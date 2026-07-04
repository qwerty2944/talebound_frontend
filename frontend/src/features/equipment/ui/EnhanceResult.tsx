"use client";

// ============ EnhanceResult ============
// 강화 결과 표시 컴포넌트

import { useThemeStore } from "@/application/stores";
import { getEnhancementColor } from "@/entities/item/types/enhancement";

interface EnhanceResultProps {
  result: {
    success: boolean;
    result: string;
    previousLevel: number;
    newLevel: number;
  };
  itemName: string;
  onClose: () => void;
}

export function EnhanceResult({ result, itemName, onClose }: EnhanceResultProps) {
  const { theme } = useThemeStore();

  const getResultEmoji = () => {
    switch (result.result) {
      case "success":
        return "✨";
      case "fail":
        return "😓";
      case "downgrade":
        return "💔";
      case "destroy":
        return "💥";
      default:
        return "❓";
    }
  };

  const getResultTitle = () => {
    switch (result.result) {
      case "success":
        return "강화 성공!";
      case "fail":
        return "강화 실패";
      case "downgrade":
        return "강화 단계 하락";
      case "destroy":
        return "장비 파괴!";
      default:
        return "알 수 없는 결과";
    }
  };

  const getResultColor = () => {
    switch (result.result) {
      case "success":
        return theme.colors.success;
      case "fail":
        return theme.colors.warning;
      case "downgrade":
        return theme.colors.warning;
      case "destroy":
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  };

  const getResultMessage = () => {
    switch (result.result) {
      case "success":
        return `${itemName}이(가) +${result.newLevel}로 강화되었습니다!`;
      case "fail":
        return `강화에 실패했지만, 장비는 그대로입니다.`;
      case "downgrade":
        return `강화에 실패하여 +${result.newLevel}로 하락했습니다.`;
      case "destroy":
        return `강화에 실패하여 장비가 파괴되었습니다...`;
      default:
        return "";
    }
  };

  return (
    <div
      className="p-6 rounded-lg border font-mono text-center"
      style={{
        background: theme.colors.bg,
        borderColor: theme.colors.border,
      }}
    >
      {/* 애니메이션 이모지 */}
      <div
        className="text-6xl mb-4 animate-bounce"
        style={{
          animationDuration: result.success ? "0.5s" : "1s",
        }}
      >
        {getResultEmoji()}
      </div>

      {/* 결과 타이틀 */}
      <h3
        className="text-2xl font-bold mb-2"
        style={{ color: getResultColor() }}
      >
        {getResultTitle()}
      </h3>

      {/* 레벨 변경 표시 */}
      {result.result !== "destroy" && (
        <div className="flex items-center justify-center gap-4 mb-4">
          <span
            className="text-xl"
            style={{ color: getEnhancementColor(result.previousLevel) }}
          >
            +{result.previousLevel}
          </span>
          <span style={{ color: theme.colors.textMuted }}>→</span>
          <span
            className="text-xl font-bold"
            style={{ color: getEnhancementColor(result.newLevel) }}
          >
            +{result.newLevel}
          </span>
        </div>
      )}

      {/* 결과 메시지 */}
      <p
        className="mb-6"
        style={{ color: theme.colors.textDim }}
      >
        {getResultMessage()}
      </p>

      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        className="px-6 py-2 rounded font-bold transition-all hover:opacity-80"
        style={{
          background: theme.colors.primary,
          color: "#000",
        }}
      >
        확인
      </button>
    </div>
  );
}
