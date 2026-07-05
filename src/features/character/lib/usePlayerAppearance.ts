"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppearanceStore } from "@/application/stores";
import type { ProfileAppearance } from "@/entities/character";

/**
 * usePlayerAppearance
 *
 * 상태창(StatusModal)의 외형 로드 로직을 공용 훅으로 추출한 것.
 * DB의 ID 기반 ProfileAppearance를 스프라이트 인덱스로 변환한 뒤,
 * Unity가 로드되어 있으면 loadAppearance로 내 캐릭터 외형을 적용한다.
 *
 * 보스전 유니티 연출(BattleUnityStage)과 상태창에서 공용으로 사용한다.
 *
 * @param appearance DB에 저장된 ID 기반 외형 (profile.appearance)
 * @param enabled    로드 활성화 여부 (예: 보스전 스테이지가 열려 있을 때만 true)
 */

interface SpriteItem {
  id: string;
  index: number;
}

interface SpriteData {
  eyes?: SpriteItem[];
  hairs?: SpriteItem[];
  facehairs?: SpriteItem[];
  bodies?: SpriteItem[];
}

// 스프라이트 인덱스 데이터는 한 번만 로드해서 캐시
let cachedSpriteData: SpriteData | null = null;
let spriteDataPromise: Promise<SpriteData> | null = null;

async function loadSpriteIndexData(): Promise<SpriteData> {
  if (cachedSpriteData) return cachedSpriteData;
  if (spriteDataPromise) return spriteDataPromise;

  spriteDataPromise = (async () => {
    const [eyeRes, hairRes, facehairRes, bodyRes] = await Promise.all([
      fetch("/data/sprites/appearance/eye.json"),
      fetch("/data/sprites/appearance/hair.json"),
      fetch("/data/sprites/appearance/facehair.json"),
      fetch("/data/sprites/appearance/body.json"),
    ]);
    const [eyeData, hairData, facehairData, bodyData] = await Promise.all([
      eyeRes.json(),
      hairRes.json(),
      facehairRes.json(),
      bodyRes.json(),
    ]);
    cachedSpriteData = {
      eyes: eyeData.eyes || [],
      hairs: hairData.hairs || [],
      facehairs: facehairData.facehairs || [],
      bodies: bodyData.bodies || [],
    };
    return cachedSpriteData;
  })();

  return spriteDataPromise;
}

export function usePlayerAppearance(
  appearance: ProfileAppearance | null | undefined,
  enabled: boolean = true
) {
  const { isUnityLoaded, spriteCounts, loadAppearance } = useAppearanceStore();
  const [spriteData, setSpriteData] = useState<SpriteData>(cachedSpriteData ?? {});
  const [spriteDataLoaded, setSpriteDataLoaded] = useState(!!cachedSpriteData);

  // 스프라이트 인덱스 데이터 로드
  useEffect(() => {
    if (!enabled || spriteDataLoaded) return;
    let mounted = true;
    loadSpriteIndexData()
      .then((data) => {
        if (mounted) {
          setSpriteData(data);
          setSpriteDataLoaded(true);
        }
      })
      .catch((err) => console.error("Failed to load sprite data:", err));
    return () => {
      mounted = false;
    };
  }, [enabled, spriteDataLoaded]);

  // ID → 인덱스 변환
  const indexes = useMemo(() => {
    if (!spriteDataLoaded || !appearance) {
      return { eyeIndex: -1, hairIndex: -1, facehairIndex: -1, bodyIndex: 12 };
    }
    const eyeItem = spriteData.eyes?.find((e) => e.id === appearance.eyeId);
    const hairItem = spriteData.hairs?.find((h) => h.id === appearance.hairId);
    const facehairItem = spriteData.facehairs?.find((f) => f.id === appearance.facehairId);
    // 기본 body는 Human_1 (index 12)
    return {
      eyeIndex: eyeItem?.index ?? -1,
      hairIndex: hairItem?.index ?? -1,
      facehairIndex: facehairItem?.index ?? -1,
      bodyIndex: 12,
    };
  }, [spriteDataLoaded, appearance, spriteData]);

  const isReady = enabled && isUnityLoaded && !!spriteCounts && !!appearance && spriteDataLoaded;

  // Unity 로드 완료 후 외형 적용
  useEffect(() => {
    if (!isReady || !appearance) return;

    loadAppearance(
      {
        bodyIndex: indexes.bodyIndex,
        eyeIndex: indexes.eyeIndex,
        hairIndex: indexes.hairIndex,
        facehairIndex: indexes.facehairIndex,
        clothIndex: -1,
        armorIndex: -1,
        pantIndex: -1,
        helmetIndex: -1,
        backIndex: -1,
      },
      {
        body: "#FFFFFF",
        eye: appearance.leftEyeColor || "#4A3728",
        hair: appearance.hairColor || "#8B4513",
        facehair: appearance.faceHairColor || "#8B4513",
        cloth: "#FFFFFF",
        armor: "#FFFFFF",
        pant: "#FFFFFF",
      }
    );
  }, [isReady, appearance, indexes, loadAppearance]);

  return { isReady, indexes };
}
