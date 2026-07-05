/**
 * 아이템 JSON 파일들을 읽어서 카테고리별 통합 JSON 생성
 *
 * 폴더 구조:
 *   public/data/items/
 *   ├── equipment/
 *   │   ├── weapons/*.json    → equipment.json
 *   │   ├── armors/*.json
 *   │   └── accessories/*.json
 *   ├── consumables/*.json    → consumables.json
 *   ├── materials/*.json      → materials.json
 *   └── misc/*.json           → misc.json
 *
 * 출력:
 *   - equipment.json (장비)
 *   - consumables.json (소비)
 *   - materials.json (재료)
 *   - misc.json (기타)
 *   - items.json (전체 통합 - API에서 사용)
 *
 * 사용법: npx tsx scripts/generate-items.ts
 */

import fs from "fs";
import path from "path";

// 경로 설정
const ITEMS_DIR = "public/data/items";

// 카테고리별 설정
const CATEGORIES = {
  equipment: {
    subdirs: ["equipment/weapons", "equipment/wearables", "equipment/accessories"],
    output: "equipment.json",
    type: "equipment",
  },
  consumable: {
    subdirs: ["consumables"],
    output: "consumables.json",
    type: "consumable",
  },
  material: {
    subdirs: ["materials"],
    output: "materials.json",
    type: "material",
  },
  misc: {
    subdirs: ["misc"],
    output: "misc.json",
    type: "misc",
  },
};

interface BaseItem {
  id: string;
  nameKo: string;
  nameEn: string;
  description: string;
  rarity: string;
  value: number;
  weight: number;
}

interface EquipmentSourceItem extends BaseItem {
  spriteId: string;
  color?: string | null;
  stats?: Record<string, unknown>;
  requirements?: Record<string, unknown>;
}

interface EquipmentSource {
  category: string;
  subcategory: string;
  slot?: string;
  weaponType?: string;
  spriteMapping?: string;
  items: EquipmentSourceItem[];
}

interface ConsumableSourceItem extends BaseItem {
  icon?: string;
  stackSize?: number;
  effect?: Record<string, unknown>;
}

interface ConsumableSource {
  category: string;
  subcategory: string;
  items: ConsumableSourceItem[];
}

interface MaterialSourceItem extends BaseItem {
  icon?: string;
  stackSize?: number;
  dropFrom?: string[];
  craftingUse?: string[];
}

interface MaterialSource {
  category: string;
  subcategory: string;
  items: MaterialSourceItem[];
}

interface OutputItem {
  id: string;
  nameKo: string;
  nameEn: string;
  description: { ko: string; en: string };
  type: string;
  subtype?: string;
  rarity: string;
  value: number;
  weight: number;
  stackable: boolean;
  stackSize?: number;
  icon?: string;
  slot?: string;
  weaponType?: string;
  spriteId?: string;
  spriteMapping?: string;
  color?: string | null;
  stats?: Record<string, unknown>;
  requirements?: Record<string, unknown>;
  effect?: Record<string, unknown>;
  dropFrom?: string[];
  craftingUse?: string[];
}

// 설명 정규화 (문자열 → 객체)
function normalizeDescription(desc: string | { ko: string; en: string }): { ko: string; en: string } {
  if (typeof desc === "string") {
    return { ko: desc, en: desc };
  }
  return desc;
}

// 장비 아이템 변환
function convertEquipmentItem(
  item: EquipmentSourceItem,
  source: EquipmentSource
): OutputItem {
  return {
    id: item.id,
    nameKo: item.nameKo,
    nameEn: item.nameEn,
    description: normalizeDescription(item.description),
    type: "equipment",
    subtype: source.subcategory,
    rarity: item.rarity,
    value: item.value,
    weight: item.weight,
    stackable: false,
    slot: source.slot,
    weaponType: source.weaponType,
    spriteId: item.spriteId,
    spriteMapping: source.spriteMapping,
    color: item.color,
    stats: item.stats,
    requirements: item.requirements,
  };
}

// 소비 아이템 변환
function convertConsumableItem(
  item: ConsumableSourceItem,
  source: ConsumableSource
): OutputItem {
  return {
    id: item.id,
    nameKo: item.nameKo,
    nameEn: item.nameEn,
    description: normalizeDescription(item.description),
    type: "consumable",
    subtype: source.subcategory,
    rarity: item.rarity,
    value: item.value,
    weight: item.weight,
    stackable: true,
    stackSize: item.stackSize || 20,
    icon: item.icon,
    effect: item.effect,
  };
}

// 재료 아이템 변환
function convertMaterialItem(
  item: MaterialSourceItem,
  source: MaterialSource
): OutputItem {
  return {
    id: item.id,
    nameKo: item.nameKo,
    nameEn: item.nameEn,
    description: normalizeDescription(item.description),
    type: "material",
    subtype: source.subcategory,
    rarity: item.rarity,
    value: item.value,
    weight: item.weight,
    stackable: true,
    stackSize: item.stackSize || 99,
    icon: item.icon,
    dropFrom: item.dropFrom,
    craftingUse: item.craftingUse,
  };
}

// 카테고리별 아이템 처리
function processCategory(
  categoryKey: string,
  config: (typeof CATEGORIES)[keyof typeof CATEGORIES]
): { items: OutputItem[]; bySubtype: Record<string, number>; byRarity: Record<string, number> } {
  const items: OutputItem[] = [];
  const bySubtype: Record<string, number> = {};
  const byRarity: Record<string, number> = {};

  for (const subdir of config.subdirs) {
    const fullDir = path.join(ITEMS_DIR, subdir);
    if (!fs.existsSync(fullDir)) continue;

    const files = fs.readdirSync(fullDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const filePath = path.join(fullDir, file);
      try {
        const content = fs.readFileSync(filePath, "utf8");
        const source = JSON.parse(content);
        if (!source.items) continue;

        console.log(`    ${subdir}/${file}: ${source.items.length}개`);

        for (const item of source.items) {
          let outputItem: OutputItem;

          if (config.type === "equipment") {
            outputItem = convertEquipmentItem(item, source as EquipmentSource);
          } else if (config.type === "consumable") {
            outputItem = convertConsumableItem(item, source as ConsumableSource);
          } else if (config.type === "material") {
            outputItem = convertMaterialItem(item, source as MaterialSource);
          } else {
            outputItem = {
              ...item,
              description: normalizeDescription(item.description),
              type: "misc",
              subtype: source.subcategory || "other",
              stackable: item.stackable ?? true,
              stackSize: item.stackSize || 10,
            };
          }

          items.push(outputItem);
          bySubtype[source.subcategory] = (bySubtype[source.subcategory] || 0) + 1;
          byRarity[item.rarity] = (byRarity[item.rarity] || 0) + 1;
        }
      } catch (err) {
        console.error(`    ❌ ${file} 로드 실패:`, err);
      }
    }
  }

  return { items, bySubtype, byRarity };
}

// 메인 함수
async function main(): Promise<void> {
  console.log("🔧 아이템 데이터 생성 시작...\n");

  const totalSummary = {
    total: 0,
    byType: {} as Record<string, number>,
    byRarity: {} as Record<string, number>,
  };

  // 전체 아이템 모음 (items.json용)
  const allItems: OutputItem[] = [];

  // 각 카테고리별로 처리
  for (const [categoryKey, config] of Object.entries(CATEGORIES)) {
    console.log(`📁 ${categoryKey} 처리 중...`);

    const { items, bySubtype, byRarity } = processCategory(categoryKey, config);

    if (items.length === 0) {
      console.log(`    (파일 없음)\n`);
      continue;
    }

    // 카테고리별 JSON 파일 생성
    const output = {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      type: config.type,
      items,
      summary: {
        total: items.length,
        bySubtype,
        byRarity,
      },
    };

    const outputPath = path.join(ITEMS_DIR, config.output);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`  ✅ ${config.output}: ${items.length}개 아이템\n`);

    // 전체 아이템 모음에 추가
    allItems.push(...items);

    // 전체 통계 업데이트
    totalSummary.total += items.length;
    totalSummary.byType[config.type] = items.length;
    for (const [rarity, count] of Object.entries(byRarity)) {
      totalSummary.byRarity[rarity] = (totalSummary.byRarity[rarity] || 0) + count;
    }
  }

  // 통합 items.json 생성 (API에서 사용)
  if (allItems.length > 0) {
    const unifiedOutput = {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      items: allItems,
      summary: {
        total: totalSummary.total,
        byType: totalSummary.byType,
        byRarity: totalSummary.byRarity,
      },
    };

    const unifiedPath = path.join(ITEMS_DIR, "items.json");
    fs.writeFileSync(unifiedPath, JSON.stringify(unifiedOutput, null, 2));
    console.log(`📦 items.json: ${allItems.length}개 아이템 (통합)\n`);
  }

  console.log("═".repeat(50));
  console.log(`✅ 생성 완료!`);
  console.log(`   총 ${totalSummary.total}개 아이템`);
  console.log(`   타입별:`, totalSummary.byType);
  console.log(`   등급별:`, totalSummary.byRarity);
}

main().catch(console.error);
