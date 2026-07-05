"use client";

import { useMemo, useState } from "react";
import { useThemeStore } from "@/shared/config";
import type { InventorySlotItem } from "../types";
import type { Item } from "@/entities/item";
import { InventorySlot } from "./InventorySlot";

interface InventoryGridProps {
  items: (InventorySlotItem | null)[];
  allItems: Item[];
  maxSlots?: number;
  disabled?: boolean;
  onUseItem?: (slot: InventorySlotItem, item: Item) => void;
  onEquipItem?: (slot: InventorySlotItem, item: Item) => void;
  onDropItem?: (slot: InventorySlotItem) => void;
}

type SortMode = "slot" | "rarity" | "type" | "name";

export function InventoryGrid({
  items,
  allItems,
  maxSlots = 20,
  disabled = false,
  onUseItem,
  onEquipItem,
  onDropItem,
}: InventoryGridProps) {
  const { theme } = useThemeStore();
  const [sortMode, setSortMode] = useState<SortMode>("slot");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // 아이템 ID → Item 매핑
  const itemsMap = useMemo(() => {
    const map = new Map<string, Item>();
    for (const item of allItems) {
      map.set(item.id, item);
    }
    return map;
  }, [allItems]);

  // 아이템이 있는 슬롯만 필터링
  const nonNullItems = useMemo(() =>
    items.filter((item): item is InventorySlotItem => item !== null),
    [items]
  );

  // 정렬된 아이템 목록
  const sortedItems = useMemo(() => {
    if (sortMode === "slot") {
      return nonNullItems;
    }

    return [...nonNullItems].sort((a, b) => {
      const itemA = itemsMap.get(a.itemId);
      const itemB = itemsMap.get(b.itemId);

      if (!itemA || !itemB) return 0;

      switch (sortMode) {
        case "rarity": {
          const tierA = itemA.rarity ? getRarityTier(itemA.rarity) : 0;
          const tierB = itemB.rarity ? getRarityTier(itemB.rarity) : 0;
          return tierB - tierA; // 높은 등급 먼저
        }
        case "type":
          return itemA.type.localeCompare(itemB.type);
        case "name":
          return itemA.nameKo.localeCompare(itemB.nameKo);
        default:
          return 0;
      }
    });
  }, [nonNullItems, sortMode, itemsMap]);

  // 슬롯 그리드 생성 (빈 슬롯 포함)
  const grid = useMemo(() => {
    const slots: (InventorySlotItem | null)[] = [];

    if (sortMode === "slot") {
      // 슬롯 순서대로 표시 (빈 슬롯 포함)
      for (let i = 0; i < maxSlots; i++) {
        const item = items.find((it) => it?.slot === i);
        slots.push(item ?? null);
      }
    } else {
      // 정렬된 아이템만 표시 + 빈 슬롯
      for (const item of sortedItems) {
        slots.push(item);
      }
      // 나머지 빈 슬롯
      const emptyCount = maxSlots - sortedItems.length;
      for (let i = 0; i < emptyCount; i++) {
        slots.push(null);
      }
    }

    return slots;
  }, [items, sortedItems, sortMode, maxSlots]);

  const handleSelect = (slot: InventorySlotItem | null, index: number) => {
    setSelectedSlot(selectedSlot === index ? null : index);
  };

  const usedSlots = nonNullItems.length;

  return (
    <div>
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-2 py-1.5 mb-2"
        style={{
          background: theme.colors.bgLight,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <span className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>
          📦 인벤토리 ({usedSlots}/{maxSlots})
        </span>
        <div className="flex gap-1">
          {(["slot", "rarity", "type", "name"] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className="px-1.5 py-0.5 text-[10px] font-mono transition-colors"
              style={{
                background: sortMode === mode ? theme.colors.primary + "30" : "transparent",
                color: sortMode === mode ? theme.colors.primary : theme.colors.textMuted,
                borderRadius: "2px",
              }}
            >
              {mode === "slot" && "순서"}
              {mode === "rarity" && "등급"}
              {mode === "type" && "종류"}
              {mode === "name" && "이름"}
            </button>
          ))}
        </div>
      </div>

      {/* 그리드 */}
      {nonNullItems.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center h-40 font-mono"
          style={{ color: theme.colors.textMuted }}
        >
          <p className="text-3xl mb-2">📦</p>
          <p className="text-sm">인벤토리가 비어있습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-1">
          {grid.map((slot, index) => (
            <InventorySlot
              key={`slot-${sortMode === "slot" ? index : slot?.slot ?? index}`}
              slot={slot}
              item={slot ? itemsMap.get(slot.itemId) : undefined}
              slotIndex={sortMode === "slot" ? index : (slot?.slot ?? index)}
              selected={selectedSlot === index}
              disabled={disabled}
              onSelect={handleSelect}
              onUse={onUseItem}
              onEquip={onEquipItem}
              onDrop={onDropItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 등급 티어 (정렬용)
function getRarityTier(rarity: string): number {
  const tiers: Record<string, number> = {
    crude: 0,
    common: 1,
    grand: 2,
    rare: 3,
    arcane: 4,
    heroic: 5,
    unique: 6,
    celestial: 7,
    divine: 8,
    epic: 9,
    legendary: 10,
    mythic: 11,
    eternal: 12,
  };
  return tiers[rarity] ?? 0;
}
