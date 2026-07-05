"use client";

import { useThemeStore } from "@/shared/config";

// 마법 속성 타입
export type MagicElement = "all" | "fire" | "ice" | "lightning" | "earth" | "holy" | "dark";

// 마법 속성 정보
const MAGIC_ELEMENTS: Record<MagicElement, { nameKo: string; icon: string }> = {
  all: { nameKo: "전체", icon: "🔮" },
  fire: { nameKo: "화염", icon: "🔥" },
  ice: { nameKo: "냉기", icon: "❄️" },
  lightning: { nameKo: "번개", icon: "⚡" },
  earth: { nameKo: "대지", icon: "🪨" },
  holy: { nameKo: "신성", icon: "✨" },
  dark: { nameKo: "암흑", icon: "🌑" },
};

const ELEMENT_ORDER: MagicElement[] = ["all", "fire", "ice", "lightning", "earth", "holy", "dark"];

interface MagicSubTabsProps {
  activeElement: MagicElement;
  onElementChange: (element: MagicElement) => void;
  availableElements: string[];  // 배운 마법이 있는 속성 (UI 표시용, 모든 탭은 항상 클릭 가능)
  disabled?: boolean;
}

export function MagicSubTabs({
  activeElement,
  onElementChange,
  availableElements,
  disabled = false,
}: MagicSubTabsProps) {
  const { theme } = useThemeStore();

  return (
    <div
      className="flex gap-1 overflow-x-auto pb-2 mb-2"
      style={{ borderBottom: `1px solid ${theme.colors.borderDim}` }}
    >
      {ELEMENT_ORDER.map((element) => {
        const isActive = activeElement === element;
        const hasSpells = element === "all" || availableElements.includes(element);
        const { nameKo, icon } = MAGIC_ELEMENTS[element];

        return (
          <button
            key={element}
            onClick={() => !disabled && onElementChange(element)}
            disabled={disabled}
            className="flex items-center gap-0.5 px-2 py-1 text-xs font-mono whitespace-nowrap transition-colors"
            style={{
              background: isActive ? theme.colors.primary + "30" : "transparent",
              color: isActive
                ? theme.colors.primary
                : hasSpells
                ? theme.colors.text
                : theme.colors.textMuted,
              borderRadius: "4px",
              opacity: disabled ? 0.4 : hasSpells ? 1 : 0.6,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
            title={hasSpells ? nameKo : `${nameKo} (마법 없음)`}
          >
            <span>{icon}</span>
            <span className="hidden sm:inline">{nameKo}</span>
          </button>
        );
      })}
    </div>
  );
}

// 외부에서 사용할 수 있도록 MAGIC_ELEMENTS 내보내기
export { MAGIC_ELEMENTS };
