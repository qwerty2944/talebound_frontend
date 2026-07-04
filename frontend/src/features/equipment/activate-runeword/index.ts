// ============ Activate Runeword Action ============
// 룬워드 활성화하다

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activateRuneword, type ActivateRunewordParams } from "../api";
import { equipmentKeys } from "../queries";

/**
 * 룬워드 활성화 훅
 */
export function useActivateRuneword(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Omit<ActivateRunewordParams, "characterId">) =>
      activateRuneword({ ...params, characterId }),
    onSuccess: (_data, variables) => {
      // 인스턴스 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.instanceDetail(variables.instanceId),
      });
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.instanceList(characterId),
      });
    },
  });
}
