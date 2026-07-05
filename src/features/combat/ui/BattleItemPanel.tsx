"use client";

/**
 * 전투 중 아이템 사용 패널 (ActionPanel의 아이템 탭)
 * - 인벤토리의 회복형 소비 아이템 목록 표시
 * - 사용 시 battleStore HP/MP 반영 + 인벤토리 소모
 */

import { useMemo } from "react";
import toast from "react-hot-toast";
import { useAuthStore, useBattleStore, useThemeStore } from "@/application/stores";
import { usePersonalInventory, type InventorySlotItem } from "@/entities/inventory";
import { useItems, type Item } from "@/entities/item";
import { useUseItem } from "@/features/inventory";

interface RawItemEffect {
  type: string;
  value?: number;
  hpValue?: number;
  mpValue?: number;
}

const BATTLE_USABLE_EFFECTS = new Set([
  "heal_hp",
  "heal",
  "heal_mp",
  "mana",
  "heal_both",
  "full_restore",
]);

function getItemEffect(item: Item): RawItemEffect | null {
  const raw = (item as Item & { effect?: RawItemEffect }).effect;
  if (raw) return raw;
  if (item.consumableEffect) {
    return { type: item.consumableEffect.type, value: item.consumableEffect.value };
  }
  return null;
}

interface BattleItemPanelProps {
  disabled?: boolean;
}

export function BattleItemPanel({ disabled = false }: BattleItemPanelProps) {
  const { theme } = useThemeStore();
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  const { data: inventoryData } = usePersonalInventory(userId);
  const { data: allItems = [] } = useItems();

  const healPlayer = useBattleStore((s) => s.healPlayer);
  const restoreMp = useBattleStore((s) => s.restoreMp);

  const consumeItem = useUseItem(userId, {
    onError: (error) => toast.error(error.message || "아이템 사용 실패"),
  });

  // 전투에서 사용 가능한 소비 아이템 목록
  const usableItems = useMemo(() => {
    const slots = inventoryData?.items ?? [];
    const result: Array<{ slot: InventorySlotItem; item: Item; effect: RawItemEffect }> = [];

    for (const slot of slots) {
      if (!slot) continue;
      const item = allItems.find((i) => i.id === slot.itemId);
      if (!item || item.type !== "consumable") continue;

      const effect = getItemEffect(item);
      if (!effect || !BATTLE_USABLE_EFFECTS.has(effect.type)) continue;

      result.push({ slot, item, effect });
    }

    return result;
  }, [inventoryData?.items, allItems]);

  const handleUse = (slot: InventorySlotItem, item: Item, effect: RawItemEffect) => {
    if (disabled || consumeItem.isPending) return;

    const value = effect.value ?? 0;

    switch (effect.type) {
      case "heal_hp":
      case "heal":
        healPlayer(value);
        break;
      case "heal_mp":
      case "mana":
        restoreMp(value);
        break;
      case "heal_both":
        healPlayer(effect.hpValue ?? value);
        restoreMp(effect.mpValue ?? value);
        break;
      case "full_restore":
        healPlayer(99999);
        restoreMp(99999);
        break;
      default:
        return;
    }

    // 인벤토리에서 1개 소모 (전투 종료 후 HP/MP는 end-battle에서 DB 저장됨)
    consumeItem.mutate({ slot: slot.slot, amount: 1 });
    toast.success(`${item.nameKo} 사용!`);
  };

  if (usableItems.length === 0) {
    return (
      <div
        className="text-center py-4 font-mono text-sm"
        style={{ color: theme.colors.textMuted }}
      >
        🎒 사용할 수 있는 아이템이 없습니다
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {usableItems.map(({ slot, item, effect }) => (
        <button
          key={slot.slot}
          onClick={() => handleUse(slot, item, effect)}
          disabled={disabled || consumeItem.isPending}
          className="flex items-center gap-2 p-2 font-mono text-left transition-colors"
          style={{
            background: theme.colors.bgDark,
            border: `1px solid ${theme.colors.border}`,
            color: theme.colors.text,
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          <span className="text-xl">🧪</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{item.nameKo}</div>
            <div className="text-[10px]" style={{ color: theme.colors.textMuted }}>
              {effect.type.startsWith("heal_hp") || effect.type === "heal"
                ? `HP +${effect.value}`
                : effect.type === "heal_mp" || effect.type === "mana"
                  ? `MP +${effect.value}`
                  : effect.type === "full_restore"
                    ? "완전 회복"
                    : `HP/MP +${effect.value}`}
            </div>
          </div>
          <span
            className="text-xs px-1.5 py-0.5"
            style={{ background: `${theme.colors.primary}20`, color: theme.colors.primary }}
          >
            x{slot.quantity}
          </span>
        </button>
      ))}
    </div>
  );
}
