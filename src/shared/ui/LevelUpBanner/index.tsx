"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/shared/config";

interface LevelUpBannerProps {
  newLevel: number;
  levelsGained: number;
  onDone: () => void;
  /** 표시 시간(ms) */
  duration?: number;
}

/**
 * LevelUpBanner
 *
 * 레벨업 시 화면 상단에 잠깐 나타나는 축하 배너. CSS 애니메이션만 사용.
 * 전투 종료(end-battle)에서 레벨업 토스트도 뜨지만, 큰 성장 피드백을 위해
 * 게임 화면에서 이 배너를 함께 노출한다.
 */
export function LevelUpBanner({
  newLevel,
  levelsGained,
  onDone,
  duration = 2600,
}: LevelUpBannerProps) {
  const { theme } = useThemeStore();

  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration, newLevel]);

  const gold = "#ffcf4d";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex justify-center px-4">
      <div
        className="animate-levelup-in text-center px-8 py-4 rounded-lg"
        style={{
          background: `linear-gradient(180deg, ${theme.colors.bgLight}, ${theme.colors.bgDark})`,
          border: `2px solid ${gold}`,
          boxShadow: `0 0 24px ${gold}66, inset 0 0 12px ${gold}22`,
        }}
      >
        <div className="text-3xl mb-1">✨🎉✨</div>
        <div
          className="font-mono font-bold text-2xl"
          style={{
            backgroundImage: `linear-gradient(90deg, ${gold}, #fff6cf, ${gold})`,
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            animation: "levelup-shine 1.6s linear infinite",
          }}
        >
          LEVEL UP!
        </div>
        <div
          className="font-mono text-sm mt-1"
          style={{ color: theme.colors.text }}
        >
          Lv.{newLevel}
          {levelsGained > 1 && (
            <span style={{ color: gold }}> (+{levelsGained})</span>
          )}
        </div>
      </div>
    </div>
  );
}
