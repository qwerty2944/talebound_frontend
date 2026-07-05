import { apiFetch } from "@/shared/api";

/**
 * 서버 권위 전투 보상 API.
 * start에서 받은 battleToken을 complete에 제출해야 보상이 지급된다.
 */

export interface BattleStartResponse {
  battleToken: string;
  monster: { id: string; level: number };
}

export interface BattleCompleteResponse {
  result: "victory" | "defeat" | "fled";
  exp: number;
  gold: number;
  drops: { itemId: string; quantity: number }[];
  karmaChange: number;
  levelUp: { leveledUp: boolean; newLevel: number; levelsGained: number };
  totalGold: number;
  totalExp: number;
}

export function startBattleOnServer(monsterId: string): Promise<BattleStartResponse> {
  return apiFetch<BattleStartResponse>("/api/battle/start", {
    method: "POST",
    body: { monsterId },
  });
}

export function completeBattleOnServer(params: {
  battleToken: string;
  result: "victory" | "defeat" | "fled";
  currentHp: number;
  currentMp: number;
}): Promise<BattleCompleteResponse> {
  return apiFetch<BattleCompleteResponse>("/api/battle/complete", {
    method: "POST",
    body: params,
  });
}
