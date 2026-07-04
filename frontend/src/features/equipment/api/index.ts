// ============ Equipment API ============
// 장비 관련 모든 API 함수

import { supabase } from "@/shared/api/supabase";
import type {
  EnhancementResultType,
} from "@/entities/item/types/enhancement";
import type { EquipmentSockets } from "@/entities/item/types/socket";

// ============ Types ============

// 강화 관련
export interface EnhanceParams {
  characterId: string;
  instanceId: string;
  useProtection?: boolean;
  useLuckBoost?: boolean;
}

export interface EnhanceResponse {
  success: boolean;
  result: EnhancementResultType;
  previousLevel: number;
  newLevel: number;
  goldCost: number;
  roll: number;
  successRate: number;
  newFailCount: number;
  error?: string;
}

// 룬 삽입 관련
export interface InsertRuneParams {
  characterId: string;
  instanceId: string;
  socketIndex: number;
  itemId: string;
}

export interface InsertRuneResponse {
  success: boolean;
  sockets: EquipmentSockets;
  insertedItemId: string;
  socketIndex: number;
  error?: string;
}

// 룬 제거 관련
export interface RemoveRuneParams {
  characterId: string;
  instanceId: string;
  socketIndex: number;
}

export interface RemoveRuneResponse {
  success: boolean;
  sockets: EquipmentSockets;
  removedItemId: string;
  socketIndex: number;
  error?: string;
}

// 룬워드 활성화 관련
export interface ActivateRunewordParams {
  characterId: string;
  instanceId: string;
  runewordId: string;
}

export interface ActivateRunewordResponse {
  success: boolean;
  runewordId: string;
  completedAt: string;
  error?: string;
}

// ============ 강화 API ============

/**
 * 장비 강화 시도
 */
export async function enhance(params: EnhanceParams): Promise<EnhanceResponse> {
  const { characterId, instanceId, useProtection = false, useLuckBoost = false } = params;

  const { data, error } = await supabase.rpc("enhance_equipment", {
    p_character_id: characterId,
    p_instance_id: instanceId,
    p_use_protection: useProtection,
    p_use_luck_boost: useLuckBoost,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.success && data.error) {
    throw new Error(data.error);
  }

  return data as EnhanceResponse;
}

// ============ 룬 API ============

/**
 * 소켓에 룬 삽입
 */
export async function insertRune(params: InsertRuneParams): Promise<InsertRuneResponse> {
  const { characterId, instanceId, socketIndex, itemId } = params;

  const { data, error } = await supabase.rpc("insert_socket_item", {
    p_character_id: characterId,
    p_instance_id: instanceId,
    p_socket_index: socketIndex,
    p_item_id: itemId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.success && data.error) {
    throw new Error(data.error);
  }

  return data as InsertRuneResponse;
}

/**
 * 소켓에서 룬 제거
 */
export async function removeRune(params: RemoveRuneParams): Promise<RemoveRuneResponse> {
  const { characterId, instanceId, socketIndex } = params;

  const { data, error } = await supabase.rpc("remove_socket_item", {
    p_character_id: characterId,
    p_instance_id: instanceId,
    p_socket_index: socketIndex,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.success && data.error) {
    throw new Error(data.error);
  }

  return data as RemoveRuneResponse;
}

/**
 * 룬워드 활성화
 */
export async function activateRuneword(
  params: ActivateRunewordParams
): Promise<ActivateRunewordResponse> {
  const { characterId, instanceId, runewordId } = params;

  const { data, error } = await supabase.rpc("activate_runeword", {
    p_character_id: characterId,
    p_instance_id: instanceId,
    p_runeword_id: runewordId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.success && data.error) {
    throw new Error(data.error);
  }

  return {
    success: data.success,
    runewordId: data.runewordId,
    completedAt: data.completedAt,
  };
}

// ============ 장비 인스턴스 CRUD ============

/**
 * 장비 인스턴스 생성
 */
export async function createInstance(params: {
  characterId: string;
  baseItemId: string;
  maxSockets?: number;
  acquiredFrom?: string;
}): Promise<{ instanceId: string; baseItemId: string; maxSockets: number }> {
  const { data, error } = await supabase.rpc("create_equipment_instance", {
    p_character_id: params.characterId,
    p_base_item_id: params.baseItemId,
    p_max_sockets: params.maxSockets ?? 0,
    p_acquired_from: params.acquiredFrom ?? "drop",
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.success) {
    throw new Error(data.error ?? "인스턴스 생성 실패");
  }

  return {
    instanceId: data.instanceId,
    baseItemId: data.baseItemId,
    maxSockets: data.maxSockets,
  };
}

/**
 * 캐릭터의 장비 인스턴스 목록 조회
 */
export async function fetchInstances(characterId: string) {
  const { data, error } = await supabase
    .from("equipment_instances")
    .select("*")
    .eq("character_id", characterId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * 특정 장비 인스턴스 조회
 */
export async function fetchInstance(instanceId: string) {
  const { data, error } = await supabase
    .from("equipment_instances")
    .select("*")
    .eq("id", instanceId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * 장비 인스턴스 삭제
 */
export async function deleteInstance(instanceId: string) {
  const { error } = await supabase
    .from("equipment_instances")
    .delete()
    .eq("id", instanceId);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
