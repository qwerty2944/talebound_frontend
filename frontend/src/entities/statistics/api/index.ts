/**
 * 통계 API 함수
 */

import { supabase } from "@/shared/api";
import type {
  StatisticsData,
  CombatStatistics,
  BattleResultType,
} from "../types";
import { DEFAULT_COMBAT_STATS } from "../types";

/**
 * 캐릭터 통계 조회
 */
export async function fetchStatistics(
  characterId: string
): Promise<StatisticsData> {
  const { data, error } = await supabase
    .from("character_statistics")
    .select("*")
    .eq("character_id", characterId)
    .single();

  // PGRST116 = no rows found (아직 통계 레코드가 없는 경우)
  if (error && error.code !== "PGRST116") {
    throw error;
  }

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
  const { data, error } = await supabase.rpc("record_battle_result", {
    p_character_id: params.characterId,
    p_result: params.result,
    p_monster_id: params.monsterId ?? null,
    p_monster_type: params.monsterType ?? null,
    p_damage_dealt: params.damageDealt ?? 0,
    p_damage_taken: params.damageTaken ?? 0,
    p_critical_count: params.criticalCount ?? 0,
  });

  if (error) {
    console.error("[Statistics] Failed to record battle result:", error);
    throw error;
  }

  return data as CombatStatistics;
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
  const { data, error } = await supabase.rpc("increment_combat_stat", {
    p_character_id: characterId,
    p_path: path,
    p_increment: increment,
  });

  if (error) {
    console.error("[Statistics] Failed to increment stat:", error);
    throw error;
  }

  return data as CombatStatistics;
}
