"use client";

import { useCallback } from "react";
import { useBattleStore, useDungeonStore } from "@/application/stores";
import { startDungeon, type Dungeon } from "@/entities/dungeon";
import { fetchMonsterById } from "@/entities/monster";
import { ApiError } from "@/shared/api";
import toast from "react-hot-toast";

interface PlayerVitals {
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
}

/**
 * 던전 입장 — 서버가 레벨/피로도 검증 후 wave0 토큰을 발급한다.
 * 성공 시 battleStore로 첫 웨이브 전투를 시작하고 dungeonStore에 런을 저장한다.
 */
export function useEnterDungeon() {
  const { startBattle, setBattleToken, battle } = useBattleStore();
  const setRun = useDungeonStore((s) => s.setRun);

  const enter = useCallback(
    async (dungeon: Dungeon, vitals: PlayerVitals): Promise<boolean> => {
      if (battle.isInBattle) return false;

      let resp;
      try {
        resp = await startDungeon(dungeon.id);
      } catch (error) {
        if (error instanceof ApiError && error.code === "NOT_ENOUGH_FATIGUE") {
          toast.error(error.message || "피로도가 부족합니다");
        } else if (error instanceof ApiError && error.code === "LEVEL_TOO_LOW") {
          toast.error(error.message || "레벨이 부족합니다");
        } else {
          toast.error("던전 입장에 실패했습니다");
        }
        return false;
      }

      const monster = await fetchMonsterById(resp.monster.id);
      if (!monster) {
        toast.error("던전 몬스터 데이터를 찾을 수 없습니다");
        return false;
      }

      startBattle(monster, vitals.playerHp, vitals.playerMaxHp, vitals.playerMp, vitals.playerMaxMp);
      setBattleToken(resp.battleToken);
      setRun({
        dungeonId: resp.dungeonId,
        wave: resp.wave,
        totalWaves: resp.totalWaves,
        runToken: resp.runToken,
      });

      toast(`⚔️ ${dungeon.nameKo} 입장! 웨이브 1/${resp.totalWaves}`, { icon: "🏛️" });
      return true;
    },
    [battle.isInBattle, startBattle, setBattleToken, setRun]
  );

  return { enter, isInBattle: battle.isInBattle };
}
