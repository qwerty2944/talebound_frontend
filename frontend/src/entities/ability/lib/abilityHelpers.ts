/**
 * Ability Helpers - 어빌리티 UI용 상수 및 헬퍼 함수
 */

import type { Ability, AbilityType, AbilityLevelEffects, MagicElement } from "../types";

// ============ 타입별 색상/아이콘 설정 ============

export const ABILITY_TYPE_CONFIG: Record<AbilityType, { color: string; icon: string; nameKo: string }> = {
  passive: { color: "#9CA3AF", icon: "⚪", nameKo: "패시브" },
  attack: { color: "#EF4444", icon: "⚔️", nameKo: "공격" },
  heal: { color: "#22C55E", icon: "💚", nameKo: "치유" },
  buff: { color: "#3B82F6", icon: "⬆️", nameKo: "버프" },
  debuff: { color: "#A855F7", icon: "⬇️", nameKo: "디버프" },
  utility: { color: "#F59E0B", icon: "🔧", nameKo: "유틸" },
  defense: { color: "#6B7280", icon: "🛡️", nameKo: "방어" },
  dot: { color: "#DC2626", icon: "🩸", nameKo: "도트" },
  special: { color: "#EC4899", icon: "✨", nameKo: "특수" },
};

// ============ 카테고리별 한글 이름 ============

export const CATEGORY_NAMES: Record<string, string> = {
  combat: "전투 기술",
  magic: "마법",
  life: "생활 기술",
};

// ============ 속성별 색상/아이콘 ============

export const ELEMENT_CONFIG: Record<MagicElement, { color: string; icon: string; nameKo: string }> = {
  fire: { color: "#EF4444", icon: "🔥", nameKo: "화염" },
  ice: { color: "#3B82F6", icon: "❄️", nameKo: "냉기" },
  lightning: { color: "#FBBF24", icon: "⚡", nameKo: "번개" },
  earth: { color: "#84CC16", icon: "🪨", nameKo: "대지" },
  holy: { color: "#FBBF24", icon: "✨", nameKo: "신성" },
  dark: { color: "#6B21A8", icon: "🌑", nameKo: "암흑" },
  poison: { color: "#22C55E", icon: "☠️", nameKo: "독" },
  arcane: { color: "#8B5CF6", icon: "🔮", nameKo: "비전" },
};

// ============ 효과 필드 한글 변환 ============

export const EFFECT_LABELS: Record<string, string> = {
  // 기본
  baseDamage: "기본 피해",
  apCost: "AP 소모",
  mpCost: "MP 소모",
  healAmount: "치유량",
  healPercent: "치유 (%)",
  duration: "지속 시간",

  // 방어
  armorBreak: "방어 관통",
  armorReduction: "방어력 감소",
  blockBonus: "막기 확률",
  dodgeBonus: "회피 확률",
  damageReduction: "피해 감소",
  counterChance: "반격 확률",

  // 상태이상
  bleedDamage: "출혈 피해",
  bleedDuration: "출혈 지속",
  bleedChance: "출혈 확률",
  poisonDamage: "독 피해",
  poisonDuration: "독 지속",
  burnDamage: "화상 피해",
  stunDuration: "기절 지속",
  stunChance: "기절 확률",
  slowPercent: "둔화",
  freezeChance: "빙결 확률",
  freezeDuration: "빙결 지속",
  knockdownChance: "넉다운 확률",
  blindChance: "실명 확률",

  // 공격 보너스
  critBonus: "치명타 확률",
  lifestealPercent: "흡혈",
  damageAmplify: "피해 증폭",

  // 상태이상 부여
  statusEffect: "상태이상",
  statusValue: "효과 값",
  statusDuration: "효과 지속",
  statusChance: "발동 확률",

  // 저항
  physicalResist: "물리 저항",
  magicResist: "마법 저항",
  ignoreResist: "저항 무시",

  // 속성 데미지
  fireDamage: "화염 피해",
  iceDamage: "냉기 피해",
  lightningDamage: "번개 피해",
  earthDamage: "대지 피해",
  holyDamage: "신성 피해",
  darkDamage: "암흑 피해",

  // 무기 데미지
  axeDamage: "도끼 피해",
  swordDamage: "검 피해",
  spearDamage: "창 피해",
  maceDamage: "둔기 피해",
  daggerDamage: "단검 피해",
  bowDamage: "활 피해",
  fistDamage: "맨손 피해",

  // MP 관련
  mpCostReduction: "MP 소모 감소",
  apModifierBonus: "AP 수정 보너스",
};

// 효과 값의 단위 (%, 턴 등)
export const EFFECT_UNITS: Record<string, string> = {
  apCost: "",
  mpCost: "",
  baseDamage: "",
  healAmount: "",
  healPercent: "%",
  duration: "턴",
  armorBreak: "%",
  blockBonus: "%",
  dodgeBonus: "%",
  damageReduction: "%",
  counterChance: "%",
  bleedDamage: "/턴",
  bleedDuration: "턴",
  bleedChance: "%",
  poisonDamage: "/턴",
  poisonDuration: "턴",
  stunDuration: "턴",
  stunChance: "%",
  slowPercent: "%",
  freezeChance: "%",
  freezeDuration: "턴",
  critBonus: "%",
  lifestealPercent: "%",
  damageAmplify: "%",
  statusDuration: "턴",
  statusChance: "%",
  physicalResist: "%",
  magicResist: "%",
  ignoreResist: "%",
  mpCostReduction: "%",
};

// ============ 헬퍼 함수 ============

/**
 * 경험치 진행률 계산 (0~100)
 */
export function getExpProgress(exp: number, expPerLevel: number): number {
  if (expPerLevel <= 0) return 0;
  return Math.min(100, Math.floor((exp / expPerLevel) * 100));
}

/**
 * 다음 레벨까지 필요한 경험치
 */
export function getExpToNextLevel(currentExp: number, expPerLevel: number): number {
  return Math.max(0, expPerLevel - currentExp);
}

/**
 * 레벨에 해당하는 효과 가져오기
 */
export function getEffectsAtLevel(ability: Ability, level: number): AbilityLevelEffects {
  if (!ability.levelBonuses || ability.levelBonuses.length === 0) {
    return {};
  }

  // 해당 레벨 이하의 가장 높은 레벨 보너스 찾기
  const applicableBonuses = ability.levelBonuses.filter((b) => b.level <= level);
  if (applicableBonuses.length === 0) {
    return ability.levelBonuses[0]?.effects || {};
  }
  return applicableBonuses[applicableBonuses.length - 1].effects;
}

/**
 * 다음 레벨 마일스톤 찾기
 */
export function getNextLevelMilestone(ability: Ability, currentLevel: number): number | null {
  if (!ability.levelBonuses) return null;

  const nextBonus = ability.levelBonuses.find((b) => b.level > currentLevel);
  return nextBonus?.level ?? null;
}

/**
 * 현재/다음 레벨 효과 비교
 */
export function compareEffects(
  ability: Ability,
  currentLevel: number
): Array<{ key: string; label: string; current: number | string; next: number | string | null; diff: number | null; unit: string }> {
  const currentEffects = getEffectsAtLevel(ability, currentLevel);
  const nextMilestone = getNextLevelMilestone(ability, currentLevel);
  const nextEffects = nextMilestone ? getEffectsAtLevel(ability, nextMilestone) : null;

  const result: Array<{ key: string; label: string; current: number | string; next: number | string | null; diff: number | null; unit: string }> = [];

  // 주요 효과만 표시 (수치형만)
  const priorityKeys = ["baseDamage", "apCost", "mpCost", "healAmount", "armorBreak", "blockBonus", "dodgeBonus", "bleedDamage", "stunChance", "critBonus"];

  for (const key of priorityKeys) {
    const currentValue = currentEffects[key];
    if (currentValue === undefined || typeof currentValue !== "number") continue;

    const label = EFFECT_LABELS[key] || key;
    const unit = EFFECT_UNITS[key] || "";
    const nextValue = nextEffects?.[key];

    if (nextValue !== undefined && typeof nextValue === "number") {
      result.push({
        key,
        label,
        current: currentValue,
        next: nextValue,
        diff: nextValue - currentValue,
        unit,
      });
    } else {
      result.push({
        key,
        label,
        current: currentValue,
        next: null,
        diff: null,
        unit,
      });
    }
  }

  // 나머지 효과 (수치형)
  for (const [key, value] of Object.entries(currentEffects)) {
    if (priorityKeys.includes(key)) continue;
    if (typeof value !== "number") continue;

    const label = EFFECT_LABELS[key] || key;
    const unit = EFFECT_UNITS[key] || "";
    const nextValue = nextEffects?.[key];

    if (nextValue !== undefined && typeof nextValue === "number") {
      result.push({
        key,
        label,
        current: value,
        next: nextValue,
        diff: nextValue - value,
        unit,
      });
    } else {
      result.push({
        key,
        label,
        current: value,
        next: null,
        diff: null,
        unit,
      });
    }
  }

  return result;
}

/**
 * 어빌리티를 카테고리별로 그룹핑
 */
export function groupAbilitiesByCategory(
  skillIds: string[],
  abilities: Ability[],
  userAbilities: { combat: Record<string, unknown>; magic: Record<string, unknown>; life: Record<string, unknown> } | undefined
): {
  combat: string[];
  magic: string[];
  life: string[];
} {
  const result = {
    combat: [] as string[],
    magic: [] as string[],
    life: [] as string[],
  };

  for (const skillId of skillIds) {
    // userAbilities에서 카테고리 확인
    if (userAbilities) {
      if (skillId in (userAbilities.combat || {})) {
        result.combat.push(skillId);
        continue;
      }
      if (skillId in (userAbilities.magic || {})) {
        result.magic.push(skillId);
        continue;
      }
      if (skillId in (userAbilities.life || {})) {
        result.life.push(skillId);
        continue;
      }
    }

    // abilities JSON에서 source로 분류
    const ability = abilities.find((a) => a.id === skillId);
    if (ability) {
      if (ability.source === "spell") {
        result.magic.push(skillId);
      } else if (ability.source === "combatskill") {
        result.combat.push(skillId);
      } else {
        result.life.push(skillId);
      }
    } else {
      // 기본값: combat
      result.combat.push(skillId);
    }
  }

  return result;
}
