// MapRoom 메시지 프로토콜 — 프론트/서버가 공유하는 이벤트 이름과 페이로드 타입.
// 기존 Supabase Realtime broadcast 이벤트 shape를 그대로 유지한다.

export const ROOM_NAME = "map";

export const MSG = {
  CHAT: "chat_message",
  WHISPER: "whisper",
  WHISPER_ERROR: "whisper_error",
  DUEL_REQUEST: "duel_request",
  DUEL_RESPONSE: "duel_response",
  DUEL_START: "duel_start",
  DUEL_ACTION: "duel_action",
  DUEL_END: "duel_end",
} as const;

export type MessageType = "normal" | "whisper" | "system";

export interface ChatMessagePayload {
  id: string;
  mapId: string;
  senderId: string;
  senderName: string;
  messageType: MessageType;
  recipientName?: string;
  content: string;
  createdAt: string;
}

export interface WhisperErrorPayload {
  code: "NO_CHARGES" | "TIER_TOO_LOW" | "RECIPIENT_OFFLINE";
  message: string;
}

export interface DuelRequestPayload {
  challengerId: string;
  challengerName: string;
  targetId: string;
  targetName: string;
  mapId: string;
  timestamp: number;
}

export interface DuelResponsePayload {
  challengerId: string;
  targetId: string;
  targetName: string;
  accepted: boolean;
}

// duel_start/action/end 페이로드의 내부 구조(DuelState 등)는 프론트 pvpStore가 소유하며
// 서버는 내용 검사 없이 그대로 릴레이한다.
export interface DuelStartPayload {
  duelState: unknown & { player1: { id: string }; player2: { id: string } };
}

export interface DuelActionPayload {
  action: unknown & { duelId: string; actorId: string };
}

export interface DuelEndPayload {
  result: unknown & { duelId: string };
}

export interface JoinOptions {
  mapId: string;
  characterName: string;
}
