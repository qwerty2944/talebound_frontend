"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { claimQuest, questKeys } from "@/entities/quest";
import { profileKeys } from "@/entities/user";
import { inventoryKeys } from "@/entities/inventory";
import { ApiError } from "@/shared/api";
import toast from "react-hot-toast";

/** 퀘스트 보상 수령 (서버가 목표 검증 + exp/gold/아이템 지급) */
export function useClaimQuest(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questId: string) => claimQuest(questId),
    onSuccess: (result) => {
      toast.success(`보상 획득! EXP +${result.exp}, 골드 +${result.gold}`, { icon: "🎁" });
      if (result.levelUp.leveledUp) {
        toast.success(`레벨 업! Lv.${result.levelUp.newLevel}`, { icon: "⬆️" });
      }
      if (userId) {
        queryClient.invalidateQueries({ queryKey: questKeys.list(userId) });
        queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
        queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(userId) });
      }
    },
    onError: (error) => {
      const msg = error instanceof ApiError ? error.message : "보상 수령에 실패했습니다";
      toast.error(msg);
    },
  });
}
