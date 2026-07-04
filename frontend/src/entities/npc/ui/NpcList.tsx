"use client";

import { useNpcsByMap } from "@/entities/npc";
import { useThemeStore } from "@/shared/config";

interface NpcListProps {
  mapId: string;
  onSelectNpc: (npcId: string) => void;
  disabled?: boolean;
  /** compact 모드 (CollapsibleSection 안에서 사용 시) */
  compact?: boolean;
}

/**
 * 현재 맵의 NPC 목록 표시
 */
export function NpcList({ mapId, onSelectNpc, disabled, compact = false }: NpcListProps) {
  const { theme } = useThemeStore();
  const { data: npcs = [] } = useNpcsByMap(mapId);

  if (npcs.length === 0) return null;

  return (
    <div
      className={compact ? "" : "p-3"}
      style={{
        background: compact ? "transparent" : theme.colors.bgLight,
        border: compact ? "none" : `1px solid ${theme.colors.border}`,
      }}
    >
      {/* 헤더 (compact 모드에서는 숨김) */}
      {!compact && (
        <h3
          className="text-xs font-mono font-medium mb-2 flex items-center gap-1.5"
          style={{ color: theme.colors.textMuted }}
        >
          <span>👤</span>
          <span>NPC</span>
          <span
            className="ml-auto px-1.5 py-0.5 text-[10px]"
            style={{ background: theme.colors.bgDark }}
          >
            {npcs.length}
          </span>
        </h3>
      )}
      <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
        {npcs.map((npc) => (
          <button
            key={npc.id}
            onClick={() => onSelectNpc(npc.id)}
            disabled={disabled}
            className="w-full p-2 flex items-center gap-2 text-sm font-mono transition-all text-left hover:translate-x-0.5"
            style={{
              background: theme.colors.bgDark,
              color: theme.colors.text,
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            <span className="text-base flex-shrink-0">{npc.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="truncate">{npc.nameKo}</p>
              <p
                className="text-xs truncate"
                style={{ color: theme.colors.textMuted }}
              >
                {getNpcTypeLabel(npc.type)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function getNpcTypeLabel(type: string): string {
  switch (type) {
    case "healer":
      return "치료사";
    case "merchant":
      return "상인";
    case "quest":
      return "퀘스트";
    case "trainer":
      return "훈련사";
    default:
      return "NPC";
  }
}
