"use client";

/**
 * /unity-viewer
 *
 * 유니티 단독 풀스크린 뷰어 페이지 (게임 UI/로그인 없음).
 *
 * 목적: Flutter 앱(WebView, WKWebView)이 보스전에서 이 페이지를 임베드해
 * 내 캐릭터를 유니티 WebGL로 렌더하고, 전투 이벤트에 맞춰 애니메이션을 재생한다.
 *
 * 브리지 (Flutter ↔ WebView):
 *  - window.tbSetAnimation(state)  전역 함수. state: "IDLE"|"ATTACK"|"HIT"|"VICTORY"|"DEATH"
 *    (대소문자 무시). 내부에서 유니티 런타임 상태명으로 매칭 후 JS_SetAnimationState 호출.
 *    ATTACK/HIT는 ~700ms 뒤 IDLE로 자동 복귀 (웹 useBattleUnityAnimation과 동일 타이밍).
 *  - window.tbReady = true         유니티 로드 + 스프라이트 준비 완료 신호.
 *  - document.title = "tb-unity-ready"  Flutter가 타이틀로도 감지 가능.
 *
 * 외형: URL 쿼리 파라미터로 스프라이트 인덱스/색상을 직렬화해 받는다 (민감정보 없음).
 *  예) /unity-viewer?body=12&hair=3&hairColor=8B4513&eyeColor=4A3728
 *  파라미터가 없으면 기본 외형(Human_1 + 갈색)으로 폴백.
 */

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { UnityProvider } from "@/application/providers";
import { useAppearanceStore } from "@/application/stores";
import { DynamicUnityCanvas } from "@/features/character/ui/DynamicUnityCanvas";

// ── 전역 브리지 타입 ──
declare global {
  interface Window {
    tbSetAnimation?: (state: string) => void;
    tbReady?: boolean;
  }
}

// 이벤트별 유니티 상태명 후보 (useBattleUnityAnimation과 동일 규칙, 대소문자 무시)
const STATE_CANDIDATES = {
  idle: ["IDLE", "Idle", "IDLE_BATTLE", "BATTLE_IDLE", "STAND", "WAIT"],
  attack: ["ATTACK", "Attack", "ATTACK_01", "ATTACK1", "SKILL", "CAST"],
  hit: ["HIT", "Hit", "DAMAGED", "DAMAGE", "HURT"],
  victory: ["VICTORY", "WIN", "CLEAR", "DANCE", "CHEER", "IDLE"],
  death: ["DEATH", "DIE", "DEAD", "DOWN", "FALL"],
} as const;

type EventKind = keyof typeof STATE_CANDIDATES;

// 외부 입력 상태명 → 내부 EventKind 정규화
function toEventKind(raw: string): EventKind {
  const s = raw.trim().toLowerCase();
  if (s.startsWith("attack") || s === "skill" || s === "cast") return "attack";
  if (s.startsWith("hit") || s.startsWith("dam") || s === "hurt") return "hit";
  if (s.startsWith("vic") || s === "win" || s === "clear") return "victory";
  if (s.startsWith("dea") || s === "die" || s === "down" || s === "fall") return "death";
  return "idle";
}

interface ParsedAppearance {
  indices: {
    bodyIndex: number;
    eyeIndex: number;
    hairIndex: number;
    facehairIndex: number;
    clothIndex: number;
    armorIndex: number;
    pantIndex: number;
    helmetIndex: number;
    backIndex: number;
  };
  colors: {
    body: string;
    eye: string;
    hair: string;
    facehair: string;
    cloth: string;
    armor: string;
    pant: string;
  };
}

/**
 * 유니티 뷰어 본체. UnityProvider 내부에서 렌더되어야 스토어/브리지가 동작한다.
 */
function ViewerBridge({ appearance }: { appearance: ParsedAppearance }) {
  const isUnityLoaded = useAppearanceStore((s) => s.isUnityLoaded);
  const spriteCounts = useAppearanceStore((s) => s.spriteCounts);
  const animationCounts = useAppearanceStore((s) => s.animationCounts);
  const loadAppearance = useAppearanceStore((s) => s.loadAppearance);
  const changeAnimationState = useAppearanceStore((s) => s.changeAnimationState);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appliedRef = useRef(false);

  // 유니티 로드 완료 후 내 외형 적용 (한 번만)
  useEffect(() => {
    if (!isUnityLoaded || !spriteCounts || appliedRef.current) return;
    appliedRef.current = true;
    // 유니티 초기화(기본 body/색상 강제 적용)가 완료된 뒤 덮어쓰도록 살짝 지연
    const t = setTimeout(() => {
      loadAppearance(appearance.indices, appearance.colors);
    }, 150);
    return () => clearTimeout(t);
  }, [isUnityLoaded, spriteCounts, loadAppearance, appearance]);

  // window.tbSetAnimation 브리지 등록 (animationCounts 갱신 시 최신 상태명으로 갱신)
  useEffect(() => {
    const resolveState = (kind: EventKind): string | null => {
      const states = animationCounts?.states ?? [];
      if (states.length === 0) return null;
      const lower = states.map((s) => s.toLowerCase());
      for (const c of STATE_CANDIDATES[kind]) {
        const i = lower.indexOf(c.toLowerCase());
        if (i >= 0) return states[i];
      }
      for (const c of STATE_CANDIDATES[kind]) {
        const i = lower.findIndex((s) => s.includes(c.toLowerCase()));
        if (i >= 0) return states[i];
      }
      return null;
    };

    window.tbSetAnimation = (raw: string) => {
      const kind = toEventKind(raw);
      const state = resolveState(kind);
      if (!state) return;
      changeAnimationState(state);

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      // 공격/피격은 잠깐 재생 후 IDLE 복귀
      if (kind === "attack" || kind === "hit") {
        idleTimerRef.current = setTimeout(() => {
          const idle = resolveState("idle");
          if (idle) changeAnimationState(idle);
        }, 700);
      }
    };

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (window.tbSetAnimation) delete window.tbSetAnimation;
    };
  }, [animationCounts, changeAnimationState]);

  // 준비 완료 신호 (Flutter가 tbReady / title 로 감지)
  useEffect(() => {
    if (isUnityLoaded && spriteCounts) {
      window.tbReady = true;
      document.title = "tb-unity-ready";
    } else {
      window.tbReady = false;
      document.title = "tb-unity-loading";
    }
  }, [isUnityLoaded, spriteCounts]);

  return null;
}

function UnityViewerInner() {
  const searchParams = useSearchParams();

  const appearance = useMemo<ParsedAppearance>(() => {
    const num = (key: string, def: number) => {
      const v = searchParams.get(key);
      if (v == null) return def;
      const n = parseInt(v, 10);
      return Number.isNaN(n) ? def : n;
    };
    const color = (key: string) => {
      const v = searchParams.get(key);
      return v ? `#${v.replace(/^#/, "")}` : "";
    };
    return {
      indices: {
        // 기본 body는 Human_1 (index 12). 나머지 파츠는 없음(-1)이면 loadAppearance가 건너뜀.
        bodyIndex: num("body", 12),
        eyeIndex: num("eye", -1),
        hairIndex: num("hair", -1),
        facehairIndex: num("facehair", -1),
        clothIndex: num("cloth", -1),
        armorIndex: num("armor", -1),
        pantIndex: num("pant", -1),
        helmetIndex: num("helmet", -1),
        backIndex: num("back", -1),
      },
      colors: {
        body: color("bodyColor"),
        eye: color("eyeColor"),
        hair: color("hairColor"),
        facehair: color("facehairColor"),
        cloth: color("clothColor"),
        armor: color("armorColor"),
        pant: color("pantColor"),
      },
    };
  }, [searchParams]);

  return (
    <UnityProvider>
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100dvh",
          background: "transparent",
          overflow: "hidden",
        }}
      >
        <DynamicUnityCanvas />
      </div>
      <ViewerBridge appearance={appearance} />
    </UnityProvider>
  );
}

export default function UnityViewerPage() {
  return (
    <Suspense fallback={<div style={{ position: "fixed", inset: 0, background: "transparent" }} />}>
      <UnityViewerInner />
    </Suspense>
  );
}
