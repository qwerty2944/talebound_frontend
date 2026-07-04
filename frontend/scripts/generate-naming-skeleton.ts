/**
 * 스프라이트 → 아이템 네이밍 작업 파일(scripts/naming/{category}.json) 생성.
 *
 * 각 스프라이트에 대해 기존 아이템 커버 여부를 조사해
 * action: "create"(아이템 없음) 또는 "review"(기존 아이템 있음)를 표시한다.
 * 이름 결정 후 apply-sprite-naming.ts로 아이템 JSON에 병합한다.
 *
 * 실행: npx tsx scripts/generate-naming-skeleton.ts
 */
import * as fs from "fs";
import * as path from "path";

const ROOT = path.join(__dirname, "..");
const SPRITES_DIR = path.join(ROOT, "public/data/sprites/equipment");
const ITEMS_DIR = path.join(ROOT, "public/data/items/equipment");
const OUT_DIR = path.join(__dirname, "naming");

const CATEGORIES: Record<string, { spriteFile: string; itemFile: string }> = {
  sword: { spriteFile: "weapons/sword.json", itemFile: "weapons/swords.json" },
  axe: { spriteFile: "weapons/axe.json", itemFile: "weapons/axes.json" },
  bow: { spriteFile: "weapons/bow.json", itemFile: "weapons/bows.json" },
  spear: { spriteFile: "weapons/spear.json", itemFile: "weapons/spears.json" },
  wand: { spriteFile: "weapons/wand.json", itemFile: "weapons/wands.json" },
  dagger: { spriteFile: "weapons/dagger.json", itemFile: "weapons/daggers.json" },
  shield: { spriteFile: "weapons/shield.json", itemFile: "weapons/shields.json" },
  helmet: { spriteFile: "wearables/helmet.json", itemFile: "wearables/helmets.json" },
  armor: { spriteFile: "wearables/armor.json", itemFile: "wearables/armors.json" },
  cloth: { spriteFile: "wearables/cloth.json", itemFile: "wearables/clothes.json" },
  pant: { spriteFile: "wearables/pant.json", itemFile: "wearables/pants.json" },
  back: { spriteFile: "wearables/back.json", itemFile: "wearables/backs.json" },
};

interface SpriteMapping {
  sprites: string[];
  nameToIndex: Record<string, number>;
  spriteMap?: Record<string, string>;
}

interface Item {
  id: string;
  nameKo: string;
  nameEn: string;
  spriteId: string;
}

// /test/game의 getSpriteInfo와 동일한 변환 로직
function resolveSpriteName(mapping: SpriteMapping, spriteId: string): string | null {
  const lowerId = spriteId.toLowerCase();
  if (mapping.spriteMap?.[lowerId]) return mapping.spriteMap[lowerId];
  const key = Object.keys(mapping.nameToIndex || {}).find(
    (k) => k.toLowerCase() === lowerId
  );
  return key ?? null;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const [category, cfg] of Object.entries(CATEGORIES)) {
  const mapping: SpriteMapping = JSON.parse(
    fs.readFileSync(path.join(SPRITES_DIR, cfg.spriteFile), "utf-8")
  );
  const items: Item[] = JSON.parse(
    fs.readFileSync(path.join(ITEMS_DIR, cfg.itemFile), "utf-8")
  ).items;

  // 스프라이트명 → 해당 스프라이트를 쓰는 아이템 목록
  const bySprite = new Map<string, Item[]>();
  for (const item of items) {
    const name = resolveSpriteName(mapping, item.spriteId);
    if (!name) continue;
    if (!bySprite.has(name)) bySprite.set(name, []);
    bySprite.get(name)!.push(item);
  }

  // 스프라이트의 소문자 id (spriteMap 역방향, 없으면 스프라이트명 lowercase)
  const spriteToId = new Map<string, string>();
  for (const [id, name] of Object.entries(mapping.spriteMap || {})) {
    if (!spriteToId.has(name)) spriteToId.set(name, id);
  }

  const rows = mapping.sprites.map((sprite, index) => {
    const existing = bySprite.get(sprite) || [];
    return {
      index,
      sprite,
      spriteId: spriteToId.get(sprite) ?? sprite.toLowerCase(),
      existingItems: existing.map((i) => ({
        id: i.id,
        nameKo: i.nameKo,
        nameEn: i.nameEn,
      })),
      action: existing.length ? "review" : "create",
      nameKo: "",
      nameEn: "",
      rarity: "",
    };
  });

  const out = path.join(OUT_DIR, `${category}.json`);
  fs.writeFileSync(out, JSON.stringify({ category, sprites: rows }, null, 2));
  const create = rows.filter((r) => r.action === "create").length;
  console.log(
    `${category}: ${rows.length} sprites (create ${create}, review ${rows.length - create}) → ${out}`
  );
}
