"use client";

import { useCallback, useMemo } from "react";
import { useBattleStore, useEquipmentStore } from "@/application/stores";
import type { CharacterStats } from "@/entities/character";

// Passive skills are now integrated into the ability system
// This is a stub implementation for backward compatibility

interface UsePassiveSkillsOptions {
  characterStats: CharacterStats;
}

interface PassiveSkillResult {
  triggered: boolean;
  message: string;
}

/**
 * 패시브 스킬 처리 훅 (스텁 구현)
 * TODO: 어빌리티 시스템으로 통합 예정
 */
export function usePassiveSkills(_options: UsePassiveSkillsOptions) {
  const { battle } = useBattleStore();
  const { learnedSkills } = useEquipmentStore();

  // 스텁: 패시브 스킬 목록
  const learnedPassiveSkills = useMemo(() => {
    return [];
  }, [learnedSkills]);

  // 스텁: 피격 시 패시브 처리
  const processOnHit = useCallback(
    (_damageTaken: number): PassiveSkillResult[] => {
      return [];
    },
    [learnedPassiveSkills]
  );

  // 스텁: 저체력 패시브 처리
  const processLowHp = useCallback((): PassiveSkillResult[] => {
    return [];
  }, [learnedPassiveSkills, battle]);

  return {
    learnedPassiveSkills,
    processOnHit,
    processLowHp,
  };
}
