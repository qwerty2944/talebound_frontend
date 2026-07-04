"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchItems,
  fetchItemById,
  fetchItemsByType,
  fetchItemsByTag,
  fetchItemsByIds,
} from "../api";
import type { Item, ItemType } from "../types";

// Query Keys
export const itemKeys = {
  all: ["items"] as const,
  detail: (id: string) => [...itemKeys.all, "detail", id] as const,
  byType: (type: ItemType) => [...itemKeys.all, "type", type] as const,
  byTag: (tag: string) => [...itemKeys.all, "tag", tag] as const,
  byIds: (ids: string[]) => [...itemKeys.all, "ids", ids.join(",")] as const,
};

/**
 * 모든 아이템 조회 훅
 */
export function useItems() {
  return useQuery<Item[], Error>({
    queryKey: itemKeys.all,
    queryFn: fetchItems,
    staleTime: Infinity, // 정적 데이터
  });
}

/**
 * ID로 아이템 조회 훅
 */
export function useItem(itemId: string | undefined) {
  return useQuery<Item | null, Error>({
    queryKey: itemKeys.detail(itemId || ""),
    queryFn: () => fetchItemById(itemId!),
    enabled: !!itemId,
    staleTime: Infinity,
  });
}

/**
 * 타입별 아이템 조회 훅
 */
export function useItemsByType(type: ItemType | undefined) {
  return useQuery<Item[], Error>({
    queryKey: itemKeys.byType(type || "material"),
    queryFn: () => fetchItemsByType(type!),
    enabled: !!type,
    staleTime: Infinity,
  });
}

/**
 * 태그로 아이템 조회 훅
 */
export function useItemsByTag(tag: string | undefined) {
  return useQuery<Item[], Error>({
    queryKey: itemKeys.byTag(tag || ""),
    queryFn: () => fetchItemsByTag(tag!),
    enabled: !!tag,
    staleTime: Infinity,
  });
}

/**
 * 여러 ID로 아이템 조회 훅
 */
export function useItemsByIds(itemIds: string[] | undefined) {
  return useQuery<Item[], Error>({
    queryKey: itemKeys.byIds(itemIds || []),
    queryFn: () => fetchItemsByIds(itemIds!),
    enabled: !!itemIds && itemIds.length > 0,
    staleTime: Infinity,
  });
}

// ============ 헬퍼 함수 ============

/**
 * 아이템 표시 이름 (로케일 기반)
 */
export function getItemDisplayName(item: Item, locale: "ko" | "en" = "ko"): string {
  return locale === "ko" ? item.nameKo : item.nameEn;
}

/**
 * 아이템 설명 (로케일 기반)
 */
export function getItemDescription(item: Item, locale: "ko" | "en" = "ko"): string {
  return locale === "ko" ? item.description.ko : item.description.en;
}
