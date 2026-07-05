"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchQuests } from "../api";

// ============ Query Keys ============

const QUEST_KEY_BASE = ["quests"] as const;

export const questKeys = {
  all: QUEST_KEY_BASE,
  list: (userId: string) => [...QUEST_KEY_BASE, "list", userId] as const,
};

// ============ Query Hooks ============

export function useQuests(userId: string | undefined) {
  return useQuery({
    queryKey: questKeys.list(userId || ""),
    queryFn: fetchQuests,
    enabled: !!userId,
    staleTime: 30_000,
  });
}
