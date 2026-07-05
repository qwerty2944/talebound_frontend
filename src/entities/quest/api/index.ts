import { apiFetch } from "@/shared/api";
import type { QuestWithStatus, QuestClaimResult } from "../types";

/**
 * 퀘스트 API — 서버가 정의 + 유저 진행상태를 병합해 반환한다.
 * 보상 계산/지급은 전적으로 서버 권위이다.
 */

export async function fetchQuests(): Promise<QuestWithStatus[]> {
  return apiFetch<QuestWithStatus[]>("/api/quest");
}

export async function acceptQuest(questId: string): Promise<{ questId: string; status: string }> {
  return apiFetch("/api/quest/accept", { method: "POST", body: { questId } });
}

export async function claimQuest(questId: string): Promise<QuestClaimResult> {
  return apiFetch<QuestClaimResult>("/api/quest/claim", { method: "POST", body: { questId } });
}
