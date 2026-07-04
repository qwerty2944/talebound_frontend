"use client";

import { useState } from "react";
import type { Theme } from "@/shared/config";
import type { Ability, AbilityProgress } from "@/entities/ability";
import { ABILITY_TYPE_CONFIG } from "@/entities/ability/lib/abilityHelpers";
import { AbilityTooltip } from "./AbilityTooltip";

interface AbilityCardProps {
  ability: Ability | undefined;
  skillId: string;
  progress: AbilityProgress | null;
  isInProgress: boolean;
  theme: Theme;
}

export function AbilityCard({ ability, skillId, progress, isInProgress, theme }: AbilityCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const typeConfig = ability?.type
    ? ABILITY_TYPE_CONFIG[ability.type] || ABILITY_TYPE_CONFIG.attack
    : ABILITY_TYPE_CONFIG.attack;

  return (
    <div
      className="relative p-4 flex items-start gap-3"
      style={{
        background: theme.colors.bgDark,
        border: `1px solid ${theme.colors.border}`,
        borderLeft: `3px solid ${typeConfig.color}`,
        opacity: isInProgress ? 0.6 : 1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 아이콘 */}
      <span className="text-3xl" style={{ opacity: isInProgress ? 0.6 : 1 }}>
        {ability?.icon ?? "📖"}
      </span>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium" style={{ color: theme.colors.text }}>
            {ability?.nameKo ?? skillId}
          </span>
          {progress && (
            <span
              className="text-xs font-mono px-1.5 py-0.5"
              style={{
                background: isInProgress ? theme.colors.bgLight : `${theme.colors.primary}20`,
                color: isInProgress ? theme.colors.textMuted : theme.colors.primary,
              }}
            >
              Lv.{progress.level}
            </span>
          )}
        </div>

        {/* 타입 배지 */}
        {ability && (
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{
                background: `${typeConfig.color}20`,
                color: typeConfig.color,
              }}
            >
              {typeConfig.icon} {typeConfig.nameKo}
            </span>
          </div>
        )}

        {/* 경험치 진행바 */}
        {progress && ability && (
          <ExpBar
            exp={progress.exp}
            expPerLevel={ability.expPerLevel || 100}
            level={progress.level}
            maxLevel={ability.maxLevel || 10}
            theme={theme}
          />
        )}
      </div>

      {/* 호버 툴팁 */}
      {isHovered && ability && (
        <AbilityTooltip ability={ability} progress={progress} theme={theme} />
      )}
    </div>
  );
}

// ============ 경험치 진행바 ============

interface ExpBarProps {
  exp: number;
  expPerLevel: number;
  level: number;
  maxLevel: number;
  theme: Theme;
}

function ExpBar({ exp, expPerLevel, level, maxLevel, theme }: ExpBarProps) {
  const isMaxLevel = level >= maxLevel;
  const currentExp = Math.min(exp, expPerLevel);
  const percent = isMaxLevel ? 100 : Math.min(100, (currentExp / expPerLevel) * 100);

  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] font-mono mb-0.5">
        <span style={{ color: theme.colors.textMuted }}>
          {isMaxLevel ? "최대 레벨" : "경험치"}
        </span>
        {!isMaxLevel && (
          <span style={{ color: theme.colors.textDim }}>
            {currentExp}/{expPerLevel}
          </span>
        )}
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-sm"
        style={{ background: theme.colors.bgLight }}
      >
        <div
          className="h-full transition-all"
          style={{
            width: `${percent}%`,
            background: isMaxLevel ? theme.colors.warning : theme.colors.primary,
          }}
        />
      </div>
    </div>
  );
}
