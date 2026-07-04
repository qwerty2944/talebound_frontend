/**
 * 몬스터 AI - 어빌리티 선택 및 큐 생성
 *
 * 몬스터 행동 선택 확률:
 * - actionWeights.basicAttack: 기본 공격 확률
 * - actionWeights.specialSkill: 전용 스킬 확률 (abilities 배열)
 * - actionWeights.borrowedAbility: 캐릭터 어빌리티 확률 (borrowedAbilities 배열)
 */

import type { Monster, MonsterAbility, BorrowedAbility } from "@/entities/monster";
import type { RawMonsterAbility } from "@/entities/ability";
import type { QueuedAction } from "@/application/stores/battleStore";
import { applyDamageVariance } from "./damage";

// 캐릭터 어빌리티 타입 (combat skills)
interface CharacterAbility {
  id: string;
  nameKo: string;
  nameEn?: string;
  description?: { ko: string; en: string };
  icon?: string;
  type: string;
  attackType?: string;
  levelBonuses?: Array<{
    level: number;
    effects: { baseDamage?: number; apCost?: number; [key: string]: unknown };
  }>;
}

interface MonsterAiContext {
  monster: Monster;
  monsterHpPercent: number;
  currentTurn: number;
  monsterMaxAp: number;
  monsterCurrentAp: number;
}

// 행동 유형
type ActionType = "basicAttack" | "specialSkill" | "borrowedAbility";

/**
 * 몬스터가 사용 가능한 어빌리티 필터링 (조건 체크)
 */
export function getAvailableAbilities(
  abilities: MonsterAbility[],
  context: { hpPercent: number; currentTurn: number }
): MonsterAbility[] {
  return abilities.filter((ability) => {
    if (!ability.condition) return true;

    const { hpBelow, hpAbove, turnAfter } = ability.condition;

    // HP 조건 체크
    if (hpBelow !== undefined && context.hpPercent >= hpBelow) {
      return false;
    }
    if (hpAbove !== undefined && context.hpPercent <= hpAbove) {
      return false;
    }

    // 턴 조건 체크
    if (turnAfter !== undefined && context.currentTurn < turnAfter) {
      return false;
    }

    return true;
  });
}

/**
 * 가중치 기반 랜덤 선택
 */
export function selectAbilityByWeight(abilities: MonsterAbility[]): MonsterAbility | null {
  if (abilities.length === 0) return null;

  const totalWeight = abilities.reduce((sum, a) => sum + a.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const ability of abilities) {
    roll -= ability.weight;
    if (roll <= 0) {
      return ability;
    }
  }

  return abilities[abilities.length - 1];
}

/**
 * 몬스터 어빌리티를 QueuedAction으로 변환
 */
export function createMonsterQueuedAction(
  ability: MonsterAbility,
  monsterAbilityData: RawMonsterAbility
): QueuedAction {
  // RawMonsterAbility를 Ability 형식으로 변환
  const abilityForQueue = {
    id: monsterAbilityData.id,
    nameKo: monsterAbilityData.nameKo,
    nameEn: monsterAbilityData.nameEn,
    description: monsterAbilityData.description,
    icon: monsterAbilityData.icon,
    source: "monster" as const,
    type: monsterAbilityData.type as "attack" | "buff" | "debuff",
    attackType: monsterAbilityData.attackType as "melee_physical" | "ranged_physical" | "magic" | undefined,
    baseCost: {
      ap: monsterAbilityData.apCost,
    },
    levelBonuses: [],
    usageContext: "combat_only" as const,
    maxLevel: 1,
    expPerLevel: 0,
    requirements: {},
    target: monsterAbilityData.type === "buff" ? "self" as const : "enemy" as const,
  };

  return {
    ability: abilityForQueue,
    level: ability.level,
    apCost: monsterAbilityData.apCost,
    mpCost: 0,
  };
}

/**
 * actionWeights 기반 행동 유형 선택
 */
export function selectActionType(
  actionWeights: { basicAttack: number; specialSkill: number; borrowedAbility: number } | undefined,
  hasSpecialSkills: boolean,
  hasBorrowedAbilities: boolean
): ActionType {
  // 기본값: 전용 스킬 60%, 기본 공격 40%
  const weights = actionWeights ?? { basicAttack: 40, specialSkill: 60, borrowedAbility: 0 };

  // 사용 불가능한 옵션 필터링
  const effectiveWeights = {
    basicAttack: weights.basicAttack,
    specialSkill: hasSpecialSkills ? weights.specialSkill : 0,
    borrowedAbility: hasBorrowedAbilities ? weights.borrowedAbility : 0,
  };

  // 모든 가중치가 0이면 기본 공격
  const total = effectiveWeights.basicAttack + effectiveWeights.specialSkill + effectiveWeights.borrowedAbility;
  if (total === 0) return "basicAttack";

  const roll = Math.random() * total;
  let cumulative = 0;

  if (effectiveWeights.basicAttack > 0) {
    cumulative += effectiveWeights.basicAttack;
    if (roll < cumulative) return "basicAttack";
  }

  if (effectiveWeights.specialSkill > 0) {
    cumulative += effectiveWeights.specialSkill;
    if (roll < cumulative) return "specialSkill";
  }

  return "borrowedAbility";
}

/**
 * BorrowedAbility를 가중치 기반으로 선택
 */
export function selectBorrowedAbilityByWeight(
  abilities: BorrowedAbility[]
): BorrowedAbility | null {
  if (abilities.length === 0) return null;

  const totalWeight = abilities.reduce((sum, a) => sum + a.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const ability of abilities) {
    roll -= ability.weight;
    if (roll <= 0) {
      return ability;
    }
  }

  return abilities[abilities.length - 1];
}

/**
 * 캐릭터 어빌리티에서 레벨별 효과 계산
 */
function getAbilityEffectsAtLevel(ability: CharacterAbility, level: number): { baseDamage: number; apCost: number } {
  if (!ability.levelBonuses || ability.levelBonuses.length === 0) {
    return { baseDamage: 10, apCost: 5 };
  }

  // 해당 레벨 이하의 가장 높은 레벨 보너스 찾기
  const applicableBonuses = ability.levelBonuses
    .filter((b) => b.level <= level)
    .sort((a, b) => b.level - a.level);

  if (applicableBonuses.length === 0) {
    // 최소 레벨 보너스 사용
    const minBonus = ability.levelBonuses.reduce((min, b) => (b.level < min.level ? b : min));
    return {
      baseDamage: minBonus.effects.baseDamage ?? 10,
      apCost: minBonus.effects.apCost ?? 5,
    };
  }

  const bonus = applicableBonuses[0];
  return {
    baseDamage: bonus.effects.baseDamage ?? 10,
    apCost: bonus.effects.apCost ?? 5,
  };
}

/**
 * BorrowedAbility를 QueuedAction으로 변환
 */
export function createBorrowedAbilityAction(
  borrowed: BorrowedAbility,
  abilityData: CharacterAbility
): QueuedAction {
  const effects = getAbilityEffectsAtLevel(abilityData, borrowed.level);

  const abilityForQueue = {
    id: abilityData.id,
    nameKo: abilityData.nameKo,
    nameEn: abilityData.nameEn || abilityData.nameKo,
    description: abilityData.description || { ko: "", en: "" },
    icon: abilityData.icon || "⚔️",
    source: "monster" as const, // 몬스터가 사용
    type: abilityData.type as "attack" | "buff" | "debuff",
    attackType: abilityData.attackType as "melee_physical" | "ranged_physical" | "magic" | undefined,
    baseCost: { ap: effects.apCost },
    levelBonuses: [],
    usageContext: "combat_only" as const,
    maxLevel: 1,
    expPerLevel: 0,
    requirements: {},
    target: abilityData.type === "buff" ? ("self" as const) : ("enemy" as const),
  };

  return {
    ability: abilityForQueue,
    level: borrowed.level,
    apCost: effects.apCost,
    mpCost: 0,
  };
}

/**
 * 몬스터 기본 공격 생성 (어빌리티가 없을 때 사용)
 */
function createDefaultAttackAction(monster: Monster): QueuedAction {
  const defaultAbility = {
    id: "monster_basic_attack",
    nameKo: "공격",
    nameEn: "Attack",
    description: { ko: "기본 공격", en: "Basic attack" },
    icon: monster.icon || "👊",
    source: "monster" as const,
    type: "attack" as const,
    attackType: "melee_physical" as const,
    baseCost: { ap: 3 },
    levelBonuses: [],
    usageContext: "combat_only" as const,
    maxLevel: 1,
    expPerLevel: 0,
    requirements: {},
    target: "enemy" as const,
  };

  return {
    ability: defaultAbility,
    level: 1,
    apCost: 3,
    mpCost: 0,
  };
}

/**
 * 몬스터 턴 큐 생성
 * AP 제한 내에서 여러 어빌리티 선택
 */
export function buildMonsterQueue(
  context: MonsterAiContext,
  monsterAbilitiesData: Map<string, RawMonsterAbility>
): QueuedAction[] {
  const queue: QueuedAction[] = [];

  // passive 몬스터는 공격하지 않음 (훈련용 허수아비 등)
  if (context.monster.behavior === "passive") {
    return queue;
  }

  let remainingAp = context.monsterMaxAp;

  const monsterAbilities = context.monster.abilities || [];

  // 어빌리티가 없으면 기본 공격 사용
  if (monsterAbilities.length === 0) {
    // AP가 남아있는 한 기본 공격 추가
    const maxActions = 3;
    let actionCount = 0;
    const defaultApCost = 3;

    while (remainingAp >= defaultApCost && actionCount < maxActions) {
      queue.push(createDefaultAttackAction(context.monster));
      remainingAp -= defaultApCost;
      actionCount++;
    }
    return queue;
  }

  // 사용 가능한 어빌리티 필터링
  const available = getAvailableAbilities(monsterAbilities, {
    hpPercent: context.monsterHpPercent,
    currentTurn: context.currentTurn,
  });

  // 사용 가능한 어빌리티가 없으면 기본 공격
  if (available.length === 0) {
    const maxActions = 3;
    let actionCount = 0;
    const defaultApCost = 3;

    while (remainingAp >= defaultApCost && actionCount < maxActions) {
      queue.push(createDefaultAttackAction(context.monster));
      remainingAp -= defaultApCost;
      actionCount++;
    }
    return queue;
  }

  // AP가 남아있는 동안 어빌리티 선택
  const maxActions = 3; // 턴당 최대 행동 수
  let actionCount = 0;

  while (remainingAp > 0 && actionCount < maxActions) {
    // 사용 가능하고 AP를 감당할 수 있는 어빌리티만 필터
    const affordableAbilities = available.filter((a) => {
      const data = monsterAbilitiesData.get(a.abilityId);
      return data && data.apCost <= remainingAp;
    });

    // 감당 가능한 어빌리티가 없으면 기본 공격 시도
    if (affordableAbilities.length === 0) {
      if (remainingAp >= 3) {
        queue.push(createDefaultAttackAction(context.monster));
        remainingAp -= 3;
        actionCount++;
        continue;
      }
      break;
    }

    // 가중치 기반 선택
    const selected = selectAbilityByWeight(affordableAbilities);
    if (!selected) break;

    const abilityData = monsterAbilitiesData.get(selected.abilityId);
    if (!abilityData) break;

    // 큐에 추가
    const queuedAction = createMonsterQueuedAction(selected, abilityData);
    queue.push(queuedAction);

    remainingAp -= abilityData.apCost;
    actionCount++;
  }

  return queue;
}

/**
 * 몬스터 어빌리티 데미지 계산 (레벨 반영)
 */
export function calculateMonsterAbilityDamage(
  abilityData: RawMonsterAbility,
  level: number,
  monsterAttack: number
): number {
  const baseDamage = abilityData.baseDamage || 0;
  const perLevel = abilityData.damagePerLevel || 0;

  // 기본 데미지 + (레벨 × 레벨당 증가) + 몬스터 공격력 보정 + 편차(±15%)
  const rawDamage = baseDamage + perLevel * level + monsterAttack * 0.5;
  return applyDamageVariance(rawDamage);
}

/**
 * 몬스터 어빌리티 상태이상 적용 확률 체크
 */
export function checkMonsterStatusEffect(abilityData: RawMonsterAbility): {
  applies: boolean;
  effect?: string;
  value?: number;
  duration?: number;
} {
  if (!abilityData.statusEffect || !abilityData.statusChance) {
    return { applies: false };
  }

  const roll = Math.random() * 100;
  if (roll < abilityData.statusChance) {
    return {
      applies: true,
      effect: abilityData.statusEffect,
      value: abilityData.statusValue,
      duration: abilityData.statusDuration,
    };
  }

  return { applies: false };
}

/**
 * 몬스터 버프 어빌리티 처리
 */
export function getMonsterBuffEffect(abilityData: RawMonsterAbility): {
  buff?: string;
  value?: number;
  duration?: number;
} {
  if (!abilityData.selfBuff) {
    return {};
  }

  return {
    buff: abilityData.selfBuff,
    value: abilityData.buffValue,
    duration: abilityData.buffDuration,
  };
}

// ============ 은신 감지 시스템 ============

/**
 * 은신 감지 결과 타입
 */
export type StealthTargetingMode = "normal" | "confused" | "searching";

export interface StealthDetectionResult {
  targetingMode: StealthTargetingMode;
  hitPenalty: number; // 명중 페널티 (0-50%)
  detectedPlayer: boolean;
}

/**
 * 몬스터의 은신 감지 체크
 * 몬스터 speed 스탯을 감지력으로 활용
 *
 * @param monsterSpeed 몬스터 speed 스탯 (감지력)
 * @param isPlayerStealthed 플레이어 은신 여부
 * @returns 감지 결과
 */
export function getStealthDetectionResult(
  monsterSpeed: number,
  isPlayerStealthed: boolean
): StealthDetectionResult {
  // 은신 상태가 아니면 정상 전투
  if (!isPlayerStealthed) {
    return {
      targetingMode: "normal",
      hitPenalty: 0,
      detectedPlayer: true,
    };
  }

  // 감지 확률: speed * 2 (최대 50%)
  const detectionChance = Math.min(50, monsterSpeed * 2);
  const roll = Math.random() * 100;

  if (roll < detectionChance) {
    // 감지 성공: 10% 페널티만
    return {
      targetingMode: "normal",
      hitPenalty: 10,
      detectedPlayer: true,
    };
  }

  // 감지 실패: speed에 따라 행동 결정
  if (monsterSpeed >= 15) {
    // 부분 감지: 대략적인 위치 파악
    return {
      targetingMode: "searching",
      hitPenalty: 30,
      detectedPlayer: false,
    };
  }

  // 완전 실패: 혼란
  return {
    targetingMode: "confused",
    hitPenalty: 50,
    detectedPlayer: false,
  };
}

/**
 * 혼란 상태 몬스터 행동 생성
 * - 40%: 아무것도 안 함 (주위를 둘러본다)
 * - 20%: 주변 수색 (허공을 휘두른다)
 * - 40%: 무작위 공격 (페널티 적용)
 */
export function buildConfusedMonsterQueue(
  context: MonsterAiContext,
  monsterAbilitiesData: Map<string, RawMonsterAbility>,
  detectionResult: StealthDetectionResult
): { queue: QueuedAction[]; confusedMessages: string[] } {
  const queue: QueuedAction[] = [];
  const confusedMessages: string[] = [];

  const roll = Math.random() * 100;

  if (roll < 40) {
    // 40%: 아무것도 안 함
    confusedMessages.push(`${context.monster.icon} ${context.monster.nameKo}이(가) 주위를 두리번거린다...`);
    return { queue, confusedMessages };
  }

  if (roll < 60) {
    // 20%: 허공 공격
    confusedMessages.push(`${context.monster.icon} ${context.monster.nameKo}이(가) 허공을 휘두른다!`);
    return { queue, confusedMessages };
  }

  // 40%: 무작위 공격 (명중 페널티 적용됨)
  confusedMessages.push(`${context.monster.icon} ${context.monster.nameKo}이(가) 기척을 느끼고 공격한다!`);

  // 기본 공격만 사용 (혼란 상태에서는 스킬 사용 불가)
  queue.push(createDefaultConfusedAttack(context.monster, detectionResult.hitPenalty));

  return { queue, confusedMessages };
}

/**
 * 혼란 상태 기본 공격 생성 (명중 페널티 표시용)
 */
function createDefaultConfusedAttack(monster: Monster, hitPenalty: number): QueuedAction {
  const confusedAbility = {
    id: "monster_confused_attack",
    nameKo: `불확실한 공격 (-${hitPenalty}%)`,
    nameEn: "Confused Attack",
    description: { ko: "플레이어의 위치를 파악하지 못한 상태로 공격", en: "Attack while unable to locate player" },
    icon: "❓",
    source: "monster" as const,
    type: "attack" as const,
    attackType: "melee_physical" as const,
    baseCost: { ap: 3 },
    levelBonuses: [],
    usageContext: "combat_only" as const,
    maxLevel: 1,
    expPerLevel: 0,
    requirements: {},
    target: "enemy" as const,
    // 커스텀 필드: 페널티 정보
    hitPenalty,
  };

  return {
    ability: confusedAbility,
    level: 1,
    apCost: 3,
    mpCost: 0,
  };
}
