import { apiFetch } from "@/shared/api";
import type { Dungeon, DungeonStartResponse, DungeonAdvanceResponse } from "../types";

/** 던전 정의는 정적 JSON에서 로드 (몬스터/맵과 동일 패턴) */
let dungeonsCache: Dungeon[] | null = null;

export async function fetchDungeons(): Promise<Dungeon[]> {
  if (dungeonsCache) return dungeonsCache;
  try {
    const res = await fetch("/data/world/dungeons.json");
    if (!res.ok) return [];
    const data = await res.json();
    dungeonsCache = (data.dungeons ?? []) as Dungeon[];
    return dungeonsCache;
  } catch {
    return [];
  }
}

export async function fetchDungeonsByMap(mapId: string): Promise<Dungeon[]> {
  const dungeons = await fetchDungeons();
  return dungeons.filter((d) => d.entryMapId === mapId);
}

// ============ 서버 권위 API ============

export function startDungeon(dungeonId: string): Promise<DungeonStartResponse> {
  return apiFetch<DungeonStartResponse>("/api/dungeon/start", {
    method: "POST",
    body: { dungeonId },
  });
}

export function advanceDungeon(params: {
  runToken: string;
  battleToken: string;
  currentHp: number;
  currentMp: number;
}): Promise<DungeonAdvanceResponse> {
  return apiFetch<DungeonAdvanceResponse>("/api/dungeon/advance", {
    method: "POST",
    body: params,
  });
}
