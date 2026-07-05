"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useThemeStore } from "@/application/stores";
import { ApiError } from "@/shared/api";
import type { Npc } from "@/entities/npc";
import { profileKeys } from "@/entities/user";
import { inventoryKeys } from "@/entities/inventory";
import { acceptQuest, claimQuest } from "../api";
import { useQuests, questKeys } from "../queries";
import { getObjectiveText, canClaim, QUEST_STATUS_LABEL } from "../lib";
import type { QuestWithStatus, QuestClaimResult } from "../types";

interface QuestDialogProps {
  npc: Npc;
  userId: string;
  playerLevel: number;
  currentMapId: string;
  onClose: () => void;
}

/**
 * 퀘스트 NPC 대화 모달 (HealerDialog 템플릿).
 * 수락/보상 수령은 서버 권위(useAcceptQuest/useClaimQuest).
 */
export function QuestDialog({ npc, userId, playerLevel, currentMapId, onClose }: QuestDialogProps) {
  const { theme } = useThemeStore();
  const queryClient = useQueryClient();
  const { data: allQuests = [], isLoading } = useQuests(userId);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: questKeys.list(userId) });
    queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
    queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(userId) });
  };

  const acceptMutation = useMutation({
    mutationFn: (questId: string) => acceptQuest(questId),
    onSuccess: () => {
      toast.success("퀘스트를 수락했습니다!", { icon: "📜" });
      queryClient.invalidateQueries({ queryKey: questKeys.list(userId) });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "퀘스트 수락에 실패했습니다"),
  });

  const claimMutation = useMutation({
    mutationFn: (questId: string) => claimQuest(questId),
    onSuccess: (result: QuestClaimResult) => {
      toast.success(`보상 획득! EXP +${result.exp}, 골드 +${result.gold}`, { icon: "🎁" });
      if (result.levelUp.leveledUp) toast.success(`레벨 업! Lv.${result.levelUp.newLevel}`, { icon: "⬆️" });
      invalidateAll();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "보상 수령에 실패했습니다"),
  });

  // 이 NPC의 퀘스트 중 아직 수령 완료되지 않은 것만
  const quests = allQuests.filter((q) => q.npcId === npc.id && q.status !== "claimed");

  const busy = acceptMutation.isPending || claimMutation.isPending;

  const renderAction = (q: QuestWithStatus) => {
    if (q.status === "available") {
      const levelOk = playerLevel >= q.minLevel;
      return (
        <button
          onClick={() => acceptMutation.mutate(q.id)}
          disabled={!levelOk || busy}
          className="w-full py-2 text-sm font-mono transition-colors"
          style={{
            background: levelOk ? theme.colors.primary : theme.colors.bgLight,
            color: levelOk ? theme.colors.bg : theme.colors.textMuted,
            cursor: levelOk && !busy ? "pointer" : "not-allowed",
            opacity: busy ? 0.5 : 1,
          }}
        >
          {levelOk ? "📜 수락하기" : `🔒 Lv.${q.minLevel} 필요`}
        </button>
      );
    }
    const claimable = canClaim(q, currentMapId);
    return (
      <button
        onClick={() => claimMutation.mutate(q.id)}
        disabled={!claimable || busy}
        className="w-full py-2 text-sm font-mono transition-colors"
        style={{
          background: claimable ? theme.colors.success : theme.colors.bgLight,
          color: claimable ? theme.colors.bg : theme.colors.textMuted,
          cursor: claimable && !busy ? "pointer" : "not-allowed",
          opacity: busy ? 0.5 : 1,
        }}
      >
        {claimable ? "🎁 보상 받기" : "진행 중..."}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md"
        style={{ background: theme.colors.bg, border: `2px solid ${theme.colors.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-4 border-b" style={{ borderColor: theme.colors.border }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{npc.icon}</span>
            <div className="flex-1 min-w-0">
              <h2 className="font-mono font-bold truncate" style={{ color: theme.colors.text }}>
                {npc.nameKo}
              </h2>
              <p className="text-sm font-mono" style={{ color: theme.colors.textMuted }}>
                {quests.length > 0 ? npc.dialogues.questAvailable ?? npc.dialogues.greeting : npc.dialogues.noQuest ?? "지금은 맡길 일이 없네."}
              </p>
            </div>
          </div>
        </div>

        {/* 퀘스트 목록 */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <p className="text-center font-mono py-8" style={{ color: theme.colors.textMuted }}>
              불러오는 중...
            </p>
          ) : quests.length === 0 ? (
            <p className="text-center font-mono py-8" style={{ color: theme.colors.textMuted }}>
              지금은 수행할 퀘스트가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {quests.map((q) => (
                <div
                  key={q.id}
                  className="p-3"
                  style={{ background: theme.colors.bgDark, border: `1px solid ${theme.colors.border}` }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-medium" style={{ color: theme.colors.text }}>
                      {q.nameKo}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: theme.colors.primary }}>
                      {QUEST_STATUS_LABEL[q.status]}
                    </span>
                  </div>
                  <p className="text-xs font-mono mb-2" style={{ color: theme.colors.textMuted }}>
                    {q.descriptionKo}
                  </p>
                  <div className="flex items-center justify-between mb-2 text-xs font-mono">
                    <span style={{ color: theme.colors.textDim }}>
                      🎯 {getObjectiveText(q.objective, q.progress)}
                    </span>
                    <span style={{ color: theme.colors.warning }}>
                      EXP {q.rewards.exp} · 💰 {q.rewards.gold}
                    </span>
                  </div>
                  {renderAction(q)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t flex justify-end" style={{ borderColor: theme.colors.border }}>
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
