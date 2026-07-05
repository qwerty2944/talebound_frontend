"use client";

import { useCallback } from "react";
import { useBattleStore } from "@/application/stores";
import type { Ability, AbilityLevelEffects } from "@/entities/ability";
import { getApCost, getMpCost, getEffectsAtLevel } from "@/entities/ability";
import type { CharacterStats } from "@/entities/character";
import type { CombatProficiencyType, MagicElement, WeaponType } from "@/entities/ability";
import { isWeaponProficiency, WEAPON_ATTACK_TYPE } from "@/entities/ability";
import { getPhysicalResistance, getElementResistance } from "@/entities/monster";
import type { StatusType } from "@/entities/status";
import type { Period } from "@/entities/game-time";
import type { WeatherType } from "@/entities/weather";
import {
  calculatePhysicalDamage,
  calculateMagicDamage,
  calculateMonsterDamage,
  determineHitResultEx,
  getWeaponElementMultiplier,
  getCriticalMultiplier,
} from "../lib/damage";
import type { AggregatedTraitEffects } from "@/entities/trait";
import {
  getPhysicalDamageMultiplier,
  getMagicDamageMultiplier,
  getCriticalChanceBonus,
  getAccuracyBonus,
} from "@/entities/trait";
import {
  getAttackMessage,
  getMonsterAttackMessage,
  getDodgeMessage,
  getBlockMessage,
  getMissMessage,
  getPlayerDodgeMessage,
  getPlayerBlockMessage,
  getMonsterMissMessage,
} from "../lib/messages";

// ============ 타입 정의 ============

interface UseAbilityOptions {
  onQueueFull?: () => void;
  onMpInsufficient?: () => void;
}

interface QueueAbilityParams {
  ability: Ability;
  abilityLevel: number;
  weaponAttackSpeed?: number; // 장착 무기 공격속도 (0.65~1.15, 물리 공격 AP에 적용)
}

interface ExecuteAbilityParams {
  ability: Ability;
  abilityLevel: number;
  effects: AbilityLevelEffects;
  casterStats: CharacterStats;
  proficiencyLevel: number;
  playerDefense?: number;
  period?: Period;
  weather?: WeatherType;
  karma?: number;
  weaponElement?: MagicElement; // 장착 무기 속성 (물리 공격에 적용)
  traitEffects?: AggregatedTraitEffects | null; // 특성 집계 효과 (데미지 배율/판정 보정)
}

interface ExecuteAbilityResult {
  success: boolean;
  damage?: number;
  heal?: number;
  isCritical?: boolean;
  hitResult?: string;
  message: string;
}

/**
 * 어빌리티 사용 훅
 * - 큐에 어빌리티 추가
 * - 어빌리티 실행 (데미지/힐/버프/디버프)
 */
export function useAbility(options: UseAbilityOptions = {}) {
  const {
    battle,
    addToPlayerQueue,
    removeFromPlayerQueue,
    clearPlayerQueue,
    dealDamageToMonster,
    dealDamageToPlayer,
    healPlayer,
    useMp,
    applyPlayerStatus,
    applyMonsterStatus,
    addLog,
    canAffordAp,
    getRemainingPlayerAp,
    getPlayerMagicModifier,
  } = useBattleStore();

  const { onQueueFull, onMpInsufficient } = options;

  /**
   * 어빌리티를 큐에 추가
   */
  const queueAbility = useCallback(
    (params: QueueAbilityParams): boolean => {
      const { ability, abilityLevel, weaponAttackSpeed } = params;

      // 비용 계산 (무기 공격속도 적용)
      const apCost = getApCost(ability, abilityLevel, weaponAttackSpeed);
      const mpCost = getMpCost(ability, abilityLevel);

      // AP 체크
      if (!canAffordAp(apCost)) {
        onQueueFull?.();
        addLog({
          turn: battle.turn,
          actor: "system",
          action: "ap_fail",
          message: `AP가 부족합니다! (필요: ${apCost}, 남음: ${getRemainingPlayerAp()})`,
        });
        return false;
      }

      // MP 체크
      if (mpCost > battle.playerMp) {
        onMpInsufficient?.();
        addLog({
          turn: battle.turn,
          actor: "system",
          action: "mp_fail",
          message: `MP가 부족합니다! (필요: ${mpCost}, 현재: ${battle.playerMp})`,
        });
        return false;
      }

      // 큐에 추가
      const success = addToPlayerQueue({
        ability,
        level: abilityLevel,
        apCost,
        mpCost,
      });

      if (success) {
        addLog({
          turn: battle.turn,
          actor: "player",
          action: "queue",
          message: `${ability.icon ?? "⚔️"} ${ability.nameKo}을(를) 준비했다. (AP: ${apCost})`,
        });
      }

      return success;
    },
    [battle, addToPlayerQueue, canAffordAp, getRemainingPlayerAp, addLog, onQueueFull, onMpInsufficient]
  );

  /**
   * 어빌리티 실행 (단건 실행 경로)
   *
   * NOTE: 현재 라이브 전투의 데미지/판정 경로는 execute-queue(executePlayerAction)이며
   * BattlePanel은 이 executeAbility를 호출하지 않는다. 특성 배율 로직은 execute-queue에
   * 라이브로 배선되어 있고, 여기에도 동일 로직을 유지해 두 경로가 동작상 일치하도록 한다.
   */
  const executeAbility = useCallback(
    (params: ExecuteAbilityParams): ExecuteAbilityResult => {
      const {
        ability,
        abilityLevel,
        effects,
        casterStats,
        proficiencyLevel,
        playerDefense = 0,
        period,
        weather,
        karma,
        weaponElement,
        traitEffects,
      } = params;

      // MP 소모
      const mpCost = getMpCost(ability, abilityLevel);
      if (mpCost > 0) {
        if (!useMp(mpCost)) {
          return { success: false, message: "MP 부족" };
        }
      }

      // 어빌리티 타입별 처리
      switch (ability.type) {
        case "attack":
          return executeAttack({
            ability,
            effects,
            casterStats,
            proficiencyLevel,
            period,
            weather,
            karma,
            weaponElement,
            traitEffects,
          });

        case "heal":
          return executeHeal({ ability, effects });

        case "buff":
          return executeBuff({ ability, effects });

        case "debuff":
          return executeDebuff({ ability, effects });

        case "defense":
          return executeDefense({ ability, effects });

        default:
          addLog({
            turn: battle.turn,
            actor: "player",
            action: "skill",
            message: `${ability.icon ?? "✨"} ${ability.nameKo} 사용!`,
          });
          return { success: true, message: ability.nameKo };
      }
    },
    [battle, useMp, addLog]
  );

  /**
   * 공격 어빌리티 실행
   */
  const executeAttack = useCallback(
    (params: {
      ability: Ability;
      effects: AbilityLevelEffects;
      casterStats: CharacterStats;
      proficiencyLevel: number;
      period?: Period;
      weather?: WeatherType;
      karma?: number;
      weaponElement?: MagicElement;
      traitEffects?: AggregatedTraitEffects | null;
    }): ExecuteAbilityResult => {
      const { ability, effects, casterStats, proficiencyLevel, period, weather, karma, weaponElement, traitEffects } = params;

      if (!battle.monster) {
        return { success: false, message: "대상이 없습니다" };
      }

      const isPhysical = ability.attackType === "melee_physical" || ability.attackType === "ranged_physical";
      const baseDamage = effects.baseDamage ?? ability.baseCost.ap ?? 10;

      // 특성 판정 보너스: 명중(적 회피 감소) / 치명타 확률
      const accuracyBonus = traitEffects ? getAccuracyBonus(traitEffects) : 0;
      const critChanceBonus = traitEffects ? getCriticalChanceBonus(traitEffects) : 0;

      // 공격 판정 (명중 보너스는 적 회피 확률을 낮추는 방향으로 반영)
      const hitResult = determineHitResultEx({
        attackerStats: { lck: casterStats.lck ?? 10, dex: casterStats.dex, int: casterStats.int },
        defenderStats: { dex: battle.monster.stats.speed ?? 5, con: Math.floor(battle.monster.stats.defense / 2) },
        isPhysical,
        bonusDodge: -accuracyBonus,
      });

      let damage = 0;
      let message = "";
      let isCritical = hitResult.result === "critical";
      let hitDamageMultiplier = hitResult.damageMultiplier;

      // 특성 치명타 확률 보너스: 일반 명중 시 추가 치명타 판정
      if (!isCritical && hitResult.result === "hit" && critChanceBonus > 0) {
        if (Math.random() * 100 < critChanceBonus) {
          isCritical = true;
          hitDamageMultiplier = getCriticalMultiplier(casterStats.lck ?? 10);
        }
      }

      // 특성 데미지 배율 (물리/마법)
      const traitDamageMultiplier = traitEffects
        ? (isPhysical ? getPhysicalDamageMultiplier(traitEffects) : getMagicDamageMultiplier(traitEffects))
        : 1;

      // 저항 배율 (물리 공격용)
      let resistanceMultiplier = 1.0;
      // 무기 속성 배율 (물리 공격 + 무기 속성 있을 때)
      let elementMultiplier = 1.0;

      if (hitResult.result === "missed") {
        message = getMissMessage(battle.monster.nameKo);
      } else if (hitResult.result === "dodged") {
        message = getDodgeMessage(battle.monster.nameKo);
      } else {
        // 데미지 계산
        if (isPhysical) {
          // 물리 저항 확인 (무기 타입, 없으면 fist)
          const weaponType = (ability.category && isWeaponProficiency(ability.category as CombatProficiencyType))
            ? ability.category as WeaponType
            : "fist";
          const physicalAttackType = WEAPON_ATTACK_TYPE[weaponType];
          if (physicalAttackType) {
            resistanceMultiplier = getPhysicalResistance(battle.monster.stats, physicalAttackType);
          }

          // 무기 속성 적용 (물리 데미지 전체가 속성 데미지로 변환)
          if (weaponElement) {
            elementMultiplier = getWeaponElementMultiplier(weaponElement, battle.monster.element);
          }

          damage = calculatePhysicalDamage({
            baseDamage,
            attackerStr: casterStats.str,
            weaponType: (ability.category as WeaponType) || "fist",
            proficiencyLevel,
            targetDefense: battle.monster.stats.defense,
            attackTypeResistance: resistanceMultiplier * elementMultiplier,
          });
        } else {
          // 마법 공격
          const magicModifier = getPlayerMagicModifier();
          // 몬스터의 해당 속성 저항 배율 가져오기
          // 0.5 = 강함 (50% 데미지), 1.0 = 보통, 1.5 = 약함 (150% 데미지)
          const monsterElementResist = ability.element
            ? getElementResistance(battle.monster.stats, ability.element as MagicElement)
            : 1.0;

          damage = calculateMagicDamage({
            baseDamage,
            attackerInt: casterStats.int,
            element: ability.element as MagicElement,
            proficiencyLevel,
            targetDefense: battle.monster.stats.defense,
            targetElement: battle.monster.element,
            period,
            weather,
            karma,
          });

          // 몬스터 속성 저항 배율 적용
          damage = Math.floor(damage * monsterElementResist);

          // 마법 버프 적용
          if (magicModifier !== 0) {
            damage = Math.floor(damage * (1 + magicModifier / 100));
          }
        }

        // 배율 적용 (판정 배율 + 특성 데미지 배율)
        damage = Math.floor(damage * hitDamageMultiplier * traitDamageMultiplier);
        const isMinDamage = damage === 1;
        damage = Math.max(1, damage);

        // 메시지 생성 (저항 피드백 포함)
        if (hitResult.result === "blocked") {
          message = getBlockMessage(battle.monster.nameKo, damage);
        } else if (isPhysical) {
          // 물리 공격: 저항 피드백 메시지 추가 (무기 없으면 fist)
          const msgWeaponType = (ability.category && isWeaponProficiency(ability.category as CombatProficiencyType))
            ? ability.category as CombatProficiencyType
            : "fist";
          // 물리 저항과 무기 속성 배율을 결합하여 메시지 표시
          const combinedMultiplier = resistanceMultiplier * elementMultiplier;
          message = getAttackMessage(
            msgWeaponType,
            battle.monster.nameKo,
            damage,
            isCritical,
            combinedMultiplier,
            isMinDamage
          );
        } else {
          // 마법 공격: 속성 저항 피드백 추가
          const icon = ability.icon ?? "✨";
          const monsterElementResist = ability.element
            ? getElementResistance(battle.monster.stats, ability.element as MagicElement)
            : 1.0;

          let baseMessage = isCritical
            ? `💥 ${ability.nameKo} 치명타! ${battle.monster.nameKo}에게 ${damage} 데미지!`
            : `${icon} ${ability.nameKo}! ${battle.monster.nameKo}에게 ${damage} 데미지!`;

          // 속성 저항 피드백 추가
          if (isMinDamage) {
            baseMessage += " (간신히 스쳤다!)";
          } else if (monsterElementResist >= 1.3) {
            baseMessage += " (효과적이다!)";
          } else if (monsterElementResist <= 0.7) {
            baseMessage += " (효과가 없다...)";
          }

          message = baseMessage;
        }
      }

      // 데미지 적용
      if (damage > 0) {
        dealDamageToMonster(damage, message, ability.category);
      } else {
        addLog({
          turn: battle.turn,
          actor: "player",
          action: "attack",
          message,
        });
      }

      // 상태이상 부여 (명중 시에만)
      if (damage > 0 && effects.statusEffect && effects.statusChance) {
        const roll = Math.random() * 100;
        if (roll < effects.statusChance) {
          applyMonsterStatus(
            effects.statusEffect as StatusType,
            effects.statusValue ?? 0,
            effects.statusDuration
          );
        }
      }

      return {
        success: true,
        damage,
        isCritical,
        hitResult: hitResult.result,
        message,
      };
    },
    [battle, dealDamageToMonster, applyMonsterStatus, addLog, getPlayerMagicModifier]
  );

  /**
   * 치유 어빌리티 실행
   */
  const executeHeal = useCallback(
    (params: { ability: Ability; effects: AbilityLevelEffects }): ExecuteAbilityResult => {
      const { ability, effects } = params;

      const healAmount = effects.healAmount ?? 0;
      const healPercent = effects.healPercent ?? 0;

      let totalHeal = healAmount;
      if (healPercent > 0) {
        totalHeal += Math.floor(battle.playerMaxHp * (healPercent / 100));
      }

      addLog({
        turn: battle.turn,
        actor: "player",
        action: "skill",
        message: `${ability.icon ?? "💚"} ${ability.nameKo} 시전!`,
      });

      healPlayer(totalHeal);

      return {
        success: true,
        heal: totalHeal,
        message: `HP ${totalHeal} 회복!`,
      };
    },
    [battle, healPlayer, addLog]
  );

  /**
   * 버프 어빌리티 실행
   */
  const executeBuff = useCallback(
    (params: { ability: Ability; effects: AbilityLevelEffects }): ExecuteAbilityResult => {
      const { ability, effects } = params;

      addLog({
        turn: battle.turn,
        actor: "player",
        action: "skill",
        message: `${ability.icon ?? "🛡️"} ${ability.nameKo} 시전!`,
      });

      if (effects.statusEffect) {
        applyPlayerStatus(
          effects.statusEffect as StatusType,
          effects.statusValue ?? 0,
          effects.statusDuration
        );
      }

      return {
        success: true,
        message: `${ability.nameKo} 효과 적용!`,
      };
    },
    [battle, applyPlayerStatus, addLog]
  );

  /**
   * 디버프 어빌리티 실행
   */
  const executeDebuff = useCallback(
    (params: { ability: Ability; effects: AbilityLevelEffects }): ExecuteAbilityResult => {
      const { ability, effects } = params;

      if (!battle.monster) {
        return { success: false, message: "대상이 없습니다" };
      }

      addLog({
        turn: battle.turn,
        actor: "player",
        action: "skill",
        message: `${ability.icon ?? "💀"} ${ability.nameKo} 시전!`,
      });

      if (effects.statusEffect) {
        applyMonsterStatus(
          effects.statusEffect as StatusType,
          effects.statusValue ?? 0,
          effects.statusDuration
        );
      }

      return {
        success: true,
        message: `${battle.monster.nameKo}에게 ${ability.nameKo} 적용!`,
      };
    },
    [battle, applyMonsterStatus, addLog]
  );

  /**
   * 방어 어빌리티 실행
   */
  const executeDefense = useCallback(
    (params: { ability: Ability; effects: AbilityLevelEffects }): ExecuteAbilityResult => {
      const { ability, effects } = params;
      const { setDefensiveStance } = useBattleStore.getState();

      addLog({
        turn: battle.turn,
        actor: "player",
        action: "skill",
        message: `${ability.icon ?? "🛡️"} ${ability.nameKo} 자세!`,
      });

      // 방어 자세 설정
      if (effects.blockBonus) {
        setDefensiveStance("guard", effects.blockBonus);
      } else if (effects.dodgeBonus) {
        setDefensiveStance("dodge", effects.dodgeBonus);
      } else if (effects.counterChance) {
        setDefensiveStance("counter", effects.counterChance);
      }

      return {
        success: true,
        message: `${ability.nameKo} 자세 취함!`,
      };
    },
    [battle, addLog]
  );

  /**
   * 큐에서 어빌리티 제거
   */
  const unqueueAbility = useCallback(
    (index: number) => {
      const action = battle.playerQueue[index];
      if (action) {
        removeFromPlayerQueue(index);
        addLog({
          turn: battle.turn,
          actor: "player",
          action: "unqueue",
          message: `${action.ability.icon ?? "⚔️"} ${action.ability.nameKo}을(를) 취소했다.`,
        });
      }
    },
    [battle, removeFromPlayerQueue, addLog]
  );

  /**
   * 큐 초기화
   */
  const clearQueue = useCallback(() => {
    clearPlayerQueue();
    addLog({
      turn: battle.turn,
      actor: "player",
      action: "clear_queue",
      message: "모든 행동을 취소했다.",
    });
  }, [clearPlayerQueue, addLog, battle.turn]);

  return {
    // 큐 조작
    queueAbility,
    unqueueAbility,
    clearQueue,

    // 실행
    executeAbility,

    // 상태
    playerQueue: battle.playerQueue,
    remainingAp: getRemainingPlayerAp(),
    maxAp: battle.playerMaxAp,
    playerMp: battle.playerMp,
    playerMaxMp: battle.playerMaxMp,

    // 체크
    canAffordAp,
    canAffordMp: (mp: number) => battle.playerMp >= mp,
    isInBattle: battle.isInBattle,
    isPlanning: battle.phase === "planning",
  };
}
