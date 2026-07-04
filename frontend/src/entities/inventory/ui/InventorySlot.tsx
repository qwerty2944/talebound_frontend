"use client";

import { useState } from "react";
import { useThemeStore } from "@/shared/config";
import type { InventorySlotItem } from "../types";
import type { Item } from "@/entities/item";
import { RARITY_CONFIG } from "@/entities/item";

interface InventorySlotProps {
  slot: InventorySlotItem | null;
  item?: Item;
  slotIndex: number;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: (slot: InventorySlotItem | null, index: number) => void;
  onUse?: (slot: InventorySlotItem, item: Item) => void;
  onDrop?: (slot: InventorySlotItem) => void;
}

export function InventorySlot({
  slot,
  item,
  slotIndex,
  selected = false,
  disabled = false,
  onSelect,
  onUse,
  onDrop,
}: InventorySlotProps) {
  const { theme } = useThemeStore();
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isEmpty = !slot;
  const rarityColor = item?.rarity ? RARITY_CONFIG[item.rarity].color : theme.colors.border;
  const rarityName = item?.rarity ? RARITY_CONFIG[item.rarity].nameKo : "";

  const handleClick = () => {
    if (disabled) return;
    onSelect?.(slot, slotIndex);
    if (slot && item) {
      setShowMenu((prev) => !prev);
    }
  };

  const handleUse = () => {
    if (slot && item && item.type === "consumable") {
      onUse?.(slot, item);
    }
    setShowMenu(false);
  };

  const handleDrop = () => {
    if (slot) {
      onDrop?.(slot);
    }
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => {
          setShowTooltip(false);
          setShowMenu(false);
        }}
        disabled={disabled}
        className="w-full aspect-square flex flex-col items-center justify-center p-1 transition-all"
        style={{
          background: isEmpty ? theme.colors.bgDark : theme.colors.bgLight,
          border: selected
            ? `2px solid ${theme.colors.primary}`
            : isEmpty
            ? `1px dashed ${theme.colors.borderDim}`
            : `2px solid ${rarityColor}`,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {isEmpty ? (
          <span
            className="text-xs font-mono"
            style={{ color: theme.colors.textMuted }}
          >
            {slotIndex + 1}
          </span>
        ) : (
          <>
            <span className="text-xl leading-none">{item?.icon ?? "📦"}</span>
            <span
              className="text-[10px] font-mono truncate w-full text-center mt-0.5 leading-tight"
              style={{ color: rarityColor }}
            >
              {item?.nameKo ?? slot.itemId}
            </span>
            {slot.quantity > 1 && (
              <span
                className="absolute bottom-0.5 right-0.5 text-[10px] font-mono px-1 rounded"
                style={{
                  background: theme.colors.bgDark,
                  color: theme.colors.text,
                }}
              >
                x{slot.quantity}
              </span>
            )}
          </>
        )}
      </button>

      {/* 툴팁 */}
      {showTooltip && slot && item && !showMenu && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 p-2 min-w-[140px] max-w-[180px] text-left pointer-events-none"
          style={{
            background: theme.colors.bg,
            border: `1px solid ${rarityColor}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-lg">{item.icon}</span>
            <span
              className="text-sm font-mono font-medium truncate"
              style={{ color: rarityColor }}
            >
              {item.nameKo}
            </span>
          </div>
          <div
            className="text-[10px] font-mono mb-1"
            style={{ color: theme.colors.textMuted }}
          >
            {rarityName} {item.type === "equipment" ? "장비" : item.type === "consumable" ? "소비" : item.type === "material" ? "재료" : "기타"}
          </div>
          {item.description.ko && (
            <p
              className="text-[10px] font-mono italic leading-tight"
              style={{ color: theme.colors.textDim }}
            >
              "{item.description.ko}"
            </p>
          )}
          {item.consumableEffect && (
            <div
              className="text-[10px] font-mono mt-1"
              style={{ color: theme.colors.success }}
            >
              {item.consumableEffect.type === "heal" && `HP +${item.consumableEffect.value}`}
              {item.consumableEffect.type === "heal_percent" && `HP +${item.consumableEffect.value}%`}
              {item.consumableEffect.type === "mana" && `MP +${item.consumableEffect.value}`}
              {item.consumableEffect.type === "mana_percent" && `MP +${item.consumableEffect.value}%`}
              {item.consumableEffect.type === "fatigue" && `피로도 +${item.consumableEffect.value}`}
            </div>
          )}
        </div>
      )}

      {/* 컨텍스트 메뉴 */}
      {showMenu && slot && item && (
        <div
          className="absolute z-50 top-full left-0 mt-1 w-full min-w-[80px]"
          style={{
            background: theme.colors.bg,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}
        >
          {item.type === "consumable" && item.consumableEffect && (
            <button
              onClick={handleUse}
              className="w-full px-2 py-1 text-xs font-mono text-left transition-colors hover:bg-opacity-80"
              style={{
                color: theme.colors.success,
                background: theme.colors.bgLight,
              }}
            >
              사용
            </button>
          )}
          <button
            onClick={handleDrop}
            className="w-full px-2 py-1 text-xs font-mono text-left transition-colors hover:bg-opacity-80"
            style={{
              color: theme.colors.error,
              background: theme.colors.bgLight,
            }}
          >
            버리기
          </button>
        </div>
      )}
    </div>
  );
}
