// ============ NPC 타입 ============

export type NpcType = "healer" | "merchant" | "quest" | "trainer";

// ============ NPC 서비스 ============

export interface HealingService {
  gold: number;
  description?: string;
}

export interface NpcHealingServices {
  light: HealingService;
  medium: HealingService;
  critical: HealingService;
}

export interface NpcServices {
  healing?: NpcHealingServices;
}

// ============ NPC 대화 ============

export interface NpcDialogues {
  greeting: string;
  noInjury?: string;
  healSuccess?: string;
  notEnoughGold?: string;
  farewell?: string;
}

// ============ NPC 인터페이스 ============

export interface Npc {
  id: string;
  nameKo: string;
  nameEn: string;
  icon: string;
  type: NpcType;
  mapId: string;
  description: string;
  dialogues: NpcDialogues;
  services?: NpcServices;
}
