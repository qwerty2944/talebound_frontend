// ============ 퀘스트 타입 ============

export type QuestObjectiveType = "kill" | "collect" | "visit";

export type QuestStatus = "available" | "accepted" | "completed" | "claimed";

export interface QuestObjective {
  type: QuestObjectiveType;
  monsterId?: string;
  itemId?: string;
  mapId?: string;
  count?: number;
}

export interface QuestReward {
  exp: number;
  gold: number;
  items?: { itemId: string; quantity: number }[];
}

export interface Quest {
  id: string;
  npcId: string;
  nameKo: string;
  descriptionKo: string;
  minLevel: number;
  objective: QuestObjective;
  rewards: QuestReward;
}

/** 서버가 반환하는 퀘스트 정의 + 유저 진행 상태 병합 */
export interface QuestWithStatus extends Quest {
  status: QuestStatus;
  progress: { kill?: number };
}

export interface QuestClaimResult {
  questId: string;
  exp: number;
  gold: number;
  items: { itemId: string; quantity: number }[];
  levelUp: { leveledUp: boolean; newLevel: number; levelsGained: number };
  totalGold: number;
  totalExp: number;
}
