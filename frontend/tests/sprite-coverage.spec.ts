/**
 * 장비 스프라이트 커버리지 검증.
 *
 * 1. 모든 장비 아이템의 spriteId가 /test/game과 동일한 변환 로직으로
 *    유효한 Unity 인덱스로 해석되는지 (index !== -1)
 * 2. 카테고리별로 모든 스프라이트 인덱스(0..N-1)가 ≥1개 아이템으로 커버되는지
 * 3. 통합 equipment.json에 방어구(wearables)가 포함되는지 (generate-items 회귀 방지)
 *
 * 실행: npx playwright test tests/sprite-coverage.spec.ts
 */
import { test, expect } from "@playwright/test";

const CATEGORIES: Record<string, { spritePath: string; itemPath: string }> = {
  sword: { spritePath: "/data/sprites/equipment/weapons/sword.json", itemPath: "/data/items/equipment/weapons/swords.json" },
  axe: { spritePath: "/data/sprites/equipment/weapons/axe.json", itemPath: "/data/items/equipment/weapons/axes.json" },
  bow: { spritePath: "/data/sprites/equipment/weapons/bow.json", itemPath: "/data/items/equipment/weapons/bows.json" },
  spear: { spritePath: "/data/sprites/equipment/weapons/spear.json", itemPath: "/data/items/equipment/weapons/spears.json" },
  wand: { spritePath: "/data/sprites/equipment/weapons/wand.json", itemPath: "/data/items/equipment/weapons/wands.json" },
  dagger: { spritePath: "/data/sprites/equipment/weapons/dagger.json", itemPath: "/data/items/equipment/weapons/daggers.json" },
  shield: { spritePath: "/data/sprites/equipment/weapons/shield.json", itemPath: "/data/items/equipment/weapons/shields.json" },
  helmet: { spritePath: "/data/sprites/equipment/wearables/helmet.json", itemPath: "/data/items/equipment/wearables/helmets.json" },
  armor: { spritePath: "/data/sprites/equipment/wearables/armor.json", itemPath: "/data/items/equipment/wearables/armors.json" },
  cloth: { spritePath: "/data/sprites/equipment/wearables/cloth.json", itemPath: "/data/items/equipment/wearables/clothes.json" },
  pant: { spritePath: "/data/sprites/equipment/wearables/pant.json", itemPath: "/data/items/equipment/wearables/pants.json" },
  back: { spritePath: "/data/sprites/equipment/wearables/back.json", itemPath: "/data/items/equipment/wearables/backs.json" },
};

interface SpriteMapping {
  sprites: string[];
  nameToIndex: Record<string, number>;
  spriteMap?: Record<string, string>;
}

// app/test/game/page.tsx의 getSpriteInfo와 동일한 변환
function resolveIndex(mapping: SpriteMapping, spriteId: string): number {
  const lowerId = spriteId.toLowerCase();
  if (mapping.spriteMap?.[lowerId]) {
    return mapping.nameToIndex?.[mapping.spriteMap[lowerId]] ?? -1;
  }
  const key = Object.keys(mapping.nameToIndex || {}).find(
    (k) => k.toLowerCase() === lowerId
  );
  return key ? mapping.nameToIndex[key] : -1;
}

for (const [category, cfg] of Object.entries(CATEGORIES)) {
  test(`${category}: 모든 아이템 spriteId 해석 + 전체 스프라이트 커버`, async ({ request }) => {
    const mapping: SpriteMapping = await (await request.get(cfg.spritePath)).json();
    const { items } = await (await request.get(cfg.itemPath)).json();

    expect(mapping.sprites.length).toBeGreaterThan(0);
    expect(items.length).toBeGreaterThan(0);

    const coveredIndices = new Set<number>();
    const unresolved: string[] = [];

    for (const item of items) {
      const index = resolveIndex(mapping, item.spriteId);
      if (index === -1) unresolved.push(`${item.id} (spriteId: ${item.spriteId})`);
      else coveredIndices.add(index);
    }

    expect(unresolved, `해석 실패 아이템: ${unresolved.join(", ")}`).toHaveLength(0);

    const missing = mapping.sprites
      .map((sprite, i) => ({ sprite, i }))
      .filter(({ i }) => !coveredIndices.has(i))
      .map(({ sprite, i }) => `${i}:${sprite}`);

    expect(missing, `아이템 없는 스프라이트: ${missing.join(", ")}`).toHaveLength(0);
  });
}

test("equipment.json에 방어구(wearables) 포함", async ({ request }) => {
  const data = await (await request.get("/data/items/equipment.json")).json();
  const items = data.items ?? data;
  const helmets = items.filter((i: { spriteId?: string }) =>
    i.spriteId?.includes("helmet")
  );
  expect(helmets.length).toBeGreaterThan(0);
});

test("모든 장비 이름 중복 없음 (카테고리 내)", async ({ request }) => {
  for (const [category, cfg] of Object.entries(CATEGORIES)) {
    const { items } = await (await request.get(cfg.itemPath)).json();
    const names = items.map((i: { nameKo: string }) => i.nameKo);
    const dups = names.filter(
      (n: string, i: number) => names.indexOf(n) !== i
    );
    expect(dups, `${category} 중복 이름: ${dups.join(", ")}`).toHaveLength(0);
  }
});
