/**
 * Ability API - 스펠과 스킬 데이터를 통합하여 Ability로 변환
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api";
import type { Ability, AbilityLevelEffects } from "../types";

// 몬스터 어빌리티 원본 타입
interface RawMonsterAbility {
  id: string;
  nameKo: string;
  nameEn: string;
  type: string;
  attackType?: string;
  icon: string;
  description: { ko: string; en: string };
  baseDamage?: number;
  apCost: number;
  damagePerLevel?: number;
  statusEffect?: string;
  statusValue?: number;
  statusDuration?: number;
  statusChance?: number;
  selfBuff?: string;
  buffValue?: number;
  buffDuration?: number;
  critBonus?: number;
}

// 몬스터 어빌리티 캐시
let cachedMonsterAbilities: Map<string, RawMonsterAbility> | null = null;

// 스펠 원본 타입
interface RawSpell {
  id: string;
  nameKo: string;
  nameEn: string;
  type: string;
  usageContext: string;
  icon: string;
  description: { ko: string; en: string };
  maxLevel: number;
  expPerLevel: number;
  levelBonuses: Array<{ level: number; effects: Record<string, unknown> }>;
  requirements: Record<string, unknown>;
  grantsExpTo?: string[];
  cooldown?: number;
  element: string;
}

// 스킬 원본 타입
interface RawSkill {
  id: string;
  nameKo: string;
  nameEn: string;
  type: string;
  attackType?: string;
  usageContext: string;
  icon: string;
  description: { ko: string; en: string };
  maxLevel: number;
  expPerLevel: number;
  levelBonuses: Array<{ level: number; effects: Record<string, unknown> }>;
  requirements: Record<string, unknown>;
  grantsExpTo?: string[];
  cooldown?: number;
  category?: string;
  skillGroup?: string;
}

let cachedAbilities: Ability[] | null = null;

/**
 * 스펠을 Ability로 변환
 */
function convertSpellToAbility(spell: RawSpell): Ability {
  const firstBonus = spell.levelBonuses[0]?.effects || {};

  return {
    id: spell.id,
    nameKo: spell.nameKo,
    nameEn: spell.nameEn,
    description: spell.description,
    icon: spell.icon,
    source: "spell",
    type: spell.type as Ability["type"],
    attackType: spell.type === "attack" ? "magic" : undefined,
    element: spell.element as Ability["element"],
    usageContext: spell.usageContext as Ability["usageContext"],
    maxLevel: spell.maxLevel,
    expPerLevel: spell.expPerLevel,
    levelBonuses: spell.levelBonuses.map((b) => ({
      level: b.level,
      effects: b.effects as AbilityLevelEffects,
    })),
    baseCost: {
      mp: (firstBonus.mpCost as number) || 10,
    },
    cooldown: spell.cooldown,
    requirements: spell.requirements as Ability["requirements"],
    grantsExpTo: spell.grantsExpTo,
    target: spell.type === "heal" || spell.type === "buff" ? "self" : "enemy",
  };
}

/**
 * 스킬을 Ability로 변환
 */
function convertSkillToAbility(skill: RawSkill): Ability {
  const firstBonus = skill.levelBonuses[0]?.effects || {};

  return {
    id: skill.id,
    nameKo: skill.nameKo,
    nameEn: skill.nameEn,
    description: skill.description,
    icon: skill.icon,
    source: "combatskill",
    type: skill.type as Ability["type"],
    attackType: skill.attackType as Ability["attackType"],
    category: skill.category,
    skillGroup: skill.skillGroup,
    usageContext: skill.usageContext as Ability["usageContext"],
    maxLevel: skill.maxLevel,
    expPerLevel: skill.expPerLevel,
    levelBonuses: skill.levelBonuses.map((b) => ({
      level: b.level,
      effects: b.effects as AbilityLevelEffects,
    })),
    baseCost: {
      ap: (firstBonus.apCost as number) || 5,
      mp: (firstBonus.mpCost as number) || undefined,
    },
    cooldown: skill.cooldown,
    requirements: skill.requirements as Ability["requirements"],
    grantsExpTo: skill.grantsExpTo,
    target:
      skill.type === "buff" || skill.type === "defense"
        ? "self"
        : skill.type === "debuff" || skill.type === "attack"
        ? "enemy"
        : "self",
  };
}

/**
 * 모든 어빌리티 로드 (스펠 + 스킬 통합)
 */
export async function fetchAbilities(): Promise<Ability[]> {
  if (cachedAbilities) return cachedAbilities;

  const [spellsRes, skillsRes] = await Promise.all([
    fetch("/data/abilities/spells.json"),
    fetch("/data/abilities/combatskills.json"),
  ]);

  const spellsData = await spellsRes.json();
  const skillsData = await skillsRes.json();

  const spellAbilities = (spellsData.spells as RawSpell[])
    .filter((s) => s.type !== "passive") // 패시브 제외 (전투용 아님)
    .map(convertSpellToAbility);

  const skillAbilities = (skillsData.skills as RawSkill[])
    .filter((s) => s.type !== "passive" && s.usageContext === "combat_only")
    .map(convertSkillToAbility);

  cachedAbilities = [...spellAbilities, ...skillAbilities];
  return cachedAbilities;
}

/**
 * ID로 어빌리티 조회
 */
export async function fetchAbilityById(id: string): Promise<Ability | null> {
  const abilities = await fetchAbilities();
  return abilities.find((a) => a.id === id) || null;
}

/**
 * 소스별 어빌리티 조회
 */
export async function fetchAbilitiesBySource(
  source: "spell" | "combatskill"
): Promise<Ability[]> {
  const abilities = await fetchAbilities();
  return abilities.filter((a) => a.source === source);
}

/**
 * 타입별 어빌리티 조회
 */
export async function fetchAbilitiesByType(
  type: Ability["type"]
): Promise<Ability[]> {
  const abilities = await fetchAbilities();
  return abilities.filter((a) => a.type === type);
}

/**
 * 레벨에 해당하는 효과 가져오기
 */
export function getEffectsAtLevel(
  ability: Ability,
  level: number
): AbilityLevelEffects {
  // 해당 레벨 이하의 가장 높은 레벨 보너스 찾기
  const applicableBonuses = ability.levelBonuses.filter(
    (b) => b.level <= level
  );
  if (applicableBonuses.length === 0) {
    return ability.levelBonuses[0]?.effects || {};
  }
  return applicableBonuses[applicableBonuses.length - 1].effects;
}

/**
 * 물리 공격인지 확인
 */
export function isPhysicalAttack(ability: Ability): boolean {
  return (
    ability.type === "attack" &&
    (ability.attackType === "melee_physical" || ability.attackType === "ranged_physical")
  );
}

/**
 * AP 비용 계산 (레벨 보너스 + 무기 공격속도 적용)
 * @param ability 어빌리티
 * @param level 어빌리티 레벨
 * @param weaponAttackSpeed 무기 공격속도 (0.65~1.15, 물리 공격만 적용)
 * @returns 최종 AP 비용
 */
export function getApCost(
  ability: Ability,
  level: number,
  weaponAttackSpeed?: number
): number {
  const effects = getEffectsAtLevel(ability, level);
  const baseAp = effects.apCost ?? ability.baseCost.ap ?? 5;

  // 무기 공격속도 적용 (물리 공격만)
  if (weaponAttackSpeed && isPhysicalAttack(ability)) {
    // 역수 배율: AP = baseAP / attackSpeed
    // attackSpeed 0.65 → AP ~1.54배, attackSpeed 1.15 → AP ~0.87배
    return Math.max(1, Math.round(baseAp / weaponAttackSpeed));
  }

  return baseAp;
}

/**
 * MP 비용 계산 (레벨 보너스 적용)
 */
export function getMpCost(ability: Ability, level: number): number {
  const effects = getEffectsAtLevel(ability, level);
  return effects.mpCost ?? ability.baseCost.mp ?? 0;
}

/**
 * 캐시 클리어 (테스트용)
 */
export function clearAbilityCache(): void {
  cachedAbilities = null;
  cachedMonsterAbilities = null;
}

/**
 * 몬스터 어빌리티 로드
 */
export async function fetchMonsterAbilities(): Promise<
  Map<string, RawMonsterAbility>
> {
  if (cachedMonsterAbilities) return cachedMonsterAbilities;

  const res = await fetch("/data/abilities/monster-abilities.json");
  const data = await res.json();

  cachedMonsterAbilities = new Map();
  for (const ability of data.abilities as RawMonsterAbility[]) {
    cachedMonsterAbilities.set(ability.id, ability);
  }

  return cachedMonsterAbilities;
}

/**
 * 몬스터 어빌리티 ID로 조회
 */
export async function fetchMonsterAbilityById(
  id: string
): Promise<RawMonsterAbility | null> {
  const abilities = await fetchMonsterAbilities();
  return abilities.get(id) || null;
}

/**
 * 몬스터 어빌리티의 레벨별 데미지 계산
 */
export function calculateMonsterAbilityDamage(
  ability: RawMonsterAbility,
  level: number,
  monsterAttack: number
): number {
  const baseDamage = ability.baseDamage || 0;
  const perLevel = ability.damagePerLevel || 0;
  // 기본 데미지 + (레벨 × 레벨당 증가) + 몬스터 공격력 보정
  return Math.floor(baseDamage + perLevel * level + monsterAttack * 0.5);
}

// RawMonsterAbility를 export해서 다른 곳에서도 사용 가능하게
export type { RawMonsterAbility };

// User Abilities API (DB 연동)
export {
  fetchUserAbilities,
  increaseAbilityExp,
  updateAbilitiesProgress,
  getAbilityLevel,
  checkAbilityRequirement,
  getLearnedAbilities,
} from "./userAbilities";
export type {
  AbilityProgress,
  UserAbilities,
  AbilityCategory,
} from "./userAbilities";

// ============ Proficiency Constants (from deprecated proficiency module) ============
import type {
  WeaponType,
  MagicElement,
  ProficiencyType,
  ProficiencyInfo,
  Proficiencies,
  PhysicalAttackType,
  WeaponBlockConfig,
  KnowledgeType,
} from "../types";

export const WEAPON_PROFICIENCIES: ProficiencyInfo[] = [
  { id: "light_sword", nameKo: "세검", nameEn: "Light Sword", icon: "🗡️", category: "weapon" },
  { id: "medium_sword", nameKo: "중검", nameEn: "Medium Sword", icon: "⚔️", category: "weapon" },
  { id: "great_sword", nameKo: "대검", nameEn: "Great Sword", icon: "🗡️", category: "weapon" },
  { id: "axe", nameKo: "도끼", nameEn: "Axe", icon: "🪓", category: "weapon" },
  { id: "mace", nameKo: "둔기", nameEn: "Mace", icon: "🔨", category: "weapon" },
  { id: "dagger", nameKo: "단검", nameEn: "Dagger", icon: "🔪", category: "weapon" },
  { id: "spear", nameKo: "창", nameEn: "Spear", icon: "🔱", category: "weapon" },
  { id: "bow", nameKo: "활", nameEn: "Bow", icon: "🏹", category: "weapon" },
  { id: "crossbow", nameKo: "석궁", nameEn: "Crossbow", icon: "🎯", category: "weapon" },
  { id: "staff", nameKo: "지팡이", nameEn: "Staff", icon: "🪄", category: "weapon" },
  { id: "fist", nameKo: "맨손", nameEn: "Fist", icon: "👊", category: "weapon" },
  { id: "shield", nameKo: "방패", nameEn: "Shield", icon: "🛡️", category: "weapon" },
];

export const MAGIC_PROFICIENCIES: ProficiencyInfo[] = [
  { id: "fire", nameKo: "화염", nameEn: "Fire", icon: "🔥", category: "magic" },
  { id: "ice", nameKo: "냉기", nameEn: "Ice", icon: "❄️", category: "magic" },
  { id: "lightning", nameKo: "번개", nameEn: "Lightning", icon: "⚡", category: "magic" },
  { id: "earth", nameKo: "대지", nameEn: "Earth", icon: "🪨", category: "magic" },
  { id: "holy", nameKo: "신성", nameEn: "Holy", icon: "✨", category: "magic" },
  { id: "dark", nameKo: "암흑", nameEn: "Dark", icon: "🌑", category: "magic" },
  { id: "poison", nameKo: "독", nameEn: "Poison", icon: "☠️", category: "magic" },
];

export const CRAFTING_PROFICIENCIES: ProficiencyInfo[] = [];
export const MEDICAL_PROFICIENCIES: ProficiencyInfo[] = [];
export const KNOWLEDGE_PROFICIENCIES: ProficiencyInfo[] = [];

export const ALL_PROFICIENCIES = [...WEAPON_PROFICIENCIES, ...MAGIC_PROFICIENCIES];

export const DEFAULT_PROFICIENCIES: Proficiencies = {
  light_sword: 0, medium_sword: 0, great_sword: 0,
  axe: 0, mace: 0, dagger: 0, spear: 0,
  bow: 0, crossbow: 0, staff: 0, fist: 0, shield: 0,
  fire: 0, ice: 0, lightning: 0, earth: 0, holy: 0, dark: 0, poison: 0, arcane: 0,
};

export const WEAPON_ATTACK_TYPE: Record<WeaponType, PhysicalAttackType> = {
  light_sword: "pierce", medium_sword: "slash", great_sword: "slash",
  axe: "slash", mace: "crush", dagger: "pierce", spear: "pierce",
  bow: "pierce", crossbow: "pierce", staff: "blunt", fist: "crush", shield: "crush",
};

export const WEAPON_BLOCK_CONFIG: Record<WeaponType, WeaponBlockConfig> = {
  light_sword: { blockChance: 0, damageReduction: 0, specialEffect: "riposte", specialChance: 0 },
  medium_sword: { blockChance: 0, damageReduction: 0, specialEffect: "counter", specialChance: 0 },
  great_sword: { blockChance: 0, damageReduction: 0, specialEffect: "stun", specialChance: 0 },
  axe: { blockChance: 0, damageReduction: 0, specialEffect: "disarm", specialChance: 0 },
  mace: { blockChance: 0, damageReduction: 0, specialEffect: "stun", specialChance: 0 },
  dagger: { blockChance: 0, damageReduction: 0, specialEffect: "riposte", specialChance: 0 },
  spear: { blockChance: 0, damageReduction: 0, specialEffect: "counter", specialChance: 0 },
  bow: { blockChance: 0, damageReduction: 0, specialEffect: "none", specialChance: 0 },
  crossbow: { blockChance: 0, damageReduction: 0, specialEffect: "none", specialChance: 0 },
  staff: { blockChance: 0, damageReduction: 0, specialEffect: "counter", specialChance: 0 },
  fist: { blockChance: 0, damageReduction: 0, specialEffect: "counter", specialChance: 0 },
  shield: { blockChance: 0, damageReduction: 0, specialEffect: "stun", specialChance: 0 },
};

export const ATTACK_TYPE_TO_KNOWLEDGE: Record<PhysicalAttackType, KnowledgeType> = {
  slash: "anatomy", pierce: "anatomy", blunt: "metallurgy", crush: "metallurgy",
};

// ============ Proficiency Functions ============

const proficiencyKeys = {
  user: (userId: string) => ["proficiencies", userId] as const,
};

/**
 * 숙련도 조회 (백엔드 proficiencies 테이블)
 */
export function useProficiencies(userId: string | undefined) {
  return useQuery({
    queryKey: proficiencyKeys.user(userId || ""),
    queryFn: async (): Promise<Proficiencies> => {
      const data = await apiFetch<Partial<Proficiencies>>("/api/proficiencies");
      return { ...DEFAULT_PROFICIENCIES, ...data };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * 숙련도 증가 mutation
 */
export function useGainProficiency(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { type: ProficiencyType; amount: number }) =>
      apiFetch<{ type: ProficiencyType; value: number }>("/api/proficiencies/gain", {
        method: "POST",
        body: params,
      }),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: proficiencyKeys.user(userId) });
      }
    },
  });
}

export function getProficiencyValue(
  proficiencies: Proficiencies | null | undefined,
  type: ProficiencyType
): number {
  return proficiencies?.[type as keyof Proficiencies] ?? 0;
}

export function getProficiencyInfo(type: ProficiencyType): ProficiencyInfo | undefined {
  return ALL_PROFICIENCIES.find((p) => p.id === type);
}

// 숙련도 등급 (docs/proficiency-system.md)
export interface ProficiencyRank {
  id: string;
  nameKo: string;
  nameEn: string;
  minLevel: number;
  damageBonus: number;
  speedBonus: number;
}

export const PROFICIENCY_RANKS: ProficiencyRank[] = [
  { id: "novice", nameKo: "초보", nameEn: "Novice", minLevel: 0, damageBonus: 0, speedBonus: 0 },
  { id: "apprentice", nameKo: "견습", nameEn: "Apprentice", minLevel: 20, damageBonus: 5, speedBonus: 0 },
  { id: "journeyman", nameKo: "숙련", nameEn: "Journeyman", minLevel: 40, damageBonus: 10, speedBonus: 5 },
  { id: "expert", nameKo: "전문가", nameEn: "Expert", minLevel: 60, damageBonus: 15, speedBonus: 10 },
  { id: "master", nameKo: "달인", nameEn: "Master", minLevel: 80, damageBonus: 20, speedBonus: 15 },
  { id: "grandmaster", nameKo: "대가", nameEn: "Grandmaster", minLevel: 100, damageBonus: 25, speedBonus: 20 },
];

export function getRankInfo(level: number) {
  let rank = PROFICIENCY_RANKS[0];
  for (const r of PROFICIENCY_RANKS) {
    if (level >= r.minLevel) rank = r;
  }
  return rank;
}

export function getDamageBonus(level: number): number {
  return getRankInfo(level).damageBonus;
}

export function getDamageMultiplier(level: number): number {
  return 1 + getDamageBonus(level) / 100;
}

// 요일별 속성 강화 (월=ice, 화=fire, 수=lightning, 목=earth, 금=holy, 토=dark, 일=없음)
const DAY_BOOST_ELEMENTS: Array<MagicElement | null> = [
  null,        // 일 (日)
  "ice",       // 월 (月)
  "fire",      // 화 (火)
  "lightning", // 수 (水)
  "earth",     // 목 (木)
  "holy",      // 금 (金)
  "dark",      // 토 (土)
];

export function getDayBoostMultiplier(element: MagicElement): number {
  const boosted = DAY_BOOST_ELEMENTS[new Date().getDay()];
  return boosted === element ? 1.2 : 1.0;
}

export function isWeaponProficiency(type: ProficiencyType): type is WeaponType {
  return WEAPON_PROFICIENCIES.some((p) => p.id === type);
}

export function isMagicProficiency(type: ProficiencyType): type is MagicElement {
  return MAGIC_PROFICIENCIES.some((p) => p.id === type);
}

// 속성 상성 (fire→ice→lightning→earth→fire 순환, holy↔dark 상호)
const ELEMENT_STRONG_AGAINST: Partial<Record<MagicElement, MagicElement>> = {
  fire: "ice",
  ice: "lightning",
  lightning: "earth",
  earth: "fire",
  holy: "dark",
  dark: "holy",
};

const ELEMENT_WEAK_AGAINST: Partial<Record<MagicElement, MagicElement>> = {
  fire: "earth",
  ice: "fire",
  lightning: "ice",
  earth: "lightning",
};

export function getMagicEffectiveness(
  attackElement: MagicElement,
  targetElement: MagicElement | undefined
): number {
  if (!targetElement) return 1.0;
  if (ELEMENT_STRONG_AGAINST[attackElement] === targetElement) return 1.5;
  if (ELEMENT_WEAK_AGAINST[attackElement] === targetElement) return 0.75;
  return 1.0;
}

/**
 * 레벨 기반 숙련도 획득 계산
 * - 몬스터가 플레이어보다 5레벨 이상 낮으면 획득 없음
 * - 상위 몬스터일수록 더 많이 획득, 숙련도 100 도달 시 종료
 */
export function calculateProficiencyGain(params: {
  proficiencyType: ProficiencyType;
  currentProficiency: number;
  playerLevel: number;
  monsterLevel: number;
  attackSuccess: boolean;
}) {
  const { currentProficiency, playerLevel, monsterLevel, attackSuccess } = params;
  const levelDiff = monsterLevel - playerLevel;

  if (!attackSuccess) {
    return { gained: false, amount: 0, levelDiff, reason: "attack_failed" };
  }
  if (currentProficiency >= 100) {
    return { gained: false, amount: 0, levelDiff, reason: "max_proficiency" };
  }
  if (levelDiff < -5) {
    return { gained: false, amount: 0, levelDiff, reason: "level_too_low" };
  }

  // 기본 1, 동급 이상 몬스터 2, 5레벨 이상 상위 몬스터 3
  const amount = levelDiff >= 5 ? 3 : levelDiff >= 0 ? 2 : 1;

  return { gained: true, amount, levelDiff, reason: "success" };
}

export function canGainProficiency(
  currentProficiency: number,
  playerLevel: number,
  monsterLevel: number
): boolean {
  return currentProficiency < 100 && monsterLevel - playerLevel >= -5;
}

// ============ Knowledge Bonus ============
export interface KnowledgeBonus {
  damageBonus: number;
  critBonus: number;
  slashBonus: number;
  pierceBonus: number;
  crushBonus: number;
  magicBonus: number;
  poisonBonus: number;
  healingBonus: number;
  defenseBonus: number;
}

export function calculateKnowledgeBonus(
  _knowledgeProficiencies: Partial<Record<KnowledgeType, number>>
): KnowledgeBonus {
  return {
    damageBonus: 0, critBonus: 0, slashBonus: 0, pierceBonus: 0,
    crushBonus: 0, magicBonus: 0, poisonBonus: 0, healingBonus: 0, defenseBonus: 0,
  };
}
