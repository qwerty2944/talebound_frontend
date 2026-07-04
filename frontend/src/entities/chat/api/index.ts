import { rpc } from "@/shared/api";
import type { ChatMessage } from "../types";

// ============ 채팅 API ============

/**
 * 최근 메시지 조회 (RPC)
 */
export async function fetchRecentMessages(
  mapId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  const data = await rpc<
    Array<{
      id: number | string;
      map_id: string;
      sender_id: string;
      sender_name: string;
      message_type: ChatMessage["messageType"];
      recipient_id?: string;
      recipient_name?: string;
      content: string;
      created_at: string;
    }>
  >("get_recent_messages", {
    p_map_id: mapId,
    p_limit: limit,
  });

  return (data || []).map((msg) => ({
    id: msg.id.toString(),
    mapId: msg.map_id,
    senderId: msg.sender_id,
    senderName: msg.sender_name,
    messageType: msg.message_type,
    recipientId: msg.recipient_id,
    recipientName: msg.recipient_name,
    content: msg.content,
    createdAt: msg.created_at,
  }));
}

/**
 * 메시지 저장
 * @deprecated 채팅 저장은 이제 서버(MapRoom)가 브로드캐스트 시 직접 처리한다.
 */
export async function saveMessage(_message: {
  mapId: string;
  senderId: string;
  senderName: string;
  messageType: string;
  recipientName?: string;
  content: string;
}): Promise<void> {
  // no-op: MapRoom이 서버에서 저장
}
