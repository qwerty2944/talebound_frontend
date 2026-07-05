// ============ Socket System Types ============

import type { EquipmentStats, EquipmentSlot, ItemRarity } from "./index";

// ============ Socket Types ============

/** 소켓 타입 */
export type SocketType = "gem" | "rune" | "inscription";

/** 소켓 색상 (젬 호환성용) */
export type SocketColor =
  | "red" // 화염/물리
  | "blue" // 냉기/마법
  | "yellow" // 번개/속도
  | "green" // 대지/체력
  | "white" // 신성/치유
  | "black" // 암흑/저주
  | "prismatic"; // 모든 색상 호환

// ============ Socket Slot ============

/** 개별 소켓 슬롯 */
export interface SocketSlot {
  /** 소켓 인덱스 (0부터 시작) */
  index: number;
  /** 소켓 타입 */
  type: SocketType;
  /** 소켓 색상 (젬용) */
  color?: SocketColor;
  /** 장착된 아이템 ID */
  insertedItemId?: string;
  /** 장착 시간 */
  insertedAt?: string;
}

/** 장비의 소켓 정보 */
export interface EquipmentSockets {
  /** 최대 소켓 수 (0-6) */
  maxSockets: number;
  /** 현재 소켓 배열 */
  sockets: SocketSlot[];
}

// ============ Socket Config ============

export interface SocketTypeInfo {
  id: SocketType;
  nameKo: string;
  nameEn: string;
  icon: string;
  description: string;
}

export const SOCKET_TYPE_CONFIG: Record<SocketType, SocketTypeInfo> = {
  gem: {
    id: "gem",
    nameKo: "보석",
    nameEn: "Gem",
    icon: "💎",
    description: "스탯을 강화하는 보석",
  },
  rune: {
    id: "rune",
    nameKo: "룬",
    nameEn: "Rune",
    icon: "ᚱ",
    description: "조합하여 룬워드를 완성",
  },
  inscription: {
    id: "inscription",
    nameKo: "각인",
    nameEn: "Inscription",
    icon: "📜",
    description: "스킬을 사용할 수 있게 함",
  },
};

export interface SocketColorInfo {
  id: SocketColor;
  nameKo: string;
  nameEn: string;
  color: string; // hex
}

export const SOCKET_COLOR_CONFIG: Record<SocketColor, SocketColorInfo> = {
  red: { id: "red", nameKo: "붉은", nameEn: "Red", color: "#EF4444" },
  blue: { id: "blue", nameKo: "푸른", nameEn: "Blue", color: "#3B82F6" },
  yellow: { id: "yellow", nameKo: "노란", nameEn: "Yellow", color: "#EAB308" },
  green: { id: "green", nameKo: "녹색", nameEn: "Green", color: "#22C55E" },
  white: { id: "white", nameKo: "흰", nameEn: "White", color: "#F3F4F6" },
  black: { id: "black", nameKo: "검은", nameEn: "Black", color: "#1F2937" },
  prismatic: {
    id: "prismatic",
    nameKo: "무지개빛",
    nameEn: "Prismatic",
    color:
      "linear-gradient(135deg, #EF4444, #EAB308, #22C55E, #3B82F6, #A855F7)",
  },
};

// ============ Gem Types ============

import type { MagicElement } from "@/entities/ability";

/** 젬 특수 효과 타입 */
export type GemSpecialEffectType =
  | "lifesteal" // 생명력 흡수
  | "manaSteal" // 마나 흡수
  | "reflect" // 반사
  | "thorns" // 가시
  | "onHit"; // 적중 시 효과

/** 젬 특수 효과 */
export interface GemSpecialEffect {
  type: GemSpecialEffectType;
  value: number;
  chance?: number; // 확률 (%)
}

/** 젬 아이템 데이터 */
export interface GemData {
  /** 젬 색상 */
  color: SocketColor;
  /** 젬 등급 (1-5) */
  tier: number;
  /** 속성 (있는 경우) */
  element?: MagicElement;
  /** 젬이 제공하는 스탯 */
  stats: Partial<EquipmentStats>;
  /** 특수 효과 */
  specialEffect?: GemSpecialEffect;
}

// ============ Rune Types ============

/** 룬 아이템 데이터 */
export interface RuneData {
  /** 룬 고유 ID (예: "El", "Eld", "Tir"...) */
  runeId: string;
  /** 룬 순서 (룬워드 조합용, 1부터 시작) */
  runeOrder: number;
  /** 개별 장착 시 효과 */
  individualStats: Partial<EquipmentStats>;
  /** 참여 가능한 룬워드 ID 목록 */
  runewords: string[];
}

/** 룬워드 특수 효과 타입 */
export type RunewordEffectType =
  | "aura" // 오라 효과
  | "onKill" // 처치 시 발동
  | "onHit" // 적중 시 발동
  | "chance" // 확률 발동
  | "passive"; // 패시브 효과

/** 룬워드 특수 효과 */
export interface RunewordEffect {
  type: RunewordEffectType;
  effectId: string;
  value: number;
  chance?: number; // 확률 (%)
  description: { ko: string; en: string };
}

/** 룬워드 정의 */
export interface RunewordDefinition {
  id: string;
  nameKo: string;
  nameEn: string;
  description: { ko: string; en: string };
  /** 필요 룬 ID 순서대로 */
  requiredRunes: string[];
  /** 적용 가능한 장비 슬롯 */
  requiredSlots: EquipmentSlot[];
  /** 필요 소켓 수 */
  requiredSockets: number;
  /** 룬워드 보너스 스탯 */
  stats: Partial<EquipmentStats>;
  /** 특수 효과 */
  specialEffects?: RunewordEffect[];
  /** 룬워드 희귀도 */
  rarity: ItemRarity;
}

// ============ Inscription Types ============

/** 각인 아이템 데이터 */
export interface InscriptionData {
  /** 각인된 스킬/능력 ID */
  abilityId: string;
  /** 각인 레벨 (1-5) */
  abilityLevel: number;
  /** 현재 충전 횟수 (null = 무제한) */
  charges?: number;
  /** 최대 충전 횟수 */
  maxCharges?: number;
  /** 쿨다운 (초) */
  cooldown?: number;
}

// ============ Equipment Socket Info (아이템 정의용) ============

/** 장비 아이템의 소켓 정보 (아이템 정의에 추가) */
export interface EquipmentSocketInfo {
  /** 최대 소켓 수 */
  maxSockets: number;
  /** 허용 소켓 타입 */
  allowedTypes: SocketType[];
  /** 소켓 색상 (순서대로) */
  socketColors?: SocketColor[];
}

// ============ Utility Types ============

/** 소켓 장착 가능 아이템 데이터 (통합) */
export type SocketableData = GemData | RuneData | InscriptionData;

/** 소켓 장착 결과 */
export interface SocketInsertResult {
  success: boolean;
  message: string;
  /** 룬워드 완성 시 */
  completedRuneword?: RunewordDefinition;
}

/** 소켓 장착 가능 여부 */
export interface CanInsertResult {
  canInsert: boolean;
  reason?: string;
}
