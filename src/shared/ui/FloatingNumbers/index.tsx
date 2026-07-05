"use client";

import { useEffect, useRef, useState } from "react";
import { useBattleStore } from "@/application/stores";
import { useThemeStore } from "@/shared/config";

type FloatKind = "damage" | "crit" | "heal" | "miss";

interface FloatItem {
  id: number;
  label: string;
  kind: FloatKind;
  left: number; // % 위치 (수평 지터)
}

/**
 * FloatingNumbers
 *
 * 전투 로그를 구독해 대상(몬스터/플레이어) 위로 데미지·힐·치명타·회피 숫자를
 * 떠오르는 애니메이션으로 표시한다. CSS 애니메이션만 사용하며 신규 의존성 없음.
 *
 * - target="monster": 내가 몬스터에게 준 피해
 * - target="player":  몬스터에게 받은 피해 + 내가 받은 회복
 *
 * 부모 요소는 `position: relative`여야 하며, pointer-events는 통과시킨다.
 */
export function FloatingNumbers({ target }: { target: "monster" | "player" }) {
  const { theme } = useThemeStore();
  const battleLog = useBattleStore((s) => s.battle.battleLog);
  const [items, setItems] = useState<FloatItem[]>([]);
  const lastTs = useRef<number>(0);
  const idRef = useRef(0);

  useEffect(() => {
    if (battleLog.length === 0) return;
    const last = battleLog[battleLog.length - 1];
    // 같은(혹은 과거) 타임스탬프는 무시 (중복 처리 방지)
    if (last.timestamp <= lastTs.current) return;
    lastTs.current = last.timestamp;

    const match = resolveEvent(target, last);
    if (!match) return;

    const id = idRef.current++;
    const left = 50 + (Math.random() * 44 - 22); // 28% ~ 72%
    setItems((prev) => [...prev, { id, left, ...match }]);

    const ttl = match.kind === "crit" ? 1100 : 1000;
    const timer = setTimeout(() => {
      setItems((prev) => prev.filter((it) => it.id !== id));
    }, ttl);
    return () => clearTimeout(timer);
  }, [battleLog, target]);

  if (items.length === 0) return null;

  const colorFor = (kind: FloatKind): string => {
    switch (kind) {
      case "crit":
        return "#ffcf4d";
      case "heal":
        return theme.colors.success;
      case "miss":
        return theme.colors.textMuted;
      default:
        return theme.colors.error;
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
      {items.map((it) => (
        <span
          key={it.id}
          className={`absolute font-mono font-bold select-none ${
            it.kind === "crit" ? "animate-float-up-crit" : "animate-float-up"
          }`}
          style={{
            left: `${it.left}%`,
            top: "10%",
            color: colorFor(it.kind),
            fontSize: it.kind === "crit" ? "1.6rem" : "1.05rem",
            textShadow:
              it.kind === "crit"
                ? "0 0 8px rgba(255,180,0,0.9), 0 1px 2px #000"
                : "0 1px 2px rgba(0,0,0,0.9)",
            whiteSpace: "nowrap",
          }}
        >
          {it.label}
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
type LogEntry = {
  actor: "player" | "monster" | "system";
  action: string;
  damage?: number;
  heal?: number;
  message: string;
};

function isCrit(message: string): boolean {
  return message.includes("치명타") || message.includes("💥") || message.includes("크리티");
}

function resolveEvent(
  target: "monster" | "player",
  e: LogEntry
): { label: string; kind: FloatKind } | null {
  const isAttack =
    e.action.includes("attack") ||
    e.action.includes("ability") ||
    e.action.includes("skill") ||
    e.action.includes("cast") ||
    e.action === "dot";

  if (target === "monster") {
    // 내가 몬스터에게 준 피해 (플레이어 공격 or 몬스터 대상 DoT)
    const dealtByPlayer = e.actor === "player" && isAttack && e.damage != null;
    const dotOnMonster = e.action === "dot" && e.actor === "system" && e.damage != null;
    if (!dealtByPlayer && !dotOnMonster) return null;
    const dmg = e.damage ?? 0;
    if (dmg <= 0) return { label: "MISS", kind: "miss" };
    return isCrit(e.message)
      ? { label: `${dmg}`, kind: "crit" }
      : { label: `${dmg}`, kind: "damage" };
  }

  // target === "player"
  // 내가 받은 회복
  if (e.actor === "player" && e.action === "heal" && (e.heal ?? 0) > 0) {
    return { label: `+${e.heal}`, kind: "heal" };
  }
  // 내가 받은 재생(HoT)
  if (e.action === "hot" && (e.heal ?? 0) > 0) {
    return { label: `+${e.heal}`, kind: "heal" };
  }
  // 몬스터에게 받은 피해
  if (e.actor === "monster" && e.damage != null) {
    const dmg = e.damage;
    if (dmg <= 0) return { label: "회피!", kind: "miss" };
    return { label: `${dmg}`, kind: "damage" };
  }
  return null;
}
