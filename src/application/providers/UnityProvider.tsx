"use client";

import { useContext, ReactNode, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { UnityCtx, type UnityContextValue } from "./UnityProviderInner";

// react-unity-webgl을 포함한 실제 Provider를 다이나믹 임포트
const UnityProviderInner = dynamic(
  () => import("./UnityProviderInner").then((m) => ({ default: m.UnityProviderInner })),
  { ssr: false }
);

// 빈 함수들 (서버/초기 렌더링용)
const noop = () => {};

// 빈 Context 제공자 (서버 렌더링 및 초기 클라이언트 렌더링용)
function EmptyUnityProvider({ children }: { children: ReactNode }) {
  return (
    <UnityCtx.Provider
      value={{
        unityProvider: null,
        isLoaded: false,
        loadingProgression: 0,
        registerViewport: noop,
        unregisterViewport: noop,
        activeViewportId: null,
      }}
    >
      {children}
    </UnityCtx.Provider>
  );
}

export function UnityProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 서버 렌더링 또는 클라이언트 hydration 전에는 빈 Provider 사용
  if (!mounted) {
    return <EmptyUnityProvider>{children}</EmptyUnityProvider>;
  }

  // 클라이언트에서만 실제 Unity Provider 로드
  return <UnityProviderInner>{children}</UnityProviderInner>;
}

export function useUnityBridge(): UnityContextValue {
  const context = useContext(UnityCtx);

  // Context 없이 사용하는 경우 (fallback)
  if (!context) {
    console.warn("useUnityBridge called outside UnityProvider");
    return {
      unityProvider: null,
      isLoaded: false,
      loadingProgression: 0,
      registerViewport: noop,
      unregisterViewport: noop,
      activeViewportId: null,
    };
  }

  return context;
}
