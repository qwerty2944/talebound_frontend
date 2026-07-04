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

        {/* 진행 중 스킬의 경험치 */}
        {isInProgress && progress && (
          <div
            className="text-xs font-mono mt-1"
            style={{ color: theme.colors.textMuted }}
          >
            경험치: {progress.exp}
          </div>
        )}
      </div>

      {/* 호버 툴팁 */}
      {isHovered && ability && (
        <AbilityTooltip ability={ability} progress={progress} theme={theme} />
      )}
    </div>
  );
}
