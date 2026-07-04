"use client";

import { useCallback, useRef, useEffect } from "react";
import type { Room } from "colyseus.js";
import {
  usePvpStore,
  type DuelRequest,
  type DuelAction,
  type DuelState,
  type DuelEndResult,
} from "@/application/stores";
import { DEFAULT_PROFICIENCIES } from "@/entities/ability";

// ============ 이벤트 페이로드 타입 ============

interface DuelRequestPayload {
  challengerId: string;
  challengerName: string;
  targetId: string;
  targetName: string;
  mapId: string;
  timestamp: number;
}

interface DuelResponsePayload {
  challengerId: string;
  targetId: string;
  targetName: string;
  accepted: boolean;
}

interface DuelStartPayload {
  duelState: DuelState;
}

interface DuelActionPayload {
  action: DuelAction;
}

interface DuelEndPayload {
  result: DuelEndResult;
}

// ============ 훅 ============

interface UseRealtimeDuelProps {
  mapId: string;
  userId: string;
  characterName: string;
  room: Room | null;
  onDuelStart?: () => void;
  onDuelEnd?: (result: DuelEndResult) => void;
}

const DUEL_REQUEST_TIMEOUT = 30000; // 30초

export function useRealtimeDuel({
  mapId,
  userId,
  characterName,
  room,
  onDuelStart,
  onDuelEnd,
}: UseRealtimeDuelProps) {
  const {
    setSentRequest,
    addPendingRequest,
    removePendingRequest,
    clearExpiredRequests,
    setDeclineNotice,
    startDuel,
    applyAction,
    switchTurn,
    endDuel,
    resetDuel,
    activeDuel,
    pendingRequests,
    sentRequest,
    declineNotice,
  } = usePvpStore();

  const expiryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 만료 요청 정리 타이머
  useEffect(() => {
    const interval = setInterval(() => {
      clearExpiredRequests();
    }, 5000);

    return () => clearInterval(interval);
  }, [clearExpiredRequests]);

  // ============ 도전 신청 ============

  const requestDuel = useCallback(
    (targetId: string, targetName: string) => {
      if (!room || !userId || !characterName) return;

      // 이미 보낸 요청이 있으면 무시
      if (sentRequest) {
        console.warn("Already sent a duel request");
        return;
      }

      // 이미 결투 중이면 무시
      if (activeDuel) {
        console.warn("Already in a duel");
        return;
      }

      const now = Date.now();
      const request: DuelRequest = {
        challengerId: userId,
        challengerName: characterName,
        targetId,
        targetName,
        mapId,
        requestedAt: now,
        expiresAt: now + DUEL_REQUEST_TIMEOUT,
      };

      // 로컬 상태 저장
      setSentRequest(request);

      // 룸으로 전송 (서버가 다른 클라이언트에 릴레이)
      room.send("duel_request", {
        challengerId: userId,
        challengerName: characterName,
        targetId,
        targetName,
        mapId,
        timestamp: now,
      } satisfies DuelRequestPayload);

      // 타임아웃 설정
      expiryTimerRef.current = setTimeout(() => {
        setSentRequest(null);
      }, DUEL_REQUEST_TIMEOUT);
    },
    [room, userId, characterName, mapId, sentRequest, activeDuel, setSentRequest]
  );

  // ============ 도전 취소 ============

  const cancelDuelRequest = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
    setSentRequest(null);
  }, [setSentRequest]);

  // ============ 도전 응답 (수락/거절) ============

  const respondToDuel = useCallback(
    (challengerId: string, accepted: boolean) => {
      if (!room || !userId || !characterName) return;

      room.send("duel_response", {
        challengerId,
        targetId: userId,
        targetName: characterName,
        accepted,
      } satisfies DuelResponsePayload);

      // 대기 목록에서 제거
      removePendingRequest(challengerId);
    },
    [room, userId, characterName, removePendingRequest]
  );

  // ============ 결투 시작/행동/종료 전송 ============

  const broadcastDuelStart = useCallback(
    (duelState: DuelState) => {
      room?.send("duel_start", { duelState } satisfies DuelStartPayload);
    },
    [room]
  );

  const broadcastAction = useCallback(
    (action: DuelAction) => {
      room?.send("duel_action", { action } satisfies DuelActionPayload);
    },
    [room]
  );

  const broadcastDuelEnd = useCallback(
    (result: DuelEndResult) => {
      room?.send("duel_end", { result } satisfies DuelEndPayload);
    },
    [room]
  );

  // ============ 이벤트 핸들러 등록 ============

  useEffect(() => {
    if (!room || !userId || !characterName) return;

    // 도전 신청 수신
    const offRequest = room.onMessage("duel_request", (payload: DuelRequestPayload) => {
      // 나에게 온 도전만 처리
      if (payload.targetId !== userId) return;

      // 이미 결투 중이면 무시
      if (activeDuel) return;

      const request: DuelRequest = {
        challengerId: payload.challengerId,
        challengerName: payload.challengerName,
        targetId: payload.targetId,
        targetName: characterName,
        mapId: payload.mapId,
        requestedAt: payload.timestamp,
        expiresAt: payload.timestamp + DUEL_REQUEST_TIMEOUT,
      };

      addPendingRequest(request);
    });

    // 도전 응답 수신
    const offResponse = room.onMessage("duel_response", (payload: DuelResponsePayload) => {
      // 내가 보낸 요청에 대한 응답만 처리
      if (payload.challengerId !== userId) return;

      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }

      if (payload.accepted && sentRequest) {
        // 수락됨 - 도전자가 결투 상태를 생성하고 전송
        const duelId = `duel-${userId}-${payload.targetId}-${Date.now()}`;

        // TODO: 실제 스탯과 숙련도 가져오기
        const defaultStats = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, lck: 10, ambushChance: 0, ambushDamage: 0 };

        const player1 = {
          id: userId,
          name: characterName,
          stats: defaultStats,
          currentHp: 100,
          maxHp: 100,
          proficiencies: DEFAULT_PROFICIENCIES,
        };

        const player2 = {
          id: payload.targetId,
          name: payload.targetName,
          stats: defaultStats,
          currentHp: 100,
          maxHp: 100,
          proficiencies: DEFAULT_PROFICIENCIES,
        };

        // DEX 비교로 선공 결정
        const firstTurnId =
          player1.stats.dex > player2.stats.dex
            ? player1.id
            : player2.stats.dex > player1.stats.dex
              ? player2.id
              : Math.random() < 0.5
                ? player1.id
                : player2.id;

        const duelState: DuelState = {
          duelId,
          player1,
          player2,
          currentTurnId: firstTurnId,
          turn: 1,
          battleLog: [
            {
              turn: 0,
              actorId: "system",
              actorName: "시스템",
              action: "start",
              message: `${player1.name} VS ${player2.name} 결투 시작!`,
              timestamp: Date.now(),
            },
          ],
          result: "ongoing",
          startedAt: Date.now(),
        };

        // 로컬 상태 업데이트
        startDuel(duelState);

        // 전송
        broadcastDuelStart(duelState);

        onDuelStart?.();
      } else {
        // 거절됨 - 알림 표시
        setDeclineNotice({
          targetName: payload.targetName,
          timestamp: Date.now(),
        });
        setSentRequest(null);
      }
    });

    // 결투 시작 수신
    const offStart = room.onMessage("duel_start", (payload: DuelStartPayload) => {
      const { duelState } = payload;

      // 내가 참가자인 경우에만 처리
      if (duelState.player1.id !== userId && duelState.player2.id !== userId) {
        return;
      }

      // 이미 결투 중이면 무시 (도전자가 이미 설정함)
      if (activeDuel && activeDuel.duelId === duelState.duelId) {
        return;
      }

      startDuel(duelState);
      onDuelStart?.();
    });

    // 턴 행동 수신
    const offAction = room.onMessage("duel_action", (payload: DuelActionPayload) => {
      const { action } = payload;

      // 현재 결투의 액션만 처리
      if (!activeDuel || activeDuel.duelId !== action.duelId) return;

      // 내가 보낸 액션이 아닌 경우에만 적용 (상대방의 액션)
      if (action.actorId !== userId) {
        applyAction(action);
        switchTurn();
      }
    });

    // 결투 종료 수신
    const offEnd = room.onMessage("duel_end", (payload: DuelEndPayload) => {
      const { result } = payload;

      // 현재 결투의 종료만 처리
      if (!activeDuel || activeDuel.duelId !== result.duelId) return;

      endDuel(result);
      onDuelEnd?.(result);
    });

    // 클린업: 리스너 해제
    return () => {
      offRequest?.();
      offResponse?.();
      offStart?.();
      offAction?.();
      offEnd?.();
    };
  }, [
    room,
    userId,
    characterName,
    activeDuel,
    sentRequest,
    addPendingRequest,
    removePendingRequest,
    setSentRequest,
    setDeclineNotice,
    startDuel,
    applyAction,
    switchTurn,
    endDuel,
    broadcastDuelStart,
    onDuelStart,
    onDuelEnd,
  ]);

  // 거절 알림 초기화
  const clearDeclineNotice = useCallback(() => {
    setDeclineNotice(null);
  }, [setDeclineNotice]);

  return {
    // 도전 신청
    requestDuel,
    cancelDuelRequest,
    respondToDuel,

    // 턴 행동
    broadcastAction,
    broadcastDuelEnd,

    // 상태
    sentRequest,
    pendingRequests,
    activeDuel,
    isInDuel: activeDuel !== null && activeDuel.result === "ongoing",
    declineNotice,
    clearDeclineNotice,

    // 결투 종료 후 리셋
    resetDuel,
  };
}
