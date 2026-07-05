"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useThemeStore } from "@/shared/config";
import {
  INJURY_CONFIG,
  type CharacterInjury,
  type InjuryType,
} from "@/entities/status";
import type { Npc } from "@/entities/npc";
import { healInjuryWithGold, profileKeys } from "@/entities/user";
import toast from "react-hot-toast";

interface HealerDialogProps {
  npc: Npc;
  injuries: CharacterInjury[];
  playerGold: number;
  userId: string;
  onClose: () => void;
}

/**
 * 치료사 NPC 대화 모달
 */
export function HealerDialog({
  npc,
  injuries,
  playerGold,
  userId,
  onClose,
}: HealerDialogProps) {
  const { theme } = useThemeStore();
  const queryClient = useQueryClient();
  const [healingIndex, setHealingIndex] = useState<number | null>(null);

  const healMutation = useMutation({
    // 비용은 서버가 NPC 가격표로 계산·검증한다
    mutationFn: (params: { injuryIndex: number }) =>
      healInjuryWithGold(userId, params.injuryIndex, npc.id),
    onSuccess: (result, variables) => {
      if (result.success) {
        toast.success(npc.dialogues.healSuccess || "치료 완료!");
        queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
      } else {
        toast.error(npc.dialogues.notEnoughGold || "금화가 부족합니다.");
      }
      setHealingIndex(null);
    },
    onError: () => {
      toast.error("치료 중 오류가 발생했습니다.");
      setHealingIndex(null);
    },
  });

  const getHealingCost = (type: InjuryType): number => {
    return npc.services?.healing?.[type]?.gold || 0;
  };

  const handleHeal = (index: number, injury: CharacterInjury) => {
    const cost = getHealingCost(injury.type);
    if (playerGold < cost) {
      toast.error(npc.dialogues.notEnoughGold || "금화가 부족합니다.");
      return;
    }

    setHealingIndex(index);
    healMutation.mutate({ injuryIndex: index });
  };

  const getRemainingHealTime = (injury: CharacterInjury): string | null => {
    if (!injury.naturalHealAt) return null;
    const remaining = new Date(injury.naturalHealAt).getTime() - Date.now();
    if (remaining <= 0) return "곧 치유됨";
    const minutes = Math.ceil(remaining / 60000);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}시간 ${mins}분`;
    }
    return `${minutes}분`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md"
        style={{
          background: theme.colors.bg,
          border: `2px solid ${theme.colors.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="p-4 border-b"
          style={{ borderColor: theme.colors.border }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{npc.icon}</span>
            <div className="flex-1 min-w-0">
              <h2
                className="font-mono font-bold truncate"
                style={{ color: theme.colors.text }}
              >
                {npc.nameKo}
              </h2>
              <p
                className="text-sm font-mono"
                style={{ color: theme.colors.textMuted }}
              >
                {injuries.length > 0
                  ? npc.dialogues.greeting
                  : npc.dialogues.noInjury}
              </p>
            </div>
          </div>
        </div>

        {/* 부상 목록 */}
        <div className="p-4 max-h-80 overflow-y-auto">
          {injuries.length === 0 ? (
            <p
              className="text-center font-mono py-8"
              style={{ color: theme.colors.textMuted }}
            >
              치료할 부상이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {injuries.map((injury, index) => {
                const config = INJURY_CONFIG[injury.type];
                const cost = getHealingCost(injury.type);
                const canAfford = playerGold >= cost;
                const remainingTime = getRemainingHealTime(injury);
                const isHealing = healingIndex === index;

                return (
                  <div
                    key={index}
                    className="p-3"
                    style={{
                      background: theme.colors.bgDark,
                      border: `1px solid ${config.color}30`,
                    }}
                  >
                    {/* 부상 정보 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{config.icon}</span>
                        <span
                          className="font-mono font-medium"
                          style={{ color: config.color }}
                        >
                          {config.nameKo}
                        </span>
                      </div>
                      <span
                        className="text-xs font-mono"
                        style={{ color: theme.colors.textMuted }}
                      >
                        HP 회복 상한 -{config.hpRecoveryReduction * 100}%
                      </span>
                    </div>

                    {/* 자연 치유 시간 */}
                    {remainingTime && (
                      <p
                        className="text-xs font-mono mb-2"
                        style={{ color: theme.colors.textMuted }}
                      >
                        자연 치유까지: {remainingTime}
                      </p>
                    )}
                    {!injury.naturalHealAt && (
                      <p
                        className="text-xs font-mono mb-2"
                        style={{ color: theme.colors.error }}
                      >
                        자연 치유 불가 - 치료 필요
                      </p>
                    )}

                    {/* 치료 버튼 */}
                    <button
                      onClick={() => handleHeal(index, injury)}
                      disabled={!canAfford || healMutation.isPending}
                      className="w-full py-2 text-sm font-mono transition-colors flex items-center justify-center gap-2"
                      style={{
                        background: canAfford
                          ? theme.colors.primary
                          : theme.colors.bgLight,
                        color: canAfford
                          ? theme.colors.bg
                          : theme.colors.textMuted,
                        opacity: healMutation.isPending ? 0.5 : 1,
                        cursor: canAfford && !healMutation.isPending
                          ? "pointer"
                          : "not-allowed",
                      }}
                    >
                      {isHealing ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          <span>치료 중...</span>
                        </>
                      ) : (
                        <>
                          <span>💰</span>
                          <span>{cost} 골드로 즉시 치료</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div
          className="p-4 border-t flex justify-between items-center"
          style={{ borderColor: theme.colors.border }}
        >
          <span
            className="font-mono text-sm flex items-center gap-1"
            style={{ color: theme.colors.warning }}
          >
            <span>💰</span>
            <span>{playerGold.toLocaleString()}</span>
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
