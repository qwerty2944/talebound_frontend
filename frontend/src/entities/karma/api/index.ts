import { apiFetch, rpc } from "@/shared/api";
import type { KarmaRank } from "../types";

// ============ 카르마 조회 ============

export interface KarmaData {
  karma: number;
  rank: KarmaRank;
}

export async function fetchKarma(_userId: string): Promise<KarmaData> {
  const data = await apiFetch<{ karma: number | null } | null>("/api/profile");

  const karma = data?.karma ?? 0;
  const rank = getKarmaRankFromValue(karma);

  return { karma, rank };
}

// ============ 카르마 업데이트 ============

export interface UpdateKarmaResult {
  newKarma: number;
  karmaRank: KarmaRank;
}

export async function updateKarma(
  _userId: string,
  change: number,
  reason?: string
): Promise<UpdateKarmaResult> {
  const data = await rpc<Array<{ new_karma: number; karma_rank: string }>>("update_karma", {
    p_change: change,
    p_reason: reason || null,
  });

  const result = data?.[0] || { new_karma: 0, karma_rank: "neutral" };

  return {
    newKarma: result.new_karma,
    karmaRank: result.karma_rank as KarmaRank,
  };
}

// ============ 유틸리티 ============

function getKarmaRankFromValue(karma: number): KarmaRank {
  if (karma >= 80) return "saintly";
  if (karma >= 50) return "holy";
  if (karma >= 20) return "virtuous";
  if (karma >= -19) return "neutral";
  if (karma >= -49) return "wicked";
  if (karma >= -79) return "evil";
  return "abyssal";
}
