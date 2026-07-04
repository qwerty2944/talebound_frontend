// ============ Equipment Instance Types ============
// 개별 장비 인스턴스 (강화/소켓 상태 저장)

import type { EnhancementInfo, DEFAULT_ENHANCEMENT_INFO } from "./enhancement";
import type { EquipmentSockets, RunewordDefinition } from "./socket";

// ============ Equipment Instance ============

/** 장비 인스턴스 (DB 저장용 개별 장비) */
export interface EquipmentInstance {
  /** 인스턴스 고유 ID (UUID) */
  instanceId: string;

  /** 기본 아이템 ID (items.json 참조) */
  baseItemId: string;

  /** 캐릭터 ID (소유자) */
  characterId: string;

  /** 강화 정보 */
  enhancement: EnhancementInfo;

  /** 소켓 정보 */
  sockets?: EquipmentSockets;

  /** 활성 룬워드 */
  activeRuneword?: {
    runewordId: string;
    completedAt: string;
  };

  /** 획득 시간 */
  acquiredAt: string;

  /** 획득처 */
  acquiredFrom?: EquipmentAcquiredFrom;

  /** 귀속 캐릭터 ID (귀속된 경우) */
  boundTo?: string;

  /** 생성 시간 */
  createdAt: string;

  /** 수정 시간 */
  updatedAt: string;
}

/** 장비 획득처 */
export type EquipmentAcquiredFrom =
  | "drop" // 몬스터 드랍
  | "craft" // 제작
  | "trade" // 거래
  | "quest" // 퀘스트 보상
  | "shop" // 상점 구매
  | "event"; // 이벤트

// ============ DB Row Type ============

/** equipment_instances 테이블 Row 타입 */
export interface EquipmentInstanceRow {
  id: string; // UUID
  character_id: string;
  base_item_id: string;
  enhancement_level: number;
  enhancement_fail_count: number;
  sockets: EquipmentSocketsJson;
  active_runeword_id: string | null;
  runeword_completed_at: string | null;
  acquired_at: string;
  acquired_from: string | null;
  bound_to: string | null;
  created_at: string;
  updated_at: string;
}

/** sockets JSONB 타입 */
export interface EquipmentSocketsJson {
  maxSockets: number;
  sockets: Array<{
    index: number;
    type: string;
    color?: string;
    insertedItemId?: string;
    insertedAt?: string;
  }>;
}

// ============ Converters ============

/**
 * DB Row → EquipmentInstance 변환
 */
export function rowToEquipmentInstance(
  row: EquipmentInstanceRow
): EquipmentInstance {
  return {
    instanceId: row.id,
    baseItemId: row.base_item_id,
    characterId: row.character_id,
    enhancement: {
      level: row.enhancement_level,
      maxLevel: 15,
      failCount: row.enhancement_fail_count,
      protectedUntil: 10,
    },
    sockets: row.sockets as EquipmentSockets | undefined,
    activeRuneword: row.active_runeword_id
      ? {
          runewordId: row.active_runeword_id,
          completedAt: row.runeword_completed_at ?? "",
        }
      : undefined,
    acquiredAt: row.acquired_at,
    acquiredFrom: row.acquired_from as EquipmentAcquiredFrom | undefined,
    boundTo: row.bound_to ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * EquipmentInstance → DB Insert 데이터 변환
 */
export function instanceToInsertData(
  instance: Omit<EquipmentInstance, "createdAt" | "updatedAt">
): Omit<EquipmentInstanceRow, "id" | "created_at" | "updated_at"> {
  return {
    character_id: instance.characterId,
    base_item_id: instance.baseItemId,
    enhancement_level: instance.enhancement.level,
    enhancement_fail_count: instance.enhancement.failCount,
    sockets: instance.sockets ?? { maxSockets: 0, sockets: [] },
    active_runeword_id: instance.activeRuneword?.runewordId ?? null,
    runeword_completed_at: instance.activeRuneword?.completedAt ?? null,
    acquired_at: instance.acquiredAt,
    acquired_from: instance.acquiredFrom ?? null,
    bound_to: instance.boundTo ?? null,
  };
}

// ============ Inventory Integration ============

/** 인벤토리 슬롯 아이템 (장비 인스턴스 참조 추가) */
export interface InventorySlotItemWithInstance {
  slot: number;
  itemId: string;
  itemType: string;
  quantity: number;
  acquiredAt: string;
  /** 장비인 경우 인스턴스 ID 참조 */
  instanceId?: string;
}

// ============ Equipment Slot with Instance ============

/** 장비 슬롯 저장 형식 (characters.equipment 컬럼) */
export interface EquipmentSlotsWithInstance {
  mainHandId?: string; // instanceId
  offHandId?: string;
  helmetId?: string;
  armorId?: string;
  clothId?: string;
  pantsId?: string;
  ring1Id?: string;
  ring2Id?: string;
  necklaceId?: string;
  earring1Id?: string;
  earring2Id?: string;
  braceletId?: string;
}

// ============ Factory Functions ============

/**
 * 새 장비 인스턴스 생성 (획득 시)
 */
export function createEquipmentInstance(params: {
  baseItemId: string;
  characterId: string;
  maxSockets?: number;
  acquiredFrom?: EquipmentAcquiredFrom;
}): Omit<EquipmentInstance, "instanceId" | "createdAt" | "updatedAt"> {
  const now = new Date().toISOString();

  return {
    baseItemId: params.baseItemId,
    characterId: params.characterId,
    enhancement: {
      level: 0,
      maxLevel: 15,
      failCount: 0,
      protectedUntil: 10,
    },
    sockets:
      params.maxSockets && params.maxSockets > 0
        ? {
            maxSockets: params.maxSockets,
            sockets: [],
          }
        : undefined,
    acquiredAt: now,
    acquiredFrom: params.acquiredFrom ?? "drop",
  };
}

// ============ Display Helpers ============

/**
 * 장비 인스턴스 표시명 생성
 * 예: "+5 미스릴 검 [룬워드: 강철]"
 */
export function getInstanceDisplayName(
  baseName: string,
  instance: EquipmentInstance,
  runeword?: RunewordDefinition
): string {
  let name = baseName;

  // 강화 레벨
  if (instance.enhancement.level > 0) {
    name = `+${instance.enhancement.level} ${name}`;
  }

  // 룬워드
  if (runeword) {
    name = `${name} [${runeword.nameKo}]`;
  }

  return name;
}

/**
 * 장비 인스턴스 상태 요약
 */
export function getInstanceSummary(instance: EquipmentInstance): {
  enhancementText: string;
  socketText: string;
  runewordText: string | null;
} {
  const socketsFilled =
    instance.sockets?.sockets.filter((s) => s.insertedItemId).length ?? 0;
  const socketsMax = instance.sockets?.maxSockets ?? 0;

  return {
    enhancementText:
      instance.enhancement.level > 0 ? `+${instance.enhancement.level}` : "-",
    socketText: socketsMax > 0 ? `${socketsFilled}/${socketsMax}` : "-",
    runewordText: instance.activeRuneword?.runewordId ?? null,
  };
}
