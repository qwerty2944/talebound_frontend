// ============ Enhance Action ============
// 장비 강화하다

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enhance, type EnhanceParams } from "../api";
import { equipmentKeys } from "../queries";

/**
 * 장비 강화 훅
 */
export function useEnhance(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Omit<EnhanceParams, "characterId">) =>
      enhance({ ...params, characterId }),
    onSuccess: (_data, variables) => {
      // 인스턴스 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.instanceDetail(variables.instanceId),
      });
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.instanceList(characterId),
      });
      // 캐릭터 정보 무효화 (골드 변경)
      queryClient.invalidateQueries({
        queryKey: ["characters", characterId],
      });
    },
  });
}
