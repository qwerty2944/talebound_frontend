"use client";

import { useThemeStore } from "@/shared/config";
import type { StatusEffect } from "@/entities/status";

interface StatusEffectDisplayProps {
  buffs: StatusEffect[];
  debuffs: StatusEffect[];
  compact?: boolean;
}

export function StatusEffectDisplay({
  buffs,
  debuffs,
  compact = false,
}: StatusEffectDisplayProps) {
  const { theme } = useThemeStore();

  if (buffs.length === 0 && debuffs.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? "" : "mt-1"}`}>
      {buffs.map((buff) => (
        <StatusIcon
          key={buff.id}
          effect={buff}
          color={theme.colors.success}
          compact={compact}
        />
      ))}
      {debuffs.map((debuff) => (
        <StatusIcon
          key={debuff.id}
          effect={debuff}
          color={theme.colors.error}
          compact={compact}
        />
      ))}
    </div>
  );
}

interface StatusIconProps {
  effect: StatusEffect;
  color: string;
  compact: boolean;
}

function StatusIcon({ effect, color, compact }: StatusIconProps) {
  const { theme } = useThemeStore();

  return (
    <div
      className={`relative flex items-center justify-center ${
        compact ? "w-6 h-6 text-sm" : "w-8 h-8 text-base"
      }`}
      style={{
        background: `${color}20`,
        border: `1px solid ${color}40`,
        borderRadius: "4px",
      }}
      title={`${effect.nameKo} (${effect.duration}턴)`}
    >
      <span>{effect.icon}</span>
      {/* 지속시간 표시 */}
      <span
        className="absolute -bottom-1 -right-1 text-[10px] font-mono font-bold px-0.5 rounded"
        style={{
          background: theme.colors.bgDark,
          color: theme.colors.text,
          minWidth: "14px",
          textAlign: "center",
        }}
      >
        {effect.duration}
      </span>
      {/* 중첩 표시 */}
      {effect.currentStacks > 1 && (
        <span
          className="absolute -top-1 -left-1 text-[10px] font-mono font-bold px-0.5 rounded"
          style={{
            background: color,
            color: theme.colors.bg,
            minWidth: "14px",
            textAlign: "center",
          }}
        >
          x{effect.currentStacks}
        </span>
      )}
    </div>
  );
}
