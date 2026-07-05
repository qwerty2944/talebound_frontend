"use client";

// ============ EnhancePanel ============
// 장비 강화 패널 컴포넌트

import { useState } from "react";
import { useThemeStore } from "@/application/stores";
import { useEnhance } from "../enhance";
import {
  ENHANCEMENT_CONFIG,
  getEnhancementColor,
  formatEnhancementLevel,
  calculateEnhanceSuccessRate,
  getEnhancementCost,
} from "@/entities/item/types/enhancement";
import type { EquipmentInstance } from "@/entities/item/types/equipment-instance";
import type { Item } from "@/entities/item";
import { EnhanceResult } from "./EnhanceResult";

interface EnhancePanelProps {
  instance: EquipmentInstance;
  baseItem: Item;
  characterId: string;
  playerGold: number;
  onClose?: () => void;
}

export function EnhancePanel({
  instance,
  baseItem,
  characterId,
  playerGold,
  onClose,
}: EnhancePanelProps) {
  const { theme } = useThemeStore();
  const enhanceMutation = useEnhance(characterId);

  const [useProtection, setUseProtection] = useState(false);
  const [useLuckBoost, setUseLuckBoost] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    result: string;
    previousLevel: number;
    newLevel: number;
  } | null>(null);

  const currentLevel = instance.enhancement.level;
  const targetLevel = currentLevel + 1;
  const cost = getEnhancementCost(currentLevel);
  const successRate = calculateEnhanceSuccessRate(
    targetLevel,
    instance.enhancement.failCount,
    useLuckBoost
  );

  const config = ENHANCEMENT_CONFIG.find((c) => c.level === targetLevel);
  const canEnhance =
    currentLevel < 15 && cost && playerGold >= cost.goldCost && !enhanceMutation.isPending;

  const handleEnhance = async () => {
    if (!canEnhance) return;

    try {
      const response = await enhanceMutation.mutateAsync({
        instanceId: instance.instanceId,
        useProtection,
        useLuckBoost,
      });

      setResult({
        success: response.result === "success",
        result: response.result,
        previousLevel: response.previousLevel,
        newLevel: response.newLevel,
      });
    } catch (error) {
      console.error("Enhancement failed:", error);
    }
  };

  const handleResultClose = () => {
    setResult(null);
    if (result?.result === "destroy") {
      onClose?.();
    }
  };

  if (result) {
    return (
      <EnhanceResult
        result={result}
        itemName={baseItem.nameKo}
        onClose={handleResultClose}
      />
    );
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>
          장비 강화
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xl hover:opacity-70"
            style={{ color: theme.colors.textMuted }}
          >
            ×
          </button>
        )}
      </div>

      {/* 아이템 정보 */}
      <div
        className="p-3 rounded mb-4"
        style={{ background: theme.colors.bgDark }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{baseItem.icon}</span>
          <div>
            <div
              className="font-bold"
              style={{ color: getEnhancementColor(currentLevel) }}
            >
              {formatEnhancementLevel(currentLevel)} {baseItem.nameKo}
            </div>
            <div
              className="text-sm"
              style={{ color: theme.colors.textMuted }}
            >
              {baseItem.equipmentData?.slot}
            </div>
          </div>
        </div>
      </div>

      {currentLevel >= 15 ? (
        <div
          className="text-center py-4"
          style={{ color: theme.colors.primary }}
        >
          최대 강화 단계입니다!
        </div>
      ) : (
        <>
          {/* 강화 정보 */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span style={{ color: theme.colors.textDim }}>강화 단계</span>
              <span style={{ color: theme.colors.text }}>
                <span style={{ color: getEnhancementColor(currentLevel) }}>
                  +{currentLevel}
                </span>
                {" → "}
                <span style={{ color: getEnhancementColor(targetLevel) }}>
                  +{targetLevel}
                </span>
              </span>
            </div>

            <div className="flex justify-between">
              <span style={{ color: theme.colors.textDim }}>성공 확률</span>
              <span
                style={{
                  color:
                    successRate >= 70
                      ? theme.colors.success
                      : successRate >= 40
                      ? theme.colors.warning
                      : theme.colors.error,
                }}
              >
                {successRate}%
              </span>
            </div>

            <div className="flex justify-between">
              <span style={{ color: theme.colors.textDim }}>스탯 배율</span>
              <span style={{ color: theme.colors.primary }}>
                ×{config?.statMultiplier.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span style={{ color: theme.colors.textDim }}>실패 시</span>
              <span
                style={{
                  color:
                    config?.failPenalty === "destroy"
                      ? theme.colors.error
                      : config?.failPenalty === "downgrade"
                      ? theme.colors.warning
                      : theme.colors.textMuted,
                }}
              >
                {config?.failPenalty === "destroy"
                  ? "파괴"
                  : config?.failPenalty === "downgrade"
                  ? "단계 하락"
                  : "유지"}
              </span>
            </div>

            {instance.enhancement.failCount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: theme.colors.textDim }}>연속 실패</span>
                <span style={{ color: theme.colors.warning }}>
                  {instance.enhancement.failCount}회 (+
                  {Math.min(instance.enhancement.failCount * 2, 30)}% 보너스)
                </span>
              </div>
            )}

            <div
              className="border-t pt-2 mt-2"
              style={{ borderColor: theme.colors.borderDim }}
            >
              <div className="flex justify-between">
                <span style={{ color: theme.colors.textDim }}>비용</span>
                <span
                  style={{
                    color:
                      playerGold >= (cost?.goldCost ?? 0)
                        ? theme.colors.text
                        : theme.colors.error,
                  }}
                >
                  {cost?.goldCost.toLocaleString()}G
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: theme.colors.textMuted }}>보유 골드</span>
                <span style={{ color: theme.colors.textMuted }}>
                  {playerGold.toLocaleString()}G
                </span>
              </div>
            </div>
          </div>

          {/* 옵션 */}
          {config?.failPenalty === "destroy" && (
            <div
              className="p-2 rounded mb-4"
              style={{ background: `${theme.colors.error}20` }}
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useProtection}
                  onChange={(e) => setUseProtection(e.target.checked)}
                  className="w-4 h-4"
                />
                <span style={{ color: theme.colors.text }}>
                  파괴 보호 사용 (실패 시 하락으로 변경)
                </span>
              </label>
            </div>
          )}

          {/* 강화 버튼 */}
          <button
            onClick={handleEnhance}
            disabled={!canEnhance}
            className="w-full py-3 rounded font-bold transition-all"
            style={{
              background: canEnhance ? theme.colors.primary : theme.colors.bgDark,
              color: canEnhance ? "#000" : theme.colors.textMuted,
              opacity: enhanceMutation.isPending ? 0.7 : 1,
            }}
          >
            {enhanceMutation.isPending
              ? "강화 중..."
              : !cost
              ? "최대 강화"
              : playerGold < cost.goldCost
              ? "골드 부족"
              : `+${targetLevel} 강화하기`}
          </button>
        </>
      )}
    </div>
  );
}
