/**
 * scripts/naming/{category}.json의 이름 결정을 아이템 소스 JSON에 병합한다.
 *
 * - action "create": 해당 스프라이트용 새 아이템 생성 (id = nameEn 슬러그, 전역 충돌 검사)
 * - action "review": 스프라이트를 공유하는 기존 아이템 중 이름이 그림과 일치하는 것은 유지,
 *   나머지는 결정된 기본 이름 + 등급 수식어로 교정 (id는 절대 변경하지 않음)
 * - 멱등: 재실행 시 spriteId 기준으로 이미 반영된 항목은 건너뜀
 *
 * 실행: npx tsx scripts/apply-sprite-naming.ts
 * 이후: npx tsx scripts/generate-items.ts && npm run upload-data
 */
import * as fs from "fs";
import * as path from "path";

const ROOT = path.join(__dirname, "..");
const SPRITES_DIR = path.join(ROOT, "public/data/sprites/equipment");
const ITEMS_DIR = path.join(ROOT, "public/data/items/equipment");
const NAMING_DIR = path.join(__dirname, "naming");

const RARITY_TIER: Record<string, number> = {
  crude: 0, common: 1, grand: 2, rare: 3, arcane: 4, heroic: 5, unique: 6,
  celestial: 7, divine: 8, epic: 9, legendary: 10, mythic: 11, eternal: 12,
};
const VALUE_MULT = [0.5, 1, 2, 4, 8, 15, 30, 60, 120, 250, 500, 1000, 2500];
const LEVEL_REQ = [1, 1, 3, 5, 8, 12, 16, 20, 25, 30, 35, 40, 50];
// 스탯 배율 (등급이 오를수록 강해짐)
const statMult = (tier: number) => 1 + tier * 0.35;

interface CategoryConfig {
  spriteFile: string;
  itemFile: string;
  baseValue: number;
  weight: number;
  stats: Record<string, number>;
  requirements: Record<string, number>;
  descNoun: string;
}

const CATEGORIES: Record<string, CategoryConfig> = {
  sword: { spriteFile: "weapons/sword.json", itemFile: "weapons/swords.json", baseValue: 100, weight: 3, stats: { damage: 8, attackSpeed: 1 }, requirements: { str: 5 }, descNoun: "검" },
  axe: { spriteFile: "weapons/axe.json", itemFile: "weapons/axes.json", baseValue: 100, weight: 4, stats: { damage: 10, attackSpeed: 0.85 }, requirements: { str: 6 }, descNoun: "도끼" },
  bow: { spriteFile: "weapons/bow.json", itemFile: "weapons/bows.json", baseValue: 100, weight: 2, stats: { damage: 7, attackSpeed: 1, range: 3 }, requirements: { dex: 5 }, descNoun: "활" },
  spear: { spriteFile: "weapons/spear.json", itemFile: "weapons/spears.json", baseValue: 100, weight: 2.5, stats: { damage: 7, attackSpeed: 0.95, range: 2 }, requirements: { str: 5 }, descNoun: "창" },
  wand: { spriteFile: "weapons/wand.json", itemFile: "weapons/wands.json", baseValue: 100, weight: 1, stats: { magicDamage: 8, attackSpeed: 1, mp: 10 }, requirements: { int: 5 }, descNoun: "지팡이" },
  dagger: { spriteFile: "weapons/dagger.json", itemFile: "weapons/daggers.json", baseValue: 80, weight: 1, stats: { damage: 5, attackSpeed: 1.3 }, requirements: { dex: 5 }, descNoun: "단검" },
  shield: { spriteFile: "weapons/shield.json", itemFile: "weapons/shields.json", baseValue: 120, weight: 4, stats: { defense: 8, blockChance: 12 }, requirements: { str: 5, con: 5 }, descNoun: "방패" },
  helmet: { spriteFile: "wearables/helmet.json", itemFile: "wearables/helmets.json", baseValue: 80, weight: 2, stats: { defense: 4 }, requirements: {}, descNoun: "머리 장비" },
  armor: { spriteFile: "wearables/armor.json", itemFile: "wearables/armors.json", baseValue: 120, weight: 5, stats: { defense: 8 }, requirements: {}, descNoun: "갑옷" },
  cloth: { spriteFile: "wearables/cloth.json", itemFile: "wearables/clothes.json", baseValue: 40, weight: 1, stats: { defense: 2 }, requirements: {}, descNoun: "옷" },
  pant: { spriteFile: "wearables/pant.json", itemFile: "wearables/pants.json", baseValue: 60, weight: 1.5, stats: { defense: 3 }, requirements: {}, descNoun: "하의" },
  back: { spriteFile: "wearables/back.json", itemFile: "wearables/backs.json", baseValue: 60, weight: 0.5, stats: { defense: 2, moveSpeed: 2 }, requirements: {}, descNoun: "등 장비" },
};

// 스프라이트 공유 아이템용 등급 수식어 (기본 이름과 구분)
const KO_QUALIFIERS = ["낡은", "강화된", "정예", "대가의", "고대", "전설의", "태초의"];
const EN_QUALIFIERS = ["Worn", "Reinforced", "Elite", "Master's", "Ancient", "Legendary", "Primordial"];
const qualifierIndexForTier = (tier: number) =>
  tier <= 0 ? 0 : tier <= 2 ? 1 : tier <= 4 ? 2 : tier <= 6 ? 3 : tier <= 9 ? 4 : tier <= 11 ? 5 : 6;

interface SpriteMapping {
  sprites: string[];
  nameToIndex: Record<string, number>;
  spriteMap?: Record<string, string>;
}

interface Item {
  id: string;
  nameKo: string;
  nameEn: string;
  description?: string;
  rarity: string;
  value?: number;
  weight?: number;
  color?: string | null;
  stats?: Record<string, number>;
  requirements?: Record<string, number>;
  spriteId: string;
}

interface NamingRow {
  index: number;
  sprite: string;
  spriteId: string;
  existingItems: { id: string; nameKo: string; nameEn: string }[];
  action: "create" | "review";
  nameKo: string;
  nameEn: string;
  rarity: string;
}

function resolveSpriteName(mapping: SpriteMapping, spriteId: string): string | null {
  const lowerId = spriteId.toLowerCase();
  if (mapping.spriteMap?.[lowerId]) return mapping.spriteMap[lowerId];
  const key = Object.keys(mapping.nameToIndex || {}).find((k) => k.toLowerCase() === lowerId);
  return key ?? null;
}

function slugify(nameEn: string): string {
  return nameEn
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ===== 전역 아이템 id 수집 (충돌 방지) =====
const globalIds = new Set<string>();
function collectIds(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) collectIds(p);
    else if (entry.name.endsWith(".json")) {
      try {
        const data = JSON.parse(fs.readFileSync(p, "utf-8"));
        for (const item of data.items || []) if (item.id) globalIds.add(item.id);
      } catch { /* metadata 등 무시 */ }
    }
  }
}
collectIds(path.join(ROOT, "public/data/items"));

function uniqueId(base: string): string {
  let id = base;
  let n = 2;
  while (globalIds.has(id)) id = `${base}_${n++}`;
  globalIds.add(id);
  return id;
}

// ===== 카테고리별 병합 =====
let created = 0;
let renamed = 0;

for (const [category, cfg] of Object.entries(CATEGORIES)) {
  const namingPath = path.join(NAMING_DIR, `${category}.json`);
  if (!fs.existsSync(namingPath)) continue;
  const rows: NamingRow[] = JSON.parse(fs.readFileSync(namingPath, "utf-8")).sprites;

  const mapping: SpriteMapping = JSON.parse(
    fs.readFileSync(path.join(SPRITES_DIR, cfg.spriteFile), "utf-8")
  );
  const itemFilePath = path.join(ITEMS_DIR, cfg.itemFile);
  const itemFile = JSON.parse(fs.readFileSync(itemFilePath, "utf-8"));
  const items: Item[] = itemFile.items;

  // 스프라이트명 → 아이템 그룹
  const bySprite = new Map<string, Item[]>();
  for (const item of items) {
    const name = resolveSpriteName(mapping, item.spriteId);
    if (!name) continue;
    if (!bySprite.has(name)) bySprite.set(name, []);
    bySprite.get(name)!.push(item);
  }

  const usedNames = new Set(items.map((i) => i.nameKo));

  for (const row of rows) {
    if (!row.nameKo || !row.nameEn || !row.rarity) {
      throw new Error(`${category}[${row.index}] ${row.sprite}: naming 미완성`);
    }
    const tier = RARITY_TIER[row.rarity] ?? 1;

    if (row.action === "create") {
      // 멱등성: 이미 이 spriteId를 쓰는 아이템이 생겼으면 건너뜀
      if (bySprite.has(row.sprite)) continue;
      const id = uniqueId(slugify(row.nameEn));
      const stats: Record<string, number> = {};
      for (const [k, v] of Object.entries(cfg.stats)) {
        stats[k] = k === "attackSpeed" || k === "range" ? v : Math.max(1, Math.round(v * statMult(tier)));
      }
      const requirements: Record<string, number> = { level: LEVEL_REQ[tier] };
      for (const [k, v] of Object.entries(cfg.requirements)) {
        requirements[k] = v + tier * 2;
      }
      const newItem: Item = {
        id,
        nameKo: row.nameKo,
        nameEn: row.nameEn,
        description: `${row.nameKo}. ${cfg.descNoun} 장비.`,
        rarity: row.rarity,
        value: Math.max(1, Math.round(cfg.baseValue * VALUE_MULT[tier])),
        weight: round1(cfg.weight),
        color: null,
        stats,
        requirements,
        spriteId: row.spriteId,
      };
      items.push(newItem);
      bySprite.set(row.sprite, [newItem]);
      usedNames.add(row.nameKo);
      created++;
    } else {
      // review: 그룹 내 이름 정리
      const group = bySprite.get(row.sprite) || [];
      if (group.length === 0) continue;

      let baseOwner = group.find((i) => i.nameKo === row.nameKo);
      if (!baseOwner) {
        // 결정된 기본 이름을 그룹 대표(등급 가장 낮은 아이템)에 부여
        baseOwner = [...group].sort(
          (a, b) => (RARITY_TIER[a.rarity] ?? 1) - (RARITY_TIER[b.rarity] ?? 1)
        )[0];
        if (baseOwner.nameKo !== row.nameKo) {
          usedNames.delete(baseOwner.nameKo);
          baseOwner.nameKo = row.nameKo;
          baseOwner.nameEn = row.nameEn;
          usedNames.add(row.nameKo);
          renamed++;
        }
      }
      // 나머지 공유 아이템: 등급 수식어로 그림과 어울리게 교정
      for (const item of group) {
        if (item === baseOwner) continue;
        const itemTier = RARITY_TIER[item.rarity] ?? 1;
        let qi = qualifierIndexForTier(itemTier);
        let ko = `${KO_QUALIFIERS[qi]} ${row.nameKo}`;
        // 수식어 충돌 시 다음 수식어 사용
        while (usedNames.has(ko) && qi < KO_QUALIFIERS.length - 1) {
          qi++;
          ko = `${KO_QUALIFIERS[qi]} ${row.nameKo}`;
        }
        if (item.nameKo !== ko) {
          usedNames.delete(item.nameKo);
          item.nameKo = ko;
          item.nameEn = `${EN_QUALIFIERS[qi]} ${row.nameEn}`;
          usedNames.add(ko);
          renamed++;
        }
      }
    }
  }

  fs.writeFileSync(itemFilePath, JSON.stringify(itemFile, null, 2) + "\n");
  console.log(`${category}: items=${items.length}`);
}

console.log(`\ncreated=${created}, renamed=${renamed}`);
