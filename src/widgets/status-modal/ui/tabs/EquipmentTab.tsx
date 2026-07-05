"use client";

import toast from "react-hot-toast";
import { useEquipmentStore } from "@/application/stores";
import { SLOT_CONFIG, RARITY_CONFIG, type EquipmentSlot } from "@/entities/item";
import type { EquipmentTabProps } from "./types";

const WEAPON_SLOTS: EquipmentSlot[] = ["mainHand", "offHand"];
const ARMOR_SLOTS: EquipmentSlot[] = ["helmet", "armor", "cloth", "pants"];
const ACCESSORY_SLOTS: EquipmentSlot[] = [
  "ring1",
  "ring2",
  "necklace",
  "earring1",
  "earring2",
  "bracelet",
];

export function EquipmentTab({ theme }: EquipmentTabProps) {
  const equipmentStore = useEquipmentStore();

  const handleUnequip = (slot: EquipmentSlot) => {
    const item = equipmentStore.getEquippedItem(slot);
    if (!item) return;
    equipmentStore.unequipItem(slot);
    toast.success(`${item.itemName} 해제`);
  };

  return (
    <div className="space-y-6">
      {/* 무기 카테고리 */}
      <div>
        <h3
          className="text-sm font-mono font-medium mb-2 flex items-center gap-2"
          style={{ color: theme.colors.textMuted }}
        >
          <span>⚔️</span> 무기
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {WEAPON_SLOTS.map((slot) => {
            const config = SLOT_CONFIG[slot];
            const item = equipmentStore.getEquippedItem(slot);
            const isDisabled = slot === "offHand" && equipmentStore.isOffHandDisabled();
            const rarityColor = item?.rarity
              ? RARITY_CONFIG[item.rarity].color
              : theme.colors.border;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => item && handleUnequip(slot)}
                disabled={!item || isDisabled}
                title={item ? "클릭하여 해제" : undefined}
                className="p-3 text-left transition-all"
                style={{
                  background: isDisabled ? `${theme.colors.bgDark}80` : theme.colors.bgDark,
                  border: `1px solid ${item ? rarityColor : theme.colors.border}`,
                  opacity: isDisabled ? 0.6 : 1,
                  cursor: item && !isDisabled ? "pointer" : "default",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>
                    {config.nameKo}
                    {isDisabled && " (비활성)"}
                  </span>
                </div>
                {item ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm truncate" style={{ color: rarityColor }}>
                        {item.itemName}
                      </div>
                      {item.stats && (
                        <div className="text-xs font-mono" style={{ color: theme.colors.success }}>
                          {Object.entries(item.stats).slice(0, 2).map(([k, v]) => `${k}+${v}`).join(" ")}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>
                    빈 슬롯
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 방어구 카테고리 */}
      <div>
        <h3
          className="text-sm font-mono font-medium mb-2 flex items-center gap-2"
          style={{ color: theme.colors.textMuted }}
        >
          <span>🛡️</span> 방어구
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ARMOR_SLOTS.map((slot) => {
            const config = SLOT_CONFIG[slot];
            const item = equipmentStore.getEquippedItem(slot);
            const rarityColor = item?.rarity
              ? RARITY_CONFIG[item.rarity].color
              : theme.colors.border;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => item && handleUnequip(slot)}
                disabled={!item}
                title={item ? "클릭하여 해제" : undefined}
                className="p-3 text-left transition-all"
                style={{
                  background: theme.colors.bgDark,
                  border: `1px solid ${item ? rarityColor : theme.colors.border}`,
                  cursor: item ? "pointer" : "default",
                }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-base">{config.icon}</span>
                  <span className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>
                    {config.nameKo}
                  </span>
                </div>
                {item ? (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-mono text-xs truncate" style={{ color: rarityColor }}>
                        {item.itemName}
                      </span>
                    </div>
                    {item.stats?.physicalDefense ? (
                      <div className="text-xs font-mono mt-1" style={{ color: theme.colors.success }}>
                        DEF +{item.stats.physicalDefense}
                      </div>
                    ) : item.stats?.defense ? (
                      <div className="text-xs font-mono mt-1" style={{ color: theme.colors.success }}>
                        DEF +{item.stats.defense}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>
                    빈 슬롯
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 장신구 카테고리 */}
      <div>
        <h3
          className="text-sm font-mono font-medium mb-2 flex items-center gap-2"
          style={{ color: theme.colors.textMuted }}
        >
          <span>💍</span> 장신구
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ACCESSORY_SLOTS.map((slot) => {
            const config = SLOT_CONFIG[slot];
            const item = equipmentStore.getEquippedItem(slot);
            const rarityColor = item?.rarity
              ? RARITY_CONFIG[item.rarity].color
              : theme.colors.border;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => item && handleUnequip(slot)}
                disabled={!item}
                title={item ? "클릭하여 해제" : undefined}
                className="p-2 text-center transition-all"
                style={{
                  background: theme.colors.bgDark,
                  border: `1px solid ${item ? rarityColor : theme.colors.border}`,
                  cursor: item ? "pointer" : "default",
                }}
              >
                <span className="text-lg block">{item?.icon ?? config.icon}</span>
                <div className="text-[10px] font-mono mt-1" style={{ color: theme.colors.textMuted }}>
                  {config.nameKo}
                </div>
                {item && (
                  <div className="text-[10px] font-mono truncate" style={{ color: rarityColor }}>
                    {item.itemName}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 장비 합계 */}
      <div
        className="p-3 flex flex-wrap gap-3"
        style={{
          background: theme.colors.bgLight,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <span className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>
          장비 합계:
        </span>
        {(() => {
          const stats = equipmentStore.getTotalStats();
          const entries = Object.entries(stats).filter(([, v]) => v !== 0);
          if (entries.length === 0) {
            return (
              <span className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>
                없음
              </span>
            );
          }
          return entries.map(([key, val]) => (
            <span key={key} className="text-xs font-mono" style={{ color: theme.colors.success }}>
              {key.toUpperCase()} +{val}
            </span>
          ));
        })()}
      </div>
    </div>
  );
}
