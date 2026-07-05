"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/shared/api";
import { profileKeys } from "@/entities/user";
import { inventoryKeys } from "@/entities/inventory";

export interface SellItemParams {
  itemId: string;
  quantity: number;
}

export interface SellItemResult {
  gold: number;
}

/** 상점 판매 — 서버가 인벤 수량 검증·차감, 골드 지급. 단가 = sellPrice ?? floor(value*0.4) */
export async function sellItem(params: SellItemParams): Promise<SellItemResult> {
  return apiFetch<SellItemResult>("/api/shop/sell", { method: "POST", body: params });
}

/** 상점 판매 mutation. 성공 시 골드/인벤토리 쿼리 무효화. */
export function useSellItem(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<SellItemResult, ApiError, SellItemParams>({
    mutationFn: sellItem,
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
        queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(userId) });
      }
    },
  });
}
