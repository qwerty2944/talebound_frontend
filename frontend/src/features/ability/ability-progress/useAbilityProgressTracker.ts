import { useCallback, useRef, useEffect } from "react";
import { supabase } from "@/shared/api";

type AbilityCategory = "combat" | "magic" | "life";

interface PendingProgress {
  combat: Record<string, number>;
  magic: Record<string, number>;
  life: Record<string, number>;
}

interface UseAbilityProgressTrackerOptions {
  userId: string | undefined;
  /** 자동 플러시 간격 (ms). 기본 30초 */
  flushInterval?: number;
  /** 디버그 로그 활성화 */
  debug?: boolean;
}

/**
 * 어빌리티 경험치 배치 트래커
 *
 * 어빌리티 사용 시 경험치를 메모리에 모았다가 일정 시간마다 또는
 * 수동으로 flush 호출 시 DB에 한 번에 업데이트합니다.
 *
 * @example
 * ```tsx
 * const { addProgress, flush } = useAbilityProgressTracker({ userId });
 *
 * // 어빌리티 사용 시 경험치 추가
 * addProgress("combat", "slash", 10);
 * addProgress("magic", "fireball", 5);
 *
 * // 전투 종료 시 수동 플러시
 * await flush();
 * ```
 */
export function useAbilityProgressTracker(options: UseAbilityProgressTrackerOptions) {
  const { userId, flushInterval = 30000, debug = false } = options;

  const pendingRef = useRef<PendingProgress>({
    combat: {},
    magic: {},
    life: {},
  });

  const isFlushing = useRef(false);

  const log = useCallback(
    (message: string, data?: unknown) => {
      if (debug) {
        console.log(`[AbilityTracker] ${message}`, data ?? "");
      }
    },
    [debug]
  );

  /**
   * 어빌리티 경험치를 메모리에 추가
   */
  const addProgress = useCallback(
    (category: AbilityCategory, abilityId: string, amount: number) => {
      if (!userId) return;

      const current = pendingRef.current[category][abilityId] ?? 0;
      pendingRef.current[category][abilityId] = current + amount;

      log(`Added ${amount} exp to ${category}/${abilityId}`, {
        total: pendingRef.current[category][abilityId],
      });
    },
    [userId, log]
  );

  /**
   * 누적된 경험치를 DB에 플러시
   */
  const flush = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    if (isFlushing.current) return false;

    const pending = pendingRef.current;
    const hasPending =
      Object.keys(pending.combat).length > 0 ||
      Object.keys(pending.magic).length > 0 ||
      Object.keys(pending.life).length > 0;

    if (!hasPending) {
      log("No pending progress to flush");
      return true;
    }

    isFlushing.current = true;

    try {
      log("Flushing ability progress", pending);

      const { data, error } = await supabase.rpc("update_skill_progress", {
        p_user_id: userId,
        p_combat: Object.keys(pending.combat).length > 0 ? pending.combat : null,
        p_magic: Object.keys(pending.magic).length > 0 ? pending.magic : null,
        p_life: Object.keys(pending.life).length > 0 ? pending.life : null,
      });

      if (error) {
        console.error("[AbilityTracker] Flush error:", error);
        return false;
      }

      // 성공 시 pending 초기화
      pendingRef.current = {
        combat: {},
        magic: {},
        life: {},
      };

      log("Flush successful", data);
      return true;
    } catch (err) {
      console.error("[AbilityTracker] Flush exception:", err);
      return false;
    } finally {
      isFlushing.current = false;
    }
  }, [userId, log]);

  /**
   * 현재 누적된 경험치 확인 (디버그용)
   */
  const getPending = useCallback((): PendingProgress => {
    return { ...pendingRef.current };
  }, []);

  /**
   * 누적된 경험치 초기화 (DB 저장 없이)
   */
  const clear = useCallback(() => {
    pendingRef.current = {
      combat: {},
      magic: {},
      life: {},
    };
    log("Pending progress cleared");
  }, [log]);

  // 자동 플러시 타이머
  useEffect(() => {
    if (!userId || flushInterval <= 0) return;

    const timer = setInterval(() => {
      flush();
    }, flushInterval);

    return () => clearInterval(timer);
  }, [userId, flushInterval, flush]);

  // 언마운트 시 플러시
  useEffect(() => {
    return () => {
      if (userId) {
        flush();
      }
    };
  }, [userId, flush]);

  return {
    addProgress,
    flush,
    getPending,
    clear,
  };
}
