import raceData from "../../../../public/data/appearance/races/races.json";
import { CHARACTER_CATALOG } from "@/shared/lib/character/catalog";
// 능력치 시스템
export interface CharacterStats {
  str: number; // 힘 - 물리 공격력, 무게 제한
  dex: number; // 민첩 - 명중, 회피
  con: number; // 체력 - HP, 방어력
  int: number; // 지능 - 마법 공격력, 마나
  wis: number; // 지혜 - 마법 방어, 마나 회복
  cha: number; // 매력 - 상점 가격, NPC 호감도
  lck: number; // 행운 - 치명타 확률, 치명타 피해
  ambushChance: number; // 암습 확률 (%)
  ambushDamage: number; // 암습 추가 피해 (%)
}

export const STAT_NAMES: Record<keyof CharacterStats, { ko: string; desc: string }> = {
  str: { ko: "힘", desc: "물리 공격력, 무게 제한" },
  dex: { ko: "민첩", desc: "명중, 회피" },
  con: { ko: "체력", desc: "HP, 방어력" },
  int: { ko: "지능", desc: "마법 공격력, 마나" },
  wis: { ko: "지혜", desc: "마법 방어, 마나 회복" },
  cha: { ko: "매력", desc: "상점 가격, NPC 호감도" },
  lck: { ko: "행운", desc: "치명타 확률, 치명타 피해" },
  ambushChance: { ko: "암습 확률", desc: "전투 첫 공격 암습 확률 (%)" },
  ambushDamage: { ko: "암습 피해", desc: "암습 성공 시 추가 피해 (%)" },
};

// 기본 스탯 (모든 종족 공통)
export const BASE_STATS: CharacterStats = {
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
  lck: 10,
  ambushChance: 0, // 기본 0%
  ambushDamage: 0, // 기본 0%
};

// 배분 가능한 보너스 포인트
export const BONUS_POINTS = 10;
export const MAX_STAT = 20;
export const MIN_STAT = 5;

// 성별
export type Gender = "male" | "female";

export const GENDERS = [
  { id: "male" as Gender, name: "남성", icon: "♂" },
  { id: "female" as Gender, name: "여성", icon: "♀" },
];

// 종족 내 바디 타입
export interface BodyType {
  index: number;
  name: string;
}

// 종족 (여러 body type 지원)
export interface Race {
  id: string;
  name: string;
  bodyTypes: BodyType[];
  description: string;
  // 종족별 기본 스탯 보너스
  statBonus: Partial<CharacterStats>;
}

// Resolve by sprite name; Unity's order changes when art packs are added.
export const RACES: Race[] = raceData.races.filter(race => race.playable).map(race => {
  const index = CHARACTER_CATALOG.body.findIndex(body => body.sprite === race.appearance.body.spriteId);
  if (index < 0) throw new Error(`Missing body for ${race.id}`);
  return { id: race.id, name: race.nameKo, description: race.description,
    bodyTypes: [{ index, name: race.nameKo }], statBonus: race.statModifiers };
});

// 스탯 계산 유틸
export function calculateTotalStats(
  raceBonus: Partial<CharacterStats>,
  allocatedStats: CharacterStats
): CharacterStats {
  const result = { ...BASE_STATS };

  // 종족 보너스 적용
  for (const [key, value] of Object.entries(raceBonus)) {
    result[key as keyof CharacterStats] += value;
  }

  // 배분된 스탯 적용
  for (const [key, value] of Object.entries(allocatedStats)) {
    result[key as keyof CharacterStats] += value - BASE_STATS[key as keyof CharacterStats];
  }

  return result;
}
