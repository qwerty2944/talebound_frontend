// ============ Remove Rune Action ============
// 룬 제거하다

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeRune, type RemoveRuneParams } from "../api";
import { equipmentKeys } from "../queries";

/**
 * 소켓에서 룬 제거 훅
 */
export function useRemoveRune(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Omit<RemoveRuneParams, "characterId">) =>
      removeRune({ ...params, characterId }),
    onSuccess: (_data, variables) => {
      // 인스턴스 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.instanceDetail(variables.instanceId),
      });
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.instanceList(characterId),
      });
      // 인벤토리 무효화 (아이템 반환)
      queryClient.invalidateQueries({
        queryKey: ["inventory"],
      });
    },
  });
}
