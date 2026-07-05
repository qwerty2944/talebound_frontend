/**
 * 통계 React Query 훅
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchStatistics,
  recordBattleResult,
  incrementCombatStat,
  type RecordBattleParams,
} from "../api";
import { STALE_TIME } from "@/shared/config";

/** 쿼리 키 */
export const statisticsKeys = {
  all: ["statistics"] as const,
  detail: (characterId: string) =>
    [...statisticsKeys.all, characterId] as const,
};

/**
 * 캐릭터 통계 조회 훅
 */
export function useStatistics(characterId: string | undefined) {
  return useQuery({
    queryKey: statisticsKeys.detail(characterId ?? ""),
    queryFn: () => fetchStatistics(characterId!),
    enabled: !!characterId,
    staleTime: STALE_TIME.DYNAMIC,
  });
}

/**
 * 전투 결과 기록 훅
 *
 * 전투 종료 시 호출하여 통계 업데이트
 */
export function useRecordBattleResult(characterId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Omit<RecordBattleParams, "characterId">) =>
      recordBattleResult({ ...params, characterId: characterId! }),
    onSuccess: () => {
      if (characterId) {
        queryClient.invalidateQueries({
          queryKey: statisticsKeys.detail(characterId),
        });
      }
    },
    onError: (error) => {
      console.error("[Statistics] Record battle result failed:", error);
    },
  });
}

/**
 * 단일 통계 증가 훅
 */
export function useIncrementStat(characterId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { path: string[]; increment?: number }) =>
      incrementCombatStat(characterId!, params.path, params.increment),
    onSuccess: () => {
      if (characterId) {
        queryClient.invalidateQueries({
          queryKey: statisticsKeys.detail(characterId),
        });
      }
    },
  });
}
