import type { Ability } from "../types";
import type { AbilityProgress } from "../api/userAbilities";
import { getEffectsAtLevel } from "../api";

/**
 * 배운 패시브 어빌리티의 효과를 전투용 보너스로 집계한다.
 * 1차 범위: 데미지 보너스(%)와 AP 비용 감소(%)만. 나머지 효과 키는 추후 확장.
 */
export interface PassiveBonuses {
  /** 카테고리(무기 타입 또는 "magic")별 데미지 보너스 % */
  damageBonusByCategory: Record<string, number>;
  /** 모든 공격에 적용되는 데미지 보너스 % */
  globalDamageBonus: number;
  /** 카테고리별 AP 비용 감소 % */
  costReductionByCategory: Record<string, number>;
}

const WEAPON_CATEGORIES = new Set([
  "light_sword", "medium_sword", "great_sword", "sword",
  "axe", "mace", "dagger", "spear", "bow", "crossbow", "staff", "fist", "shield",
]);

/** "axeDamage" 같은 무기별 키 → 카테고리 매핑 */
const WEAPON_DAMAGE_KEY = /^([a-z_]+)Damage$/;

/** 패시브 id가 "<weapon>_mastery" 형태면 해당 무기 카테고리로 귀속 */
function categoryFromAbility(ability: Ability): string | null {
  const m = ability.id.match(/^([a-z_]+)_mastery$/);
  if (m && WEAPON_CATEGORIES.has(m[1])) return m[1];
  if (ability.category && WEAPON_CATEGORIES.has(ability.category)) return ability.category;
  return null;
}

export function getPassiveBonuses(
  allAbilities: Ability[],
  learned: Record<string, AbilityProgress>
): PassiveBonuses {
  const result: PassiveBonuses = {
    damageBonusByCategory: {},
    globalDamageBonus: 0,
    costReductionByCategory: {},
  };

  const addDamage = (category: string, amount: number) => {
    result.damageBonusByCategory[category] =
      (result.damageBonusByCategory[category] ?? 0) + amount;
  };

  for (const ability of allAbilities) {
    if (ability.type !== "passive") continue;
    const progress = learned[ability.id];
    if (!progress || progress.level < 1) continue;

    const effects = getEffectsAtLevel(ability, progress.level) as Record<string, unknown>;
    const ownCategory = categoryFromAbility(ability);

    for (const [key, raw] of Object.entries(effects)) {
      if (typeof raw !== "number" || raw === 0) continue;

      if (key === "damageBonus") {
        // 무기 마스터리면 해당 무기에만, 아니면 전역
        if (ownCategory) addDamage(ownCategory, raw);
        else result.globalDamageBonus += raw;
      } else if (key === "magicDamage") {
        addDamage("magic", raw);
      } else {
        const m = key.match(WEAPON_DAMAGE_KEY);
        if (m && WEAPON_CATEGORIES.has(m[1])) {
          addDamage(m[1], raw);
        }
      }

      if (key === "costReduction" || key === "apCostReduction") {
        const target = ownCategory ?? "all";
        result.costReductionByCategory[target] =
          (result.costReductionByCategory[target] ?? 0) + raw;
      }
    }
  }

  return result;
}

/** 공격 1회에 적용될 총 데미지 보너스 % (카테고리 + 전역) */
export function getDamageBonusFor(
  bonuses: PassiveBonuses | undefined,
  category: string
): number {
  if (!bonuses) return 0;
  return (bonuses.damageBonusByCategory[category] ?? 0) + bonuses.globalDamageBonus;
}
