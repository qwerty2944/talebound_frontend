// ============ Enhancement System Types ============

import type { EquipmentStats } from "./index";

// ============ Enhancement Info ============

/** 강화 정보 */
export interface EnhancementInfo {
  /** 강화 단계 (+0 ~ +15) */
  level: number;
  /** 최대 강화 단계 */
  maxLevel: number;
  /** 연속 실패 횟수 (천장 시스템용) */
  failCount: number;
  /** 파괴 보호 단계 (이 단계까지는 파괴 안 됨) */
  protectedUntil?: number;
}

/** 기본 강화 정보 */
export const DEFAULT_ENHANCEMENT_INFO: EnhancementInfo = {
  level: 0,
  maxLevel: 15,
  failCount: 0,
  protectedUntil: 10, // +10까지 파괴 보호
};

// ============ Enhancement Result ============

/** 강화 결과 타입 */
export type EnhancementResultType =
  | "success" // 성공: 단계 +1
  | "fail" // 실패: 단계 유지
  | "downgrade" // 하락: 단계 -1
  | "destroy"; // 파괴: 장비 소멸

/** 실패 시 패널티 타입 */
export type FailPenaltyType = "none" | "downgrade" | "destroy";

// ============ Enhancement Config ============

/** 강화 단계별 설정 */
export interface EnhancementLevelConfig {
  /** 강화 단계 (목표) */
  level: number;
  /** 성공 확률 (%) */
  successRate: number;
  /** 스탯 증가 배율 */
  statMultiplier: number;
  /** 실패 시 패널티 */
  failPenalty: FailPenaltyType;
  /** 강화 비용 (골드) */
  goldCost: number;
  /** 필요 재료 ID (없으면 골드만) */
  requiredMaterial?: string;
  /** 필요 재료 수량 */
  requiredMaterialCount?: number;
}

/** 강화 설정 테이블 (+1 ~ +15) */
export const ENHANCEMENT_CONFIG: EnhancementLevelConfig[] = [
  // +1 ~ +2: 100% 성공, 실패 없음
  {
    level: 1,
    successRate: 100,
    statMultiplier: 1.05,
    failPenalty: "none",
    goldCost: 100,
  },
  {
    level: 2,
    successRate: 100,
    statMultiplier: 1.1,
    failPenalty: "none",
    goldCost: 200,
  },
  // +3 ~ +5: 높은 성공률, 실패해도 유지
  {
    level: 3,
    successRate: 95,
    statMultiplier: 1.15,
    failPenalty: "none",
    goldCost: 500,
  },
  {
    level: 4,
    successRate: 90,
    statMultiplier: 1.2,
    failPenalty: "none",
    goldCost: 1000,
  },
  {
    level: 5,
    successRate: 80,
    statMultiplier: 1.3,
    failPenalty: "none",
    goldCost: 2000,
  },
  // +6 ~ +10: 중간 난이도, 실패 시 하락
  {
    level: 6,
    successRate: 70,
    statMultiplier: 1.4,
    failPenalty: "downgrade",
    goldCost: 5000,
  },
  {
    level: 7,
    successRate: 60,
    statMultiplier: 1.5,
    failPenalty: "downgrade",
    goldCost: 10000,
  },
  {
    level: 8,
    successRate: 50,
    statMultiplier: 1.65,
    failPenalty: "downgrade",
    goldCost: 20000,
  },
  {
    level: 9,
    successRate: 40,
    statMultiplier: 1.8,
    failPenalty: "downgrade",
    goldCost: 40000,
  },
  {
    level: 10,
    successRate: 30,
    statMultiplier: 2.0,
    failPenalty: "downgrade",
    goldCost: 80000,
  },
  // +11 ~ +15: 고위험, 실패 시 파괴 가능 (보호 아이템 필요)
  {
    level: 11,
    successRate: 25,
    statMultiplier: 2.25,
    failPenalty: "destroy",
    goldCost: 150000,
    requiredMaterial: "enhancement_stone_high",
    requiredMaterialCount: 1,
  },
  {
    level: 12,
    successRate: 20,
    statMultiplier: 2.5,
    failPenalty: "destroy",
    goldCost: 300000,
    requiredMaterial: "enhancement_stone_high",
    requiredMaterialCount: 2,
  },
  {
    level: 13,
    successRate: 15,
    statMultiplier: 2.8,
    failPenalty: "destroy",
    goldCost: 500000,
    requiredMaterial: "enhancement_stone_high",
    requiredMaterialCount: 3,
  },
  {
    level: 14,
    successRate: 10,
    statMultiplier: 3.2,
    failPenalty: "destroy",
    goldCost: 1000000,
    requiredMaterial: "enhancement_stone_high",
    requiredMaterialCount: 4,
  },
  {
    level: 15,
    successRate: 5,
    statMultiplier: 4.0,
    failPenalty: "destroy",
    goldCost: 2000000,
    requiredMaterial: "enhancement_stone_high",
    requiredMaterialCount: 5,
  },
];

// ============ Enhancement Attempt ============

/** 강화 시도 파라미터 */
export interface EnhanceAttemptParams {
  /** 현재 강화 레벨 */
  currentLevel: number;
  /** 플레이어 골드 */
  playerGold: number;
  /** 보유 재료 */
  materials: { itemId: string; quantity: number }[];
  /** 파괴 보호 아이템 사용 */
  useProtection?: boolean;
  /** 확률 증가 아이템 사용 */
  useLuckBoost?: boolean;
  /** 연속 실패 횟수 (천장용) */
  failCount?: number;
}

/** 강화 시도 결과 */
export interface EnhanceAttemptResult {
  /** 강화 성공 여부 */
  success: boolean;
  /** 결과 타입 */
  result: EnhancementResultType;
  /** 새로운 강화 레벨 (-1 = 파괴) */
  newLevel: number;
  /** 소모된 골드 */
  goldCost: number;
  /** 소모된 재료 */
  materialsUsed: { itemId: string; quantity: number }[];
  /** 결과 메시지 */
  message: string;
  /** 새로운 연속 실패 횟수 */
  newFailCount: number;
}

// ============ Helper Functions ============

/**
 * 강화 레벨에 해당하는 설정 가져오기
 */
export function getEnhancementConfig(
  targetLevel: number
): EnhancementLevelConfig | null {
  return ENHANCEMENT_CONFIG.find((c) => c.level === targetLevel) ?? null;
}

/**
 * 현재 레벨에서 다음 강화 비용 계산
 */
export function getEnhancementCost(currentLevel: number): {
  goldCost: number;
  materialId?: string;
  materialCount?: number;
} | null {
  const config = getEnhancementConfig(currentLevel + 1);
  if (!config) return null;

  return {
    goldCost: config.goldCost,
    materialId: config.requiredMaterial,
    materialCount: config.requiredMaterialCount,
  };
}

/**
 * 강화 레벨에 따른 스탯 배율 계산
 */
export function getEnhancementMultiplier(enhancementLevel: number): number {
  if (enhancementLevel <= 0) return 1.0;
  const config = ENHANCEMENT_CONFIG.find((c) => c.level === enhancementLevel);
  return config?.statMultiplier ?? 1.0;
}

/**
 * 강화된 스탯 계산
 */
export function calculateEnhancedStats(
  baseStats: Partial<EquipmentStats>,
  enhancementLevel: number
): Partial<EquipmentStats> {
  if (enhancementLevel <= 0) return { ...baseStats };

  const multiplier = getEnhancementMultiplier(enhancementLevel);
  const enhancedStats: Partial<EquipmentStats> = {};

  // 숫자 스탯에만 배율 적용
  const numericKeys: (keyof EquipmentStats)[] = [
    "attack",
    "defense",
    "magic",
    "hp",
    "mp",
    "physicalAttack",
    "physicalDefense",
    "magicAttack",
    "magicDefense",
    "str",
    "dex",
    "con",
    "int",
    "wis",
    "cha",
    "lck",
  ];

  for (const key of Object.keys(baseStats) as (keyof EquipmentStats)[]) {
    const value = baseStats[key];
    if (typeof value === "number") {
      if (numericKeys.includes(key)) {
        // 주요 스탯은 배율 적용
        enhancedStats[key] = Math.floor(value * multiplier);
      } else {
        // % 스탯은 가산
        const bonusPercent = (multiplier - 1) * 100 * 0.1; // 배율의 10%만 가산
        enhancedStats[key] = value + Math.floor(bonusPercent);
      }
    }
  }

  return enhancedStats;
}

/**
 * 강화 성공 확률 계산 (천장 시스템 포함)
 */
export function calculateEnhanceSuccessRate(
  targetLevel: number,
  failCount: number = 0,
  useLuckBoost: boolean = false
): number {
  const config = getEnhancementConfig(targetLevel);
  if (!config) return 0;

  let rate = config.successRate;

  // 행운 부스트 (+10%)
  if (useLuckBoost) {
    rate += 10;
  }

  // 천장 시스템: 연속 실패 시 확률 증가 (최대 +30%)
  const failBonus = Math.min(failCount * 2, 30);
  rate += failBonus;

  // 최대 100%
  return Math.min(rate, 100);
}

// ============ UI Helpers ============

/** 강화 레벨 표시 문자열 */
export function formatEnhancementLevel(level: number): string {
  if (level <= 0) return "";
  return `+${level}`;
}

/** 강화 레벨별 색상 */
export function getEnhancementColor(level: number): string {
  if (level <= 0) return "#D1D5DB"; // gray-300
  if (level <= 3) return "#22C55E"; // green-500
  if (level <= 6) return "#3B82F6"; // blue-500
  if (level <= 9) return "#A855F7"; // purple-500
  if (level <= 12) return "#F97316"; // orange-500
  return "#EF4444"; // red-500 (+13 이상)
}

/** 강화 레벨별 이펙트 (빛남 등) */
export function getEnhancementEffect(level: number): string | null {
  if (level < 5) return null;
  if (level < 10) return "glow-subtle";
  if (level < 13) return "glow-medium";
  return "glow-intense";
}
