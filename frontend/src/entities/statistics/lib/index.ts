/**
 * 통계 유틸리티 함수
 */

import type { CombatStatistics } from "../types";

/**
 * 숫자를 읽기 쉬운 형태로 포맷
 *
 * @example
 * formatStatNumber(1234567) // "1,234,567"
 * formatStatNumber(1234567, true) // "1.23M"
 */
export function formatStatNumber(value: number, compact?: boolean): string {
  if (compact) {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
  }
  return value.toLocaleString("ko-KR");
}

/**
 * 승률 계산
 */
export function calculateWinRate(stats: CombatStatistics): number {
  const total = stats.battles.victories + stats.battles.defeats;
  if (total === 0) return 0;
  return Math.round((stats.battles.victories / total) * 100);
}

/**
 * K/D 비율 계산
 */
export function calculateKDRatio(stats: CombatStatistics): string {
  if (stats.battles.defeats === 0) {
    return stats.kills.total > 0 ? "Perfect" : "0.00";
  }
  return (stats.kills.total / stats.battles.defeats).toFixed(2);
}

/**
 * 가장 많이 처치한 몬스터 조회
 */
export function getMostKilledMonster(
  stats: CombatStatistics
): { monsterId: string; count: number } | null {
  const entries = Object.entries(stats.kills.byMonster);
  if (entries.length === 0) return null;

  const [monsterId, count] = entries.reduce((max, current) =>
    current[1] > max[1] ? current : max
  );

  return { monsterId, count };
}

/**
 * 킬 랭크 계산 (칭호 시스템용)
 */
export type KillRank =
  | "novice"
  | "apprentice"
  | "journeyman"
  | "expert"
  | "master"
  | "grandmaster"
  | "legend";

export function getKillRank(totalKills: number): KillRank {
  if (totalKills >= 10000) return "legend";
  if (totalKills >= 5000) return "grandmaster";
  if (totalKills >= 1000) return "master";
  if (totalKills >= 500) return "expert";
  if (totalKills >= 100) return "journeyman";
  if (totalKills >= 10) return "apprentice";
  return "novice";
}

export const KILL_RANK_INFO: Record<
  KillRank,
  { nameKo: string; color: string; minKills: number }
> = {
  novice: { nameKo: "초보", color: "#9CA3AF", minKills: 0 },
  apprentice: { nameKo: "견습", color: "#22C55E", minKills: 10 },
  journeyman: { nameKo: "숙련", color: "#3B82F6", minKills: 100 },
  expert: { nameKo: "전문가", color: "#A855F7", minKills: 500 },
  master: { nameKo: "달인", color: "#F59E0B", minKills: 1000 },
  grandmaster: { nameKo: "대가", color: "#EF4444", minKills: 5000 },
  legend: { nameKo: "전설", color: "#FFD700", minKills: 10000 },
};
