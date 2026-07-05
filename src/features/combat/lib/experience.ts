/**
 * 전투 스킬 경험치 부여 시스템
 */

import { increaseAbilityExp, type AbilityCategory } from "@/entities/ability";
import { useBattleStore } from "@/application/stores";

/**
 * 스킬 사용 시 관련 스킬에 경험치 부여
 * - 공격 성공 시 (데미지 > 0) 호출
 * - grantsExpTo 배열의 모든 스킬에 경험치 +1
 * - battleStore에도 추적하여 전투 결과에 표시
 *
 * @param userId 유저 ID
 * @param grantsExpTo 경험치를 부여할 스킬 ID 배열
 * @param source 스킬 소스 (spell/combatskill)
 */
export async function grantSkillExperience(
  userId: string,
  grantsExpTo: string[],
  source: "spell" | "combatskill" | "monster"
): Promise<void> {
  // source에 따라 category 결정
  // spell → magic, combatskill → combat
  const category: AbilityCategory = source === "spell" ? "magic" : "combat";

  // battleStore에 추적 (전투 결과에 표시용)
  const addSkillExpGain = useBattleStore.getState().addSkillExpGain;
  for (const skillId of grantsExpTo) {
    addSkillExpGain(skillId, 1);
  }

  try {
    // 병렬로 경험치 부여 (전투 흐름 blocking 안 함)
    await Promise.all(
      grantsExpTo.map((skillId) =>
        increaseAbilityExp(userId, category, skillId, 1)
      )
    );
  } catch (error) {
    // 경험치 부여 실패해도 전투는 계속 진행
    console.error("[grantSkillExperience] 경험치 부여 실패:", error);
  }
}
