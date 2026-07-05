"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDungeonsByMap } from "../api";

const DUNGEON_KEY_BASE = ["dungeons"] as const;

export const dungeonKeys = {
  all: DUNGEON_KEY_BASE,
  byMap: (mapId: string) => [...DUNGEON_KEY_BASE, "byMap", mapId] as const,
};

/** 현재 맵에서 입장 가능한 던전 목록 */
export function useDungeonsByMap(mapId: string) {
  return useQuery({
    queryKey: dungeonKeys.byMap(mapId),
    queryFn: () => fetchDungeonsByMap(mapId),
    staleTime: Infinity,
    enabled: !!mapId,
  });
}
