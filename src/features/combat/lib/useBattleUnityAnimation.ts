"use client";

import { useEffect, useRef } from "react";
import { useBattleStore, useAppearanceStore } from "@/application/stores";

/**
 * useBattleUnityAnimation
 *
 * 보스전 유니티 스테이지에서 내 캐릭터의 애니메이션을 전투 로그와 동기화한다.
 *
 * - battleLog의 마지막 엔트리를 구독하여 이벤트를 감지:
 *   - 플레이어 공격 → ATTACK 계열
 *   - 피격(피해 > 0) → HIT/DAMAGED 계열
 *   - 승리 → VICTORY/WIN 계열, 패배 → DEATH 계열
 * - 공격/피격 모션 이후 ~700ms 뒤 IDLE로 복귀
 *
 * 상태명은 하드코딩하지 않는다. Unity 런타임이 보내주는
 * `animationCounts.states`에서 대소문자를 무시하고 후보를 매칭한다
 * (SPUM 모델마다 상태명이 다를 수 있으므로 런타임에만 알 수 있음).
 *
 * @param enabled 보스전 스테이지가 활성화되어 있을 때만 true
 */

// 이벤트별 상태명 후보 (우선순위 순, 대소문자 무시 매칭)
const STATE_CANDIDATES = {
  idle: ["IDLE", "Idle", "IDLE_BATTLE", "BATTLE_IDLE", "STAND", "WAIT"],
  attack: ["ATTACK", "Attack", "ATTACK_01", "ATTACK1", "SKILL", "CAST"],
  hit: ["HIT", "Hit", "DAMAGED", "DAMAGE", "HURT"],
  victory: ["VICTORY", "WIN", "CLEAR", "DANCE", "CHEER", "IDLE"],
  death: ["DEATH", "DIE", "DEAD", "DOWN", "FALL"],
} as const;

type EventKind = keyof typeof STATE_CANDIDATES;

export function useBattleUnityAnimation(enabled: boolean) {
  const battleLog = useBattleStore((s) => s.battle.battleLog);
  const result = useBattleStore((s) => s.battle.result);
  const animationCounts = useAppearanceStore((s) => s.animationCounts);
  const changeAnimationState = useAppearanceStore((s) => s.changeAnimationState);
  const isUnityLoaded = useAppearanceStore((s) => s.isUnityLoaded);

  const lastTimestampRef = useRef<number>(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResultRef = useRef<string>("ongoing");

  // 런타임 상태명 목록에서 후보 매칭 (대소문자 무시)
  const resolveState = (kind: EventKind): string | null => {
    const states = animationCounts?.states ?? [];
    if (states.length === 0) return null;
    const lowerStates = states.map((s) => s.toLowerCase());
    for (const candidate of STATE_CANDIDATES[kind]) {
      // 1) 정확히 일치 (대소문자 무시)
      const exactIdx = lowerStates.indexOf(candidate.toLowerCase());
      if (exactIdx >= 0) return states[exactIdx];
    }
    // 2) 부분 포함 매칭
    for (const candidate of STATE_CANDIDATES[kind]) {
      const partialIdx = lowerStates.findIndex((s) => s.includes(candidate.toLowerCase()));
      if (partialIdx >= 0) return states[partialIdx];
    }
    return null;
  };

  const play = (kind: EventKind, returnToIdle: boolean) => {
    const state = resolveState(kind);
    if (!state) return;
    changeAnimationState(state);

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (returnToIdle) {
      idleTimerRef.current = setTimeout(() => {
        const idle = resolveState("idle");
        if (idle) changeAnimationState(idle);
      }, 700);
    }
  };

  // 전투 결과(승리/패배) 모션
  useEffect(() => {
    if (!enabled || !isUnityLoaded) return;
    if (result === lastResultRef.current) return;
    lastResultRef.current = result;

    if (result === "victory") {
      play("victory", false);
    } else if (result === "defeat") {
      play("death", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, enabled, isUnityLoaded]);

  // battleLog 마지막 엔트리 구독
  useEffect(() => {
    if (!enabled || !isUnityLoaded) return;
    if (battleLog.length === 0) return;

    const last = battleLog[battleLog.length - 1];
    if (last.timestamp === lastTimestampRef.current) return;
    lastTimestampRef.current = last.timestamp;

    // 전투가 끝난 상태면 결과 모션이 우선 (여기서 건드리지 않음)
    if (result !== "ongoing") return;

    const isAttackAction = last.action.includes("attack") || last.action.includes("ability") || last.action.includes("skill") || last.action.includes("cast");

    if (last.actor === "player" && isAttackAction) {
      // 내가 공격
      play("attack", true);
    } else if (last.actor === "monster" && (last.damage ?? 0) > 0) {
      // 내가 피격
      play("hit", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleLog, enabled, isUnityLoaded, result]);

  // 정리
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // 스테이지가 열릴 때 IDLE로 초기화
  useEffect(() => {
    if (enabled && isUnityLoaded) {
      const idle = resolveState("idle");
      if (idle) changeAnimationState(idle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isUnityLoaded, animationCounts]);
}
