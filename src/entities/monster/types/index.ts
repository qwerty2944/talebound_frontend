import type { MagicElement } from "@/entities/ability";
import type { Period } from "@/entities/game-time";
import type { MonsterAlignment } from "@/entities/karma";
import type { MonsterAbility } from "@/entities/ability";

// ============ 몬스터 종족 타입 ============

export type MonsterType =
  | "beast"      // 야수 (동물, 마수)
  | "humanoid"   // 인간형 (고블린, 도적)
  | "undead"     // 언데드 (스켈레톤, 좀비)
  | "demon"      // 악마 (임프, 악마)
  | "dragon"     // 용족 (드래곤, 와이번)
  | "spirit"     // 정령 (원소 정령)
  | "construct"  // 구조물 (골렘, 허수아비)
  | "plant";     // 식물 (트렌트)

// ============ 몬스터 등급 (rank) ============

export type MonsterRank = "normal" | "elite" | "boss";

export interface MonsterRankInfo {
  nameKo: string;
  nameEn: string;
  icon: string;
  color: string;      // 등급 강조 색상 (hex)
  description: string;
}

export const MONSTER_RANK_INFO: Record<MonsterRank, MonsterRankInfo> = {
  normal: {
    nameKo: "일반",
    nameEn: "Normal",
    icon: "",
    color: "#9CA3AF",
    description: "일반 몬스터",
  },
  elite: {
    nameKo: "정예",
    nameEn: "Elite",
    icon: "✦",
    color: "#3B82F6",
    description: "강화된 정예 몬스터",
  },
  boss: {
    nameKo: "보스",
    nameEn: "Boss",
    icon: "👑",
    color: "#F59E0B",
    description: "지역의 지배자. 강력한 전용 스킬을 사용한다.",
  },
};

export interface MonsterTypeInfo {
  nameKo: string;
  nameEn: string;
  icon: string;
  dropsGold: boolean;
  description: string;
}

export const MONSTER_TYPE_INFO: Record<MonsterType, MonsterTypeInfo> = {
  beast: {
    nameKo: "야수",
    nameEn: "Beast",
    icon: "🐾",
    dropsGold: false,
    description: "야생 동물과 마수",
  },
  humanoid: {
    nameKo: "인간형",
    nameEn: "Humanoid",
    icon: "👤",
    dropsGold: true,
    description: "지능을 가진 인간형 존재",
  },
  undead: {
    nameKo: "언데드",
    nameEn: "Undead",
    icon: "💀",
    dropsGold: true,
    description: "죽은 자들",
  },
  demon: {
    nameKo: "악마",
    nameEn: "Demon",
    icon: "👿",
    dropsGold: true,
    description: "마계의 존재",
  },
  dragon: {
    nameKo: "용족",
    nameEn: "Dragon",
    icon: "🐉",
    dropsGold: true,
    description: "드래곤과 그 아종",
  },
  spirit: {
    nameKo: "정령",
    nameEn: "Spirit",
    icon: "✨",
    dropsGold: false,
    description: "원소의 정령",
  },
  construct: {
    nameKo: "구조물",
    nameEn: "Construct",
    icon: "🗿",
    dropsGold: false,
    description: "만들어진 존재",
  },
  plant: {
    nameKo: "식물",
    nameEn: "Plant",
    icon: "🌿",
    dropsGold: false,
    description: "식물형 몬스터",
  },
};

// ============ 물리 저항 ============

/**
 * 물리 공격 타입별 저항 배율
 * 1.0 = 보통 (100% 데미지)
 * 1.5 = 약함 (150% 데미지)
 * 0.5 = 강함 (50% 데미지)
 */
export interface PhysicalResistance {
  slashResist: number;   // 베기 저항
  pierceResist: number;  // 찌르기 저항
  crushResist: number;   // 타격 저항
}

export const DEFAULT_PHYSICAL_RESISTANCE: PhysicalResistance = {
  slashResist: 1.0,
  pierceResist: 1.0,
  crushResist: 1.0,
};

// ============ 속성 저항 ============

/**
 * 마법 속성별 저항 배율
 * 1.0 = 보통 (100% 데미지)
 * 1.5 = 약함 (150% 데미지)
 * 0.5 = 강함 (50% 데미지)
 */
export interface ElementResistance {
  fire?: number;      // 화염 저항
  ice?: number;       // 냉기 저항
  lightning?: number; // 번개 저항
  earth?: number;     // 대지 저항
  holy?: number;      // 신성 저항
  dark?: number;      // 암흑 저항
  poison?: number;    // 독 저항
  arcane?: number;    // 비전 저항
}

export const DEFAULT_ELEMENT_RESISTANCE: ElementResistance = {
  fire: 1.0,
  ice: 1.0,
  lightning: 1.0,
  earth: 1.0,
  holy: 1.0,
  dark: 1.0,
  poison: 1.0,
  arcane: 1.0,
};

// ============ 몬스터 스탯 ============

// 몬스터 스탯
export interface MonsterStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;          // DEX 역할 (선공 결정, 회피 등)
  magicAttack?: number;   // 마법 공격력 (없으면 attack 사용)
  physicalResist?: PhysicalResistance;   // 물리 저항 (베기/찌르기/타격) - 물리 공격에만 적용
  elementResist?: ElementResistance;     // 속성 저항 (화염/냉기/번개 등) - 마법 공격에만 적용
}

// 몬스터 드롭 아이템
export interface MonsterDrop {
  itemId: string;
  chance: number; // 0-1
  quantity: [number, number]; // [min, max]
}

// 몬스터 보상
export interface MonsterRewards {
  exp: number;
  gold: number;
}

// 몬스터 행동 패턴
export type MonsterBehavior = "passive" | "aggressive" | "defensive" | "territorial";

// 몬스터 설명
export interface MonsterDescription {
  ko: string;
  en: string;
}

// 몬스터 출현 조건
export interface SpawnCondition {
  period?: Period[]; // 출현 가능한 시간대 (null이면 항상 출현)
}

// 몬스터 행동 유형 가중치 (합계 100)
export interface ActionWeights {
  basicAttack: number;      // 기본 공격 확률 (%)
  specialSkill: number;     // 전용 스킬 확률 (abilities 배열에서 선택)
  borrowedAbility: number;  // 캐릭터 어빌리티 확률 (borrowedAbilities 배열에서 선택)
}

// 빌린 어빌리티 (캐릭터 스킬 사용)
export interface BorrowedAbility {
  abilityId: string;        // 어빌리티 ID (combatskills.json 또는 spells.json)
  level: number;            // 어빌리티 레벨
  weight: number;           // 선택 확률 가중치
  source?: "skill" | "spell"; // 어빌리티 소스 (기본: skill)
}

// 몬스터 데이터
export interface Monster {
  id: string;
  nameKo: string;
  nameEn: string;
  type: MonsterType;
  rank?: MonsterRank;  // 몬스터 등급 (normal/elite/boss). 없으면 normal 취급
  alignment: MonsterAlignment;
  mapIds: string[];  // 출현 맵 ID 배열 (복수 맵 가능)
  level: number;
  element: MagicElement | null;
  stats: MonsterStats;
  rewards: MonsterRewards;
  drops: MonsterDrop[];
  behavior: MonsterBehavior;
  icon: string;
  description?: MonsterDescription;
  spawnCondition?: SpawnCondition; // 출현 조건 (null이면 항상 출현)
  // AP 기반 전투 시스템
  maxAp?: number;                  // 턴당 최대 AP (기본 10)
  abilities?: MonsterAbility[];    // 사용 가능한 어빌리티 목록
  actionWeights?: ActionWeights;   // 행동 유형별 확률
  borrowedAbilities?: BorrowedAbility[]; // 사용 가능한 캐릭터 어빌리티
}

// JSON 파일 구조
export interface MonstersData {
  version: string;
  generatedAt: string;
  monsters: Monster[];
  summary: {
    total: number;
    byMap: Record<string, number>;
    byElement: Record<string, number>;
    byType: Record<string, number>;
    byAlignment: Record<MonsterAlignment, number>;
  };
}
