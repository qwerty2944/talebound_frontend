"use client";

import { useState, useEffect, useRef, useId } from "react";
import { useUnityBridge } from "@/application/providers";

export function UnityCanvas() {
  const { isLoaded, loadingProgression, registerViewport, unregisterViewport } = useUnityBridge();
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportId = useId();

  // Viewport 등록/해제
  useEffect(() => {
    if (containerRef.current) {
      registerViewport(viewportId, containerRef.current);
    }
    return () => {
      unregisterViewport(viewportId);
    };
  }, [viewportId, registerViewport, unregisterViewport]);

  // 90% 이상에서 10초 이상 멈추면 안내 메시지 표시
  useEffect(() => {
    if (isLoaded) {
      setShowSlowMessage(false);
      return;
    }

    if (loadingProgression >= 0.9) {
      const timer = setTimeout(() => {
        setShowSlowMessage(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [loadingProgression, isLoaded]);

  return (
    <div className="relative w-full h-full">
      {/* 로딩 오버레이 */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900">
          <div className="text-center text-white px-4">
            <p className="mb-2">로딩 중... {Math.round(loadingProgression * 100)}%</p>
            <div className="w-48 h-2 bg-gray-700 rounded mx-auto">
              <div
                className="h-full bg-blue-500 rounded transition-all"
                style={{ width: `${loadingProgression * 100}%` }}
              />
            </div>
            {showSlowMessage && (
              <p className="mt-4 text-sm text-yellow-400">
                초기화 중입니다. 모바일에서는 시간이 오래 걸릴 수 있습니다.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Unity canvas가 Portal로 렌더링될 컨테이너 */}
      <div
        ref={containerRef}
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ background: "transparent" }}
      />
    </div>
  );
}
