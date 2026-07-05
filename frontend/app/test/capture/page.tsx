"use client";

import { useEffect } from "react";
import { DynamicUnityCanvas, useAppearanceStore } from "@/features/character";

// 개발용 스프라이트 캡처 페이지.
// Playwright가 window.__unityCapture로 Unity를 직접 조작해 장비 스프라이트를 촬영한다.
// scripts/capture-equipment-sprites.ts에서 사용.

const RIGHT_HAND: Record<string, string> = {
  sword: "Sword",
  axe: "Axe",
  bow: "Bow",
  spear: "Spear",
  wand: "Wand",
  dagger: "Dagger",
};

const WEARABLE_METHOD: Record<string, string> = {
  helmet: "JS_SetHelmet",
  armor: "JS_SetArmor",
  cloth: "JS_SetCloth",
  pant: "JS_SetPant",
  back: "JS_SetBack",
  hair: "JS_SetHair",
};

declare global {
  interface Window {
    __unityCapture?: {
      ready: () => boolean;
      reset: () => void;
      set: (category: string, index: number) => void;
    };
  }
}

export default function CaptureTestPage() {
  const { clearAll, callUnity } = useAppearanceStore();

  useEffect(() => {
    const state = () => useAppearanceStore.getState();

    const reset = () => {
      const s = state();
      s.callUnity("JS_ClearAll");
      s.callUnity("JS_SetBody", "12"); // Human_1
      s.callUnity("JS_SetHair", "-1");
      s.callUnity("JS_SetFacehair", "-1");
      s.callUnity("JS_SetEye", "-1");
    };

    window.__unityCapture = {
      ready: () => state().isUnityLoaded,
      reset,
      set: (category, index) => {
        const s = state();
        if (RIGHT_HAND[category]) {
          s.callUnity("JS_SetRightWeapon", `${RIGHT_HAND[category]},${index}`);
        } else if (category === "shield") {
          s.callUnity("JS_SetLeftWeapon", `Shield,${index}`);
        } else if (WEARABLE_METHOD[category]) {
          s.callUnity(WEARABLE_METHOD[category], index.toString());
        }
      },
    };

    return () => {
      delete window.__unityCapture;
    };
  }, []);

  // 진입 시 기본 상태로 초기화
  useEffect(() => {
    clearAll();
    callUnity("JS_SetBody", "12");
    callUnity("JS_SetHair", "-1");
    callUnity("JS_SetFacehair", "-1");
  }, [clearAll, callUnity]);

  return (
    <div className="h-dvh w-full bg-gray-900 flex items-center justify-center">
      <div className="relative" style={{ width: 1600, height: 800 }}>
        <DynamicUnityCanvas />
      </div>
    </div>
  );
}
