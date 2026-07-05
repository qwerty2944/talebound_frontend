/**
 * 캐릭터 통계 타입 정의
 *
 * 전투 통계를 추적하여 칭호/업적 시스템의 기반이 됨
 */

/** 전투 통계 */
export interface CombatStatistics {
  /** 몬스터 처치 */
  kills: {
    total: number;
    byMonster: Record<string, number>; // { "slime": 50, "wolf": 30 }
    byType: Record<string, number>; // { "beast": 80, "undead": 20 }
  };

  /** 데미지 */
  damage: {
    dealt: number; // 총 가한 데미지
    taken: number; // 총 받은 데미지
    maxSingleHit: number; // 최대 단일 데미지
  };

  /** 전투 결과 */
  battles: {
    victories: number;
    defeats: number;
    fled: number;
  };

  /** 치명타 */
  criticals: {
    dealt: number; // 가한 치명타 횟수
    received: number; // 받은 치명타 횟수
  };

  /** PvP */
  pvp: {
    wins: number;
    losses: number;
  };
}

/** 통계 데이터 (DB 응답 형태) */
export interface StatisticsData {
  characterId: string;
  combat: CombatStatistics;
  createdAt: string;
  updatedAt: string;
}

/** 전투 결과 타입 */
export type BattleResultType = "victory" | "defeat" | "fled";

/** 기본 전투 통계 */
export const DEFAULT_COMBAT_STATS: CombatStatistics = {
  kills: { total: 0, byMonster: {}, byType: {} },
  damage: { dealt: 0, taken: 0, maxSingleHit: 0 },
  battles: { victories: 0, defeats: 0, fled: 0 },
  criticals: { dealt: 0, received: 0 },
  pvp: { wins: 0, losses: 0 },
};
