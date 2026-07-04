/**
 * 장비 스프라이트 전체 캡처 스크립트.
 *
 * /test/capture 페이지의 window.__unityCapture 브릿지로 Unity를 조작해
 * 모든 장비 스프라이트를 capture/{category}/{index}_{sprite}.png로 저장한다.
 *
 * 사전 조건: npm run dev (localhost:3000)
 * 실행: npx tsx scripts/capture-equipment-sprites.ts [category...]
 */
import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = process.env.CAPTURE_URL || "http://localhost:3000";
const OUT_DIR = path.join(__dirname, "../capture");

// category → 스프라이트 매핑 JSON 경로
const SPRITE_FILES: Record<string, string> = {
  sword: "weapons/sword.json",
  axe: "weapons/axe.json",
  bow: "weapons/bow.json",
  spear: "weapons/spear.json",
  wand: "weapons/wand.json",
  dagger: "weapons/dagger.json",
  shield: "weapons/shield.json",
  helmet: "wearables/helmet.json",
  armor: "wearables/armor.json",
  cloth: "wearables/cloth.json",
  pant: "wearables/pant.json",
  back: "wearables/back.json",
};

function loadSprites(category: string): string[] {
  const file = path.join(
    __dirname,
    "../public/data/sprites/equipment",
    SPRITE_FILES[category]
  );
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  return data.sprites || [];
}

async function main() {
  const only = process.argv.slice(2);
  const categories = only.length
    ? only.filter((c) => SPRITE_FILES[c])
    : Object.keys(SPRITE_FILES);

  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=angle", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({
    viewport: { width: 1700, height: 900 },
    deviceScaleFactor: 1,
  });

  // Unity 로드 완료 대기 (unitySpritesLoaded 이벤트 + 브릿지 ready)
  await page.addInitScript(() => {
    (window as unknown as { __spritesLoaded: boolean }).__spritesLoaded = false;
    window.addEventListener("unitySpritesLoaded", () => {
      (window as unknown as { __spritesLoaded: boolean }).__spritesLoaded = true;
    });
  });

  console.log(`Navigating to ${BASE_URL}/test/capture ...`);
  await page.goto(`${BASE_URL}/test/capture`, { waitUntil: "networkidle" });

  console.log("Waiting for Unity to load (max 120s)...");
  await page.waitForFunction(
    () =>
      (window as unknown as { __spritesLoaded: boolean }).__spritesLoaded &&
      window.__unityCapture?.ready(),
    { timeout: 120_000 }
  );
  // Unity 초기 렌더 안정화
  await page.waitForTimeout(2000);

  const canvas = page.locator("canvas").first();

  let total = 0;
  const startedAt = Date.now();

  for (const category of categories) {
    const sprites = loadSprites(category);
    const dir = path.join(OUT_DIR, category);
    fs.mkdirSync(dir, { recursive: true });

    // 카테고리 시작 전 초기화 (이전 카테고리 장비 제거)
    await page.evaluate(() => window.__unityCapture!.reset());
    await page.waitForTimeout(300);

    console.log(`\n[${category}] ${sprites.length} sprites`);

    for (let i = 0; i < sprites.length; i++) {
      const spriteName = sprites[i].replace(/[^\w.-]/g, "_");
      const file = path.join(
        dir,
        `${String(i).padStart(3, "0")}_${spriteName}.png`
      );

      await page.evaluate(
        ([c, idx]) => window.__unityCapture!.set(c as string, idx as number),
        [category, i]
      );
      // Unity가 다음 Update에서 적용 + 한 프레임 렌더 보장
      await page.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r))
          )
      );
      await page.waitForTimeout(200);

      await canvas.screenshot({ path: file });
      total++;
      process.stdout.write(`  ${i + 1}/${sprites.length}\r`);
    }

    // 카테고리 종료 후 해당 슬롯 해제
    await page.evaluate(
      (c) => window.__unityCapture!.set(c as string, -1),
      category
    );
  }

  const sec = Math.round((Date.now() - startedAt) / 1000);
  console.log(`\nDone. ${total} screenshots in ${sec}s → ${OUT_DIR}`);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
