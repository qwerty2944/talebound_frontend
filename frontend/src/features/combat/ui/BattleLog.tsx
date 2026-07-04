"use client";

import { useEffect, useRef, useState } from "react";
import { useThemeStore } from "@/shared/config";
import { useBattleStore } from "@/application/stores";

export function BattleLog() {
  const { theme } = useThemeStore();
  const { battle } = useBattleStore();
  const logRef = useRef<HTMLDivElement>(null);
  const [newLogIndex, setNewLogIndex] = useState(-1);

  // 로그 자동 스크롤 및 새 로그 애니메이션
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
    if (battle.battleLog.length > 0) {
      setNewLogIndex(battle.battleLog.length - 1);
      const timer = setTimeout(() => setNewLogIndex(-1), 500);
      return () => clearTimeout(timer);
    }
  }, [battle.battleLog]);

  const getLogColor = (
    actor: "player" | "monster" | "system",
    action: string
  ): string => {
    // 결과 관련
    if (action === "victory") return theme.colors.success;
    if (action === "defeat") return theme.colors.error;
    if (action === "flee" || action === "flee_fail") return theme.colors.warning;

    // 상태이상 관련
    if (action === "buff" || action === "hot" || action === "heal")
      return theme.colors.success;
    if (action === "debuff" || action === "dot") return theme.colors.error;
    if (action === "buff_expire" || action === "debuff_expire")
      return theme.colors.textMuted;
    if (action === "shield_absorb") return theme.colors.primary;

    // 방어/회피 관련
    if (action === "defense" || action === "guard_success" || action === "dodge_success")
      return theme.colors.success;
    if (action === "block_counter" || action === "counter")
      return theme.colors.warning;

    // 패시브 스킬
    if (action === "passive") return theme.colors.primary;

    // 시스템 메시지
    if (actor === "system") return theme.colors.textDim;

    // 공격 관련
    if (actor === "player") return theme.colors.primary;
    if (actor === "monster") return theme.colors.error;

    return theme.colors.text;
  };

  const getLogIcon = (actor: "player" | "monster" | "system", action: string): string => {
    // 결과
    if (action === "victory") return ">";
    if (action === "defeat") return ">";
    if (action === "flee") return ">";
    if (action === "flee_fail") return "!";

    // 전투
    if (actor === "player" && action === "attack") return ">>>";
    if (actor === "monster") return "<<<";

    // 방어/회피
    if (action === "defense") return "o";
    if (action === "guard_success") return "O";
    if (action === "dodge_success") return "*";
    if (action === "block_counter") return "!";

    // 패시브
    if (action === "passive") return "+";

    // 힐/버프
    if (action === "heal" || action === "hot") return "+";
    if (action === "buff") return "^";
    if (action === "debuff" || action === "dot") return "v";

    // 시스템
    if (actor === "system") return "-";

    return ">";
  };

  return (
    <div
      ref={logRef}
      className="h-36 overflow-y-auto px-3 py-2 space-y-0.5 font-mono text-xs"
      style={{
        background: theme.colors.bgDark,
        borderTop: `1px solid ${theme.colors.border}`,
        borderBottom: `1px solid ${theme.colors.border}`,
      }}
    >
      {battle.battleLog.map((log, idx) => {
        const isNew = idx === newLogIndex;
        const icon = getLogIcon(log.actor, log.action);
        const color = getLogColor(log.actor, log.action);

        return (
          <div
            key={idx}
            className={`flex items-start gap-1 py-0.5 transition-all duration-300 ${
              isNew ? "animate-pulse" : ""
            }`}
            style={{
              color,
              opacity: isNew ? 1 : 0.9,
              transform: isNew ? "translateX(2px)" : "none",
            }}
          >
            <span
              className="flex-shrink-0 w-6 text-center opacity-60"
              style={{ fontSize: "10px" }}
            >
              {icon}
            </span>
            <span className="flex-1">{log.message}</span>
            {log.damage && log.damage > 0 && (
              <span
                className="flex-shrink-0 px-1 rounded text-[10px] font-bold"
                style={{
                  background: log.actor === "player"
                    ? `${theme.colors.primary}30`
                    : `${theme.colors.error}30`,
                }}
              >
                -{log.damage}
              </span>
            )}
            {log.heal && log.heal > 0 && (
              <span
                className="flex-shrink-0 px-1 rounded text-[10px] font-bold"
                style={{ background: `${theme.colors.success}30` }}
              >
                +{log.heal}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
