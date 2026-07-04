"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAbilities,
  fetchAbilityById,
  fetchAbilitiesBySource,
  fetchAbilitiesByType,
  // User Abilities
  fetchUserAbilities,
  increaseAbilityExp,
  updateAbilitiesProgress,
} from "../api";
import type { Ability } from "../types";
import type { AbilityCategory, UserAbilities } from "../api";

// 쿼리 키
export const abilityKeys = {
  all: ["abilities"] as const,
  byId: (id: string) => ["abilities", id] as const,
  bySource: (source: string) => ["abilities", "source", source] as const,
  byType: (type: string) => ["abilities", "type", type] as const,
  // User Abilities
  user: (characterId: string) => ["userAbilities", characterId] as const,
};

/**
 * 모든 어빌리티 조회
 */
export function useAbilities() {
  return useQuery({
    queryKey: abilityKeys.all,
    queryFn: fetchAbilities,
    staleTime: Infinity, // 정적 데이터
  });
}

/**
 * ID로 어빌리티 조회
 */
export function useAbility(id: string) {
  return useQuery({
    queryKey: abilityKeys.byId(id),
    queryFn: () => fetchAbilityById(id),
    enabled: !!id,
    staleTime: Infinity,
  });
}

/**
 * 소스별 어빌리티 조회 (spell | combatskill)
 */
export function useAbilitiesBySource(source: "spell" | "combatskill") {
  return useQuery({
    queryKey: abilityKeys.bySource(source),
    queryFn: () => fetchAbilitiesBySource(source),
    staleTime: Infinity,
  });
}

/**
 * 타입별 어빌리티 조회
 */
export function useAbilitiesByType(type: Ability["type"]) {
  return useQuery({
    queryKey: abilityKeys.byType(type),
    queryFn: () => fetchAbilitiesByType(type),
    staleTime: Infinity,
  });
}

/**
 * 전투용 공격 어빌리티만 조회
 */
export function useAttackAbilities() {
  const { data: abilities, ...rest } = useAbilities();

  const attackAbilities = abilities?.filter(
    (a) => a.type === "attack" && a.usageContext === "combat_only"
  );

  return { data: attackAbilities, ...rest };
}

/**
 * 마법 어빌리티만 조회
 */
export function useSpellAbilities() {
  return useAbilitiesBySource("spell");
}

/**
 * 물리 스킬 어빌리티만 조회
 */
export function useCombatSkillAbilities() {
  return useAbilitiesBySource("combatskill");
}

// ============ User Abilities (DB) ============

/**
 * 유저의 어빌리티 데이터 조회
 */
export function useUserAbilities(characterId: string | undefined) {
  return useQuery({
    queryKey: abilityKeys.user(characterId || ""),
    queryFn: () => fetchUserAbilities(characterId!),
    enabled: !!characterId,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 단일 어빌리티 경험치 증가 mutation
 */
export function useIncreaseAbilityExp(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      category: AbilityCategory;
      abilityId: string;
      amount?: number;
    }) =>
      increaseAbilityExp(
        characterId,
        params.category,
        params.abilityId,
        params.amount
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: abilityKeys.user(characterId),
      });
    },
  });
}

/**
 * 배치 어빌리티 업데이트 mutation
 */
export function useUpdateAbilitiesProgress(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: {
      combat?: Record<string, number>;
      magic?: Record<string, number>;
      life?: Record<string, number>;
    }) => updateAbilitiesProgress(characterId, updates),
    onSuccess: (data) => {
      // 캐시 직접 업데이트
      queryClient.setQueryData(
        abilityKeys.user(characterId),
        data
      );
    },
  });
}
