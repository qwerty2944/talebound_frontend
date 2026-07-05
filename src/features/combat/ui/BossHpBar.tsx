"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeStore } from "@/shared/config";
import { useBattleStore } from "@/application/stores";
import { MONSTER_RANK_INFO } from "@/entities/monster";

/**
 * BossHpBar
 *
 * 보스전(rank === "boss")에서만 전투 패널 최상단에 렌더되는 대형 보스 HP바.
 * - 보스명 + 👑 + 굵은 그라데이션 HP바 + 퍼센트
 * - 피격 시 HP 감소 애니메이션(플래시/흔들림)
 * 일반/정예 전투에서는 null을 반환하여 기존 UI를 그대로 유지한다.
 */
export function BossHpBar() {
  const { theme } = useThemeStore();
  const battle = useBattleStore((s) => s.battle);
  const getMonsterHpPercent = useBattleStore((s) => s.getMonsterHpPercent);

  const monster = battle.monster;
  const isBoss = !!monster && monster.rank === "boss";

  // 피격 플래시 (HP 감소 감지)
  const [hitFlash, setHitFlash] = useState(false);
  const prevHp = useRef(battle.monsterCurrentHp);
  useEffect(() => {
    if (battle.monsterCurrentHp < prevHp.current) {
      setHitFlash(true);
      const t = setTimeout(() => setHitFlash(false), 320);
      prevHp.current = battle.monsterCurrentHp;
      return () => clearTimeout(t);
    }
    prevHp.current = battle.monsterCurrentHp;
  }, [battle.monsterCurrentHp]);

  if (!isBoss || !monster) return null;

  const bossColor = MONSTER_RANK_INFO.boss.color;
  const hpPercent = getMonsterHpPercent();
  const roundedPercent = Math.round(hpPercent);

  return (
    <div
      className="px-4 py-3 border-b"
      style={{
        background: `linear-gradient(180deg, ${bossColor}18, ${theme.colors.bgDark})`,
        borderColor: `${bossColor}66`,
      }}
    >
      {/* 보스명 + 퍼센트 */}
      <div className="flex items-end justify-between mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-lg leading-none">👑</span>
          <span
            className="font-mono font-bold tracking-wide truncate"
            style={{
              color: bossColor,
              textShadow: `0 0 10px ${bossColor}66`,
            }}
          >
            {monster.nameKo}
          </span>
          <span
            className="text-[10px] font-mono px-1 py-0.5 rounded flex-shrink-0"
            style={{ background: `${bossColor}22`, color: bossColor }}
          >
            BOSS
          </span>
        </div>
        <span
          className={`text-sm font-mono font-bold transition-all ${hitFlash ? "scale-110" : ""}`}
          style={{ color: hitFlash ? "#fff" : bossColor }}
        >
          {roundedPercent}%
        </span>
      </div>

      {/* 대형 HP바 */}
      <div
        className={hitFlash ? "animate-shake" : ""}
        style={{ animation: hitFlash ? "shake 0.3s ease-in-out" : "none" }}
      >
        <div
          className="h-5 rounded-sm overflow-hidden relative"
          style={{
            background: theme.colors.bgDark,
            border: `1px solid ${bossColor}44`,
            boxShadow: hitFlash ? `0 0 14px ${bossColor}aa` : `inset 0 0 6px ${theme.colors.bgDark}`,
          }}
        >
          <div
            className="h-full transition-all duration-300 relative"
            style={{
              width: `${hpPercent}%`,
              background: hitFlash
                ? `linear-gradient(90deg, #fff, ${bossColor})`
                : `linear-gradient(90deg, ${bossColor}, ${theme.colors.error})`,
              boxShadow: `0 0 12px ${bossColor}88`,
            }}
          >
            {/* 상단 광택 */}
            <div
              className="absolute inset-x-0 top-0 h-1/2"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.28), transparent)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
