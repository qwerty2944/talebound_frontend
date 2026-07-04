import { apiFetch } from "@/shared/api";
import type { GameSettings } from "../types";

/**
 * 게임 설정을 조회합니다.
 */
export async function fetchGameSettings(): Promise<GameSettings | null> {
  try {
    const data = await apiFetch<GameSettings | null>("/api/game-settings");
    return data;
  } catch (error) {
    console.error("[GameSettings] Fetch error:", error);
    return null;
  }
}
