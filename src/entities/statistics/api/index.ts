/**
 * 통계 API 함수
 */

import { apiFetch, rpc } from "@/shared/api";
import type {
  StatisticsData,
  CombatStatistics,
  BattleResultType,
} from "../types";
import { DEFAULT_COMBAT_STATS } from "../types";

interface StatisticsRow {
  character_id: string;
  combat: CombatStatistics | null;
  created_at: string;
  updated_at: string;
}

/**
 * 캐릭터 통계 조회
 */
export async function fetchStatistics(
  characterId: string
): Promise<StatisticsData> {
  const data = await apiFetch<StatisticsRow | null>(
    `/api/statistics/${characterId}`
  );

  return {
    characterId,
    combat: (data?.combat as CombatStatistics) ?? DEFAULT_COMBAT_STATS,
    createdAt: data?.created_at ?? new Date().toISOString(),
    updatedAt: data?.updated_at ?? new Date().toISOString(),
  };
}

/** 전투 결과 기록 파라미터 */
export interface RecordBattleParams {
  characterId: string;
  result: BattleResultType;
  monsterId?: string;
  monsterType?: string;
  damageDealt?: number;
  damageTaken?: number;
  criticalCount?: number;
}

/**
 * 전투 결과 기록
 *
 * 전투 종료 시 호출하여 통계 업데이트
 */
export async function recordBattleResult(
  params: RecordBattleParams
): Promise<CombatStatistics> {
  const data = await rpc<CombatStatistics>("record_battle_result", {
    p_character_id: params.characterId,
    p_result: params.result,
    p_monster_id: params.monsterId ?? null,
    p_monster_type: params.monsterType ?? null,
    p_damage_dealt: params.damageDealt ?? 0,
    p_damage_taken: params.damageTaken ?? 0,
    p_critical_count: params.criticalCount ?? 0,
  });

  return data;
}

/**
 * 단일 통계 증가
 *
 * @param characterId 캐릭터 ID
 * @param path JSONB 경로 (예: ['kills', 'byMonster', 'slime'])
 * @param increment 증가량 (기본값: 1)
 */
export async function incrementCombatStat(
  characterId: string,
  path: string[],
  increment: number = 1
): Promise<CombatStatistics> {
  const data = await rpc<CombatStatistics>("increment_combat_stat", {
    p_character_id: characterId,
    p_path: path,
    p_increment: increment,
  });

  return data;
}
