"use client";

/**
 * 미습득 어빌리티 목록 + 수련 시작 (어빌리티 습득)
 * - 요구 조건(스탯/선행 스킬) 충족 여부 표시
 * - 수련 시작 시 경험치 1을 부여해 "진행 중" 상태로 등록
 */

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { Theme } from "@/shared/config";
import type { Ability, UserAbilities, AbilityCategory } from "@/entities/ability";
import { useIncreaseAbilityExp } from "@/entities/ability";
import type { CharacterStats } from "@/entities/character";
import { ABILITY_TYPE_CONFIG } from "@/entities/ability/lib/abilityHelpers";

const STAT_LABELS: Record<string, string> = {
  str: "힘",
  dex: "민첩",
  con: "체력",
  int: "지능",
  wis: "지혜",
  cha: "매력",
  lck: "행운",
};

function getCategory(ability: Ability): AbilityCategory {
  if (ability.source === "spell") return "magic";
  if (ability.source === "combatskill") return "combat";
  return "life";
}

interface RequirementCheck {
  met: boolean;
  reasons: string[];
}

function checkRequirements(
  ability: Ability,
  stats: CharacterStats | undefined,
  userAbilities: UserAbilities | undefined
): RequirementCheck {
  const reasons: string[] = [];
  const req = ability.requirements;
  if (!req) return { met: true, reasons };

  // 스탯 요구
  if (req.stats && stats) {
    for (const [key, required] of Object.entries(req.stats)) {
      if (required === undefined) continue;
      const raw = stats[key as keyof CharacterStats];
      const current = typeof raw === "number" ? raw : 0;
      if (current < required) {
        reasons.push(`${STAT_LABELS[key] ?? key} ${required} 필요 (현재 ${current})`);
      }
    }
  }

  // 선행 스킬 요구
  if (req.skills && userAbilities) {
    for (const [skillId, requiredLevel] of Object.entries(req.skills)) {
      let currentLevel = 0;
      for (const category of ["combat", "magic", "life"] as const) {
        const progress = userAbilities[category][skillId];
        if (progress) currentLevel = progress.level;
      }
      if (currentLevel < requiredLevel) {
        reasons.push(`선행: ${skillId} Lv.${requiredLevel} 필요`);
      }
    }
  }

  return { met: reasons.length === 0, reasons };
}

interface LearnableAbilitiesProps {
  theme: Theme;
  userId: string | undefined;
  abilities: Ability[];
  userAbilities: UserAbilities | undefined;
  learnedIds: string[];
  stats: CharacterStats | undefined;
}

export function LearnableAbilities({
  theme,
  userId,
  abilities,
  userAbilities,
  learnedIds,
  stats,
}: LearnableAbilitiesProps) {
  const [expanded, setExpanded] = useState(false);
  const increaseExp = useIncreaseAbilityExp(userId ?? "");

  const learnable = useMemo(() => {
    const learned = new Set(learnedIds);
    return abilities
      .filter((a) => a.source !== "monster" && !learned.has(a.id))
      .map((ability) => ({
        ability,
        check: checkRequirements(ability, stats, userAbilities),
      }))
      .sort((a, b) => Number(b.check.met) - Number(a.check.met));
  }, [abilities, learnedIds, stats, userAbilities]);

  if (learnable.length === 0) return null;

  const handleLearn = (ability: Ability) => {
    if (!userId || increaseExp.isPending) return;

    increaseExp.mutate(
      { category: getCategory(ability), abilityId: ability.id, amount: 1 },
      {
        onSuccess: () => toast.success(`${ability.nameKo} 수련을 시작했습니다!`),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "수련 시작에 실패했습니다"),
      }
    );
  };

  return (
    <div>
      {/* 섹션 헤더 (토글) */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 mb-3 w-full text-left"
      >
        <h3 className="font-mono font-medium" style={{ color: theme.colors.text }}>
          습득 가능한 어빌리티
        </h3>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{
            background: `${theme.colors.success}20`,
            color: theme.colors.success,
          }}
        >
          {learnable.filter((l) => l.check.met).length}/{learnable.length}
        </span>
        <span className="ml-auto text-xs font-mono" style={{ color: theme.colors.textMuted }}>
          {expanded ? "▲ 접기" : "▼ 펼치기"}
        </span>
      </button>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {learnable.map(({ ability, check }) => {
            const typeConfig =
              ABILITY_TYPE_CONFIG[ability.type] || ABILITY_TYPE_CONFIG.attack;

            return (
              <div
                key={ability.id}
                className="p-3 flex items-start gap-3"
                style={{
                  background: theme.colors.bgDark,
                  border: `1px solid ${theme.colors.borderDim}`,
                  borderLeft: `3px solid ${check.met ? typeConfig.color : theme.colors.borderDim}`,
                  opacity: check.met ? 1 : 0.65,
                }}
              >
                <span className="text-2xl">{ability.icon || "📖"}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-sm font-medium truncate"
                      style={{ color: theme.colors.text }}
                    >
                      {ability.nameKo}
                    </span>
                    <span
                      className="text-[10px] font-mono px-1 py-0.5 rounded shrink-0"
                      style={{ background: `${typeConfig.color}20`, color: typeConfig.color }}
                    >
                      {typeConfig.nameKo}
                    </span>
                  </div>

                  <p
                    className="text-[11px] font-mono mt-0.5 line-clamp-2"
                    style={{ color: theme.colors.textMuted }}
                  >
                    {ability.description?.ko}
                  </p>

                  {/* 미충족 조건 */}
                  {!check.met && (
                    <div className="mt-1 space-y-0.5">
                      {check.reasons.map((reason, i) => (
                        <div
                          key={i}
                          className="text-[10px] font-mono"
                          style={{ color: theme.colors.error }}
                        >
                          🔒 {reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleLearn(ability)}
                  disabled={!check.met || !userId || increaseExp.isPending}
                  className="shrink-0 px-2 py-1 text-xs font-mono transition-colors"
                  style={{
                    background: check.met ? `${theme.colors.primary}20` : theme.colors.bgLight,
                    border: `1px solid ${check.met ? theme.colors.primary : theme.colors.borderDim}`,
                    color: check.met ? theme.colors.primary : theme.colors.textMuted,
                    cursor: check.met ? "pointer" : "not-allowed",
                  }}
                >
                  수련
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
