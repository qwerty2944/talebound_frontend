"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useThemeStore } from "@/application/stores";
import { ApiError } from "@/shared/api";
import { useCountUp } from "@/shared/lib";
import type { Npc } from "@/entities/npc";
import {
  ALL_PROFICIENCIES,
  useProficiencies,
  getProficiencyValue,
  getRankInfo,
  type ProficiencyType,
} from "@/entities/ability";
import { useTrainProficiency, trainingCost } from "../train-proficiency";

interface TrainingDialogProps {
  npc: Npc;
  userId: string;
  playerGold: number;
  onClose: () => void;
}

const MAX_VALUE = 100;

/** 훈련사(trainer) 대화 모달 — 숙련도 훈련. 비용/증가는 서버 권위. */
export function TrainingDialog({ npc, userId, playerGold, onClose }: TrainingDialogProps) {
  const { theme } = useThemeStore();
  const { data: proficiencies } = useProficiencies(userId);
  const trainMutation = useTrainProficiency(userId);
  const [trainingType, setTrainingType] = useState<ProficiencyType | null>(null);
  const [goldDisplay, goldDir] = useCountUp(playerGold);
  // 방금 상승한 숙련도(게이지 광택 + 상승 수치 플로팅용)
  const [gain, setGain] = useState<{ type: ProficiencyType; delta: number; nonce: number } | null>(
    null
  );

  const handleTrain = (type: ProficiencyType, current: number, cost: number) => {
    if (current >= MAX_VALUE) return;
    if (playerGold < cost) {
      toast.error(npc.dialogues.notEnoughGold ?? "훈련에도 비용이 든다네.");
      return;
    }
    setTrainingType(type);
    trainMutation.mutate(
      { proficiencyType: type },
      {
        onSuccess: (res) => {
          const delta = Math.max(0, res.value - current);
          setGain({ type, delta: delta || 2, nonce: (gain?.nonce ?? 0) + 1 });
          toast.success(
            `${npc.dialogues.success ?? "잘했어. 점점 나아지고 있군."} (+2 → ${res.value})`,
            { icon: "📈" }
          );
          setTrainingType(null);
        },
        onError: (e) => {
          if (e instanceof ApiError && e.code === "NOT_ENOUGH_GOLD") {
            toast.error(npc.dialogues.notEnoughGold ?? "훈련에도 비용이 든다네.");
          } else {
            toast.error(e instanceof ApiError ? e.message : "훈련에 실패했습니다");
          }
          setTrainingType(null);
        },
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
                “{npc.dialogues.train ?? npc.dialogues.greeting}”
              </div>
            </div>
          </div>
        </div>

        {/* 숙련도 목록 */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-2.5">
            {ALL_PROFICIENCIES.map((info) => {
              const type = info.id as ProficiencyType;
              const current = getProficiencyValue(proficiencies, type);
              const cost = trainingCost(current);
              const maxed = current >= MAX_VALUE;
              const canAfford = playerGold >= cost;
              const isTraining = trainingType === type;
              const rank = getRankInfo(current);
              const pct = Math.max(0, Math.min(100, current));
              const justGained = gain?.type === type;

              return (
                <div
                  key={info.id}
                  className="p-3"
                  style={{ background: theme.colors.bgDark, border: `1px solid ${theme.colors.border}` }}
                >
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base flex-none">{info.icon}</span>
                      <span className="font-mono font-medium truncate" style={{ color: theme.colors.text }}>
                        {info.nameKo}
                      </span>
                      <span className="text-[10px] font-mono flex-none" style={{ color: theme.colors.primary }}>
                        {rank.nameKo}
                      </span>
                    </div>
                    <span className="text-xs font-mono flex-none" style={{ color: theme.colors.textDim }}>
                      {current}/{MAX_VALUE}
                    </span>
                  </div>

                  {/* 게이지 */}
                  <div className="relative mb-2">
                    <div
                      className="w-full h-1.5 rounded overflow-hidden"
                      style={{ background: theme.colors.bg }}
                    >
                      <div
                        className="h-full transition-all duration-500 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: maxed ? theme.colors.success : theme.colors.primary,
                        }}
                      />
                    </div>
                    {justGained && (
                      <div
                        key={`shimmer-${gain!.nonce}`}
                        className="gauge-shimmer absolute inset-0 rounded pointer-events-none"
                      />
                    )}
                    {justGained && (
                      <span
                        key={`gain-${gain!.nonce}`}
                        className="animate-float-stat absolute font-mono font-bold text-xs pointer-events-none"
                        style={{
                          left: `${pct}%`,
                          bottom: "100%",
                          color: theme.colors.success,
                          textShadow: "0 1px 2px rgba(0,0,0,0.9)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        +{gain!.delta}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleTrain(type, current, cost)}
                    disabled={maxed || !canAfford || trainMutation.isPending}
                    className="w-full py-1.5 text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
                    style={{
                      background: maxed
                        ? theme.colors.bgLight
                        : canAfford
                        ? theme.colors.primary
                        : theme.colors.bgLight,
                      color: maxed || !canAfford ? theme.colors.textMuted : theme.colors.bg,
                      cursor: maxed || !canAfford || trainMutation.isPending ? "not-allowed" : "pointer",
                      opacity: trainMutation.isPending && !isTraining ? 0.5 : 1,
                    }}
                  >
                    {maxed ? (
                      <span>✅ 숙련 완성</span>
                    ) : isTraining ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>훈련 중...</span>
                      </>
                    ) : (
                      <>
                        <span>💰</span>
                        <span>{cost.toLocaleString()} 골드로 훈련 (+2)</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
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
                color: goldDir < 0 ? theme.colors.error : theme.colors.warning,
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
