import type { Npc, NpcType } from "../types";

// ============ NPC 조회 API ============

// NPC 타입별 파일 매핑
const NPC_TYPE_FILES: Record<NpcType, string> = {
  healer: "/data/npcs/healers.json",
  merchant: "/data/npcs/merchants.json",
  trainer: "/data/npcs/trainers.json",
  quest: "/data/npcs/quests.json",
};

// 캐시: 타입별 NPC 목록
const npcsCacheByType: Partial<Record<NpcType, Npc[]>> = {};
let allNpcsCache: Npc[] | null = null;

export async function fetchNpcsByType(type: NpcType): Promise<Npc[]> {
  if (npcsCacheByType[type]) return npcsCacheByType[type]!;

  try {
    const response = await fetch(NPC_TYPE_FILES[type]);
    if (!response.ok) return [];
    const data = await response.json();
    npcsCacheByType[type] = data.npcs.map((npc: Npc) => ({ ...npc, type }));
    return npcsCacheByType[type]!;
  } catch {
    return [];
  }
}

export async function fetchNpcs(): Promise<Npc[]> {
  if (allNpcsCache) return allNpcsCache;

  // 모든 NPC 타입 파일에서 로드
  const types: NpcType[] = ["healer", "merchant", "trainer", "quest"];
  const results = await Promise.all(types.map(fetchNpcsByType));
  allNpcsCache = results.flat();
  return allNpcsCache;
}

export async function fetchNpcsByMap(mapId: string): Promise<Npc[]> {
  const npcs = await fetchNpcs();
  return npcs.filter((npc) => npc.mapId === mapId);
}

export async function fetchNpcById(npcId: string): Promise<Npc | undefined> {
  const npcs = await fetchNpcs();
  return npcs.find((npc) => npc.id === npcId);
}

export async function fetchHealerNpcs(): Promise<Npc[]> {
  const npcs = await fetchNpcs();
  return npcs.filter((npc) => npc.type === "healer");
}
