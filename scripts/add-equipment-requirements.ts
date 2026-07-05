/**
 * 스킬에 장비 요구사항을 추가하는 스크립트
 * - 무기 스킬에 해당 무기 타입 요구사항 추가
 * - 방패 스킬에 방패 요구사항 추가
 */

import * as fs from "fs";
import * as path from "path";

const ABILITIES_DIR = path.join(process.cwd(), "public/data/abilities");

// 무기 타입 → 장비 타입 매핑
const WEAPON_EQUIPMENT_MAP: Record<string, string> = {
  axe: "axe",
  bow: "bow",
  crossbow: "crossbow",
  dagger: "dagger",
  mace: "mace",
  spear: "spear",
  staff: "staff",
  light_sword: "sword",
  medium_sword: "sword",
  great_sword: "sword",
  dual_wield: "dual_wield",
  shield: "shield",
};

interface Skill {
  id: string;
  nameKo: string;
  type: string;
  requirements: {
    skills?: Record<string, number>;
    stats?: Record<string, number>;
    equipment?: string;
  };
  [key: string]: unknown;
}

interface SkillFile {
  category: string;
  weaponType?: string;
  skills: Skill[];
  [key: string]: unknown;
}

function processWeaponSkillFile(filePath: string, weaponType: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data: SkillFile = JSON.parse(content);

  const equipmentType = WEAPON_EQUIPMENT_MAP[weaponType];
  if (!equipmentType) {
    console.log(`  [SKIP] Unknown weapon type: ${weaponType}`);
    return;
  }

  let modified = false;

  for (const skill of data.skills) {
    // 패시브 스킬(mastery)은 장비 요구 없음
    if (skill.type === "passive") continue;

    // 이미 요구사항이 있으면 업데이트, 없으면 추가
    if (!skill.requirements) {
      skill.requirements = {};
    }

    // 장비 요구사항 추가 (아직 없는 경우)
    if (!skill.requirements.equipment) {
      skill.requirements.equipment = equipmentType;
      modified = true;
      console.log(`  [ADD] ${skill.id}: requires ${equipmentType}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
    console.log(`  [SAVED] ${filePath}`);
  }
}

function processShieldSkills() {
  const shieldPath = path.join(ABILITIES_DIR, "combatskill/weapon/shield.json");
  if (fs.existsSync(shieldPath)) {
    console.log("Processing shield skills...");
    processWeaponSkillFile(shieldPath, "shield");
  }
}

function processWeaponSkills() {
  const weaponDir = path.join(ABILITIES_DIR, "combatskill/weapon");

  // 단일 파일 무기
  const singleFiles = ["axe", "bow", "crossbow", "dagger", "mace", "spear", "staff", "dual_wield"];
  for (const weapon of singleFiles) {
    const filePath = path.join(weaponDir, `${weapon}.json`);
    if (fs.existsSync(filePath)) {
      console.log(`Processing ${weapon} skills...`);
      processWeaponSkillFile(filePath, weapon);
    }
  }

  // 검술 서브타입
  const swordDir = path.join(weaponDir, "sword");
  const swordTypes = ["light_sword", "medium_sword", "great_sword"];
  for (const swordType of swordTypes) {
    const filePath = path.join(swordDir, `${swordType}.json`);
    if (fs.existsSync(filePath)) {
      console.log(`Processing ${swordType} skills...`);
      processWeaponSkillFile(filePath, swordType);
    }
  }

  // 검술 공통 스킬
  const commonSwordPath = path.join(swordDir, "common.json");
  if (fs.existsSync(commonSwordPath)) {
    console.log("Processing common sword skills...");
    // 공통 검술은 sword 장비 요구
    const content = fs.readFileSync(commonSwordPath, "utf-8");
    const data: SkillFile = JSON.parse(content);

    let modified = false;
    for (const skill of data.skills) {
      if (skill.type === "passive") continue;
      if (!skill.requirements) skill.requirements = {};
      if (!skill.requirements.equipment) {
        skill.requirements.equipment = "sword";
        modified = true;
        console.log(`  [ADD] ${skill.id}: requires sword`);
      }
    }

    if (modified) {
      fs.writeFileSync(commonSwordPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
    }
  }
}

function main() {
  console.log("Adding equipment requirements to weapon skills...\n");

  processWeaponSkills();
  processShieldSkills();

  console.log("\nDone!");
}

main();
