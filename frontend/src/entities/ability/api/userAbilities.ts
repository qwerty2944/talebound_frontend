/**
 * User Abilities API - abilities 테이블 연동
 */

import { supabase } from "@/shared/api";

// ============ 타입 정의 ============

export interface AbilityProgress {
  level: number;
  exp: number;
}

export interface UserAbilities {
  combat: Record<string, AbilityProgress>;
  magic: Record<string, AbilityProgress>;
  life: Record<string, AbilityProgress>;
}

export type AbilityCategory = "combat" | "magic" | "life";

// ============ API 함수 ============

/**
 * 유저의 어빌리티 데이터 조회
 */
export async function fetchUserAbilities(
  characterId: string
): Promise<UserAbilities> {
  const { data, error } = await supabase
    .from("abilities")
    .select("combat, magic, life")
    .eq("user_id", characterId)
    .single();

  if (error) {
    // 데이터가 없으면 빈 객체 반환
    if (error.code === "PGRST116") {
      return { combat: {}, magic: {}, life: {} };
    }
    throw error;
  }

  return {
    combat: data.combat || {},
    magic: data.magic || {},
    life: data.life || {},
  };
}

/**
 * 단일 어빌리티 경험치 증가
 */
export async function increaseAbilityExp(
  characterId: string,
  category: AbilityCategory,
  abilityId: string,
  amount: number = 1
): Promise<AbilityProgress> {
  const { data, error } = await supabase.rpc("increase_ability_exp", {
    p_character_id: characterId,
    p_category: category,
    p_ability_id: abilityId,
    p_amount: amount,
  });

  if (error) throw error;

  return {
    level: data.level,
    exp: data.exp,
  };
}

/**
 * 배치 어빌리티 경험치 업데이트
 */
export async function updateAbilitiesProgress(
  characterId: string,
  updates: {
    combat?: Record<string, number>;
    magic?: Record<string, number>;
    life?: Record<string, number>;
  }
): Promise<UserAbilities> {
  const { data, error } = await supabase.rpc("update_abilities_progress", {
    p_character_id: characterId,
    p_combat: updates.combat || null,
    p_magic: updates.magic || null,
    p_life: updates.life || null,
  });

  if (error) throw error;

  return data as UserAbilities;
}

/**
 * 특정 어빌리티의 레벨 조회
 */
export async function getAbilityLevel(
  characterId: string,
  category: AbilityCategory,
  abilityId: string
): Promise<number> {
  const abilities = await fetchUserAbilities(characterId);
  const categoryData = abilities[category];
  return categoryData[abilityId]?.level || 0;
}

/**
 * 어빌리티 레벨이 요구 조건을 충족하는지 확인
 */
export function checkAbilityRequirement(
  userAbilities: UserAbilities,
  category: AbilityCategory,
  abilityId: string,
  requiredLevel: number
): boolean {
  const progress = userAbilities[category][abilityId];
  return progress ? progress.level >= requiredLevel : false;
}

/**
 * 배운 어빌리티 목록 (레벨 1 이상)
 */
export function getLearnedAbilities(
  userAbilities: UserAbilities,
  category?: AbilityCategory
): Record<string, AbilityProgress> {
  const result: Record<string, AbilityProgress> = {};

  const categories: AbilityCategory[] = category
    ? [category]
    : ["combat", "magic", "life"];

  for (const cat of categories) {
    const catData = userAbilities[cat];
    for (const [id, progress] of Object.entries(catData)) {
      if (progress.level >= 1) {
        result[id] = progress;
      }
    }
  }

  return result;
}
