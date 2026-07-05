"use client";

import { useState, useCallback, useRef } from "react";
import { useBattleStore, type QueuedAction } from "@/application/stores";
import type { CharacterStats } from "@/entities/character";
import type { Proficiencies, CombatProficiencyType, WeaponType, MagicElement, PassiveBonuses } from "@/entities/ability";
import { getProficiencyValue, isWeaponProficiency, WEAPON_ATTACK_TYPE, getDamageBonusFor } from "@/entities/ability";
import type { RawMonsterAbility } from "@/entities/ability";
import { getEffectsAtLevel } from "@/entities/ability";
import { getPhysicalResistance, getElementResistance } from "@/entities/monster";
import {
  buildMonsterQueue,
  calculateMonsterAbilityDamage,
} from "../lib/monsterAi";
import { applyDamageVariance, calculateStealthAmbushDamage, getCriticalChance, getCriticalMultiplier } from "../lib/damage";
import { getAttackMessage } from "../lib/messages";
import { grantSkillExperience } from "../lib/experience";
import { isStealthed, breakStealth } from "@/entities/status";

// ============ 타입 정의 ============

interface UseExecuteQueueOptions {
  /** 유저 ID (스킬 경험치 부여용) */
  userId: string;
  /** 플레이어 스탯 */
  characterStats: CharacterStats;
  /** 숙련도 정보 */
  proficiencies: Proficiencies | undefined;
  /** 몬스터 어빌리티 데이터 */
  monsterAbilitiesData: Map<string, RawMonsterAbility>;
  /** 패시브 어빌리티 보너스 */
  passiveBonuses?: PassiveBonuses;
  /** 행동 간 딜레이 (ms) */
  actionDelay?: number;
  /** 턴 종료 딜레이 (ms) */
  turnEndDelay?: number;
}

interface ExecuteQueueResult {
  success: boolean;
  message?: string;
}

/**
 * 큐 실행 훅
 * - 플레이어/몬스터 큐 교대 실행
 * - 몬스터 어빌리티 실행
 * - 턴 종료 처리
 */
export function useExecuteQueue(options: UseExecuteQueueOptions) {
  const {
    userId,
    characterStats,
    proficiencies,
    monsterAbilitiesData,
    passiveBonuses,
    actionDelay = 600,
    turnEndDelay = 500,
  } = options;

  const [isExecuting, setIsExecuting] = useState(false);

  // Refs for stable values (avoid infinite loops)
  const userIdRef = useRef(userId);
  const characterStatsRef = useRef(characterStats);
  const proficienciesRef = useRef(proficiencies);
  const monsterAbilitiesDataRef = useRef(monsterAbilitiesData);
  const passiveBonusesRef = useRef(passiveBonuses);

  // Update refs when values change
  userIdRef.current = userId;
  characterStatsRef.current = characterStats;
  proficienciesRef.current = proficiencies;
  monsterAbilitiesDataRef.current = monsterAbilitiesData;
  passiveBonusesRef.current = passiveBonuses;

  /**
   * 큐 실행 (메인 함수)
   */
  const executeQueue = useCallback(async (): Promise<ExecuteQueueResult> => {
    // Get current state directly from store
    const store = useBattleStore.getState();
    const battle = store.battle;
    const playerQueue = battle.playerQueue;

    if (isExecuting || playerQueue.length === 0) {
      return { success: false, message: "실행할 수 없습니다" };
    }

    setIsExecuting(true);

    // 몬스터 큐 생성 (abilities가 없어도 기본 공격 사용)
    if (battle.monster) {
      const monsterQueue = buildMonsterQueue(
        {
          monster: battle.monster,
          monsterHpPercent: store.getMonsterHpPercent(),
          currentTurn: battle.turn,
          monsterMaxAp: battle.monsterMaxAp,
          monsterCurrentAp: battle.monsterCurrentAp,
        },
        monsterAbilitiesDataRef.current
      );
      store.setMonsterQueue(monsterQueue);
    }

    // 페이즈 변경
    store.executeQueues();

    // 실행 시점의 큐 복사
    const playerActions = [...playerQueue];
    const monsterActions = [...useBattleStore.getState().battle.monsterQueue];
    const isPlayerFirst = battle.playerGoesFirst;

    let playerIndex = 0;
    let monsterIndex = 0;

    /**
     * 플레이어 행동 실행
     */
    const executePlayerAction = (action: QueuedAction) => {
      const currentStore = useBattleStore.getState();
      const effects = getEffectsAtLevel(action.ability, action.level);
      const profLevel = action.ability.category
        ? getProficiencyValue(proficienciesRef.current, action.ability.category as CombatProficiencyType) || 0
        : 0;

      const stats = characterStatsRef.current;

      // 어빌리티 타입별 처리
      if (action.ability.type === "attack") {
        const currentBattle = currentStore.battle;
        const monster = currentBattle.monster;

        // 물리/마법 구분
        const isPhysical = action.ability.attackType === "melee_physical" || action.ability.attackType === "ranged_physical";

        // 은신 상태 확인
        const playerWasStealthed = isStealthed(currentBattle.playerBuffs);

        // 데미지 계산 기본
        const baseDamage = effects.baseDamage ?? action.ability.baseCost.ap ?? 10;
        let rawDamage = baseDamage * (1 + profLevel * 0.02) * (1 + (stats.str || 10) * 0.05);

        // 패시브 어빌리티 데미지 보너스 (무기 마스터리 등)
        const passiveCategory = isPhysical ? (action.ability.category ?? "fist") : "magic";
        const passiveBonus = getDamageBonusFor(passiveBonusesRef.current, passiveCategory);
        if (passiveBonus > 0) {
          rawDamage = rawDamage * (1 + passiveBonus / 100);
        }

        // 은신 암습 보너스 적용
        let stealthAmbushApplied = false;
        let ambushBonusMultiplier = 1.0;
        if (playerWasStealthed) {
          // 단검 사용 시 추가 보너스
          const isDagger = action.ability.category === "dagger";
          const daggerProficiency = isDagger
            ? getProficiencyValue(proficienciesRef.current, "dagger") || 0
            : 0;

          const stealthResult = calculateStealthAmbushDamage(rawDamage, true, {
            daggerProficiency,
            skillAmbushBonus: 0, // vanish 스킬 보너스는 나중에 구현
          });

          rawDamage = stealthResult.damage;
          stealthAmbushApplied = stealthResult.isAmbush;
          ambushBonusMultiplier = stealthResult.bonusMultiplier;
        }

        // 저항 배율 계산
        let resistanceMultiplier = 1.0;

        if (monster) {
          if (isPhysical) {
            // 물리 저항 계산
            const weaponType = (action.ability.category && isWeaponProficiency(action.ability.category as CombatProficiencyType))
              ? action.ability.category as WeaponType
              : "fist";
            const physicalAttackType = WEAPON_ATTACK_TYPE[weaponType];
            if (physicalAttackType) {
              resistanceMultiplier = getPhysicalResistance(monster.stats, physicalAttackType);
            }
          } else {
            // 마법 속성 저항 계산
            if (action.ability.element) {
              resistanceMultiplier = getElementResistance(monster.stats, action.ability.element as MagicElement);
            }
          }
        }

        // 저항 적용
        rawDamage = rawDamage * resistanceMultiplier;

        // 치명타 판정 (물리: LCK+DEX, 마법: LCK+INT)
        const critSecondary = isPhysical ? (stats.dex || 10) : (stats.int || 10);
        const isCritical = Math.random() * 100 < getCriticalChance(stats.lck || 10, critSecondary);
        if (isCritical) {
          rawDamage = rawDamage * getCriticalMultiplier(stats.lck || 10);
        }

        // 편차 적용 및 최소 데미지
        const damage = Math.max(1, applyDamageVariance(rawDamage));
        const isMinDamage = damage === 1;

        // 메시지 생성 (저항 피드백 포함)
        let message: string;

        // 암습 성공 메시지 프리픽스
        const ambushPrefix = stealthAmbushApplied
          ? `👻 암습! (+${Math.round((ambushBonusMultiplier - 1) * 100)}%) `
          : "";

        if (isPhysical) {
          const msgWeaponType = (action.ability.category && isWeaponProficiency(action.ability.category as CombatProficiencyType))
            ? action.ability.category as CombatProficiencyType
            : "fist";
          message = ambushPrefix + getAttackMessage(
            msgWeaponType,
            monster?.nameKo ?? "적",
            damage,
            isCritical,
            resistanceMultiplier,
            isMinDamage
          );
        } else {
          // 마법 공격 메시지
          const icon = action.ability.icon ?? "✨";
          const critPrefix = isCritical ? "💥 치명타! " : "";
          message = `${ambushPrefix}${critPrefix}${icon} ${action.ability.nameKo}! ${monster?.nameKo ?? "적"}에게 ${damage} 데미지!`;

          // 속성 저항 피드백 추가
          if (isMinDamage) {
            message += " (간신히 스쳤다!)";
          } else if (resistanceMultiplier >= 1.3) {
            message += " (효과적이다!)";
          } else if (resistanceMultiplier <= 0.7) {
            message += " (효과가 없다...)";
          }
        }

        // 숙련도 타입: 물리는 무기 숙련도, 마법은 속성 숙련도
        const proficiencyType = isPhysical
          ? (action.ability.category && isWeaponProficiency(action.ability.category as CombatProficiencyType)
              ? action.ability.category
              : undefined)
          : action.ability.element;

        currentStore.dealDamageToMonster(damage, message, proficiencyType);
        currentStore.addDamageDealt(damage, isCritical);

        // 공격 성공 시 스킬 경험치 부여
        if (damage > 0 && action.ability.grantsExpTo && action.ability.grantsExpTo.length > 0) {
          // 비동기로 경험치 부여 (전투 흐름 blocking 안 함)
          grantSkillExperience(
            userIdRef.current,
            action.ability.grantsExpTo,
            action.ability.source
          );
        }

        // 공격 후 은신 해제
        if (playerWasStealthed) {
          const stealthBreakResult = breakStealth(currentBattle.playerBuffs);
          if (stealthBreakResult.wasStealthed) {
            currentStore.setPlayerBuffs(stealthBreakResult.effects);
            currentStore.addLog({
              turn: currentBattle.turn,
              actor: "player",
              action: "status",
              message: "👻 은신이 해제되었다!",
            });
          }
        }
      } else if (action.ability.type === "heal") {
        const healAmount = effects.healAmount ?? 20;
        currentStore.healPlayer(healAmount);
        currentStore.addLog({
          turn: currentStore.battle.turn,
          actor: "player",
          action: "heal",
          message: `${action.ability.icon ?? "💚"} ${action.ability.nameKo}! HP ${healAmount} 회복!`,
        });
      } else if (action.ability.type === "buff") {
        currentStore.addLog({
          turn: currentStore.battle.turn,
          actor: "player",
          action: "buff",
          message: `${action.ability.icon ?? "✨"} ${action.ability.nameKo} 시전!`,
        });
      } else if (action.ability.type === "debuff") {
        currentStore.addLog({
          turn: currentStore.battle.turn,
          actor: "player",
          action: "debuff",
          message: `${action.ability.icon ?? "💀"} ${action.ability.nameKo} 시전!`,
        });
      } else if (action.ability.type === "defense") {
        // 방어 스킬별 효과 처리
        if (action.ability.id === "block") {
          // 막기: 다음 공격 데미지 감소
          const damageReduction = typeof effects.damageReduction === "number" ? effects.damageReduction : 25;
          currentStore.setDefensiveStance("guard", damageReduction);
          currentStore.addLog({
            turn: currentStore.battle.turn,
            actor: "player",
            action: "defense",
            message: `${action.ability.icon ?? "🛡️"} ${action.ability.nameKo}! 피해 ${damageReduction}% 감소!`,
          });
        } else if (action.ability.id === "dodge") {
          // 회피: 다음 공격 회피 시도
          const evasionChance = typeof effects.evasionChance === "number" ? effects.evasionChance : 70;
          currentStore.setDefensiveStance("dodge", evasionChance);
          currentStore.addLog({
            turn: currentStore.battle.turn,
            actor: "player",
            action: "defense",
            message: `${action.ability.icon ?? "💨"} ${action.ability.nameKo}! 회피 확률 ${evasionChance}%!`,
          });
        } else {
          // 기타 방어 스킬
          currentStore.addLog({
            turn: currentStore.battle.turn,
            actor: "player",
            action: "defense",
            message: `${action.ability.icon ?? "🛡️"} ${action.ability.nameKo} 자세!`,
          });
        }
      }

      // MP 소모
      if (action.mpCost > 0) {
        currentStore.useMp(action.mpCost);
      }
    };

    /**
     * 몬스터 행동 실행
     */
    const executeMonsterAction = (action: QueuedAction) => {
      const currentStore = useBattleStore.getState();
      const currentBattle = currentStore.battle;
      if (!currentBattle.monster) return;

      // 기본 공격인지 체크
      if (action.ability.id === "monster_basic_attack") {
        const damage = applyDamageVariance(currentBattle.monster.stats.attack * 0.8);
        currentStore.dealDamageToPlayer(
          damage,
          `${currentBattle.monster.icon} ${currentBattle.monster.nameKo}의 공격! ${damage} 데미지!`
        );
        return;
      }

      const abilityData = monsterAbilitiesDataRef.current.get(action.ability.id);
      if (!abilityData) {
        // 어빌리티 데이터가 없으면 기본 공격으로 처리
        const damage = applyDamageVariance(currentBattle.monster.stats.attack * 0.8);
        currentStore.dealDamageToPlayer(
          damage,
          `${currentBattle.monster.icon} ${currentBattle.monster.nameKo}의 공격! ${damage} 데미지!`
        );
        return;
      }

      // 어빌리티 타입별 처리
      if (abilityData.type === "attack") {
        const damage = calculateMonsterAbilityDamage(
          abilityData,
          action.level,
          currentBattle.monster.stats.attack
        );
        const message = `${abilityData.icon} ${currentBattle.monster.nameKo}의 ${abilityData.nameKo}! ${damage} 데미지!`;
        currentStore.dealDamageToPlayer(damage, message);

        // 상태이상 체크
        if (abilityData.statusChance && abilityData.statusEffect) {
          const roll = Math.random() * 100;
          if (roll < abilityData.statusChance) {
            currentStore.addLog({
              turn: currentBattle.turn,
              actor: "monster",
              action: "status",
              message: `💀 ${abilityData.statusEffect} 상태이상에 걸렸다!`,
            });
          }
        }
      } else if (abilityData.type === "buff" && abilityData.selfBuff) {
        currentStore.addLog({
          turn: currentBattle.turn,
          actor: "monster",
          action: "buff",
          message: `${abilityData.icon} ${currentBattle.monster.nameKo}이(가) ${abilityData.nameKo}!`,
        });
      } else if (abilityData.type === "debuff") {
        currentStore.addLog({
          turn: currentBattle.turn,
          actor: "monster",
          action: "debuff",
          message: `${abilityData.icon} ${currentBattle.monster.nameKo}이(가) ${abilityData.nameKo}!`,
        });
      }
    };

    return new Promise((resolve) => {
      // 턴 1: 선공자가 먼저 행동, 턴 2+: AP 비용이 작은 순으로 번갈아 실행
      const currentTurn = battle.turn;

      // 모든 행동을 하나의 배열로 합치고 정렬
      interface SortedAction {
        type: "player" | "monster";
        action: QueuedAction;
        apCost: number;
        originalIndex: number;
      }

      const sortedActions: SortedAction[] = [];

      playerActions.forEach((action, idx) => {
        sortedActions.push({
          type: "player",
          action,
          apCost: action.apCost,
          originalIndex: idx,
        });
      });

      monsterActions.forEach((action, idx) => {
        sortedActions.push({
          type: "monster",
          action,
          apCost: action.apCost,
          originalIndex: idx,
        });
      });

      // 턴 1: 선공자의 모든 행동 → 후공자의 모든 행동
      // 턴 2+: AP 비용 순으로 정렬 (같으면 선공자 우선)
      if (currentTurn === 1) {
        // 턴 1: 선공자 먼저
        sortedActions.sort((a, b) => {
          const aFirst = (a.type === "player") === isPlayerFirst;
          const bFirst = (b.type === "player") === isPlayerFirst;
          if (aFirst !== bFirst) return aFirst ? -1 : 1;
          return a.originalIndex - b.originalIndex;
        });
      } else {
        // 턴 2+: AP 비용 순으로 정렬 (작은 AP가 먼저), 같으면 player/monster 번갈아
        sortedActions.sort((a, b) => {
          if (a.apCost !== b.apCost) return a.apCost - b.apCost;
          // AP 같으면 선공자 우선
          const aFirst = (a.type === "player") === isPlayerFirst;
          const bFirst = (b.type === "player") === isPlayerFirst;
          if (aFirst !== bFirst) return aFirst ? -1 : 1;
          return a.originalIndex - b.originalIndex;
        });
      }

      let actionIndex = 0;

      const executeNextAction = () => {
        // 전투 종료 체크
        const currentBattle = useBattleStore.getState().battle;
        if (currentBattle.result !== "ongoing") {
          setIsExecuting(false);
          resolve({ success: true, message: "전투 종료" });
          return;
        }

        if (actionIndex < sortedActions.length) {
          const sortedAction = sortedActions[actionIndex];

          if (sortedAction.type === "player") {
            executePlayerAction(sortedAction.action);
          } else {
            executeMonsterAction(sortedAction.action);
          }

          actionIndex++;
          setTimeout(executeNextAction, actionDelay);
        } else {
          // 모든 행동 완료 → 다음 턴
          setTimeout(() => {
            const finalBattle = useBattleStore.getState().battle;
            if (finalBattle.result === "ongoing") {
              useBattleStore.getState().startNextTurn();
            }
            setIsExecuting(false);
            resolve({ success: true, message: "턴 완료" });
          }, turnEndDelay);
        }
      };

      // 실행 시작
      setTimeout(executeNextAction, 300);
    });
  }, [isExecuting, actionDelay, turnEndDelay]);

  // playerQueue length for canExecute check
  const playerQueueLength = useBattleStore((state) => state.battle.playerQueue.length);

  return {
    /** 큐 실행 */
    executeQueue,
    /** 실행 중 여부 */
    isExecuting,
    /** 실행 가능 여부 */
    canExecute: !isExecuting && playerQueueLength > 0,
  };
}
