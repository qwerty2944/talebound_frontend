"use client";

import { useState } from "react";
import { useMonstersByMap, getMonsterDisplayName, MONSTER_RANK_INFO } from "@/entities/monster";
import { useThemeStore } from "@/shared/config";
import type { Theme } from "@/shared/config/themes";
import type { Monster } from "@/entities/monster";

interface MonsterListProps {
  mapId: string;
  playerLevel: number;
  onSelectMonster: (monster: Monster) => void;
  disabled?: boolean;
  /** compact 모드 (CollapsibleSection 안에서 사용 시) */
  compact?: boolean;
}

export function MonsterList({
  mapId,
  playerLevel,
  onSelectMonster,
  disabled = false,
  compact = false,
}: MonsterListProps) {
  const { theme } = useThemeStore();
  const { data: monsters = [], isLoading } = useMonstersByMap(mapId);
  // 보스 도전 확인 모달 대상
  const [bossToChallenge, setBossToChallenge] = useState<Monster | null>(null);

  if (isLoading) {
    return (
      <div
        className="p-4"
        style={{
          background: theme.colors.bg,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div className="text-sm text-center font-mono" style={{ color: theme.colors.textMuted }}>
          몬스터 로딩 중...
        </div>
      </div>
    );
  }

  if (monsters.length === 0) {
    return (
      <div
        className="p-4"
        style={{
          background: theme.colors.bg,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div
          className="text-sm text-center font-mono py-2"
          style={{ color: theme.colors.textMuted }}
        >
          이 지역에는 몬스터가 없습니다.
        </div>
      </div>
    );
  }

  // 일반/정예와 보스 분리
  const bossMonsters = monsters.filter((m) => m.rank === "boss");
  const normalMonsters = monsters.filter((m) => m.rank !== "boss");

  const handleSelect = (monster: Monster) => {
    if (disabled) return;
    if (monster.rank === "boss") {
      setBossToChallenge(monster);
      return;
    }
    onSelectMonster(monster);
  };

  const confirmBoss = () => {
    if (bossToChallenge) {
      onSelectMonster(bossToChallenge);
      setBossToChallenge(null);
    }
  };

  return (
    <div
      className="flex flex-col overflow-hidden flex-shrink-0"
      style={{
        background: compact ? "transparent" : theme.colors.bg,
        border: compact ? "none" : `1px solid ${theme.colors.border}`,
      }}
    >
      {/* 헤더 (compact 모드에서는 숨김) */}
      {!compact && (
        <div
          className="px-3 py-2 flex items-center justify-between border-b"
          style={{
            background: theme.colors.bgLight,
            borderColor: theme.colors.border,
          }}
        >
          <span className="text-sm font-mono font-medium" style={{ color: theme.colors.text }}>
            ⚔️ 전투
          </span>
          <span className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>
            {monsters.length}종 출현
          </span>
        </div>
      )}

      {/* 몬스터 목록 */}
      <div className={compact ? "space-y-2 max-h-40 overflow-y-auto custom-scrollbar" : "p-2 space-y-2 max-h-40 overflow-y-auto custom-scrollbar flex-1 min-h-0"}>
        {normalMonsters.map((monster) => (
          <MonsterRow
            key={monster.id}
            monster={monster}
            playerLevel={playerLevel}
            disabled={disabled}
            onSelect={handleSelect}
            theme={theme}
          />
        ))}

        {/* 보스 구역 */}
        {bossMonsters.length > 0 && (
          <>
            <div
              className="flex items-center gap-2 px-1 pt-2 pb-1"
              style={{ borderTop: `1px dashed ${MONSTER_RANK_INFO.boss.color}55` }}
            >
              <span className="text-xs font-mono font-bold" style={{ color: MONSTER_RANK_INFO.boss.color }}>
                👑 보스
              </span>
              <span className="text-[10px] font-mono" style={{ color: theme.colors.textMuted }}>
                지역의 지배자
              </span>
            </div>
            {bossMonsters.map((monster) => (
              <MonsterRow
                key={monster.id}
                monster={monster}
                playerLevel={playerLevel}
                disabled={disabled}
                onSelect={handleSelect}
                theme={theme}
                isBoss
              />
            ))}
          </>
        )}
      </div>

      {/* 보스 도전 확인 모달 */}
      {bossToChallenge && (
        <BossChallengeModal
          monster={bossToChallenge}
          playerLevel={playerLevel}
          onConfirm={confirmBoss}
          onCancel={() => setBossToChallenge(null)}
          theme={theme}
        />
      )}
    </div>
  );
}

interface RowProps {
  monster: Monster;
  playerLevel: number;
  disabled: boolean;
  onSelect: (m: Monster) => void;
  theme: Theme;
  isBoss?: boolean;
}

function MonsterRow({ monster, playerLevel, disabled, onSelect, theme, isBoss = false }: RowProps) {
  const levelDiff = monster.level - playerLevel;
  const diffColor =
    levelDiff > 3
      ? theme.colors.error
      : levelDiff > 0
      ? theme.colors.warning
      : theme.colors.success;
  const bossColor = MONSTER_RANK_INFO.boss.color;

  return (
    <button
      onClick={() => onSelect(monster)}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-3 py-2 transition-colors text-left"
      style={{
        background: theme.colors.bgDark,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        border: isBoss ? `1px solid ${bossColor}66` : undefined,
        boxShadow: isBoss ? `0 0 8px ${bossColor}22` : undefined,
      }}
    >
      <span className="text-2xl flex-shrink-0">{monster.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isBoss && (
            <span className="text-xs flex-shrink-0" title="보스">👑</span>
          )}
          <span
            className="text-sm font-mono font-medium truncate"
            style={{ color: isBoss ? bossColor : theme.colors.text }}
          >
            {getMonsterDisplayName(monster)}
          </span>
          <span
            className="text-xs font-mono px-1.5 py-0.5"
            style={{
              background: `${diffColor}20`,
              color: diffColor,
            }}
          >
            Lv.{monster.level}
          </span>
          {monster.element && (
            <span className="text-xs">{getElementIcon(monster.element)}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>
            HP {monster.stats.hp}
          </span>
          <span className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>·</span>
          <span className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>
            {getBehaviorText(monster.behavior)}
          </span>
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-xs font-mono" style={{ color: theme.colors.warning }}>
          +{monster.rewards.exp} exp
        </div>
        {monster.rewards.gold > 0 && (
          <div className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>
            +{monster.rewards.gold} gold
          </div>
        )}
      </div>
    </button>
  );
}

interface BossModalProps {
  monster: Monster;
  playerLevel: number;
  onConfirm: () => void;
  onCancel: () => void;
  theme: Theme;
}

function BossChallengeModal({ monster, playerLevel, onConfirm, onCancel, theme }: BossModalProps) {
  const bossColor = MONSTER_RANK_INFO.boss.color;
  const underLeveled = monster.level - playerLevel > 3;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm p-5 font-mono"
        style={{
          background: theme.colors.bg,
          border: `2px solid ${bossColor}`,
          boxShadow: `0 0 24px ${bossColor}44`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl">{monster.icon}</span>
          <div>
            <div className="text-xs font-bold" style={{ color: bossColor }}>👑 보스 도전</div>
            <div className="text-base font-bold" style={{ color: theme.colors.text }}>
              {getMonsterDisplayName(monster)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <Stat label="레벨" value={`Lv.${monster.level}`} theme={theme} />
          <Stat label="HP" value={`${monster.stats.hp}`} theme={theme} />
          <Stat label="공격" value={`${monster.stats.attack}`} theme={theme} />
          <Stat label="방어" value={`${monster.stats.defense}`} theme={theme} />
        </div>

        <div
          className="text-xs mb-3 p-2"
          style={{ background: theme.colors.bgDark, color: theme.colors.textDim }}
        >
          강력한 전용 스킬을 사용하는 보스입니다. 도주가 어렵습니다 (성공률 25%).
          {underLeveled && (
            <div className="mt-1" style={{ color: theme.colors.error }}>
              ⚠️ 권장 레벨보다 낮습니다. 위험합니다!
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-sm transition-colors"
            style={{
              background: theme.colors.bgDark,
              color: theme.colors.textDim,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 text-sm font-bold transition-colors"
            style={{
              background: bossColor,
              color: "#1a1a1a",
            }}
          >
            도전한다
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, theme }: { label: string; value: string; theme: Theme }) {
  return (
    <div className="flex justify-between px-2 py-1" style={{ background: theme.colors.bgDark }}>
      <span style={{ color: theme.colors.textMuted }}>{label}</span>
      <span style={{ color: theme.colors.text }}>{value}</span>
    </div>
  );
}

function getElementIcon(element: string): string {
  const icons: Record<string, string> = {
    fire: "🔥",
    ice: "❄️",
    lightning: "⚡",
    earth: "🪨",
    holy: "✨",
    dark: "🌑",
  };
  return icons[element] || "";
}

function getBehaviorText(behavior: string): string {
  const texts: Record<string, string> = {
    passive: "평화적",
    defensive: "방어적",
    aggressive: "공격적",
    territorial: "영역적",
  };
  return texts[behavior] || behavior;
}
