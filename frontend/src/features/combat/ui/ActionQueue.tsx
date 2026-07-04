"use client";

import { useThemeStore } from "@/shared/config";
import { useBattleStore, type QueuedAction } from "@/application/stores";

interface ActionQueueProps {
  onRemoveAction: (index: number) => void;
  onClearQueue: () => void;
  onExecute: () => void;
  disabled?: boolean;
}

export function ActionQueue({
  onRemoveAction,
  onClearQueue,
  onExecute,
  disabled,
}: ActionQueueProps) {
  const { theme } = useThemeStore();
  const { battle, getRemainingPlayerAp } = useBattleStore();

  const queue = battle.playerQueue;
  const remainingAp = getRemainingPlayerAp();
  const totalApUsed = battle.playerMaxAp - remainingAp;

  if (queue.length === 0) {
    return (
      <div
        className="px-4 py-3 border-t font-mono text-sm text-center"
        style={{
          background: theme.colors.bgDark,
          borderColor: theme.colors.border,
          color: theme.colors.textMuted,
        }}
      >
        행동을 선택하세요 (AP: {battle.playerMaxAp})
      </div>
    );
  }

  return (
    <div
      className="border-t"
      style={{
        background: theme.colors.bgDark,
        borderColor: theme.colors.border,
      }}
    >
      {/* 큐 헤더 */}
      <div
        className="px-4 py-2 flex items-center justify-between border-b"
        style={{ borderColor: theme.colors.border }}
      >
        <div className="font-mono text-xs" style={{ color: theme.colors.text }}>
          <span style={{ color: theme.colors.warning }}>⚡</span> 행동 큐
          <span
            className="ml-2"
            style={{ color: theme.colors.textMuted }}
          >
            (AP: {totalApUsed}/{battle.playerMaxAp})
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClearQueue}
            disabled={disabled}
            className="px-2 py-1 text-xs font-mono transition-colors"
            style={{
              background: "transparent",
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.textMuted,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            초기화
          </button>
          <button
            onClick={onExecute}
            disabled={disabled}
            className="px-3 py-1 text-xs font-mono font-bold transition-colors"
            style={{
              background: theme.colors.primary,
              border: `1px solid ${theme.colors.primary}`,
              color: theme.colors.bg,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            실행!
          </button>
        </div>
      </div>

      {/* 큐 아이템 목록 */}
      <div className="px-4 py-2 flex flex-wrap gap-2">
        {queue.map((action, index) => (
          <QueueItem
            key={`${action.ability.id}-${index}`}
            action={action}
            index={index}
            onRemove={() => onRemoveAction(index)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

interface QueueItemProps {
  action: QueuedAction;
  index: number;
  onRemove: () => void;
  disabled?: boolean;
}

function QueueItem({ action, index, onRemove, disabled }: QueueItemProps) {
  const { theme } = useThemeStore();

  const getTypeColor = () => {
    switch (action.ability.type) {
      case "attack":
        return theme.colors.error;
      case "heal":
        return theme.colors.success;
      case "buff":
        return theme.colors.primary;
      case "debuff":
        return "#A855F7"; // purple
      case "defense":
        return theme.colors.warning;
      default:
        return theme.colors.textMuted;
    }
  };

  return (
    <div
      className="flex items-center gap-1 px-2 py-1 font-mono text-xs group"
      style={{
        background: `${getTypeColor()}20`,
        border: `1px solid ${getTypeColor()}40`,
        color: theme.colors.text,
      }}
    >
      <span className="text-sm">{action.ability.icon || "⚔️"}</span>
      <span>{action.ability.nameKo}</span>
      <span
        className="ml-1"
        style={{ color: theme.colors.warning }}
      >
        {action.apCost}
      </span>
      {action.mpCost > 0 && (
        <span style={{ color: theme.colors.primary }}>
          +{action.mpCost}
        </span>
      )}
      <button
        onClick={onRemove}
        disabled={disabled}
        className="ml-1 w-4 h-4 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
        style={{
          background: "transparent",
          color: theme.colors.textMuted,
        }}
      >
        ×
      </button>
    </div>
  );
}
