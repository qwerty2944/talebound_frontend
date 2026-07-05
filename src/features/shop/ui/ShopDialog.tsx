"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useThemeStore } from "@/application/stores";
import { ApiError } from "@/shared/api";
import { useCountUp } from "@/shared/lib";
import type { Npc } from "@/entities/npc";
import {
  useItemsByIds,
  getRarityColor,
  getRarityName,
  type Item,
} from "@/entities/item";
import { usePersonalInventory } from "@/entities/inventory";
import type { InventorySlotItem } from "@/entities/inventory";
import { useBuyItem } from "../buy-item";
import { useSellItem } from "../sell-item";

interface ShopDialogProps {
  npc: Npc;
  userId: string;
  playerGold: number;
  onClose: () => void;
}

type Tab = "buy" | "sell";

/** 상점(상인) 대화 모달 — 구매/판매 탭. 가격·검증은 서버 권위. */
export function ShopDialog({ npc, userId, playerGold, onClose }: ShopDialogProps) {
  const { theme } = useThemeStore();
  const [tab, setTab] = useState<Tab>("buy");
  const [goldDisplay, goldDir] = useCountUp(playerGold);

  const buyMutation = useBuyItem(userId);
  const sellMutation = useSellItem(userId);
  const busy = buyMutation.isPending || sellMutation.isPending;

  // 상인 취급 품목
  const stock = npc.stock ?? [];
  const { data: stockItems = [], isLoading: stockLoading } = useItemsByIds(stock);

  // 판매용: 내 개인 인벤토리
  const { data: inventory, isLoading: invLoading } = usePersonalInventory(userId);
  const invItems = useMemo(
    () => (inventory?.items ?? []).filter((i): i is InventorySlotItem => i !== null),
    [inventory]
  );
  const invItemIds = useMemo(
    () => Array.from(new Set(invItems.map((i) => i.itemId))),
    [invItems]
  );
  const { data: invItemDefs = [] } = useItemsByIds(invItemIds);
  const itemDefById = useMemo(() => {
    const m = new Map<string, Item>();
    for (const it of invItemDefs) m.set(it.id, it);
    return m;
  }, [invItemDefs]);

  // 아이템 ID별 보유 수량 합산
  const ownedQty = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of invItems) m.set(it.itemId, (m.get(it.itemId) ?? 0) + it.quantity);
    return m;
  }, [invItems]);

  const handleBuy = (item: Item, quantity: number) => {
    if (playerGold < item.value * quantity) {
      toast.error(npc.dialogues.notEnoughGold ?? "금화가 부족하시네요...");
      return;
    }
    buyMutation.mutate(
      { npcId: npc.id, itemId: item.id, quantity },
      {
        onSuccess: () => {
          toast.success(
            `${npc.dialogues.purchase ?? "좋은 선택이십니다!"} (${item.nameKo} x${quantity})`,
            {
              icon: item.icon && item.icon.length <= 2 ? item.icon : "🛒",
              style: {
                borderLeft: `3px solid ${getRarityColor(item.rarity)}`,
                fontWeight: 600,
              },
            }
          );
        },
        onError: (e) => {
          if (e instanceof ApiError && e.code === "NOT_ENOUGH_GOLD") {
            toast.error(npc.dialogues.notEnoughGold ?? "금화가 부족하시네요...");
          } else {
            toast.error(e instanceof ApiError ? e.message : "구매에 실패했습니다");
          }
        },
      }
    );
  };

  const handleSell = (item: Item, quantity: number) => {
    const unit = sellUnitPrice(item);
    sellMutation.mutate(
      { itemId: item.id, quantity },
      {
        onSuccess: () => {
          toast.success(`${item.nameKo} x${quantity} 판매 (💰 +${unit * quantity})`, {
            icon: "💰",
          });
        },
        onError: (e) =>
          toast.error(e instanceof ApiError ? e.message : "판매에 실패했습니다"),
      }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md flex flex-col max-h-[85vh]"
        style={{ background: theme.colors.bg, border: `2px solid ${theme.colors.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-4 border-b flex-none" style={{ borderColor: theme.colors.border }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{npc.icon}</span>
            <div className="flex-1 min-w-0">
              <h2 className="font-mono font-bold truncate" style={{ color: theme.colors.text }}>
                {npc.nameKo}
              </h2>
              <div
                className="speech-bubble mt-1 inline-block px-2.5 py-1.5 text-sm font-mono"
                style={{
                  background: theme.colors.bgLight,
                  borderLeft: `2px solid ${theme.colors.border}`,
                  borderBottom: `2px solid ${theme.colors.border}`,
                  color: theme.colors.textMuted,
                }}
              >
                “{tab === "buy"
                  ? npc.dialogues.greeting
                  : npc.dialogues.browse ?? npc.dialogues.greeting}”
              </div>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex-none flex" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
          {(["buy", "sell"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-sm font-mono font-medium transition-colors"
              style={{
                background: tab === t ? theme.colors.bgLight : "transparent",
                color: tab === t ? theme.colors.primary : theme.colors.textMuted,
                borderBottom: tab === t ? `2px solid ${theme.colors.primary}` : "2px solid transparent",
              }}
            >
              {t === "buy" ? "🛒 구매" : "💰 판매"}
            </button>
          ))}
        </div>

        {/* 목록 */}
        <div className="p-4 overflow-y-auto flex-1">
          {tab === "buy" ? (
            stockLoading ? (
              <p className="text-center font-mono py-8" style={{ color: theme.colors.textMuted }}>
                불러오는 중...
              </p>
            ) : stockItems.length === 0 ? (
              <p className="text-center font-mono py-8" style={{ color: theme.colors.textMuted }}>
                판매 중인 물건이 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {stockItems.map((item) => (
                  <BuyRow
                    key={item.id}
                    item={item}
                    playerGold={playerGold}
                    disabled={busy}
                    onBuy={handleBuy}
                  />
                ))}
              </div>
            )
          ) : invLoading ? (
            <p className="text-center font-mono py-8" style={{ color: theme.colors.textMuted }}>
              불러오는 중...
            </p>
          ) : ownedQty.size === 0 ? (
            <p className="text-center font-mono py-8" style={{ color: theme.colors.textMuted }}>
              판매할 아이템이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {Array.from(ownedQty.entries()).map(([itemId, qty]) => {
                const def = itemDefById.get(itemId);
                if (!def) return null;
                return (
                  <SellRow
                    key={itemId}
                    item={def}
                    owned={qty}
                    disabled={busy}
                    onSell={handleSell}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div
          className="p-4 border-t flex justify-between items-center flex-none"
          style={{ borderColor: theme.colors.border }}
        >
          <span
            className="font-mono text-sm flex items-center gap-1"
            style={{ color: theme.colors.warning }}
          >
            <span>💰</span>
            <span
              key={goldDir}
              className={goldDir !== 0 ? "animate-value-pulse" : undefined}
              style={{
                color:
                  goldDir > 0
                    ? theme.colors.success
                    : goldDir < 0
                    ? theme.colors.error
                    : theme.colors.warning,
                transition: "color 0.4s ease",
              }}
            >
              {goldDisplay.toLocaleString()}
            </span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-mono text-sm transition-colors"
            style={{
              background: theme.colors.bgLight,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

/** 계약: 판매 단가 = sellPrice(>0) 없으면 floor(value*0.4) */
function sellUnitPrice(item: Item): number {
  return item.sellPrice > 0 ? item.sellPrice : Math.floor(item.value * 0.4);
}

// ============ 수량 스텝퍼 ============
function QtyStepper({
  qty,
  setQty,
  max,
  disabled,
}: {
  qty: number;
  setQty: (n: number) => void;
  max: number;
  disabled?: boolean;
}) {
  const { theme } = useThemeStore();
  const clamp = (n: number) => Math.max(1, Math.min(max, n));
  const btn = {
    background: theme.colors.bgLight,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.text,
  };
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setQty(clamp(qty - 1))}
        disabled={disabled || qty <= 1}
        className="w-6 h-6 font-mono text-xs flex items-center justify-center"
        style={{ ...btn, opacity: qty <= 1 ? 0.4 : 1 }}
      >
        −
      </button>
      <input
        type="number"
        value={qty}
        min={1}
        max={max}
        disabled={disabled}
        onChange={(e) => setQty(clamp(parseInt(e.target.value, 10) || 1))}
        className="w-10 h-6 text-center font-mono text-xs bg-transparent"
        style={{ border: `1px solid ${theme.colors.border}`, color: theme.colors.text }}
      />
      <button
        type="button"
        onClick={() => setQty(clamp(qty + 1))}
        disabled={disabled || qty >= max}
        className="w-6 h-6 font-mono text-xs flex items-center justify-center"
        style={{ ...btn, opacity: qty >= max ? 0.4 : 1 }}
      >
        +
      </button>
    </div>
  );
}

// ============ 구매 행 ============
function BuyRow({
  item,
  playerGold,
  disabled,
  onBuy,
}: {
  item: Item;
  playerGold: number;
  disabled: boolean;
  onBuy: (item: Item, qty: number) => void;
}) {
  const { theme } = useThemeStore();
  const [qty, setQty] = useState(1);
  const rarityColor = getRarityColor(item.rarity);
  const total = item.value * qty;
  const canAfford = playerGold >= total;

  return (
    <div
      className="game-card p-3"
      style={{
        background: theme.colors.bgDark,
        border: `1px solid ${rarityColor}55`,
        boxShadow: `inset 0 0 18px ${rarityColor}12`,
      }}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-none">{item.icon}</span>
          <div className="min-w-0">
            <div className="font-mono font-medium truncate" style={{ color: rarityColor }}>
              {item.nameKo}
            </div>
            <div className="text-[10px] font-mono" style={{ color: theme.colors.textMuted }}>
              [{getRarityName(item.rarity, "ko")}] · 개당 💰 {item.value}
            </div>
          </div>
        </div>
        <QtyStepper qty={qty} setQty={setQty} max={99} disabled={disabled} />
      </div>
      <button
        onClick={() => onBuy(item, qty)}
        disabled={!canAfford || disabled}
        className="w-full py-2 text-sm font-mono transition-colors flex items-center justify-center gap-2"
        style={{
          background: canAfford ? theme.colors.primary : theme.colors.bgLight,
          color: canAfford ? theme.colors.bg : theme.colors.textMuted,
          cursor: canAfford && !disabled ? "pointer" : "not-allowed",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span>💰</span>
        <span>{total.toLocaleString()} 골드에 구매</span>
      </button>
    </div>
  );
}

// ============ 판매 행 ============
function SellRow({
  item,
  owned,
  disabled,
  onSell,
}: {
  item: Item;
  owned: number;
  disabled: boolean;
  onSell: (item: Item, qty: number) => void;
}) {
  const { theme } = useThemeStore();
  const [qty, setQty] = useState(1);
  const rarityColor = getRarityColor(item.rarity);
  const unit = sellUnitPrice(item);
  const total = unit * qty;
  const q = Math.min(qty, owned);

  return (
    <div
      className="game-card p-3"
      style={{
        background: theme.colors.bgDark,
        border: `1px solid ${rarityColor}55`,
        boxShadow: `inset 0 0 18px ${rarityColor}12`,
      }}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-none">{item.icon}</span>
          <div className="min-w-0">
            <div className="font-mono font-medium truncate" style={{ color: rarityColor }}>
              {item.nameKo}
            </div>
            <div className="text-[10px] font-mono" style={{ color: theme.colors.textMuted }}>
              보유 {owned} · 단가 💰 {unit}
            </div>
          </div>
        </div>
        <QtyStepper qty={q} setQty={setQty} max={owned} disabled={disabled} />
      </div>
      <button
        onClick={() => onSell(item, q)}
        disabled={disabled || owned < 1}
        className="w-full py-2 text-sm font-mono transition-colors flex items-center justify-center gap-2"
        style={{
          background: theme.colors.warning,
          color: theme.colors.bg,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span>💰</span>
        <span>{total.toLocaleString()} 골드에 판매</span>
      </button>
    </div>
  );
}
