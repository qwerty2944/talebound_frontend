"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBattleStore, useDungeonStore } from "@/application/stores";
import { advanceDungeon } from "@/entities/dungeon";
import { fetchMonsterById } from "@/entities/monster";
import { profileKeys } from "@/entities/user";
import { inventoryKeys } from "@/entities/inventory";
import { questKeys } from "@/entities/quest";
import { fetchItemById } from "@/entities/item";
import { karmaKeys } from "@/entities/karma";
import toast from "react-hot-toast";

/**
 * 던전 웨이브 진행 — 승리 시 호출.
 * 서버가 현재 웨이브를 정산(개별 exp/gold/드랍 지급)하고 다음 웨이브 토큰을 발급하거나
 * 마지막 웨이브면 클리어 보상을 지급한다. 웨이브 간 HP는 유지된다(회복 없음).
 */
export function useAdvanceWave(userId: string | undefined) {
  const { startBattle, setBattleToken, resetBattle } = useBattleStore();
  const { updateRun, clearRun } = useDungeonStore();
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
    queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(userId) });
    queryClient.invalidateQueries({ queryKey: questKeys.list(userId) });
    queryClient.invalidateQueries({ queryKey: karmaKeys.detail(userId) });
  }, [userId, queryClient]);

  const notifyDrops = useCallback((drops: { itemId: string; quantity: number }[]) => {
    for (const drop of drops) {
      fetchItemById(drop.itemId)
        .then((item) => toast(`${item?.icon && item.icon.length <= 2 ? item.icon : "📦"} ${item?.nameKo ?? drop.itemId} x${drop.quantity} 획득!`))
        .catch(() => toast(`📦 ${drop.itemId} x${drop.quantity} 획득!`));
    }
  }, []);

  const advance = useCallback(async (): Promise<void> => {
    const run = useDungeonStore.getState().activeRun;
    const b = useBattleStore.getState().battle;
    if (!run || !b.battleToken) {
      resetBattle();
      clearRun();
      return;
    }

    // 웨이브 종료 후 남은 HP/MP (다음 웨이브로 이어짐)
    const carriedHp = b.playerCurrentHp;
    const carriedMp = b.playerMp;
    const maxHp = b.playerMaxHp;
    const maxMp = b.playerMaxMp;

    let resp;
    try {
      resp = await advanceDungeon({
        runToken: run.runToken,
        battleToken: b.battleToken,
        currentHp: carriedHp,
        currentMp: carriedMp,
      });
    } catch (error) {
      console.error("[dungeon] advance 실패:", error);
      toast.error("던전 진행 처리에 실패했습니다");
      resetBattle();
      clearRun();
      invalidate();
      return;
    }

    // 방금 웨이브 보상 알림
    if (resp.waveReward.exp || resp.waveReward.gold) {
      toast.success(`웨이브 클리어! EXP +${resp.waveReward.exp}, 골드 +${resp.waveReward.gold}`);
    }
    notifyDrops(resp.waveReward.drops);

    if (resp.cleared) {
      resetBattle();
      clearRun();
      toast.success(
        `🏆 던전 클리어! 보상 EXP +${resp.clearReward.exp}, 골드 +${resp.clearReward.gold}`,
        { duration: 5000 }
      );
      if (resp.levelUp.leveledUp) {
        toast.success(`레벨 업! Lv.${resp.levelUp.newLevel}`, { icon: "⬆️" });
      }
      notifyDrops(resp.clearReward.items);
      invalidate();
      return;
    }

    // 다음 웨이브 진입
    const monster = await fetchMonsterById(resp.monster.id);
    if (!monster) {
      toast.error("다음 웨이브 몬스터를 찾을 수 없습니다");
      resetBattle();
      clearRun();
      invalidate();
      return;
    }

    startBattle(monster, carriedHp, maxHp, carriedMp, maxMp);
    setBattleToken(resp.battleToken);
    updateRun({ wave: resp.wave, runToken: resp.runToken });
    toast(`다음 웨이브 ${resp.wave + 1}/${resp.totalWaves}!`, { icon: "⚔️" });
    invalidate();
  }, [startBattle, setBattleToken, resetBattle, updateRun, clearRun, invalidate, notifyDrops]);

  return { advance };
}
