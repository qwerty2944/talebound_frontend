"use client";

import { useEffect, useState, useRef } from "react";
import { useThemeStore } from "@/shared/config";
import { useBattleStore } from "@/application/stores";
import { StatusEffectDisplay } from "./StatusEffectDisplay";

export function BattleHeader() {
  const { theme } = useThemeStore();
  const {
    battle,
    getMonsterHpPercent,
    getPlayerHpPercent,
    getPlayerMpPercent,
    getPlayerApPercent,
    getPlayerShieldAmount,
    getRemainingPlayerAp,
  } = useBattleStore();

  // 데미지 피드백 애니메이션 상태
  const [monsterDamageShake, setMonsterDamageShake] = useState(false);
  const [playerDamageShake, setPlayerDamageShake] = useState(false);
  const prevMonsterHp = useRef(battle.monsterCurrentHp);
  const prevPlayerHp = useRef(battle.playerCurrentHp);

  // HP 변화 감지 및 애니메이션 트리거
  useEffect(() => {
    if (battle.monsterCurrentHp < prevMonsterHp.current) {
      setMonsterDamageShake(true);
      const timer = setTimeout(() => setMonsterDamageShake(false), 300);
      return () => clearTimeout(timer);
    }
    prevMonsterHp.current = battle.monsterCurrentHp;
  }, [battle.monsterCurrentHp]);

  useEffect(() => {
    if (battle.playerCurrentHp < prevPlayerHp.current) {
      setPlayerDamageShake(true);
      const timer = setTimeout(() => setPlayerDamageShake(false), 300);
      return () => clearTimeout(timer);
    }
    prevPlayerHp.current = battle.playerCurrentHp;
  }, [battle.playerCurrentHp]);

  if (!battle.monster) return null;

  const monsterHpPercent = getMonsterHpPercent();
  const playerHpPercent = getPlayerHpPercent();
  const playerMpPercent = getPlayerMpPercent();
  const playerApPercent = getPlayerApPercent();
  const remainingAp = getRemainingPlayerAp();
  const shieldAmount = getPlayerShieldAmount();

  return (
    <div>
      {/* 헤더 */}
      <div
        className="px-4 py-3 border-b"
        style={{
          background: theme.colors.bgDark,
          borderColor: theme.colors.border,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{battle.monster.icon}</span>
            <div>
              <h2
                className="font-mono font-bold"
                style={{ color: theme.colors.text }}
              >
                {battle.monster.nameKo}
              </h2>
              <span
                className="text-xs font-mono"
                style={{ color: theme.colors.textMuted }}
              >
                Lv.{battle.monster.level}
                {battle.monster.element &&
                  ` · ${getElementIcon(battle.monster.element)}`}
              </span>
            </div>
          </div>
          <div
            className="text-sm font-mono px-2 py-1"
            style={{
              background: theme.colors.bgLight,
              color: theme.colors.textMuted,
            }}
          >
            턴 {battle.turn}
          </div>
        </div>
      </div>

      {/* HP/MP 바 영역 */}
      <div className="p-4 space-y-3">
        {/* 몬스터 HP */}
        <div
          className={`transition-transform ${monsterDamageShake ? "animate-shake" : ""}`}
          style={{
            animation: monsterDamageShake ? "shake 0.3s ease-in-out" : "none",
          }}
        >
          <div className="flex justify-between items-center text-xs font-mono mb-1">
            <div className="flex items-center gap-2">
              <span style={{ color: theme.colors.error }}>
                {battle.monster.nameKo}
              </span>
              <StatusEffectDisplay
                buffs={battle.monsterBuffs}
                debuffs={battle.monsterDebuffs}
                compact
              />
            </div>
            <span
              className={`transition-all ${monsterDamageShake ? "scale-110 font-bold" : ""}`}
              style={{ color: monsterDamageShake ? theme.colors.error : theme.colors.textMuted }}
            >
              {battle.monsterCurrentHp} / {battle.monster.stats.hp}
            </span>
          </div>
          <div
            className="h-4 overflow-hidden relative"
            style={{ background: theme.colors.bgDark }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${monsterHpPercent}%`,
                background: monsterDamageShake
                  ? `linear-gradient(90deg, ${theme.colors.error}, ${theme.colors.warning})`
                  : theme.colors.error,
                boxShadow: monsterDamageShake ? `0 0 10px ${theme.colors.error}` : "none",
              }}
            />
          </div>
        </div>

        {/* 플레이어 HP */}
        <div
          className={`transition-transform ${playerDamageShake ? "animate-shake" : ""}`}
          style={{
            animation: playerDamageShake ? "shake 0.3s ease-in-out" : "none",
          }}
        >
          <div className="flex justify-between items-center text-xs font-mono mb-1">
            <div className="flex items-center gap-2">
              <span style={{ color: theme.colors.success }}>나</span>
              {shieldAmount > 0 && (
                <span
                  className="px-1 py-0.5 text-[10px]"
                  style={{
                    background: `${theme.colors.primary}30`,
                    color: theme.colors.primary,
                  }}
                >
                  🔰 {shieldAmount}
                </span>
              )}
              <StatusEffectDisplay
                buffs={battle.playerBuffs}
                debuffs={battle.playerDebuffs}
                compact
              />
            </div>
            <span
              className={`transition-all ${playerDamageShake ? "scale-110 font-bold" : ""}`}
              style={{
                color: playerDamageShake
                  ? theme.colors.error
                  : playerHpPercent <= 20
                  ? theme.colors.error
                  : theme.colors.textMuted,
              }}
            >
              {battle.playerCurrentHp} / {battle.playerMaxHp}
            </span>
          </div>
          <div
            className="h-4 overflow-hidden relative"
            style={{ background: theme.colors.bgDark }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${playerHpPercent}%`,
                background: playerDamageShake
                  ? `linear-gradient(90deg, ${theme.colors.error}, ${theme.colors.warning})`
                  : playerHpPercent > 50
                  ? theme.colors.success
                  : playerHpPercent > 20
                  ? theme.colors.warning
                  : theme.colors.error,
                boxShadow: playerDamageShake ? `0 0 10px ${theme.colors.error}` : "none",
              }}
            />
            {/* 낮은 HP 경고 */}
            {playerHpPercent <= 20 && !playerDamageShake && (
              <div
                className="absolute inset-0 animate-pulse"
                style={{ background: `${theme.colors.error}20` }}
              />
            )}
          </div>
        </div>

        {/* 플레이어 MP */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span style={{ color: theme.colors.primary }}>MP</span>
            <span style={{ color: theme.colors.textMuted }}>
              {battle.playerMp} / {battle.playerMaxMp}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden"
            style={{ background: theme.colors.bgDark }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${playerMpPercent}%`,
                background: theme.colors.primary,
              }}
            />
          </div>
        </div>

        {/* 플레이어 AP (액션 포인트) */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span style={{ color: theme.colors.warning }}>AP</span>
            <span style={{ color: theme.colors.textMuted }}>
              {remainingAp} / {battle.playerMaxAp}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden"
            style={{ background: theme.colors.bgDark }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${playerApPercent}%`,
                background: theme.colors.warning,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function getElementIcon(element: string): string {
  const icons: Record<string, string> = {
    fire: "🔥",
    ice: "❄️",
    lightning: "⚡",
    earth: "🪨",
    holy: "✨",
    dark: "🌑",
  };
  return icons[element] || "";
}
