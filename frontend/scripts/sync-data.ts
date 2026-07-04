/**
 * public/data/*.json 파일들을 Supabase Storage에 동기화
 *
 * 사용법:
 *   npm run sync-data          # 모든 JSON 업로드
 *   npm run sync-data -- --dry # 드라이런 (업로드 안함)
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// ============ 환경변수 로드 ============

function loadEnv() {
  const envPath = path.join(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=");
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

// ============ 설정 ============

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://krwmncolecywlkmlviqu.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const BUCKET_NAME = "game-data";
const STORAGE_PATH = "mappings";
const DATA_DIR = path.join(__dirname, "../public/data");

// ============ 유틸리티 ============

function getFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("md5").update(content).digest("hex");
}

function getJsonFiles(dir: string): string[] {
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
}

// ============ 메인 ============

async function main() {
  const isDryRun = process.argv.includes("--dry");

  if (!SUPABASE_KEY) {
    console.error("❌ Error: SUPABASE_SERVICE_KEY 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY 필요");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log("🔄 Supabase Storage 동기화 시작...\n");
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Bucket: ${BUCKET_NAME}`);
  console.log(`   Path: ${STORAGE_PATH}/`);
  if (isDryRun) console.log("   Mode: DRY RUN (업로드 안함)\n");
  else console.log("");

  // 버킷 확인
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.log(`⚠️  버킷 목록 조회 실패: ${listError.message}`);
    console.log("   Service Role Key가 필요할 수 있습니다.\n");
  }

  const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

  if (!bucketExists) {
    console.log(`\n❌ 버킷 '${BUCKET_NAME}'이 존재하지 않습니다.`);
    console.log("\n📋 Supabase 대시보드에서 버킷을 먼저 생성하세요:");
    console.log("   1. https://supabase.com/dashboard 접속");
    console.log("   2. Storage → New bucket → 'game-data' 생성");
    console.log("   3. Public bucket으로 설정");
    console.log("   4. 다시 npm run sync-data 실행\n");

    if (!isDryRun) {
      process.exit(1);
    }
  }

  // 기존 파일 목록 가져오기
  const { data: existingFiles } = await supabase.storage
    .from(BUCKET_NAME)
    .list(STORAGE_PATH);

  const existingMap = new Map(
    existingFiles?.map((f) => [f.name, f.metadata?.md5Hash]) || []
  );

  // JSON 파일 처리
  const files = getJsonFiles(DATA_DIR);
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`📁 ${files.length}개 파일 발견\n`);

  for (const file of files) {
    const localPath = path.join(DATA_DIR, file);
    const storagePath = `${STORAGE_PATH}/${file}`;
    const localHash = getFileHash(localPath);

    // 변경 확인
    const remoteHash = existingMap.get(file);
    if (remoteHash === localHash) {
      console.log(`⏭️  ${file} (변경 없음)`);
      skipped++;
      continue;
    }

    if (isDryRun) {
      console.log(`📤 ${file} (업로드 예정)`);
      uploaded++;
      continue;
    }

    // 업로드
    const content = fs.readFileSync(localPath);
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, content, {
        contentType: "application/json",
        upsert: true,
        cacheControl: "3600",
      });

    if (error) {
      console.error(`❌ ${file}: ${error.message}`);
      failed++;
    } else {
      console.log(`✅ ${file} 업로드됨`);
      uploaded++;
    }
  }

  // 결과 요약
  console.log("\n" + "=".repeat(40));
  console.log(`📊 결과: 업로드 ${uploaded}, 스킵 ${skipped}, 실패 ${failed}`);

  // Public URL 출력
  if (!isDryRun && uploaded > 0) {
    console.log("\n🔗 Public URLs:");
    for (const file of files) {
      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`${STORAGE_PATH}/${file}`);
      console.log(`   ${file}:`);
      console.log(`   ${data.publicUrl}`);
    }
  }

  // manifest.json 생성 (버전 관리용)
  if (!isDryRun) {
    const manifest = {
      version: new Date().toISOString(),
      files: files.map((f) => ({
        name: f,
        hash: getFileHash(path.join(DATA_DIR, f)),
      })),
    };

    const manifestContent = JSON.stringify(manifest, null, 2);
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`${STORAGE_PATH}/manifest.json`, manifestContent, {
        contentType: "application/json",
        upsert: true,
      });

    if (!error) {
      console.log("\n📋 manifest.json 업데이트됨");
    }
  }
}

main().catch((err) => {
  console.error("💥 에러:", err);
  process.exit(1);
});
