"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchNpcs, fetchNpcsByMap, fetchNpcById, fetchHealerNpcs } from "../api";

// ============ Query Keys ============

const NPC_KEY_BASE = ["npcs"] as const;

export const npcKeys = {
  all: NPC_KEY_BASE,
  byMap: (mapId: string) => [...NPC_KEY_BASE, "byMap", mapId] as const,
  byId: (npcId: string) => [...NPC_KEY_BASE, "byId", npcId] as const,
  healers: [...NPC_KEY_BASE, "healers"] as const,
};

// ============ Query Hooks ============

export function useNpcs() {
  return useQuery({
    queryKey: npcKeys.all,
    queryFn: fetchNpcs,
    staleTime: Infinity, // 정적 데이터
  });
}

export function useNpcsByMap(mapId: string) {
  return useQuery({
    queryKey: npcKeys.byMap(mapId),
    queryFn: () => fetchNpcsByMap(mapId),
    staleTime: Infinity,
    enabled: !!mapId,
  });
}

export function useNpcById(npcId: string) {
  return useQuery({
    queryKey: npcKeys.byId(npcId),
    queryFn: () => fetchNpcById(npcId),
    staleTime: Infinity,
    enabled: !!npcId,
  });
}

export function useHealerNpcs() {
  return useQuery({
    queryKey: npcKeys.healers,
    queryFn: fetchHealerNpcs,
    staleTime: Infinity,
  });
}
