"use client";

// ============ SocketSlot ============
// 개별 소켓 슬롯 컴포넌트

import { useState } from "react";
import { useThemeStore } from "@/application/stores";
import type { SocketSlot } from "@/entities/item/types/socket";
import type { Item } from "@/entities/item";
import {
  SOCKET_TYPE_CONFIG,
  SOCKET_COLOR_CONFIG,
} from "@/entities/item/types/socket";

interface SocketSlotComponentProps {
  socket: SocketSlot | null;
  index: number;
  socketableItems: Item[];
  onInsert: (itemId: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function SocketSlotComponent({
  socket,
  index,
  socketableItems,
  onInsert,
  onRemove,
  disabled,
}: SocketSlotComponentProps) {
  const { theme } = useThemeStore();
  const [showMenu, setShowMenu] = useState(false);

  const typeConfig = socket?.type ? SOCKET_TYPE_CONFIG[socket.type] : null;
  const colorConfig = socket?.color ? SOCKET_COLOR_CONFIG[socket.color] : null;

  const isEmpty = !socket?.insertedItemId;

  // 장착된 아이템 찾기
  const insertedItem = socket?.insertedItemId
    ? socketableItems.find((i) => i.id === socket.insertedItemId) ?? null
    : null;

  const handleClick = () => {
    if (disabled) return;

    if (isEmpty) {
      setShowMenu(!showMenu);
    } else {
      // 제거 확인
      if (confirm("장착된 아이템을 제거하시겠습니까?")) {
        onRemove();
      }
    }
  };

  const handleInsert = (itemId: string) => {
    onInsert(itemId);
    setShowMenu(false);
  };

  // 색상 결정
  const getBorderColor = () => {
    if (isEmpty) {
      return colorConfig?.color ?? theme.colors.borderDim;
    }
    return theme.colors.primary;
  };

  const getBackgroundColor = () => {
    if (isEmpty) {
      if (colorConfig?.color && colorConfig.id !== "prismatic") {
        return `${colorConfig.color}20`;
      }
      return theme.colors.bgDark;
    }
    return `${theme.colors.primary}20`;
  };

  return (
    <div className="relative">
      <div
        onClick={handleClick}
        className="w-12 h-12 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
        style={{
          borderColor: getBorderColor(),
          background: getBackgroundColor(),
          opacity: disabled ? 0.5 : 1,
        }}
        title={
          isEmpty
            ? `소켓 ${index + 1} (${typeConfig?.nameKo ?? "빈 소켓"})`
            : `${insertedItem?.nameKo ?? "알 수 없는 아이템"} (클릭하여 제거)`
        }
      >
        {isEmpty ? (
          <span
            className="text-lg"
            style={{ color: theme.colors.textMuted }}
          >
            {typeConfig?.icon ?? "+"}
          </span>
        ) : (
          <span className="text-lg">{insertedItem?.icon ?? "?"}</span>
        )}
      </div>

      {/* 장착 메뉴 */}
      {showMenu && isEmpty && !disabled && (
        <div
          className="absolute z-10 top-full left-0 mt-1 p-2 rounded-lg border shadow-lg min-w-[150px]"
          style={{
            background: theme.colors.bg,
            borderColor: theme.colors.border,
          }}
        >
          {socketableItems.length === 0 ? (
            <p
              className="text-sm"
              style={{ color: theme.colors.textMuted }}
            >
              장착 가능한 아이템이 없습니다
            </p>
          ) : (
            <div className="space-y-1">
              {socketableItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleInsert(item.id)}
                  className="w-full text-left px-2 py-1 rounded text-sm hover:opacity-80 flex items-center gap-2"
                  style={{
                    background: theme.colors.bgDark,
                    color: theme.colors.text,
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.nameKo}</span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowMenu(false)}
            className="mt-2 w-full text-center text-sm"
            style={{ color: theme.colors.textMuted }}
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}
