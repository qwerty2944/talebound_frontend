"use client";

import { useCallback } from "react";
import { useBattleStore } from "@/application/stores";
import type { Monster } from "@/entities/monster";
import { startBattleOnServer } from "../api/battleServer";
import { ApiError } from "@/shared/api";
import toast from "react-hot-toast";

interface UseStartBattleOptions {
  userId?: string;
  onBattleStart?: (monster: Monster) => void;
  onInsufficientFatigue?: () => void;
}

/**
 * 전투 시작 훅
 * - 서버에 전투 등록 (피로도 소모 + 전투 토큰 발급) 후 전투 시작
 */
export function useStartBattle(options?: UseStartBattleOptions) {
  const { startBattle, setBattleToken, battle } = useBattleStore();

  const start = useCallback(
    async (
      monster: Monster,
      playerHp: number,
      playerMaxHp: number,
      playerMp: number,
      playerMaxMp: number
    ): Promise<boolean> => {
      // 이미 전투 중이면 무시
      if (battle.isInBattle) {
        console.warn("Already in battle");
        return false;
      }

      // 서버에 전투 시작 등록 (피로도 소모 + 보상 정산용 토큰 발급)
      let battleToken: string;
      try {
        ({ battleToken } = await startBattleOnServer(monster.id));
      } catch (error) {
        if (error instanceof ApiError && error.code === "NOT_ENOUGH_FATIGUE") {
          toast.error(error.message || "피로도가 부족합니다");
          options?.onInsufficientFatigue?.();
        } else {
          console.error("Failed to start battle on server:", error);
          toast.error("전투 시작 처리 중 오류가 발생했습니다");
        }
        return false;
      }

      startBattle(monster, playerHp, playerMaxHp, playerMp, playerMaxMp);
      setBattleToken(battleToken);
      options?.onBattleStart?.(monster);

      return true;
    },
    [battle.isInBattle, startBattle, setBattleToken, options]
  );

  return {
    start,
    isInBattle: battle.isInBattle,
  };
}
