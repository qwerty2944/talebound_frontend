"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptQuest, questKeys } from "@/entities/quest";
import { ApiError } from "@/shared/api";
import toast from "react-hot-toast";

/** 퀘스트 수락 (서버가 minLevel 검증) */
export function useAcceptQuest(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questId: string) => acceptQuest(questId),
    onSuccess: () => {
      toast.success("퀘스트를 수락했습니다!", { icon: "📜" });
      if (userId) queryClient.invalidateQueries({ queryKey: questKeys.list(userId) });
    },
    onError: (error) => {
      const msg = error instanceof ApiError ? error.message : "퀘스트 수락에 실패했습니다";
      toast.error(msg);
    },
  });
}
