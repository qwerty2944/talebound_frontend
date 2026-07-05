"use client";

import { useEffect, useRef } from "react";
import { useProfile, updateProfile } from "@/entities/user";
import { useEquipmentStore, type EquippedItem } from "@/application/stores";
import type { EquipmentSlot } from "@/entities/item";

const EQUIP_SLOT_KEYS: EquipmentSlot[] = [
  "mainHand",
  "offHand",
  "helmet",
  "armor",
  "cloth",
  "pants",
  "ring1",
  "ring2",
  "necklace",
  "earring1",
  "earring2",
  "bracelet",
];

type Slots = Partial<Record<EquipmentSlot, EquippedItem | null>>;

function extractSlots(state: Record<string, unknown>): Slots {
  const out: Slots = {};
  for (const key of EQUIP_SLOT_KEYS) {
    out[key] = (state[key] as EquippedItem | null) ?? null;
  }
  return out;
}

/**
 * 장비 착용 상태 DB 영속화 훅
 * - 로그인/새로고침 시 characters.equipment(JSONB) → equipmentStore 복원
 * - 착용/해제 등 스토어 변경 시 디바운스 저장 (PATCH /api/profile { equipment })
 *
 * 백엔드 allowlist/GET에 equipment가 아직 없으면:
 * - 복원: 응답에 equipment 없음 → 로컬 persist(localStorage) 유지 (graceful)
 * - 저장: PATCH 실패해도 조용히 무시 (로컬 persist로 계속 동작)
 */
export function useEquipmentSync(userId?: string) {
  const { data: profile } = useProfile(userId);
  const hydratedRef = useRef(false);
  const lastSavedRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1) DB → 스토어 복원 (최초 1회)
  useEffect(() => {
    if (hydratedRef.current || !profile) return;

    const eq = profile.equipment;
    if (eq && typeof eq === "object") {
      const restore: Slots = {};
      for (const key of EQUIP_SLOT_KEYS) {
        restore[key] = eq[key] ?? null;
      }
      useEquipmentStore.setState(restore);
      lastSavedRef.current = JSON.stringify(restore);
    } else {
      // DB에 equipment 없음 → 로컬 스토어 유지, 현재 스냅샷을 저장 기준으로
      lastSavedRef.current = JSON.stringify(
        extractSlots(useEquipmentStore.getState() as unknown as Record<string, unknown>)
      );
    }
    hydratedRef.current = true;
  }, [profile]);

  // 2) 스토어 변경 → DB 저장 (디바운스)
  useEffect(() => {
    if (!userId) return;

    const unsub = useEquipmentStore.subscribe((state) => {
      if (!hydratedRef.current) return;
      const slots = extractSlots(state as unknown as Record<string, unknown>);
      const serialized = JSON.stringify(slots);
      if (serialized === lastSavedRef.current) return;
      lastSavedRef.current = serialized;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        updateProfile({ userId, equipment: slots }).catch(() => {
          // 백엔드 미배포/실패 시 조용히 무시 (로컬 persist로 동작)
        });
      }, 800);
    });

    return () => {
      unsub();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [userId]);
}
