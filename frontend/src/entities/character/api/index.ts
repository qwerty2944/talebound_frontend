import { apiFetch } from "@/shared/api";
import type { SavedCharacter } from "../types";

// ============ 캐릭터 API ============

export async function fetchCharacter(_userId: string): Promise<SavedCharacter | null> {
  const data = await apiFetch<{ character: SavedCharacter | null } | null>("/api/profile");
  return (data?.character || null) as SavedCharacter | null;
}
