"use client";

import type { Theme } from "@/shared/config";
import type { Ability, AbilityProgress } from "@/entities/ability";
import {
  ABILITY_TYPE_CONFIG,
  ELEMENT_CONFIG,
  compareEffects,
  getEffectsAtLevel,
  getExpProgress,
  getNextLevelMilestone,
} from "@/entities/ability/lib/abilityHelpers";

interface AbilityTooltipProps {
  ability: Ability;
  progress: AbilityProgress | null;
  theme: Theme;
}

export function AbilityTooltip({ ability, progress, theme }: AbilityTooltipProps) {
  const currentLevel = progress?.level ?? 0;
  const currentExp = progress?.exp ?? 0;
  const typeConfig = ABILITY_TYPE_CONFIG[ability.type] || ABILITY_TYPE_CONFIG.attack;
  const elementConfig = ability.element ? ELEMENT_CONFIG[ability.element] : null;
  const expProgress = getExpProgress(currentExp, ability.expPerLevel);
  const nextMilestone = getNextLevelMilestone(ability, currentLevel);
  const effects = compareEffects(ability, currentLevel);
  const currentEffects = getEffectsAtLevel(ability, currentLevel);

  return (
    <div
      className="absolute z-[200] p-3 min-w-[280px] max-w-[320px] font-mono text-xs pointer-events-none"
      style={{
        background: theme.colors.bg,
        border: `2px solid ${theme.colors.border}`,
        boxShadow: "0 4px 16px rgba(0,0,0,0.8)",
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginBottom: "8px",
      }}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{ability.icon}</span>
          <span className="font-medium" style={{ color: theme.colors.text }}>
            {ability.nameKo}
          </span>
        </div>
        <span
          className="text-xs px-1.5 py-0.5"
          style={{
            background: `${theme.colors.primary}20`,
            color: theme.colors.primary,
          }}
        >
          Lv.{currentLevel}/{ability.maxLevel}
        </span>
      </div>

      {/* 타입 & 속성 배지 */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="px-2 py-0.5 text-xs rounded"
          style={{
            background: `${typeConfig.color}20`,
            color: typeConfig.color,
          }}
        >
          {typeConfig.icon} {typeConfig.nameKo}
        </span>
        {elementConfig && (
          <span
            className="px-2 py-0.5 text-xs rounded"
            style={{
              background: `${elementConfig.color}20`,
              color: elementConfig.color,
            }}
          >
            {elementConfig.icon} {elementConfig.nameKo}
          </span>
        )}
      </div>

      {/* 구분선 */}
      <div className="h-px my-2" style={{ background: theme.colors.border }} />

      {/* 설명 */}
      {ability.description?.ko && (
        <>
          <p className="mb-2" style={{ color: theme.colors.textMuted }}>
            {ability.description.ko}
          </p>
          <div className="h-px my-2" style={{ background: theme.colors.border }} />
        </>
      )}

      {/* 현재 효과 */}
      {effects.length > 0 && (
        <>
          <div className="mb-2">
            <p className="mb-1" style={{ color: theme.colors.textDim }}>
              현재 효과 (Lv.{currentLevel}):
            </p>
            <div className="space-y-0.5 pl-2">
              {effects.map(({ key, label, current, unit }) => (
                <div key={key} className="flex justify-between">
                  <span style={{ color: theme.colors.textMuted }}>{label}</span>
                  <span style={{ color: theme.colors.text }}>
                    {current}
                    {unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 다음 레벨 효과 비교 */}
      {nextMilestone && effects.some((e) => e.next !== null) && (
        <>
          <div className="h-px my-2" style={{ background: theme.colors.border }} />
          <div className="mb-2">
            <p className="mb-1" style={{ color: theme.colors.textDim }}>
              다음 레벨 (Lv.{nextMilestone}):
            </p>
            <div className="space-y-0.5 pl-2">
              {effects
                .filter((e) => e.next !== null && e.diff !== null)
                .map(({ key, label, current, next, diff, unit }) => {
                  // apCost, mpCost는 감소가 좋음 (diff가 음수면 좋음)
                  const isCostField = key === "apCost" || key === "mpCost";
                  const isGood = isCostField ? (diff ?? 0) < 0 : (diff ?? 0) > 0;
                  const diffColor = isGood ? theme.colors.success : theme.colors.error;

                  return (
                    <div key={key} className="flex justify-between">
                      <span style={{ color: theme.colors.textMuted }}>{label}</span>
                      <span>
                        <span style={{ color: theme.colors.textMuted }}>
                          {current}
                          {unit}
                        </span>
                        <span style={{ color: theme.colors.textMuted }}> → </span>
                        <span style={{ color: theme.colors.text }}>
                          {next}
                          {unit}
                        </span>
                        <span style={{ color: diffColor }}>
                          {" "}
                          ({(diff ?? 0) > 0 ? "+" : ""}
                          {diff})
                        </span>
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}

      {/* 경험치 바 */}
      {currentLevel < ability.maxLevel && (
        <>
          <div className="h-px my-2" style={{ background: theme.colors.border }} />
          <div>
            <div className="flex justify-between mb-1">
              <span style={{ color: theme.colors.textMuted }}>경험치</span>
              <span style={{ color: theme.colors.text }}>
                {currentExp}/{ability.expPerLevel}
              </span>
            </div>
            <div
              className="h-2 rounded overflow-hidden"
              style={{ background: theme.colors.bgLight }}
            >
              <div
                className="h-full transition-all"
                style={{
                  background: theme.colors.primary,
                  width: `${expProgress}%`,
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* 요구사항 */}
      {ability.requirements && (
        (ability.requirements.skills && Object.keys(ability.requirements.skills).length > 0) ||
        ability.requirements.equipment
      ) && (
        <>
          <div className="h-px my-2" style={{ background: theme.colors.border }} />
          <div>
            <p className="mb-1" style={{ color: theme.colors.textDim }}>
              요구사항:
            </p>
            <div className="space-y-0.5 pl-2">
              {ability.requirements.skills &&
                Object.entries(ability.requirements.skills).map(([skillId, level]) => (
                  <p key={skillId} style={{ color: theme.colors.textMuted }}>
                    • {skillId} Lv.{level}
                  </p>
                ))}
              {ability.requirements.equipment && (
                <p style={{ color: theme.colors.textMuted }}>
                  • {ability.requirements.equipment} 장비 필요
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
