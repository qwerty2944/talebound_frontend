// ============ 던전 타입 ============

export interface DungeonReward {
  exp: number;
  gold: number;
  items?: { itemId: string; quantity: number }[];
}

export interface Dungeon {
  id: string;
  nameKo: string;
  descriptionKo: string;
  icon: string;
  entryMapId: string;
  minLevel: number;
  fatigueCost: number;
  waves: string[];
  clearRewards: DungeonReward;
}

// ============ 서버 응답 ============

export interface DungeonStartResponse {
  dungeonId: string;
  wave: number;
  totalWaves: number;
  monster: { id: string; level: number };
  battleToken: string;
  runToken: string;
}

export interface DungeonWaveReward {
  exp: number;
  gold: number;
  drops: { itemId: string; quantity: number }[];
}

export type DungeonAdvanceResponse =
  | {
      cleared: false;
      wave: number;
      totalWaves: number;
      monster: { id: string; level: number };
      battleToken: string;
      runToken: string;
      waveReward: DungeonWaveReward;
    }
  | {
      cleared: true;
      totalWaves: number;
      waveReward: DungeonWaveReward;
      clearReward: { exp: number; gold: number; items: { itemId: string; quantity: number }[] };
      levelUp: { leveledUp: boolean; newLevel: number; levelsGained: number };
    };
