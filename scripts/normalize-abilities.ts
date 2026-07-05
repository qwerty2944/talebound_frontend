/**
 * 어빌리티 데이터 정규화 스크립트
 *
 * - proficiency 기반 → skills 기반 requirements로 변환
 * - maxLevel, expPerLevel, levelBonuses 추가
 * - grantsExpTo, cooldown 추가
 */

import * as fs from "fs";
import * as path from "path";

const ABILITIES_DIR = path.join(process.cwd(), "public/data/abilities");

// 스킬 타입별 기본 설정
const SKILL_DEFAULTS = {
  passive: { maxLevel: 50, expPerLevel: 100 },
  attack: { maxLevel: 25, expPerLevel: 60, cooldown: 0 },
  defensive: { maxLevel: 20, expPerLevel: 70, cooldown: 0 },
  buff: { maxLevel: 20, expPerLevel: 80, cooldown: 3 },
  debuff: { maxLevel: 15, expPerLevel: 90, cooldown: 3 },
  heal: { maxLevel: 25, expPerLevel: 70, cooldown: 0 },
  dot: { maxLevel: 20, expPerLevel: 60, cooldown: 0 },
  utility: { maxLevel: 20, expPerLevel: 80, cooldown: 3 },
  craft: { maxLevel: 30, expPerLevel: 100 },
};

// type 매핑
const TYPE_MAPPING: Record<string, string> = {
  martial_attack: "attack",
  weapon_attack: "attack",
};

// usageContext 매핑
const USAGE_CONTEXT_MAPPING: Record<string, string> = {
  combat_only: "combat_only",
  field_only: "field_only",
  both: "both",
  passive: "passive",
};

// proficiency → skill level 변환
function convertProficiencyToSkillLevel(proficiency: number): number {
  // 0-100 → 1-10 스케일로 변환
  return Math.max(1, Math.ceil(proficiency / 10));
}

// 마스터리 스킬 ID 추출 - 기존에 있는 마스터리 탐지
function getMasterySkillId(category: string, skills: any[]): string {
  // 기존 마스터리 스킬 탐지 (이름에 mastery가 포함된 패시브 스킬)
  const existingMastery = skills.find(
    (s) => s.type === "passive" && s.id?.includes("mastery")
  );
  if (existingMastery) {
    return existingMastery.id;
  }

  const mappings: Record<string, string> = {
    fist: "fist_mastery",
    kick: "kick_mastery",
    stance: "martial_mastery",
    defense: "defense_mastery",
    utility: "tactics_mastery",
    warcry: "warcry_mastery",
    medical: "first_aid_mastery",
    knowledge: "knowledge_mastery",
    blacksmithing: "smithing_mastery",
    tailoring: "tailoring_mastery",
    cooking: "cooking_mastery",
    alchemy: "alchemy_mastery",
    jewelcrafting: "jewelcraft_mastery",
    sword_common: "sword_mastery",
    light_sword: "light_sword_mastery",
    medium_sword: "medium_sword_mastery",
    great_sword: "great_sword_mastery",
    axe: "axe_mastery",
    mace: "mace_mastery",
    dagger: "dagger_mastery",
    spear: "spear_mastery",
    bow: "bow_mastery",
    crossbow: "crossbow_mastery",
    staff: "staff_mastery",
    shield: "shield_mastery",
    dual_wield: "dual_wield_mastery",
    fire: "fire_mastery",
    ice: "ice_mastery",
    lightning: "lightning_mastery",
    earth: "earth_mastery",
    holy: "holy_mastery",
    dark: "dark_mastery",
  };
  return mappings[category] || `${category}_mastery`;
}

// 기본 levelBonuses 생성
function generateLevelBonuses(skill: any, type: string): any[] {
  const baseDamage = skill.baseDamage || 20;
  const apCost = skill.apCost || skill.mpCost || 5;

  if (type === "passive") {
    return [
      { level: 1, effects: { bonus: 0 } },
      { level: 10, effects: { bonus: 5 } },
      { level: 25, effects: { bonus: 12 } },
      { level: 40, effects: { bonus: 20 } },
      { level: 50, effects: { bonus: 30 } },
    ];
  }

  if (type === "attack" || type === "dot") {
    const effects: any[] = [
      { level: 1, effects: { baseDamage, apCost } },
      { level: 10, effects: { baseDamage: Math.floor(baseDamage * 1.3), apCost } },
      { level: 20, effects: { baseDamage: Math.floor(baseDamage * 1.6), apCost: Math.max(1, apCost - 1) } },
    ];

    // 상태이상 효과 추가
    if (skill.statusEffect) {
      effects[effects.length - 1].effects[`${skill.statusEffect}Chance`] = skill.statusChance || 20;
    }

    return effects;
  }

  if (type === "buff" || type === "debuff") {
    const effectValue = skill.statusValue || 20;
    const duration = skill.statusDuration || 3;

    return [
      { level: 1, effects: { effectValue, duration, apCost } },
      { level: 10, effects: { effectValue: Math.floor(effectValue * 1.3), duration: duration + 1, apCost } },
      { level: 20, effects: { effectValue: Math.floor(effectValue * 1.6), duration: duration + 2, apCost: Math.max(1, apCost - 1) } },
    ];
  }

  if (type === "heal") {
    const healAmount = skill.healAmount || 30;
    const mpCost = skill.mpCost || 10;

    return [
      { level: 1, effects: { healAmount, mpCost } },
      { level: 10, effects: { healAmount: Math.floor(healAmount * 1.4), mpCost } },
      { level: 25, effects: { healAmount: Math.floor(healAmount * 1.8), mpCost: Math.max(1, mpCost - 2) } },
    ];
  }

  // 기본
  return [
    { level: 1, effects: { apCost } },
    { level: 10, effects: { apCost } },
    { level: 20, effects: { apCost: Math.max(1, apCost - 1) } },
  ];
}

// 스킬 정규화
function normalizeSkill(skill: any, category: string, masteryId: string): any {
  // 이미 정규화된 경우 스킵
  if (skill.levelBonuses && skill.maxLevel) {
    // requirements만 확인
    if (skill.requirements?.proficiency !== undefined) {
      const level = convertProficiencyToSkillLevel(skill.requirements.proficiency);
      skill.requirements = level > 1 ? { skills: { [masteryId]: level } } : {};
    }
    return skill;
  }

  // 타입 정규화
  const originalType = skill.type || "attack";
  const type = TYPE_MAPPING[originalType] || originalType;

  // usageContext 정규화
  const usageContext = USAGE_CONTEXT_MAPPING[skill.usageContext] || skill.usageContext || "combat_only";

  // defaults
  const defaults = SKILL_DEFAULTS[type as keyof typeof SKILL_DEFAULTS] || SKILL_DEFAULTS.attack;

  // requirements 변환
  let requirements: any = {};
  if (skill.requirements?.proficiency !== undefined && skill.requirements.proficiency > 0) {
    const level = convertProficiencyToSkillLevel(skill.requirements.proficiency);
    requirements = { skills: { [masteryId]: level } };
  }

  // description 정규화
  let description = skill.description;
  if (typeof description === "string") {
    description = { ko: description, en: description };
  }

  const normalized: any = {
    id: skill.id,
    nameKo: skill.nameKo,
    nameEn: skill.nameEn,
    type,
    usageContext,
    icon: skill.icon || "⚔️",
    description,
    maxLevel: skill.maxLevel || defaults.maxLevel,
    expPerLevel: skill.expPerLevel || defaults.expPerLevel,
    levelBonuses: skill.levelBonuses || generateLevelBonuses(skill, type),
    requirements,
  };

  // grantsExpTo (마스터리 스킬에게 경험치 부여)
  if (type !== "passive" && skill.id !== masteryId) {
    normalized.grantsExpTo = [masteryId];
  }

  // cooldown
  if ("cooldown" in defaults && type !== "passive") {
    normalized.cooldown = skill.cooldown ?? defaults.cooldown;
  }

  // attackType (공격 스킬인 경우)
  if (type === "attack") {
    if (originalType === "martial_attack") {
      normalized.attackType = "melee_physical";
    } else if (skill.attackType) {
      normalized.attackType = skill.attackType;
    }
  }

  return normalized;
}

// 마스터리 스킬 생성
function createMasterySkill(category: string, masteryId: string, nameKo: string): any {
  return {
    id: masteryId,
    nameKo: `${nameKo} 숙련`,
    nameEn: `${category.charAt(0).toUpperCase() + category.slice(1)} Mastery`,
    type: "passive",
    usageContext: "passive",
    icon: "📖",
    description: {
      ko: `${nameKo}의 기본기를 익혀 관련 기술의 위력과 효과를 높인다.`,
      en: `Master the fundamentals to increase power and effectiveness of related skills.`,
    },
    maxLevel: 50,
    expPerLevel: 100,
    levelBonuses: [
      { level: 1, effects: { damageBonus: 0, costReduction: 0 } },
      { level: 10, effects: { damageBonus: 5, costReduction: 2 } },
      { level: 25, effects: { damageBonus: 12, costReduction: 5 } },
      { level: 40, effects: { damageBonus: 20, costReduction: 8 } },
      { level: 50, effects: { damageBonus: 30, costReduction: 12 } },
    ],
    requirements: {},
  };
}

// 파일 처리
function processFile(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    // skills 또는 spells 배열이 있는지 확인
    const skillsKey = data.skills ? "skills" : data.spells ? "spells" : null;
    if (!skillsKey) {
      console.log(`  스킵: ${path.basename(filePath)} (skills/spells 없음)`);
      return false;
    }

    const category = data.category || data.weaponType || data.element || path.basename(filePath, ".json");
    const masteryId = getMasterySkillId(category, data[skillsKey]);
    const nameKo = data.nameKo || category;

    // 마스터리 스킬이 없으면 추가
    const hasMartery = data[skillsKey].some((s: any) => s.id === masteryId);
    if (!hasMartery && !["song", "knowledge"].includes(category)) {
      console.log(`  마스터리 스킬 추가: ${masteryId}`);
      data[skillsKey].unshift(createMasterySkill(category, masteryId, nameKo));
    }

    // 각 스킬 정규화
    let modified = false;
    data[skillsKey] = data[skillsKey].map((skill: any) => {
      const original = JSON.stringify(skill);
      const normalized = normalizeSkill(skill, category, masteryId);
      if (JSON.stringify(normalized) !== original) {
        modified = true;
      }
      return normalized;
    });

    if (modified || !hasMartery) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
      console.log(`  수정됨: ${path.basename(filePath)}`);
      return true;
    }

    console.log(`  변경없음: ${path.basename(filePath)}`);
    return false;
  } catch (error) {
    console.error(`  오류: ${path.basename(filePath)}`, error);
    return false;
  }
}

// 디렉토리 재귀 처리
function processDirectory(dir: string): number {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      count += processDirectory(fullPath);
    } else if (entry.name.endsWith(".json") && !entry.name.includes("metadata")) {
      if (processFile(fullPath)) {
        count++;
      }
    }
  }

  return count;
}

// 메인
console.log("어빌리티 데이터 정규화 시작...\n");

const directories = [
  path.join(ABILITIES_DIR, "combatskill"),
  path.join(ABILITIES_DIR, "spell"),
  path.join(ABILITIES_DIR, "lifeskill"),
  path.join(ABILITIES_DIR, "craftskill"),
  path.join(ABILITIES_DIR, "song"),
];

let totalModified = 0;
for (const dir of directories) {
  if (fs.existsSync(dir)) {
    console.log(`\n처리 중: ${path.relative(ABILITIES_DIR, dir)}/`);
    totalModified += processDirectory(dir);
  }
}

console.log(`\n\n완료! ${totalModified}개 파일 수정됨.`);
