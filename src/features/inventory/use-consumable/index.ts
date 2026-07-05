"use client";

/**
 * 소비 아이템 사용 기능
 * - 아이템 effect를 해석해 HP/MP/피로도 회복 적용
 * - 성공 시 인벤토리에서 1개 소모
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryKeys } from "@/entities/inventory";
import {
  updateProfile,
  restoreFatigue,
  profileKeys,
  type UserProfile,
} from "@/entities/user";
import type { Item } from "@/entities/item";
import { useItem } from "../use-item";

// ============ 효과 타입 (JSON의 effect 필드) ============

interface RawItemEffect {
  type: string;
  value?: number;
  hpValue?: number;
  mpValue?: number;
  statusEffect?: string;
  duration?: number;
}

function getItemEffect(item: Item): RawItemEffect | null {
  const raw = (item as Item & { effect?: RawItemEffect }).effect;
  if (raw) return raw;
  if (item.consumableEffect) {
    return {
      type: item.consumableEffect.type,
      value: item.consumableEffect.value,
      statusEffect: item.consumableEffect.statusEffect,
      duration: item.consumableEffect.duration,
    };
  }
  return null;
}

// ============ HP/MP 최대치 계산 ============

function getMaxHp(profile: UserProfile): number {
  const stats = profile.character?.stats;
  const con = stats?.con ?? 10;
  return 50 + con * 5 + (profile.level || 1) * 10;
}

function getMaxMp(profile: UserProfile): number {
  const stats = profile.character?.stats;
  const wis = stats?.wis ?? 10;
  const int = stats?.int ?? 10;
  return 20 + wis * 3 + int;
}

// ============ 사용 로직 ============

export interface UseConsumableParams {
  slot: number;
  item: Item;
  profile: UserProfile;
}

export interface UseConsumableResult {
  success: boolean;
  message: string;
}

async function applyConsumable(
  userId: string,
  { slot, item, profile }: UseConsumableParams
): Promise<UseConsumableResult> {
  const effect = getItemEffect(item);
  if (!effect) {
    return { success: false, message: "사용할 수 없는 아이템입니다" };
  }

  const maxHp = getMaxHp(profile);
  const maxMp = getMaxMp(profile);
  const curHp = profile.currentHp ?? maxHp;
  const curMp = profile.currentMp ?? maxMp;
  const value = effect.value ?? 0;

  let message = "";

  switch (effect.type) {
    case "heal_hp":
    case "heal": {
      if (curHp >= maxHp) {
        return { success: false, message: "체력이 이미 가득 찼습니다" };
      }
      const newHp = Math.min(maxHp, curHp + value);
      await updateProfile({ userId, currentHp: newHp });
      message = `${item.nameKo} 사용: 체력 ${newHp - curHp} 회복`;
      break;
    }

    case "heal_mp":
    case "mana": {
      if (curMp >= maxMp) {
        return { success: false, message: "마나가 이미 가득 찼습니다" };
      }
      const newMp = Math.min(maxMp, curMp + value);
      await updateProfile({ userId, currentMp: newMp });
      message = `${item.nameKo} 사용: 마나 ${newMp - curMp} 회복`;
      break;
    }

    case "heal_both": {
      const newHp = Math.min(maxHp, curHp + (effect.hpValue ?? value));
      const newMp = Math.min(maxMp, curMp + (effect.mpValue ?? value));
      if (newHp === curHp && newMp === curMp) {
        return { success: false, message: "체력과 마나가 이미 가득 찼습니다" };
      }
      await updateProfile({ userId, currentHp: newHp, currentMp: newMp });
      message = `${item.nameKo} 사용: 체력 ${newHp - curHp}, 마나 ${newMp - curMp} 회복`;
      break;
    }

    case "full_restore": {
      await updateProfile({ userId, currentHp: maxHp, currentMp: maxMp });
      message = `${item.nameKo} 사용: 체력과 마나가 모두 회복되었습니다`;
      break;
    }

    case "heal_stamina":
    case "fatigue": {
      await restoreFatigue(userId, value);
      message = `${item.nameKo} 사용: 피로도 ${value} 회복`;
      break;
    }

    default:
      return {
        success: false,
        message: `이 아이템의 효과(${effect.type})는 아직 지원되지 않습니다`,
      };
  }

  // 효과 적용 성공 → 아이템 1개 소모
  await useItem({ userId, slot, amount: 1 });

  return { success: true, message };
}

// ============ Hook ============

interface UseUseConsumableOptions {
  onSuccess?: (result: UseConsumableResult) => void;
  onError?: (error: Error) => void;
}

export function useUseConsumable(
  userId: string | undefined,
  options?: UseUseConsumableOptions
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UseConsumableParams) => applyConsumable(userId!, params),
    onSuccess: (result) => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(userId) });
        queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
      }
      options?.onSuccess?.(result);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}
