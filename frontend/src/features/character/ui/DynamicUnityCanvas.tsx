"use client";

import dynamic from "next/dynamic";

const UnityCanvasInner = dynamic(
  () => import("./UnityCanvas").then((m) => ({ default: m.UnityCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-gray-400">Unity 모듈 로딩 중...</p>
        </div>
      </div>
    ),
  }
);

export function DynamicUnityCanvas() {
  return <UnityCanvasInner />;
}
