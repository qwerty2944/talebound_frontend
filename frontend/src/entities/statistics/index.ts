/**
 * 캐릭터 통계 엔티티
 *
 * 전투 통계를 추적하여 칭호/업적 시스템의 기반 제공
 *
 * @example
 * ```typescript
 * import { useStatistics, useRecordBattleResult } from "@/entities/statistics";
 *
 * // 통계 조회
 * const { data: stats } = useStatistics(characterId);
 * console.log(stats?.combat.kills.total);
 *
 * // 전투 결과 기록
 * const recordBattle = useRecordBattleResult(characterId);
 * recordBattle.mutate({
 *   result: "victory",
 *   monsterId: "slime",
 *   monsterType: "amorphous",
 *   damageDealt: 150,
 * });
 * ```
 */

// Types
export type {
  CombatStatistics,
  StatisticsData,
  BattleResultType,
} from "./types";
export { DEFAULT_COMBAT_STATS } from "./types";

// API
export {
  fetchStatistics,
  recordBattleResult,
  incrementCombatStat,
  type RecordBattleParams,
} from "./api";

// Queries
export {
  useStatistics,
  useRecordBattleResult,
  useIncrementStat,
  statisticsKeys,
} from "./queries";

// Lib
export {
  formatStatNumber,
  calculateWinRate,
  calculateKDRatio,
  getMostKilledMonster,
  getKillRank,
  KILL_RANK_INFO,
  type KillRank,
} from "./lib";
