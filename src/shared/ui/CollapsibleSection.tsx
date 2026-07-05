"use client";

import { useState, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeStore } from "@/shared/config";

interface CollapsibleSectionProps {
  /** 고유 ID (localStorage 키로 사용) */
  id: string;
  /** 섹션 제목 */
  title: string;
  /** 아이콘 (선택) */
  icon?: string;
  /** 기본 열림 상태 */
  defaultOpen?: boolean;
  /** 헤더 우측에 표시할 추가 정보 */
  badge?: ReactNode;
  /** 자식 요소 */
  children: ReactNode;
  /** 추가 클래스 */
  className?: string;
}

const STORAGE_KEY_PREFIX = "collapsible_";

// 커스텀 easing 커브
const easeOutExpo: [number, number, number, number] = [0.04, 0.62, 0.23, 0.98];

// 애니메이션 variants
const contentVariants = {
  open: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.3, ease: easeOutExpo },
      opacity: { duration: 0.25, delay: 0.05 },
    },
  },
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.3, ease: easeOutExpo },
      opacity: { duration: 0.2 },
    },
  },
};

/**
 * 접을 수 있는 섹션 컴포넌트
 * - localStorage로 열림/닫힘 상태 유지
 * - Framer Motion으로 부드러운 애니메이션
 */
export function CollapsibleSection({
  id,
  title,
  icon,
  defaultOpen = true,
  badge,
  children,
  className = "",
}: CollapsibleSectionProps) {
  const { theme } = useThemeStore();
  const storageKey = `${STORAGE_KEY_PREFIX}${id}`;

  // localStorage에서 초기 상태 로드
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return defaultOpen;
    const stored = localStorage.getItem(storageKey);
    return stored !== null ? stored === "true" : defaultOpen;
  });

  // 상태 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem(storageKey, String(isOpen));
  }, [isOpen, storageKey]);

  return (
    <div className={className}>
      {/* 헤더 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-mono transition-colors"
        style={{
          background: theme.colors.bgLight,
          border: `1px solid ${theme.colors.border}`,
          color: theme.colors.text,
          borderRadius: isOpen ? "4px 4px 0 0" : "4px",
        }}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <span className="font-medium">{title}</span>
          {badge}
        </div>
        {/* 화살표 아이콘 애니메이션 */}
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ color: theme.colors.textMuted }}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </button>

      {/* 콘텐츠 영역 */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            variants={contentVariants}
            initial="collapsed"
            animate="open"
            exit="collapsed"
            style={{
              overflow: "hidden",
              background: theme.colors.bgDark,
              border: `1px solid ${theme.colors.border}`,
              borderTop: "none",
              borderRadius: "0 0 4px 4px",
            }}
          >
            <div className="p-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
