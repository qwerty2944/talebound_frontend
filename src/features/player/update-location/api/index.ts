import { apiFetch, rpc } from "@/shared/api";

/**
 * 유저 위치 업데이트
 * - character_locations (실시간 위치 추적용, DB 함수)
 * - characters.current_map_id (영구 저장용)
 */
export async function updateLocation(params: {
  userId: string;
  characterName: string;
  mapId: string;
}): Promise<void> {
  // 1. 실시간 위치 테이블 업데이트
  await rpc("upsert_user_location", {
    p_character_name: params.characterName,
    p_map_id: params.mapId,
  });

  // 2. 캐릭터의 현재 맵 ID 업데이트 (영구 저장)
  await apiFetch("/api/profile", {
    method: "PATCH",
    body: { current_map_id: params.mapId },
  });
}
