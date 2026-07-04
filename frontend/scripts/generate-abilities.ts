/**
 * 능력 JSON 파일들을 읽어서 카테고리별 통합 JSON 생성
 *
 * 폴더 구조:
 *   public/data/abilities/
 *   ├── spell/
 *   │   ├── fire.json
 *   │   ├── ice.json
 *   │   └── ...
 *   ├── lifeskill/
 *   │   ├── medical.json
 *   │   └── knowledge.json
 *   ├── craftskill/
 *   │   ├── blacksmithing/
 *   │   ├── tailoring/
 *   │   ├── cooking/
 *   │   ├── alchemy/
 *   │   └── jewelcrafting/
 *   └── combatskill/
 *       ├── weapon/
 *       ├── martial/
 *       ├── defense/
 *       └── utility/
 *
 * 출력:
 *   public/data/abilities/spells.json
 *   public/data/abilities/lifeskills.json
 *   public/data/abilities/craftskills.json
 *   public/data/abilities/combatskills.json
 *
 * 사용법: npx tsx scripts/generate-abilities.ts
 */

import fs from "fs";
import path from "path";

// 경로 설정
const ABILITIES_DIR = "public/data/abilities";

interface SpellSource {
  element: string;
  nameKo: string;
  nameEn: string;
  icon: string;
  description: string;
  spells: Record<string, unknown>[];
}

interface SkillSource {
  category: string;
  nameKo: string;
  nameEn: string;
  icon: string;
  description: string;
  skills: Record<string, unknown>[];
}

// 마법 주문 처리
function processSpells(): {
  items: Record<string, unknown>[];
  byElement: Record<string, number>;
  byType: Record<string, number>;
  byUsageContext: Record<string, number>;
} {
  const fullDir = path.join(ABILITIES_DIR, "spell");
  const items: Record<string, unknown>[] = [];
  const byElement: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byUsageContext: Record<string, number> = {};

  if (!fs.existsSync(fullDir)) {
    console.log(`  ⚠️ spell/ 폴더 없음`);
    return { items, byElement, byType, byUsageContext };
  }

  const files = fs.readdirSync(fullDir).filter(
    (f) => f.endsWith(".json") && f !== "metadata.json"
  );

  for (const file of files) {
    const filePath = path.join(fullDir, file);
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const source: SpellSource = JSON.parse(content);

      if (!source.spells || !Array.isArray(source.spells)) continue;

      console.log(`    ${file}: ${source.spells.length}개 (${source.nameKo})`);

      for (const spell of source.spells) {
        const spellWithElement = {
          ...spell,
          element: source.element,
        };
        items.push(spellWithElement);

        // 통계
        byElement[source.element] = (byElement[source.element] || 0) + 1;
        const spellType = (spell as { type?: string }).type || "unknown";
        byType[spellType] = (byType[spellType] || 0) + 1;
        const usageContext = (spell as { usageContext?: string }).usageContext || "unknown";
        byUsageContext[usageContext] = (byUsageContext[usageContext] || 0) + 1;
      }
    } catch (err) {
      console.error(`    ❌ ${file} 로드 실패:`, err);
    }
  }

  return { items, byElement, byType, byUsageContext };
}

// 생활 스킬 처리
function processLifeSkills(): {
  items: Record<string, unknown>[];
  byCategory: Record<string, number>;
} {
  const fullDir = path.join(ABILITIES_DIR, "lifeskill");
  const items: Record<string, unknown>[] = [];
  const byCategory: Record<string, number> = {};

  if (!fs.existsSync(fullDir)) {
    console.log(`  ⚠️ lifeskill/ 폴더 없음`);
    return { items, byCategory };
  }

  const files = fs.readdirSync(fullDir).filter(
    (f) => f.endsWith(".json") && f !== "metadata.json"
  );

  for (const file of files) {
    const filePath = path.join(fullDir, file);
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const source: SkillSource = JSON.parse(content);

      if (!source.skills || !Array.isArray(source.skills)) continue;

      console.log(`    ${file}: ${source.skills.length}개 (${source.nameKo})`);

      for (const skill of source.skills) {
        const skillWithCategory = {
          ...skill,
          category: source.category,
        };
        items.push(skillWithCategory);

        // 통계
        byCategory[source.category] = (byCategory[source.category] || 0) + 1;
      }
    } catch (err) {
      console.error(`    ❌ ${file} 로드 실패:`, err);
    }
  }

  return { items, byCategory };
}

// 제작 스킬 처리 (하위 폴더 구조)
function processCraftSkills(): {
  items: Record<string, unknown>[];
  byCategory: Record<string, number>;
  byType: Record<string, number>;
} {
  const fullDir = path.join(ABILITIES_DIR, "craftskill");
  const items: Record<string, unknown>[] = [];
  const byCategory: Record<string, number> = {};
  const byType: Record<string, number> = {};

  if (!fs.existsSync(fullDir)) {
    console.log(`  ⚠️ craftskill/ 폴더 없음`);
    return { items, byCategory, byType };
  }

  // 하위 폴더들
  const subdirs = ["blacksmithing", "tailoring", "cooking", "alchemy", "jewelcrafting"];

  for (const subdir of subdirs) {
    const subdirPath = path.join(fullDir, subdir);
    if (!fs.existsSync(subdirPath)) {
      console.log(`    ⚠️ ${subdir}/ 폴더 없음`);
      continue;
    }

    console.log(`    📂 ${subdir}/`);

    const files = fs.readdirSync(subdirPath).filter(
      (f) => f.endsWith(".json") && f !== "metadata.json"
    );

    for (const file of files) {
      const filePath = path.join(subdirPath, file);
      try {
        const content = fs.readFileSync(filePath, "utf8");
        const source: SkillSource = JSON.parse(content);

        if (!source.skills || !Array.isArray(source.skills)) continue;

        console.log(`      ${file}: ${source.skills.length}개 (${source.nameKo})`);

        for (const skill of source.skills) {
          const skillWithMeta = {
            ...skill,
            category: source.category,
            skillGroup: subdir,
          };
          items.push(skillWithMeta);

          // 통계
          byCategory[source.category] = (byCategory[source.category] || 0) + 1;
          const skillType = (skill as { type?: string }).type || "unknown";
          byType[skillType] = (byType[skillType] || 0) + 1;
        }
      } catch (err) {
        console.error(`      ❌ ${file} 로드 실패:`, err);
      }
    }
  }

  return { items, byCategory, byType };
}

// 전투 스킬 처리
function processCombatSkills(): {
  items: Record<string, unknown>[];
  byCategory: Record<string, number>;
  byType: Record<string, number>;
} {
  const fullDir = path.join(ABILITIES_DIR, "combatskill");
  const items: Record<string, unknown>[] = [];
  const byCategory: Record<string, number> = {};
  const byType: Record<string, number> = {};

  if (!fs.existsSync(fullDir)) {
    console.log(`  ⚠️ combatskill/ 폴더 없음`);
    return { items, byCategory, byType };
  }

  // 하위 폴더들: common, weapon, martial, defense, utility, warcry
  const subdirs = ["common", "weapon", "martial", "defense", "utility", "warcry"];

  for (const subdir of subdirs) {
    const subdirPath = path.join(fullDir, subdir);
    if (!fs.existsSync(subdirPath)) {
      console.log(`    ⚠️ ${subdir}/ 폴더 없음`);
      continue;
    }

    console.log(`    📂 ${subdir}/`);

    const files = fs.readdirSync(subdirPath).filter(
      (f) => f.endsWith(".json") && f !== "metadata.json"
    );

    for (const file of files) {
      const filePath = path.join(subdirPath, file);
      try {
        const content = fs.readFileSync(filePath, "utf8");
        const source: SkillSource = JSON.parse(content);

        if (!source.skills || !Array.isArray(source.skills)) continue;

        console.log(`      ${file}: ${source.skills.length}개 (${source.nameKo})`);

        for (const skill of source.skills) {
          const skillWithMeta = {
            ...skill,
            category: source.category,
            skillGroup: subdir, // weapon, martial, defense, utility
          };
          items.push(skillWithMeta);

          // 통계
          byCategory[source.category] = (byCategory[source.category] || 0) + 1;
          const skillType = (skill as { type?: string }).type || "unknown";
          byType[skillType] = (byType[skillType] || 0) + 1;
        }
      } catch (err) {
        console.error(`      ❌ ${file} 로드 실패:`, err);
      }
    }
  }

  return { items, byCategory, byType };
}

// 메인 함수
async function main(): Promise<void> {
  console.log("🔧 능력 데이터 생성 시작...\n");

  const totalSummary = {
    spells: 0,
    lifeSkills: 0,
    craftSkills: 0,
    combatSkills: 0,
  };

  // 1. 마법 주문 처리
  console.log("📁 spell/ 처리 중...");
  const spellResult = processSpells();

  if (spellResult.items.length > 0) {
    const output = {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      spells: spellResult.items,
      summary: {
        total: spellResult.items.length,
        byElement: spellResult.byElement,
        byType: spellResult.byType,
        byUsageContext: spellResult.byUsageContext,
      },
    };

    const outputPath = path.join(ABILITIES_DIR, "spells.json");
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`  ✅ spells.json: ${spellResult.items.length}개 주문\n`);
    totalSummary.spells = spellResult.items.length;
  }

  // 2. 생활 스킬 처리
  console.log("📁 lifeskill/ 처리 중...");
  const lifeResult = processLifeSkills();

  if (lifeResult.items.length > 0) {
    const output = {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      skills: lifeResult.items,
      summary: {
        total: lifeResult.items.length,
        byCategory: lifeResult.byCategory,
      },
    };

    const outputPath = path.join(ABILITIES_DIR, "lifeskills.json");
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`  ✅ lifeskills.json: ${lifeResult.items.length}개 스킬\n`);
    totalSummary.lifeSkills = lifeResult.items.length;
  }

  // 3. 제작 스킬 처리
  console.log("📁 craftskill/ 처리 중...");
  const craftResult = processCraftSkills();

  if (craftResult.items.length > 0) {
    const output = {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      skills: craftResult.items,
      summary: {
        total: craftResult.items.length,
        byCategory: craftResult.byCategory,
        byType: craftResult.byType,
      },
    };

    const outputPath = path.join(ABILITIES_DIR, "craftskills.json");
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`  ✅ craftskills.json: ${craftResult.items.length}개 스킬\n`);
    totalSummary.craftSkills = craftResult.items.length;
  }

  // 4. 전투 스킬 처리
  console.log("📁 combatskill/ 처리 중...");
  const combatResult = processCombatSkills();

  if (combatResult.items.length > 0) {
    const output = {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      skills: combatResult.items,
      summary: {
        total: combatResult.items.length,
        byCategory: combatResult.byCategory,
        byType: combatResult.byType,
      },
    };

    const outputPath = path.join(ABILITIES_DIR, "combatskills.json");
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`  ✅ combatskills.json: ${combatResult.items.length}개 스킬\n`);
    totalSummary.combatSkills = combatResult.items.length;
  }

  console.log("═".repeat(50));
  console.log(`✅ 생성 완료!`);
  console.log(`   마법 주문: ${totalSummary.spells}개`);
  console.log(`   생활 스킬: ${totalSummary.lifeSkills}개`);
  console.log(`   제작 스킬: ${totalSummary.craftSkills}개`);
  console.log(`   전투 스킬: ${totalSummary.combatSkills}개`);
  console.log(`   총계: ${Object.values(totalSummary).reduce((a, b) => a + b, 0)}개`);
}

main().catch(console.error);
