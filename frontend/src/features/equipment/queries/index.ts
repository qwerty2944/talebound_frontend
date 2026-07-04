// ============ Equipment Queries ============
// 장비 관련 React Query 훅 (공용)

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchInstances, fetchInstance } from "../api";

// ============ Query Keys ============

export const equipmentKeys = {
  all: ["equipment"] as const,
  instances: () => [...equipmentKeys.all, "instances"] as const,
  instanceList: (characterId: string) =>
    [...equipmentKeys.instances(), "list", characterId] as const,
  instanceDetail: (instanceId: string) =>
    [...equipmentKeys.instances(), "detail", instanceId] as const,
};

// ============ Queries ============

/**
 * 캐릭터의 장비 인스턴스 목록 조회
 */
export function useEquipmentInstances(characterId: string | undefined) {
  return useQuery({
    queryKey: equipmentKeys.instanceList(characterId ?? ""),
    queryFn: () => fetchInstances(characterId!),
    enabled: !!characterId,
  });
}

/**
 * 특정 장비 인스턴스 조회
 */
export function useEquipmentInstance(instanceId: string | undefined) {
  return useQuery({
    queryKey: equipmentKeys.instanceDetail(instanceId ?? ""),
    queryFn: () => fetchInstance(instanceId!),
    enabled: !!instanceId,
  });
}

// ============ Invalidation Helpers ============

/**
 * 장비 관련 쿼리 무효화 헬퍼
 */
export function useInvalidateEquipment() {
  const queryClient = useQueryClient();

  return {
    invalidateInstance: (instanceId: string) => {
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.instanceDetail(instanceId),
      });
    },
    invalidateList: (characterId: string) => {
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.instanceList(characterId),
      });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.all,
      });
    },
  };
}
