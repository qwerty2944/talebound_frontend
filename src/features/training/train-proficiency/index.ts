"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/shared/api";
import { profileKeys } from "@/entities/user";
import type { ProficiencyType } from "@/entities/ability";

export interface TrainParams {
  proficiencyType: ProficiencyType;
}

export interface TrainResult {
  gold: number;
  type: ProficiencyType;
  value: number;
  cost: number;
  nextCost: number;
}

/** 숙련도 훈련 비용(클라 표시용). 서버 권위 공식과 동일: 50 + floor(현재값^1.35) */
export function trainingCost(currentValue: number): number {
  return 50 + Math.floor(Math.pow(currentValue, 1.35));
}

/** 숙련도 훈련 — 서버가 골드 차감(50 + floor(현재값^1.35)) + 숙련도 +2(상한 100) */
export async function trainProficiency(params: TrainParams): Promise<TrainResult> {
  return apiFetch<TrainResult>("/api/training/train", { method: "POST", body: params });
}

/** 훈련 mutation. 성공 시 골드/숙련도 쿼리 무효화. */
export function useTrainProficiency(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<TrainResult, ApiError, TrainParams>({
    mutationFn: trainProficiency,
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
        queryClient.invalidateQueries({ queryKey: ["proficiencies", userId] });
      }
    },
  });
}
