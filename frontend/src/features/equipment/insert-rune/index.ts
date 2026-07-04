// ============ Insert Rune Action ============
// 룬 삽입하다

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertRune, type InsertRuneParams } from "../api";
import { equipmentKeys } from "../queries";

/**
 * 소켓에 룬 삽입 훅
 */
export function useInsertRune(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Omit<InsertRuneParams, "characterId">) =>
      insertRune({ ...params, characterId }),
    onSuccess: (_data, variables) => {
      // 인스턴스 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.instanceDetail(variables.instanceId),
      });
      queryClient.invalidateQueries({
        queryKey: equipmentKeys.instanceList(characterId),
      });
      // 인벤토리 무효화 (아이템 소모)
      queryClient.invalidateQueries({
        queryKey: ["inventory"],
      });
    },
  });
}
