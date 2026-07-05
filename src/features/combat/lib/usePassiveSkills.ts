"use client";

import { useMemo } from "react";
import {
  useAbilities,
  useUserAbilities,
  getLearnedAbilities,
  getPassiveBonuses,
  type PassiveBonuses,
} from "@/entities/ability";

interface UsePassiveSkillsOptions {
  userId: string | undefined;
}

/**
 * 배운 패시브 어빌리티를 집계해 전투 보너스로 반환한다.
 * 데미지 보너스는 execute-queue에서, AP 감소는 use-ability에서 적용.
 */
export function usePassiveSkills({ userId }: UsePassiveSkillsOptions): {
  passiveBonuses: PassiveBonuses | undefined;
} {
  const { data: allAbilities } = useAbilities();
  const { data: userAbilities } = useUserAbilities(userId);

  const passiveBonuses = useMemo(() => {
    if (!allAbilities || !userAbilities) return undefined;
    const learned = getLearnedAbilities(userAbilities);
    return getPassiveBonuses(allAbilities, learned);
  }, [allAbilities, userAbilities]);

  return { passiveBonuses };
}
