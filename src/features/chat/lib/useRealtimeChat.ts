"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { Room } from "colyseus.js";
import { getStateCallbacks } from "colyseus.js";
import { joinMapRoom } from "@/shared/api/colyseus";
import { useGameStore, useChatStore, parseChatCommand, type OnlineUser } from "@/application/stores";
import { fetchRecentMessages, type ChatMessage } from "@/entities/chat";
import { useMaps, getMapById } from "@/entities/map";

interface UseRealtimeChatProps {
  mapId: string;
  userId: string;
  characterName: string;
}

export function useRealtimeChat({
  mapId,
  userId,
  characterName,
}: UseRealtimeChatProps) {
  const roomRef = useRef<Room | null>(null);
  const mountedRef = useRef(true);
  const [room, setRoom] = useState<Room | null>(null);

  const { setOnlineUsers, setConnected } = useGameStore();
  const { data: maps = [] } = useMaps();

  // maps를 ref로 저장하여 항상 최신 값 참조 (클로저 문제 해결)
  const mapsRef = useRef(maps);
  mapsRef.current = maps;
  const {
    addMessage,
    addMessages,
    lastWhisperFrom,
    clearMessages,
    loadFromCache,
    saveToCache,
  } = useChatStore();

  // 채팅 히스토리 로드 (캐시 우선)
  const loadHistory = useCallback(async () => {
    // 1. 캐시에서 먼저 로드 (즉시 표시)
    loadFromCache(mapId);

    try {
      // 2. 서버에서 최신 데이터 가져오기
      const messages = await fetchRecentMessages(mapId, 50);

      // 시간순 정렬 (오래된 것 먼저)
      messages.reverse();
      addMessages(messages);

      // 3. 캐시 업데이트
      saveToCache(mapId);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  }, [mapId, addMessages, loadFromCache, saveToCache]);

  // 메시지 전송
  const sendMessage = useCallback(
    async (input: string): Promise<boolean> => {
      const parsed = parseChatCommand(input, lastWhisperFrom);
      if (!parsed) return false;

      const currentRoom = roomRef.current;
      if (!currentRoom) return false;

      const messageId = `${userId}-${Date.now()}`;
      const message: ChatMessage = {
        id: messageId,
        mapId,
        senderId: userId,
        senderName: characterName,
        messageType: parsed.type,
        recipientName: parsed.recipient,
        content: parsed.content,
        createdAt: new Date().toISOString(),
      };

      // 로컬에 먼저 추가 (즉시 표시)
      addMessage(message);

      // 서버로 전송 (릴레이 + DB 저장은 서버가 처리)
      if (parsed.type === "normal") {
        currentRoom.send("chat_message", message);
      } else if (parsed.type === "whisper" && parsed.recipient) {
        currentRoom.send("whisper", message);
      }

      saveToCache(mapId);
      return true;
    },
    [mapId, userId, characterName, lastWhisperFrom, saveToCache, addMessage]
  );

  // 시스템 메시지 추가
  const addSystemMessage = useCallback(
    (content: string) => {
      addMessage({
        id: `system-${Date.now()}`,
        mapId,
        senderId: "system",
        senderName: "시스템",
        messageType: "system",
        content,
        createdAt: new Date().toISOString(),
      });
    },
    [mapId, addMessage]
  );

  // Colyseus 룸 연결
  useEffect(() => {
    if (!mapId || !userId || !characterName) {
      console.log("[Colyseus] Skipping - missing params:", { mapId, userId, characterName });
      return;
    }

    console.log("[Colyseus] Joining map room:", { mapId, userId, characterName });
    mountedRef.current = true;
    let disposed = false;
    let joinedRoom: Room | null = null;

    clearMessages();

    joinMapRoom({ mapId, characterName })
      .then(async (r) => {
        if (disposed) {
          r.leave();
          return;
        }

        joinedRoom = r;
        roomRef.current = r;
        setRoom(r);
        setConnected(true);

        // ---- 채팅/귓말 수신 ----
        r.onMessage("chat_message", (payload: ChatMessage) => {
          if (mountedRef.current) addMessage(payload);
        });

        r.onMessage("whisper", (payload: ChatMessage) => {
          if (mountedRef.current) addMessage(payload);
        });

        r.onMessage("whisper_error", (payload: { message: string }) => {
          if (mountedRef.current) addSystemMessage(payload.message);
        });

        // ---- 접속자 목록 (presence 대체) ----
        const $ = getStateCallbacks(r);
        const players = new Map<string, OnlineUser>();

        const syncOnlineUsers = () => {
          if (!mountedRef.current) return;
          setOnlineUsers(Array.from(players.values()));
        };

        $(r.state).players.onAdd(
          (player: { userId: string; characterName: string }, sessionId: string) => {
            players.set(sessionId, {
              userId: player.userId,
              characterName: player.characterName || "Unknown",
            });
            syncOnlineUsers();

            if (player.userId !== userId && mountedRef.current) {
              addSystemMessage(`${player.characterName}님이 입장했습니다.`);
            }
          }
        );

        $(r.state).players.onRemove(
          (player: { userId: string; characterName: string }, sessionId: string) => {
            players.delete(sessionId);
            syncOnlineUsers();

            if (player.userId !== userId && mountedRef.current) {
              addSystemMessage(`${player.characterName}님이 퇴장했습니다.`);
            }
          }
        );

        r.onLeave(() => {
          if (mountedRef.current) setConnected(false);
        });

        // 히스토리 로드 (위치 업데이트는 서버 onJoin이 처리)
        await loadHistory();

        if (mountedRef.current) {
          // maps 로딩 대기 후 메시지 표시
          let retryCount = 0;
          const showEntryMessage = () => {
            if (!mountedRef.current) return;

            const mapData = getMapById(mapsRef.current, mapId);
            if (mapData?.nameKo) {
              addSystemMessage(`${mapData.nameKo}에 입장했습니다.`);
            } else if (mapsRef.current.length === 0 && retryCount < 5) {
              retryCount++;
              setTimeout(showEntryMessage, 200);
            } else {
              addSystemMessage(`${mapId}에 입장했습니다.`);
            }
          };
          showEntryMessage();
        }
      })
      .catch((error) => {
        console.error("[Colyseus] Failed to join room:", error);
        if (mountedRef.current) setConnected(false);
      });

    // 클린업
    return () => {
      disposed = true;
      mountedRef.current = false;
      // 떠나기 전 캐시 저장
      saveToCache(mapId);
      joinedRoom?.leave();
      roomRef.current = null;
      setRoom(null);
      setConnected(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId, userId, characterName]);

  return {
    sendMessage,
    addSystemMessage,
    room,
  };
}
