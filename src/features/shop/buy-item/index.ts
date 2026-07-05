"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/shared/api";
import { profileKeys } from "@/entities/user";
import { inventoryKeys } from "@/entities/inventory";

export interface BuyItemParams {
  npcId: string;
  itemId: string;
  quantity: number;
}

export interface BuyItemResult {
  gold: number;
  itemId: string;
  quantity: number;
}

/** 상점 구매 — 서버가 상인 취급 품목·가격(value) 검증, 골드 차감, 인벤 지급 */
export async function buyItem(params: BuyItemParams): Promise<BuyItemResult> {
  return apiFetch<BuyItemResult>("/api/shop/buy", { method: "POST", body: params });
}

/**
 * 상점 구매 mutation. 성공 시 골드/인벤토리 쿼리 무효화.
 * 골드 부족은 서버가 400 NOT_ENOUGH_GOLD로 응답 → ApiError.code로 구분.
 */
export function useBuyItem(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<BuyItemResult, ApiError, BuyItemParams>({
    mutationFn: buyItem,
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
        queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(userId) });
      }
    },
  });
}
