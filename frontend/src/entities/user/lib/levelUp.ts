import { getExpForLevel, LEVEL_CONFIG } from "../types/constants";

export interface LevelUpResult {
  newLevel: number;
  newExp: number;
  leveledUp: boolean;
  levelsGained: number;
}

/**
 * 레벨업 체크 및 처리
 * - 현재 경험치 >= 필요 경험치 → 레벨업
 * - 초과 경험치는 다음 레벨로 이월
 * - 다중 레벨업 지원 (한번에 여러 레벨 오를 수 있음)
 */
export function checkLevelUp(
  currentLevel: number,
  currentExp: number
): LevelUpResult {
  let level = currentLevel;
  let exp = currentExp;
  const startLevel = currentLevel;

  // 최대 레벨 체크
  if (level >= LEVEL_CONFIG.MAX_LEVEL) {
    return {
      newLevel: level,
      newExp: 0, // 최대 레벨에서는 경험치 0
      leveledUp: false,
      levelsGained: 0,
    };
  }

  // 레벨업 루프 (다중 레벨업 처리)
  while (level < LEVEL_CONFIG.MAX_LEVEL) {
    const expNeeded = getExpForLevel(level);

    if (exp >= expNeeded) {
      exp -= expNeeded;
      level += 1;
    } else {
      break;
    }
  }

  // 최대 레벨 도달 시 초과 경험치 제거
  if (level >= LEVEL_CONFIG.MAX_LEVEL) {
    exp = 0;
  }

  return {
    newLevel: level,
    newExp: exp,
    leveledUp: level > startLevel,
    levelsGained: level - startLevel,
  };
}

/**
 * 레벨업 시 스탯 보너스 계산 (향후 확장용)
 */
export function getLevelUpBonusStats(level: number): {
  hpBonus: number;
  mpBonus: number;
  statPoints: number;
} {
  return {
    hpBonus: 10,      // 레벨당 HP +10
    mpBonus: 5,       // 레벨당 MP +5
    statPoints: 3,    // 레벨당 스탯 포인트 +3
  };
}
