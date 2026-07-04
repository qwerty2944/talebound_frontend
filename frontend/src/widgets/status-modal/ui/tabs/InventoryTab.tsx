"use client";

import toast from "react-hot-toast";
import { InventoryGrid } from "@/entities/inventory";
import { useProfile } from "@/entities/user";
import { useAuthStore } from "@/application/stores";
import { useUseConsumable, useRemoveItem, useUseCrystal, isCrystalItem } from "@/features/inventory";
import type { InventoryTabProps } from "./types";

export function InventoryTab({ theme, inventoryItems, allItems, inventoryMaxSlots }: InventoryTabProps) {
  const { session } = useAuthStore();
  const userId = session?.user?.id;
  const { data: profile } = useProfile(userId);

  const useConsumable = useUseConsumable(userId, {
    onSuccess: (result) => {
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    },
    onError: (error) => toast.error(error.message || "아이템 사용에 실패했습니다"),
  });

  const useCrystal = useUseCrystal(userId);

  const removeItem = useRemoveItem(userId, {
    onSuccess: () => toast.success("아이템을 버렸습니다"),
    onError: (error) => toast.error(error.message || "아이템을 버리지 못했습니다"),
  });

  return (
    <InventoryGrid
      items={inventoryItems}
      allItems={allItems}
      maxSlots={inventoryMaxSlots}
      onUseItem={(slot, item) => {
        if (!userId || !profile) return;

        // 통신용 크리스탈은 전용 훅으로 처리
        if (isCrystalItem(item.id)) {
          useCrystal.mutate({ crystalId: item.id, slot: slot.slot });
          return;
        }

        if (item.type !== "consumable") {
          toast.error("사용할 수 없는 아이템입니다");
          return;
        }

        useConsumable.mutate({ slot: slot.slot, item, profile });
      }}
      onDropItem={(slot) => {
        if (!userId) return;

        const itemDef = allItems.find((i) => i.id === slot.itemId);
        const name = itemDef?.nameKo ?? slot.itemId;
        if (!window.confirm(`${name} ${slot.quantity}개를 버리시겠습니까?`)) return;

        removeItem.mutate({ slot: slot.slot, quantity: slot.quantity });
      }}
    />
  );
}
