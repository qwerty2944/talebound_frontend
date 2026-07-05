"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useBattleStore } from "@/application/stores";
import { useThemeStore } from "@/shared/config";
import { useProfile } from "@/entities/user";
import { MONSTER_RANK_INFO } from "@/entities/monster";
import { useUnityBridge, usePlayerAppearance } from "@/features/character";
import { useBattleUnityAnimation } from "../lib/useBattleUnityAnimation";

/**
 * BattleUnityStage
 *
 * 보스전에서만(rank === "boss") BattleHeader 아래에 렌더된다.
 * - 좌측: 내 캐릭터 (내 외형을 유니티 싱글턴에 로드해 표시)
 * - 우측: 보스 아이콘 + CSS 연출(피격 플래시/흔들림)
 *
 * 기존 registerViewport/unregisterViewport를 재사용하므로 유니티 재로딩이 없다.
 * 유니티가 아직 로드되지 않았어도 전투는 정상 진행되며, 좌측은 아이콘 폴백을 보여준다.
 */
export function BattleUnityStage({ userId }: { userId: string }) {
  const { theme } = useThemeStore();
  const battle = useBattleStore((s) => s.battle);
  const getMonsterHpPercent = useBattleStore((s) => s.getMonsterHpPercent);

  const monster = battle.monster;
  const isBoss = !!monster && monster.rank === "boss";

  const { isLoaded: isUnityLoaded, registerViewport, unregisterViewport } = useUnityBridge();
  const { data: profile } = useProfile(userId);

  // 내 외형 로드 (보스전일 때만)
  usePlayerAppearance(profile?.appearance, isBoss);
  // 전투 로그 → 유니티 애니메이션 동기화
  useBattleUnityAnimation(isBoss);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewportId = useId();

  // 좌측 캔버스를 viewport로 등록 (유니티 싱글턴이 여기로 이동)
  useEffect(() => {
    if (!isBoss) return;
    const el = containerRef.current;
    if (el) registerViewport(viewportId, el);
    return () => unregisterViewport(viewportId);
  }, [isBoss, viewportId, registerViewport, unregisterViewport]);

  // 보스 피격 플래시/흔들림 (플레이어가 데미지를 줬을 때)
  const [bossHitFlash, setBossHitFlash] = useState(false);
  const prevMonsterHp = useRef(battle.monsterCurrentHp);
  useEffect(() => {
    if (battle.monsterCurrentHp < prevMonsterHp.current) {
      setBossHitFlash(true);
      const t = setTimeout(() => setBossHitFlash(false), 300);
      prevMonsterHp.current = battle.monsterCurrentHp;
      return () => clearTimeout(t);
    }
    prevMonsterHp.current = battle.monsterCurrentHp;
  }, [battle.monsterCurrentHp]);

  if (!isBoss || !monster) return null;

  const bossColor = MONSTER_RANK_INFO.boss.color;
  const monsterHpPercent = getMonsterHpPercent();
  const isDefeated = battle.result === "defeat";
  const isVictory = battle.result === "victory";

  return (
    <div
      className="relative w-full overflow-hidden border-b"
      style={{
        borderColor: `${bossColor}55`,
        background: `radial-gradient(ellipse at center, ${bossColor}12, ${theme.colors.bgDark})`,
        height: "168px",
      }}
    >
      {/* 보스 배너 */}
      <div
        className="absolute top-0 left-0 right-0 z-10 text-center py-1 text-xs font-mono font-bold"
        style={{ color: bossColor, background: `${theme.colors.bgDark}cc` }}
      >
        👑 {monster.nameKo}
      </div>

      <div className="flex items-end justify-between h-full px-4 pb-3 pt-6">
        {/* 좌측: 내 캐릭터 (유니티) */}
        <div className="relative flex-1 h-full flex items-end justify-center">
          <div
            ref={containerRef}
            className="w-full h-full"
            style={{
              transform: isVictory ? "scale(1.05)" : undefined,
              transition: "transform 0.3s ease",
            }}
          />
          {/* 유니티 미로드 폴백 */}
          {!isUnityLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl" style={{ opacity: 0.6 }}>🧝</span>
            </div>
          )}
          <span
            className="absolute bottom-0 text-[10px] font-mono"
            style={{ color: theme.colors.success }}
          >
            나
          </span>
        </div>

        {/* 중앙 VS */}
        <div className="flex-shrink-0 px-2 pb-6">
          <span className="text-sm font-mono font-bold" style={{ color: bossColor }}>
            VS
          </span>
        </div>

        {/* 우측: 보스 (아이콘 + CSS 연출) */}
        <div className="relative flex-1 h-full flex flex-col items-center justify-end">
          <div
            className="flex items-center justify-center"
            style={{
              fontSize: "56px",
              filter: bossHitFlash
                ? "brightness(2.2) drop-shadow(0 0 8px #fff)"
                : isDefeated
                ? "grayscale(1) opacity(0.4)"
                : `drop-shadow(0 0 10px ${bossColor}88)`,
              transform: bossHitFlash
                ? "translateX(4px) scale(0.95)"
                : isDefeated
                ? "translateY(6px) rotate(8deg)"
                : "none",
              transition: "transform 0.15s ease, filter 0.15s ease",
              animation: !bossHitFlash && !isDefeated ? "bossFloat 3s ease-in-out infinite" : undefined,
            }}
          >
            {monster.icon}
          </div>
          {/* 보스 HP 바 */}
          <div className="w-full mt-1 px-2">
            <div className="h-2 overflow-hidden" style={{ background: theme.colors.bgDark }}>
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${monsterHpPercent}%`, background: bossColor }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bossFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
