/**
 * 외형 JSON 파일들을 읽어서 카테고리별 통합 JSON 생성
 *
 * 폴더 구조:
 *   public/data/appearance/
 *   ├── eyes/
 *   │   ├── human.json
 *   │   ├── elf.json
 *   │   └── ...
 *   └── facehair/
 *       ├── human.json
 *       ├── dwarf.json
 *       └── ...
 *
 * 출력:
 *   public/data/appearance/eyes.json
 *   public/data/appearance/facehair.json
 *
 * 사용법: npx tsx scripts/generate-appearance.ts
 */

import fs from "fs";
import path from "path";

// 경로 설정
const APPEARANCE_DIR = "public/data/appearance";

// 외형 카테고리
const CATEGORIES = ["eyes", "facehair"];

interface RaceAppearance {
  race: string;
  variants: Record<string, unknown>;
}

// 메인 함수
async function main(): Promise<void> {
  console.log("🔧 외형 데이터 생성 시작...\n");

  const totalSummary = {
    total: 0,
    byCategory: {} as Record<string, number>,
  };

  // 각 카테고리별로 처리
  for (const category of CATEGORIES) {
    const fullDir = path.join(APPEARANCE_DIR, category);
    if (!fs.existsSync(fullDir)) {
      console.log(`  ⚠️ ${category}/ 폴더 없음`);
      continue;
    }

    console.log(`📁 ${category}/ 처리 중...`);

    const allData: RaceAppearance[] = [];
    const files = fs.readdirSync(fullDir).filter(
      (f) => f.endsWith(".json") && f !== "metadata.json"
    );

    for (const file of files) {
      const filePath = path.join(fullDir, file);
      try {
        const content = fs.readFileSync(filePath, "utf8");
        const data: RaceAppearance = JSON.parse(content);
        allData.push(data);
        console.log(`    ${file}: ${data.race}`);
      } catch (err) {
        console.error(`    ❌ ${file} 로드 실패:`, err);
      }
    }

    if (allData.length === 0) {
      console.log(`    (파일 없음)\n`);
      continue;
    }

    // 카테고리별 JSON 파일 생성
    const output = {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      category,
      races: allData,
      summary: {
        total: allData.length,
        races: allData.map((d) => d.race),
      },
    };

    const outputPath = path.join(APPEARANCE_DIR, `${category}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`  ✅ ${category}.json: ${allData.length}개 종족\n`);

    // 전체 통계 업데이트
    totalSummary.total += allData.length;
    totalSummary.byCategory[category] = allData.length;
  }

  console.log("═".repeat(50));
  console.log(`✅ 생성 완료!`);
  console.log(`   총 ${totalSummary.total}개 종족 외형 데이터`);
  console.log(`   카테고리별:`, totalSummary.byCategory);
}

main().catch(console.error);
