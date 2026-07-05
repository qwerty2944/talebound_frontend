"use client";

import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBattleStore } from "@/application/stores";
import {
  useCharacterTraitsWithDetails,
  calculateAggregatedEffects,
  getProficiencyGainMultiplier,
  type Trait,
} from "@/entities/trait";
import { calculateExpBonus } from "@/entities/monster";
import {
  profileKeys,
  updateProfile,
  useProfile,
  getRespawnLocation,
  updateProfileAfterDefeat,
} from "@/entities/user";
import { inventoryKeys } from "@/entities/inventory";
import { fetchItemById } from "@/entities/item";
import { karmaKeys } from "@/entities/karma";
import { completeBattleOnServer } from "../api/battleServer";
import type { ProficiencyType } from "@/entities/ability";
import {
  calculateProficiencyGain,
  useProficiencies,
  useGainProficiency,
  getProficiencyValue,
} from "@/entities/ability";
import {
  checkInjuryOccurrence,
  getInjuryOccurredMessage,
  INJURY_CONFIG,
} from "@/entities/status";
import { getMapById, useMaps, getMapDisplayName } from "@/entities/map";
import { useRecordBattleResult } from "@/entities/statistics";
import toast from "react-hot-toast";

interface BattleRewards {
  exp: number;
  gold: number;
  drops: { itemId: string; quantity: number }[];
  proficiencyGain?: {
    type: ProficiencyType;
    amount: number;
    levelDiff?: number;
    gained: boolean;
    reason?: string;
  };
  levelUp?: {
    newLevel: number;
    levelsGained: number;
  };
  karmaChange?: number;
  skillExpGains?: Record<string, number>;  // 스킬 경험치 획득
}

interface UseEndBattleOptions {
  userId: string | undefined;
  onVictory?: (rewards: BattleRewards) => void;
  onDefeat?: () => void;
  onFled?: () => void;
  /** 던전 등 외부에서 서버 정산을 대신 처리하는 경우 승리 시 /api/battle/complete 호출을 건너뛴다 */
  skipServerSettle?: boolean;
}

/**
 * 전투 종료 훅
 */
export function useEndBattle(options: UseEndBattleOptions) {
  const { userId, onVictory, onDefeat, onFled, skipServerSettle } = options;
  const { battle, resetBattle } = useBattleStore();
  const queryClient = useQueryClient();
  const gainProficiency = useGainProficiency(userId);
  const { data: profile } = useProfile(userId);
  const { data: proficiencies } = useProficiencies(userId);
  const { data: maps = [] } = useMaps();

  // 특성 효과 집계 (숙련도 획득 배율용)
  const { data: characterTraitsData } = useCharacterTraitsWithDetails(userId);
  const traitEffects = useMemo(() => {
    const traits = (characterTraitsData ?? [])
      .map((ct) => ct.trait)
      .filter((t): t is Trait => t !== undefined);
    if (traits.length === 0) return null;
    return calculateAggregatedEffects(traits);
  }, [characterTraitsData]);

  // 통계 기록 훅
  const recordBattle = useRecordBattleResult(profile?.id);

  const playerLevel = profile?.level ?? 1;

  // 보상 지급 처리
  // 주의: useBattleStore.getState()로 직접 읽어서 stale 클로저 문제 방지
  // preRolledDrops: BattlePanel에서 미리 계산된 드랍 (UI에 표시된 것)
  const processRewards = useCallback((preRolledDrops?: { itemId: string; quantity: number }[]): BattleRewards | null => {
    const currentBattle = useBattleStore.getState().battle;
    if (!currentBattle.monster || currentBattle.result !== "victory") return null;

    // 경험치 계산 (레벨 차이 보너스)
    const exp = calculateExpBonus(currentBattle.monster, playerLevel);

    // 골드
    const gold = currentBattle.monster.rewards.gold;

    // 드롭 아이템은 서버가 롤·지급한다 (settle 후 채워짐)
    const drops = preRolledDrops ?? [];

    // 숙련도 증가 (사용한 무기/마법) - 레벨 기반 시스템
    let proficiencyGain: BattleRewards["proficiencyGain"] = undefined;
    if (currentBattle.usedWeaponType && currentBattle.monster) {
      const profType = currentBattle.usedWeaponType as ProficiencyType;
      const currentProf = getProficiencyValue(proficiencies, profType) ?? 0;
      const monsterLevel = currentBattle.monster.level;

      // 레벨 기반 숙련도 획득 계산
      const gainResult = calculateProficiencyGain({
        proficiencyType: profType,
        currentProficiency: currentProf,
        playerLevel,
        monsterLevel,
        attackSuccess: true,
      });

      // 특성 숙련도 획득 배율 적용 (patient/genius/quick_learner 등)
      const profMultiplier = traitEffects ? getProficiencyGainMultiplier(traitEffects) : 1;
      const boostedAmount = gainResult.gained
        ? Math.max(1, Math.round(gainResult.amount * profMultiplier))
        : gainResult.amount;

      proficiencyGain = {
        type: profType,
        amount: boostedAmount,
        levelDiff: gainResult.levelDiff,
        gained: gainResult.gained,
        reason: gainResult.reason,
      };
    }

    // 카르마는 서버 정산에서 처리 (표시는 settle 후)
    const karmaChange = 0;

    // 스킬 경험치 획득 (battleStore에서 추적)
    const skillExpGains = Object.keys(currentBattle.skillExpGains).length > 0
      ? currentBattle.skillExpGains
      : undefined;

    return { exp, gold, drops, proficiencyGain, karmaChange, skillExpGains };
  }, [playerLevel, proficiencies, traitEffects]);

  // 승리 처리 (preRolledDrops: UI에서 미리 표시된 드랍 아이템)
  const handleVictory = useCallback(async (preRolledDrops?: { itemId: string; quantity: number }[]) => {
    const rewards = processRewards(preRolledDrops);
    const currentBattleState = useBattleStore.getState().battle;
    const monsterName = currentBattleState.monster?.nameKo || "몬스터";

    // UI 먼저 닫기 (사용자 경험 개선)
    resetBattle();

    // 보상 처리 실패해도 전투는 이미 종료됨
    if (!rewards || !profile) {
      console.warn("[Battle] Cannot process rewards - battle already closed");
      return;
    }

    try {
      // 1. 서버 권위 보상 정산 (exp/gold/드랍/카르마/레벨업은 서버가 계산·지급)
      // 던전 웨이브는 /api/dungeon/advance가 정산을 대신하므로 여기서는 건너뛴다.
      if (!skipServerSettle && userId && currentBattleState.battleToken && currentBattleState.monster) {
        try {
          const settled = await completeBattleOnServer({
            battleToken: currentBattleState.battleToken,
            result: "victory",
            currentHp: currentBattleState.playerCurrentHp,
            currentMp: currentBattleState.playerMp,
          });

          // 실제 지급된 값으로 보상 표시 갱신
          rewards.exp = settled.exp;
          rewards.gold = settled.gold;
          rewards.drops = settled.drops;
          rewards.karmaChange = settled.karmaChange;

          if (settled.levelUp.leveledUp) {
            rewards.levelUp = {
              newLevel: settled.levelUp.newLevel,
              levelsGained: settled.levelUp.levelsGained,
            };
            if (settled.levelUp.levelsGained === 1) {
              toast.success(`레벨 업! Lv.${settled.levelUp.newLevel}`);
            } else {
              toast.success(`${settled.levelUp.levelsGained} 레벨 상승! Lv.${settled.levelUp.newLevel}`);
            }
          }

          if (settled.karmaChange > 0) toast.success(`카르마 +${settled.karmaChange}`);
          else if (settled.karmaChange < 0) toast.error(`카르마 ${settled.karmaChange}`);

          // 드랍 알림 (지급은 서버가 이미 완료)
          for (const drop of settled.drops) {
            fetchItemById(drop.itemId)
              .then((item) => {
                const name = item?.nameKo ?? drop.itemId;
                toast(`${item?.icon && item.icon.length <= 2 ? item.icon : "📦"} ${name} x${drop.quantity} 획득!`);
              })
              .catch(() => toast(`📦 ${drop.itemId} x${drop.quantity} 획득!`));
          }
        } catch (error) {
          console.error("Failed to settle battle rewards:", error);
          toast.error("보상 정산에 실패했습니다");
        }
      }

      // 2. 숙련도 증가 (레벨 기반)
      if (rewards.proficiencyGain && userId) {
        if (rewards.proficiencyGain.gained && rewards.proficiencyGain.amount > 0) {
          try {
            const result = await gainProficiency.mutateAsync({
              type: rewards.proficiencyGain.type,
              amount: rewards.proficiencyGain.amount,
            });
            toast.success(
              `숙련도 +${rewards.proficiencyGain.amount} (${result.value})`,
              { icon: "⚔️" }
            );
          } catch (error) {
            console.error("Failed to gain proficiency:", error);
          }
        } else if (rewards.proficiencyGain.reason === "level_too_low") {
          // 레벨이 너무 낮아 숙련도 미획득 (조용히 처리, 토스트 안 띄움)
          console.log(`[Proficiency] Level too low for gain (level diff: ${rewards.proficiencyGain.levelDiff})`);
        }
      }

      // 3~4. 카르마/드랍은 서버 정산(1번)에서 이미 처리됨

      // 5. 통계 기록
      if (profile?.id) {
        try {
          await recordBattle.mutateAsync({
            result: "victory",
            monsterId: currentBattleState.monster?.id,
            monsterType: currentBattleState.monster?.type,
            damageDealt: currentBattleState.totalDamageDealt,
            damageTaken: currentBattleState.totalDamageTaken,
            criticalCount: currentBattleState.criticalHitCount,
          });
        } catch (error) {
          console.error("[Statistics] Failed to record battle:", error);
        }
      }

      // 6. 캐시 무효화
      if (userId) {
        queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
        queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(userId) });
        queryClient.invalidateQueries({ queryKey: karmaKeys.detail(userId) });
      }

      onVictory?.(rewards);
    } catch (error) {
      console.error("[Battle] Error processing rewards:", error);
    }
  }, [processRewards, profile, userId, queryClient, onVictory, resetBattle, recordBattle, skipServerSettle]);

  // 패배 처리
  const handleDefeat = useCallback(async () => {
    const currentBattleState = useBattleStore.getState().battle;
    const monster = currentBattleState.monster;

    // UI 먼저 닫기
    resetBattle();

    if (!userId || !profile) {
      onDefeat?.();
      return;
    }

    try {
      // 1. 부상 발생 판정
      let injuryResult = null;
      if (monster) {
        injuryResult = checkInjuryOccurrence({
          currentHp: currentBattleState.playerCurrentHp,
          maxHp: currentBattleState.playerMaxHp,
          playerLevel: profile.level,
          monsterLevel: monster.level,
          monsterNameKo: monster.nameKo,
          isCriticalHit: false,
        });
      }

      // 2. 귀환 위치 결정 (종교 제단 또는 시작 마을)
      const respawnMapId = await getRespawnLocation(profile.religion?.id ?? null);
      const respawnMap = getMapById(maps, respawnMapId);
      const respawnMapName = respawnMap ? getMapDisplayName(respawnMap) : "시작 마을";

      // 3. DB 업데이트 (HP=1, 귀환 위치, 부상)
      await updateProfileAfterDefeat({
        userId,
        currentHp: 1, // HP를 1로 설정 (0이 아님)
        currentMp: currentBattleState.playerMp,
        currentMapId: respawnMapId,
        newInjury: injuryResult?.injury || null,
      });

      // 4. 사망 메시지 표시
      toast.error(`💀 ${monster?.nameKo || "몬스터"}에게 쓰러졌습니다...`, {
        duration: 3000,
      });

      // 5. 부상 메시지 표시
      if (injuryResult?.occurred && injuryResult.type) {
        const injuryConfig = INJURY_CONFIG[injuryResult.type];
        toast.error(
          `${injuryConfig.icon} ${injuryConfig.nameKo}을 입었습니다! (HP 회복 상한 -${injuryConfig.hpRecoveryReduction * 100}%)`,
          { duration: 4000 }
        );
      }

      // 6. 귀환 메시지 표시
      toast(`⛪ ${respawnMapName}(으)로 귀환합니다...`, {
        icon: "🏠",
        duration: 3000,
      });

      // 7. 통계 기록
      if (profile?.id) {
        try {
          await recordBattle.mutateAsync({
            result: "defeat",
            monsterId: monster?.id,
            monsterType: monster?.type,
            damageDealt: currentBattleState.totalDamageDealt,
            damageTaken: currentBattleState.totalDamageTaken,
            criticalCount: currentBattleState.criticalHitCount,
          });
        } catch (statsError) {
          console.error("[Statistics] Failed to record defeat:", statsError);
        }
      }

      // 8. 캐시 무효화
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
    } catch (error) {
      console.error("Failed to process defeat:", error);

      // 에러 발생 시에도 기본 HP/MP 저장 시도
      try {
        await updateProfile({
          userId,
          currentHp: 1,
          currentMp: currentBattleState.playerMp,
        });
        queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
      } catch (e) {
        console.error("Failed to save HP/MP after defeat:", e);
      }
    }

    onDefeat?.();
  }, [userId, profile, maps, onDefeat, resetBattle, queryClient, recordBattle]);

  // 도주 처리
  const handleFled = useCallback(async () => {
    const currentBattleState = useBattleStore.getState().battle;

    // UI 먼저 닫기
    resetBattle();

    // 도주 시 HP/MP 저장
    if (userId) {
      try {
        await updateProfile({
          userId,
          currentHp: currentBattleState.playerCurrentHp,
          currentMp: currentBattleState.playerMp,
        });

        // 캐시 무효화
        queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
      } catch (error) {
        console.error("Failed to save HP/MP after flee:", error);
      }
    }

    // 통계 기록 (도주)
    if (profile?.id) {
      try {
        await recordBattle.mutateAsync({
          result: "fled",
          monsterId: currentBattleState.monster?.id,
          monsterType: currentBattleState.monster?.type,
          damageDealt: currentBattleState.totalDamageDealt,
          damageTaken: currentBattleState.totalDamageTaken,
          criticalCount: currentBattleState.criticalHitCount,
        });
      } catch (error) {
        console.error("[Statistics] Failed to record flee:", error);
      }
    }

    onFled?.();
  }, [userId, profile, onFled, resetBattle, queryClient, recordBattle]);

  // 전투 결과에 따른 종료 처리
  // 주의: useBattleStore.getState()로 최신 상태를 읽어서 stale closure 문제 방지
  // preRolledDrops: 승리 시 UI에서 미리 계산/표시된 드랍 아이템
  const endBattle = useCallback((preRolledDrops?: { itemId: string; quantity: number }[]) => {
    const currentResult = useBattleStore.getState().battle.result;
    switch (currentResult) {
      case "victory":
        handleVictory(preRolledDrops);
        break;
      case "defeat":
        handleDefeat();
        break;
      case "fled":
        handleFled();
        break;
      default:
        // ongoing - do nothing
        break;
    }
  }, [handleVictory, handleDefeat, handleFled]);

  return {
    endBattle,
    processRewards,
    battleResult: battle.result,
    isVictory: battle.result === "victory",
    isDefeat: battle.result === "defeat",
    isFled: battle.result === "fled",
    isBattleEnded: battle.result !== "ongoing",
  };
}
