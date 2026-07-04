import type { ProficiencyType } from "@/entities/ability";

// ============ Item Rarity (아키에이지 13단계 시스템) ============

export type ItemRarity =
  | "crude"      // 저급
  | "common"     // 일반
  | "grand"      // 고급
  | "rare"       // 희귀
  | "arcane"     // 고대
  | "heroic"     // 영웅
  | "unique"     // 유일
  | "celestial"  // 유물
  | "divine"     // 경이
  | "epic"       // 서사
  | "legendary"  // 전설
  | "mythic"     // 신화
  | "eternal";   // 태초

export interface RarityInfo {
  id: ItemRarity;
  nameKo: string;
  nameEn: string;
  color: string;
  dropRateMultiplier: number;
  valueMultiplier: number;
  tier: number; // 0-12
}

export const RARITY_CONFIG: Record<ItemRarity, RarityInfo> = {
  crude: {
    id: "crude",
    nameKo: "저급",
    nameEn: "Crude",
    color: "#6B7280", // gray-500
    dropRateMultiplier: 1.5,
    valueMultiplier: 0.5,
    tier: 0,
  },
  common: {
    id: "common",
    nameKo: "일반",
    nameEn: "Common",
    color: "#D1D5DB", // gray-300
    dropRateMultiplier: 1.0,
    valueMultiplier: 1.0,
    tier: 1,
  },
  grand: {
    id: "grand",
    nameKo: "고급",
    nameEn: "Grand",
    color: "#22C55E", // green-500
    dropRateMultiplier: 0.6,
    valueMultiplier: 2.0,
    tier: 2,
  },
  rare: {
    id: "rare",
    nameKo: "희귀",
    nameEn: "Rare",
    color: "#3B82F6", // blue-500
    dropRateMultiplier: 0.35,
    valueMultiplier: 4.0,
    tier: 3,
  },
  arcane: {
    id: "arcane",
    nameKo: "고대",
    nameEn: "Arcane",
    color: "#EAB308", // yellow-500
    dropRateMultiplier: 0.2,
    valueMultiplier: 8.0,
    tier: 4,
  },
  heroic: {
    id: "heroic",
    nameKo: "영웅",
    nameEn: "Heroic",
    color: "#F97316", // orange-500
    dropRateMultiplier: 0.12,
    valueMultiplier: 15.0,
    tier: 5,
  },
  unique: {
    id: "unique",
    nameKo: "유일",
    nameEn: "Unique",
    color: "#A855F7", // purple-500
    dropRateMultiplier: 0.07,
    valueMultiplier: 30.0,
    tier: 6,
  },
  celestial: {
    id: "celestial",
    nameKo: "유물",
    nameEn: "Celestial",
    color: "#EF4444", // red-500
    dropRateMultiplier: 0.03,
    valueMultiplier: 60.0,
    tier: 7,
  },
  divine: {
    id: "divine",
    nameKo: "경이",
    nameEn: "Divine",
    color: "#EC4899", // pink-500
    dropRateMultiplier: 0.015,
    valueMultiplier: 120.0,
    tier: 8,
  },
  epic: {
    id: "epic",
    nameKo: "서사",
    nameEn: "Epic",
    color: "#06B6D4", // cyan-500
    dropRateMultiplier: 0.007,
    valueMultiplier: 250.0,
    tier: 9,
  },
  legendary: {
    id: "legendary",
    nameKo: "전설",
    nameEn: "Legendary",
    color: "#F59E0B", // amber-500
    dropRateMultiplier: 0.003,
    valueMultiplier: 500.0,
    tier: 10,
  },
  mythic: {
    id: "mythic",
    nameKo: "신화",
    nameEn: "Mythic",
    color: "#FF6B6B", // special red-pink
    dropRateMultiplier: 0.001,
    valueMultiplier: 1000.0,
    tier: 11,
  },
  eternal: {
    id: "eternal",
    nameKo: "태초",
    nameEn: "Eternal",
    color: "#FFD700", // gold
    dropRateMultiplier: 0.0003,
    valueMultiplier: 2500.0,
    tier: 12,
  },
};

// ============ Item Types ============

export type ItemType = "equipment" | "consumable" | "material" | "misc";

export interface ItemTypeInfo {
  id: ItemType;
  nameKo: string;
  nameEn: string;
  icon: string;
}

export const ITEM_TYPE_CONFIG: Record<ItemType, ItemTypeInfo> = {
  equipment: { id: "equipment", nameKo: "장비", nameEn: "Equipment", icon: "⚔️" },
  consumable: { id: "consumable", nameKo: "소비", nameEn: "Consumable", icon: "🧪" },
  material: { id: "material", nameKo: "재료", nameEn: "Material", icon: "🪨" },
  misc: { id: "misc", nameKo: "기타", nameEn: "Misc", icon: "📦" },
};

// ============ Equipment Slots (12슬롯 시스템) ============

// 12개 장비 슬롯
export type EquipmentSlot =
  // 외형 변경 슬롯 (6)
  | "mainHand"    // 주무기
  | "offHand"     // 보조 (방패/횃불/한손무기)
  | "helmet"      // 투구
  | "armor"       // 갑옷 (외피)
  | "cloth"       // 의복 (내피)
  | "pants"       // 바지
  // 장신구 슬롯 (6)
  | "ring1" | "ring2"
  | "necklace"
  | "earring1" | "earring2"
  | "bracelet";

// 구 슬롯 (마이그레이션용)
export type LegacyEquipmentSlot = "weapon" | "armor" | "helmet" | "accessory";

// 무기 손 타입
export type WeaponHandType = "one_handed" | "two_handed";

// 오프핸드 아이템 타입
export type OffHandItemType = "shield" | "torch" | "weapon";

// 장신구 타입
export type AccessoryType = "ring" | "necklace" | "earring" | "bracelet";

// 슬롯 카테고리
export type SlotCategory = "weapon" | "armor" | "accessory";

// 슬롯 설정 정보
export interface SlotConfigInfo {
  nameKo: string;
  icon: string;
  category: SlotCategory;
  unityPart?: string;  // Unity 외형 연동용
}

// 슬롯 설정
export const SLOT_CONFIG: Record<EquipmentSlot, SlotConfigInfo> = {
  // 무기 슬롯
  mainHand: { nameKo: "주무기", icon: "⚔️", category: "weapon" },
  offHand: { nameKo: "보조", icon: "🛡️", category: "weapon" },
  // 방어구 슬롯 (외형 변경)
  helmet: { nameKo: "투구", icon: "🪖", category: "armor", unityPart: "Helmet" },
  armor: { nameKo: "갑옷", icon: "🥋", category: "armor", unityPart: "Armor" },
  cloth: { nameKo: "의복", icon: "👕", category: "armor", unityPart: "Cloth" },
  pants: { nameKo: "바지", icon: "👖", category: "armor", unityPart: "Pant" },
  // 장신구 슬롯
  ring1: { nameKo: "반지1", icon: "💍", category: "accessory" },
  ring2: { nameKo: "반지2", icon: "💍", category: "accessory" },
  necklace: { nameKo: "목걸이", icon: "📿", category: "accessory" },
  earring1: { nameKo: "귀걸이1", icon: "✨", category: "accessory" },
  earring2: { nameKo: "귀걸이2", icon: "✨", category: "accessory" },
  bracelet: { nameKo: "팔찌", icon: "⭕", category: "accessory" },
};

// 외형 변경 슬롯 목록
export const APPEARANCE_SLOTS: EquipmentSlot[] = [
  "mainHand", "offHand", "helmet", "armor", "cloth", "pants"
];

// 장신구 슬롯 목록
export const ACCESSORY_SLOTS: EquipmentSlot[] = [
  "ring1", "ring2", "necklace", "earring1", "earring2", "bracelet"
];

// 슬롯이 외형에 영향을 주는지 확인
export function isAppearanceSlot(slot: EquipmentSlot): boolean {
  return APPEARANCE_SLOTS.includes(slot);
}

// 슬롯이 장신구인지 확인
export function isAccessorySlot(slot: EquipmentSlot): boolean {
  return ACCESSORY_SLOTS.includes(slot);
}

// ============ Consumable Effects ============

export type ConsumableEffectType =
  | "heal"
  | "heal_percent"
  | "mana"
  | "mana_percent"
  | "fatigue"
  | "buff"
  | "cure";

export interface ConsumableEffect {
  type: ConsumableEffectType;
  value: number;
  target: "self";
  statusEffect?: string;
  duration?: number;
}

// ============ Sprite System ============

// Unity 스프라이트 카테고리 (all-sprites.json 기준)
export type SpriteCategory =
  // 무기 스프라이트
  | "sword"    // swordCount: 26
  | "shield"   // shieldCount: 14
  | "axe"      // axeCount: 5
  | "bow"      // bowCount: 10
  | "wand"     // wandCount: 20
  | "spear"    // spearCount: 2
  | "dagger"   // daggerCount: 2
  // 방어구 스프라이트
  | "armor"    // armorCount: 59
  | "cloth"    // clothCount: 131
  | "helmet"   // helmetCount: 120
  | "pant"     // pantCount: 60
  | "back";    // backCount: 34

// 스프라이트 참조 (외형 + 색상)
export interface SpriteReference {
  category: SpriteCategory;
  spriteId: string;          // 스프라이트 아이템 ID (예: "elf_weapon_03") - JSON에서 id로 sprite 조회
  color?: string;            // hex 색상 (예: "#808080"), undefined면 기본색
}

// 미리 정의된 색상 프리셋
export const SPRITE_COLOR_PRESETS = {
  // 금속 재질
  iron: "#808080",       // 철 (회색)
  steel: "#A0A0A0",      // 강철 (밝은 회색)
  bronze: "#CD7F32",     // 청동
  silver: "#C0C0C0",     // 은
  gold: "#FFD700",       // 금
  mithril: "#E0FFFF",    // 미스릴 (하늘색)
  adamantite: "#4B0082", // 아다만타이트 (보라)

  // 나무 재질
  wood: "#8B4513",       // 나무 (갈색)
  darkwood: "#3B2415",   // 어두운 나무
  oak: "#6B4423",        // 참나무

  // 속성 색상
  fire: "#FF4500",       // 화염 (주황빨강)
  ice: "#00BFFF",        // 냉기 (하늘색)
  lightning: "#FFFF00",  // 번개 (노랑)
  earth: "#8B4513",      // 대지 (갈색)
  holy: "#FFFACD",       // 신성 (연노랑)
  dark: "#2F1F3F",       // 암흑 (어두운 보라)
  poison: "#32CD32",     // 독 (연두)

  // 희귀도 색상 (아우라)
  common: undefined,     // 기본색
  grand: "#22C55E",      // 고급 (녹색)
  rare: "#3B82F6",       // 희귀 (파랑)
  arcane: "#EAB308",     // 고대 (노랑)
  heroic: "#F97316",     // 영웅 (주황)
  unique: "#A855F7",     // 유일 (보라)
  legendary: "#F59E0B",  // 전설 (황금)
} as const;

export type SpriteColorPreset = keyof typeof SPRITE_COLOR_PRESETS;

// 스프라이트 카테고리 정보
export const SPRITE_CATEGORY_CONFIG: Record<SpriteCategory, {
  nameKo: string;
  unityMethod: string;  // Unity에서 호출할 JS 메서드 접두사
  maxIndex: number;     // 최대 인덱스 (0-based이므로 count - 1)
}> = {
  sword: { nameKo: "검", unityMethod: "JS_SetSword", maxIndex: 25 },
  shield: { nameKo: "방패", unityMethod: "JS_SetShield", maxIndex: 13 },
  axe: { nameKo: "도끼", unityMethod: "JS_SetAxe", maxIndex: 4 },
  bow: { nameKo: "활", unityMethod: "JS_SetBow", maxIndex: 9 },
  wand: { nameKo: "지팡이", unityMethod: "JS_SetWand", maxIndex: 19 },
  spear: { nameKo: "창", unityMethod: "JS_SetSpear", maxIndex: 1 },
  dagger: { nameKo: "단검", unityMethod: "JS_SetDagger", maxIndex: 1 },
  armor: { nameKo: "갑옷", unityMethod: "JS_SetArmor", maxIndex: 58 },
  cloth: { nameKo: "의복", unityMethod: "JS_SetCloth", maxIndex: 130 },
  helmet: { nameKo: "투구", unityMethod: "JS_SetHelmet", maxIndex: 119 },
  pant: { nameKo: "바지", unityMethod: "JS_SetPant", maxIndex: 59 },
  back: { nameKo: "망토", unityMethod: "JS_SetBack", maxIndex: 33 },
};

// ============ Equipment Data ============

export interface EquipmentStats {
  // 기본 스탯 (레거시 - 새 스탯에 합산됨)
  attack?: number; // → physicalAttack에 합산
  defense?: number; // → physicalDefense에 합산
  magic?: number; // → magicAttack에 합산
  hp?: number;
  mp?: number;
  speed?: number;
  critRate?: number;
  critDamage?: number;

  // 능력치 보너스 (장신구용)
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  lck?: number;

  // 전투 스탯 (신규)
  physicalAttack?: number; // 물리공격력
  physicalDefense?: number; // 물리방어력
  magicAttack?: number; // 마법공격력
  magicDefense?: number; // 마법방어력

  // 속성 강화 (%)
  fireBoost?: number;
  iceBoost?: number;
  lightningBoost?: number;
  earthBoost?: number;
  holyBoost?: number;
  darkBoost?: number;
  poisonBoost?: number;
  arcaneBoost?: number;

  // 속성 저항 (%)
  fireResist?: number;
  iceResist?: number;
  lightningResist?: number;
  earthResist?: number;
  holyResist?: number;
  darkResist?: number;
  poisonResist?: number;
  arcaneResist?: number;

  // 물리 저항 보너스 (배율 감소, -0.1 = 10% 추가 저항)
  slashResistBonus?: number;  // 베기 저항 보너스
  pierceResistBonus?: number; // 찌르기 저항 보너스
  crushResistBonus?: number;  // 타격 저항 보너스

  // 암습 강화
  ambushChance?: number; // 암습 확률 추가 %
  ambushDamage?: number; // 암습 피해 추가 %

  // 특수 효과
  blockChance?: number; // 막기 확률 (방패)
  lightRadius?: number; // 시야 반경 (횃불)

  // 전투 추가 스탯
  dodgeChance?: number;           // 회피 확률 보너스 (%)
  weaponBlockChance?: number;     // 무기막기 확률 보너스 (%)
  physicalPenetration?: number;   // 물리관통 (%)
  magicPenetration?: number;      // 마법관통 (%)
}

export interface EquipmentData {
  slot: EquipmentSlot;
  weaponType?: ProficiencyType;
  handType?: WeaponHandType;        // 한손/양손 (무기용)
  offHandType?: OffHandItemType;    // 오프핸드 타입 (방패/횃불/무기)
  accessoryType?: AccessoryType;    // 장신구 타입
  unityPartIndex?: number;          // Unity 스프라이트 인덱스 (deprecated, use sprite)
  sprite?: SpriteReference;         // 스프라이트 + 색상 (새 시스템)
  stats: EquipmentStats;
  requiredLevel?: number;
}

// ============ Item Description ============

export interface ItemDescription {
  ko: string;
  en: string;
}

// ============ Base Item ============

export interface Item {
  id: string;
  nameKo: string;
  nameEn: string;
  description: ItemDescription;
  type: ItemType;
  rarity: ItemRarity;
  icon: string;
  weight: number;
  value: number;
  sellPrice: number;
  stackable: boolean;
  maxStack?: number;
  tags: string[];
  consumableEffect?: ConsumableEffect;
  equipmentData?: EquipmentData;
}

// ============ JSON File Structure ============

export interface ItemsData {
  version: string;
  generatedAt: string;
  items: Item[];
  summary: {
    total: number;
    byType: Record<ItemType, number>;
    byRarity: Record<ItemRarity, number>;
  };
}

// ============ Weight System ============

export const WEIGHT_CONFIG = {
  BASE_CARRY_CAPACITY: 50,
  STR_BONUS_PER_POINT: 2,
  OVERWEIGHT_SPEED_PENALTY: 0.5,
  MAX_OVERWEIGHT_RATIO: 1.5,
} as const;

// ============ Socket System ============
export * from "./socket";

// ============ Enhancement System ============
export * from "./enhancement";

// ============ Equipment Instance ============
export * from "./equipment-instance";
