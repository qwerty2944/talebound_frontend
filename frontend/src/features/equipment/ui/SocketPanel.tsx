"use client";

// ============ SocketPanel ============
// 소켓 관리 패널 컴포넌트

import { useThemeStore } from "@/application/stores";
import type { EquipmentInstance } from "@/entities/item/types/equipment-instance";
import type { EquipmentSockets, SocketSlot } from "@/entities/item/types/socket";
import type { Item } from "@/entities/item";
import { SocketSlotComponent } from "./SocketSlot";

interface SocketPanelProps {
  instance: EquipmentInstance;
  baseItem: Item;
  socketableItems: Item[];
  onInsert: (socketIndex: number, itemId: string) => void;
  onRemove: (socketIndex: number) => void;
  isLoading?: boolean;
}

export function SocketPanel({
  instance,
  baseItem,
  socketableItems,
  onInsert,
  onRemove,
  isLoading,
}: SocketPanelProps) {
  const { theme } = useThemeStore();
  const sockets = instance.sockets;

  if (!sockets || sockets.maxSockets === 0) {
    return (
      <div
        className="p-4 rounded-lg border font-mono text-center"
        style={{
          background: theme.colors.bg,
          borderColor: theme.colors.border,
        }}
      >
        <p style={{ color: theme.colors.textMuted }}>
          이 장비에는 소켓이 없습니다.
        </p>
      </div>
    );
  }

  // 빈 소켓 채우기
  const displaySockets: (SocketSlot | null)[] = [];
  for (let i = 0; i < sockets.maxSockets; i++) {
    const socket = sockets.sockets.find((s) => s.index === i);
    displaySockets.push(socket ?? null);
  }

  return (
    <div
      className="p-4 rounded-lg border font-mono"
      style={{
        background: theme.colors.bg,
        borderColor: theme.colors.border,
      }}
    >
      {/* 헤더 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>
          소켓 관리
        </h3>
        <p className="text-sm" style={{ color: theme.colors.textMuted }}>
          {baseItem.nameKo} ({displaySockets.filter((s) => s?.insertedItemId).length}/
          {sockets.maxSockets} 장착)
        </p>
      </div>

      {/* 룬워드 표시 */}
      {instance.activeRuneword && (
        <div
          className="p-2 rounded mb-4"
          style={{ background: `${theme.colors.primary}20` }}
        >
          <span style={{ color: theme.colors.primary }}>
            룬워드: {instance.activeRuneword.runewordId}
          </span>
        </div>
      )}

      {/* 소켓 그리드 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {displaySockets.map((socket, index) => (
          <SocketSlotComponent
            key={index}
            socket={socket}
            index={index}
            socketableItems={socketableItems}
            onInsert={(itemId) => onInsert(index, itemId)}
            onRemove={() => onRemove(index)}
            disabled={isLoading}
          />
        ))}
      </div>

      {/* 장착 가능한 아이템 목록 */}
      {socketableItems.length > 0 && (
        <div
          className="border-t pt-4"
          style={{ borderColor: theme.colors.borderDim }}
        >
          <h4
            className="text-sm font-bold mb-2"
            style={{ color: theme.colors.textDim }}
          >
            장착 가능한 아이템
          </h4>
          <div className="flex flex-wrap gap-1">
            {socketableItems.map((item) => (
              <div
                key={item.id}
                className="px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80"
                style={{
                  background: theme.colors.bgDark,
                  color: theme.colors.text,
                }}
                title={item.description?.ko ?? item.nameKo}
              >
                {item.icon} {item.nameKo}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
