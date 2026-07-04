"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useBattleStore } from "@/application/stores";
import { useThemeStore } from "@/shared/config";
import type { CharacterStats } from "@/entities/character";
import type { Proficiencies } from "@/entities/ability";
import type { Ability } from "@/entities/ability";
import {
  useAbilities,
  useUserAbilities,
  fetchMonsterAbilities,
  getLearnedAbilities,
  type RawMonsterAbility,
  type UserAbilities,
} from "@/entities/ability";
import { rollDrops } from "@/entities/monster";
import { useItems, RARITY_CONFIG, type Item } from "@/entities/item";
import { useAbility, useExecuteQueue } from "@/features/combat";
import { BattleHeader } from "./BattleHeader";
import { BattleLog } from "./BattleLog";
import { ActionQueue } from "./ActionQueue";
import { AbilitySelector } from "./AbilitySelector";
import { CombatSubTabs, COMBAT_SUB_TABS, type CombatSubTab } from "./ActionTabs";
import { MagicSubTabs, MAGIC_ELEMENTS, type MagicElement } from "./MagicSubTabs";

// 드랍 아이템 타입 (아이템 데이터 포함)
interface DropWithItem {
  itemId: string;
  quantity: number;
  item?: Item;
}

// 전투 탭 타입 (abilities 폴더 구조 기반)
type BattleTab = "combat" | "magic" | "item";

interface BattlePanelProps {
  userId: string;  // Auth User ID (characterId에서 변경)
  characterStats: CharacterStats;
  proficiencies: Proficiencies | undefined;
  onFlee: () => void;
  onVictory: (drops: DropWithItem[]) => void;
  onDefeat: () => void;
}

export function BattlePanel({
  userId,
  characterStats,
  proficiencies,
  onFlee,
  onVictory,
  onDefeat,
}: BattlePanelProps) {
  const { theme } = useThemeStore();
  const {
    battle,
    playerFlee,
    resetBattle,
    dealDamageToPlayer,
  } = useBattleStore();

  const [activeTab, setActiveTab] = useState<BattleTab>("combat");
  const [activeCombatSubTab, setActiveCombatSubTab] = useState<CombatSubTab>("all");
  const [activeMagicElement, setActiveMagicElement] = useState<MagicElement>("all");
  const [monsterAbilitiesData, setMonsterAbilitiesData] = useState<Map<string, RawMonsterAbility>>(new Map());
  const [pendingDrops, setPendingDrops] = useState<DropWithItem[]>([]);

  // 아이템 데이터 로드 (드랍 아이템 정보 표시용)
  const { data: allItems = [] } = useItems();

  // 어빌리티 데이터 로드
  const { data: allAbilities = [] } = useAbilities();
  const { data: userAbilities } = useUserAbilities(userId);

  // useAbility 훅
  const {
    queueAbility,
    unqueueAbility,
    clearQueue,
    playerQueue,
  } = useAbility();

  // 큐 실행 훅
  const { executeQueue, isExecuting } = useExecuteQueue({
    userId,
    characterStats,
    proficiencies,
    monsterAbilitiesData,
  });

  // 몬스터 어빌리티 데이터 로드
  useEffect(() => {
    fetchMonsterAbilities().then(setMonsterAbilitiesData);
  }, []);

  // 배운 어빌리티와 레벨 (userAbilities 기반)
  const learnedAbilities = useMemo(() => {
    if (!userAbilities) return {};
    return getLearnedAbilities(userAbilities);
  }, [userAbilities]);

  // 어빌리티 레벨 맵
  const abilityLevels = useMemo(() => {
    const levels: Record<string, number> = {};
    for (const [id, progress] of Object.entries(learnedAbilities)) {
      levels[id] = progress.level;
    }
    return levels;
  }, [learnedAbilities]);

  // 배운 어빌리티 목록 (learnedAbilities + common 카테고리는 항상 포함)
  const myAbilities = useMemo(() => {
    const learnedIds = new Set(Object.keys(learnedAbilities));
    return allAbilities.filter((a) =>
      learnedIds.has(a.id) || a.category === "common"
    );
  }, [allAbilities, learnedAbilities]);

  // 전투 스킬
  const combatAbilities = useMemo(() =>
    myAbilities.filter((a) => a.source === "combatskill" && a.type !== "passive"),
    [myAbilities]
  );

  // 배운 전투 스킬이 있는 카테고리 목록
  const availableCombatCategories = useMemo(() => [
    ...new Set(
      combatAbilities
        .map((skill) => skill.category)
        .filter((c): c is string => !!c)
    ),
  ], [combatAbilities]);

  // 마법 스킬
  const magicAbilities = useMemo(() =>
    myAbilities.filter((a) => a.source === "spell"),
    [myAbilities]
  );

  // 배운 마법이 있는 속성 목록
  const availableMagicElements = useMemo(() => {
    const elements: string[] = [];
    for (const skill of magicAbilities) {
      const element = skill.element || (skill.type === "heal" ? "holy" : null);
      if (element && !elements.includes(element)) {
        elements.push(element);
      }
    }
    return elements;
  }, [magicAbilities]);

  // 탭별 어빌리티 필터
  const filteredAbilities = useMemo(() => {
    switch (activeTab) {
      case "combat":
        // 전투 스킬 (combatskill source, 패시브 제외) + 서브탭 필터
        if (activeCombatSubTab === "all") {
          return combatAbilities;
        }
        return combatAbilities.filter((a) => a.category === activeCombatSubTab);
      case "magic":
        // 마법 스킬 (spell 소스) + 속성 필터
        if (activeMagicElement === "all") {
          return magicAbilities;
        }
        return magicAbilities.filter((a) => {
          const skillElement = a.element || (a.type === "heal" ? "holy" : null);
          return skillElement === activeMagicElement;
        });
      case "item":
        // 아이템 사용 (향후 구현)
        return [];
      default:
        return [];
    }
  }, [activeTab, combatAbilities, magicAbilities, activeCombatSubTab, activeMagicElement]);

  // 어빌리티 선택 핸들러
  const handleSelectAbility = useCallback(
    (ability: Ability, level: number) => {
      if (isExecuting) return;
      queueAbility({ ability, abilityLevel: level });
    },
    [queueAbility, isExecuting]
  );

  // 도주 핸들러
  const handleFlee = useCallback(() => {
    if (isExecuting) return;
    const success = playerFlee();
    if (success) {
      onFlee();
    }
  }, [playerFlee, onFlee, isExecuting]);

  // 승리 시 드랍 아이템 계산
  useEffect(() => {
    if (battle.result === "victory" && battle.monster && pendingDrops.length === 0) {
      const drops = rollDrops(battle.monster.drops);
      const dropsWithItems: DropWithItem[] = drops.map((drop) => ({
        ...drop,
        item: allItems.find((item) => item.id === drop.itemId),
      }));
      setPendingDrops(dropsWithItems);
    }
    // 전투 초기화 시 드랍도 초기화
    if (!battle.isInBattle) {
      setPendingDrops([]);
    }
  }, [battle.result, battle.monster, battle.isInBattle, allItems, pendingDrops.length]);

  // 전투 종료 처리
  const handleCloseBattle = useCallback(() => {
    const currentResult = useBattleStore.getState().battle.result;
    if (currentResult === "victory") {
      onVictory(pendingDrops);
    } else if (currentResult === "defeat") {
      onDefeat();
    } else if (currentResult === "fled") {
      resetBattle();
    }
  }, [onVictory, onDefeat, resetBattle, pendingDrops]);


  if (!battle.isInBattle || !battle.monster) return null;

  const isOngoing = battle.result === "ongoing";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)" }}
    >
      <div
        className="w-full max-w-lg overflow-hidden"
        style={{
          background: theme.colors.bg,
          border: `2px solid ${theme.colors.border}`,
        }}
      >
        {/* 헤더 (HP/MP/AP 바) */}
        <BattleHeader />

        {/* 전투 로그 */}
        <BattleLog />

        {/* 액션 영역 */}
        {isOngoing ? (
          <>
            {/* 액션 큐 */}
            <ActionQueue
              onRemoveAction={unqueueAbility}
              onClearQueue={clearQueue}
              onExecute={executeQueue}
              disabled={isExecuting}
            />

            {/* 탭 버튼 */}
            <div
              className="flex border-t"
              style={{ borderColor: theme.colors.border }}
            >
              {(["combat", "magic", "item"] as const).map((tab) => {
                const tabLabels: Record<BattleTab, string> = {
                  combat: "⚔️ 전투",
                  magic: "✨ 마법",
                  item: "🎒 소비",
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    disabled={isExecuting || tab === "item"} // 아이템 탭 비활성화
                    className="flex-1 px-4 py-2 font-mono text-sm transition-colors"
                    style={{
                      background:
                        activeTab === tab ? theme.colors.bgLight : "transparent",
                      color:
                        activeTab === tab
                          ? theme.colors.primary
                          : tab === "item"
                          ? theme.colors.textMuted + "80"
                          : theme.colors.textMuted,
                      borderBottom:
                        activeTab === tab
                          ? `2px solid ${theme.colors.primary}`
                          : "2px solid transparent",
                      opacity: tab === "item" ? 0.5 : 1,
                    }}
                  >
                    {tabLabels[tab]}
                  </button>
                );
              })}
            </div>

            {/* 서브탭 + 어빌리티 선택 영역 (고정 높이로 레이아웃 시프트 방지) */}
            <div className="flex flex-col" style={{ height: "180px" }}>
              {/* 서브탭 영역 (고정 높이 예약) */}
              <div className="flex-shrink-0" style={{ minHeight: "40px" }}>
                {/* 서브탭: 전투 탭일 때 */}
                {activeTab === "combat" && (
                  <div className="px-3 pt-2">
                    <CombatSubTabs
                      activeSubTab={activeCombatSubTab}
                      onSubTabChange={setActiveCombatSubTab}
                      availableCategories={availableCombatCategories}
                      disabled={isExecuting}
                    />
                  </div>
                )}

                {/* 서브탭: 마법 탭일 때 (항상 표시) */}
                {activeTab === "magic" && (
                  <div className="px-3 pt-2">
                    <MagicSubTabs
                      activeElement={activeMagicElement}
                      onElementChange={setActiveMagicElement}
                      availableElements={availableMagicElements}
                      disabled={isExecuting}
                    />
                  </div>
                )}

                {/* 아이템 탭: 빈 공간 예약 */}
                {activeTab === "item" && <div className="h-8" />}
              </div>

              {/* 어빌리티 선택 (스크롤 영역) */}
              <div className="flex-1 overflow-y-auto">
                <AbilitySelector
                  abilities={filteredAbilities}
                  abilityLevels={abilityLevels}
                  onSelectAbility={handleSelectAbility}
                  disabled={isExecuting}
                />
              </div>
            </div>

            {/* 도주 버튼 */}
            <div
              className="px-4 py-3 border-t flex justify-end"
              style={{ borderColor: theme.colors.border }}
            >
              <button
                onClick={handleFlee}
                disabled={isExecuting}
                className="px-4 py-2 font-mono text-sm transition-colors"
                style={{
                  background: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textMuted,
                  opacity: isExecuting ? 0.5 : 1,
                }}
              >
                🏃 도주
              </button>
            </div>
          </>
        ) : (
          <BattleResult
            result={battle.result}
            monster={battle.monster}
            drops={pendingDrops}
            skillExpGains={battle.skillExpGains}
            allAbilities={allAbilities}
            onClose={handleCloseBattle}
          />
        )}
      </div>
    </div>
  );
}

// 전투 결과 컴포넌트
interface BattleResultProps {
  result: "victory" | "defeat" | "fled" | "ongoing";
  monster: { nameKo: string; rewards: { exp: number; gold: number } } | null;
  drops?: DropWithItem[];
  skillExpGains?: Record<string, number>;
  allAbilities?: Ability[];
  onClose: () => void;
}

function BattleResult({ result, monster, drops = [], skillExpGains = {}, allAbilities = [], onClose }: BattleResultProps) {
  const { theme } = useThemeStore();

  // 스킬 ID로 한국어 이름 찾기
  const getSkillName = (skillId: string): string => {
    const ability = allAbilities.find((a) => a.id === skillId);
    return ability?.nameKo ?? skillId;
  };

  return (
    <div className="text-center py-4 font-mono">
      <div
        style={{
          color:
            result === "victory"
              ? theme.colors.success
              : result === "defeat"
              ? theme.colors.error
              : theme.colors.textMuted,
        }}
      >
        {result === "victory" && (
          <div>
            <div className="text-3xl mb-2">🎉</div>
            <div className="text-xl font-bold">승리!</div>
            {monster && (
              <div
                className="text-sm mt-2"
                style={{ color: theme.colors.textMuted }}
              >
                +{monster.rewards.exp} EXP
                {monster.rewards.gold > 0 && ` · +${monster.rewards.gold} Gold`}
              </div>
            )}
            {/* 드랍 아이템 표시 */}
            {drops.length > 0 && (
              <div
                className="mt-4 mx-auto max-w-xs"
                style={{
                  background: theme.colors.bgDark,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: "4px",
                }}
              >
                <div
                  className="text-xs px-3 py-2 border-b"
                  style={{
                    color: theme.colors.textMuted,
                    borderColor: theme.colors.border,
                  }}
                >
                  📦 획득 아이템
                </div>
                <div className="px-3 py-2 space-y-1">
                  {drops.map((drop, idx) => {
                    const rarityColor = drop.item?.rarity
                      ? RARITY_CONFIG[drop.item.rarity].color
                      : theme.colors.text;
                    return (
                      <div
                        key={`${drop.itemId}-${idx}`}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="text-lg">{drop.item?.icon ?? "📦"}</span>
                        <span
                          className="flex-1 text-left truncate"
                          style={{ color: rarityColor }}
                        >
                          {drop.item?.nameKo ?? drop.itemId}
                        </span>
                        {drop.quantity > 1 && (
                          <span
                            className="text-xs px-1.5 rounded"
                            style={{
                              background: theme.colors.bgLight,
                              color: theme.colors.text,
                            }}
                          >
                            x{drop.quantity}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        {result === "defeat" && (
          <div>
            <div className="text-3xl mb-2">💀</div>
            <div className="text-xl font-bold">패배...</div>
          </div>
        )}
        {result === "fled" && (
          <div>
            <div className="text-3xl mb-2">🏃</div>
            <div className="text-xl font-bold">도주 성공!</div>
          </div>
        )}
      </div>

      {/* 스킬 경험치 획득 표시 (승리/패배/도주 모두) */}
      {Object.keys(skillExpGains).length > 0 && (
        <div
          className="mt-4 mx-auto max-w-xs"
          style={{
            background: theme.colors.bgDark,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: "4px",
          }}
        >
          <div
            className="text-xs px-3 py-2 border-b"
            style={{
              color: theme.colors.textMuted,
              borderColor: theme.colors.border,
            }}
          >
            📖 스킬 경험치
          </div>
          <div className="px-3 py-2 space-y-1">
            {Object.entries(skillExpGains).map(([skillId, amount]) => (
              <div
                key={skillId}
                className="flex items-center justify-between text-sm"
              >
                <span style={{ color: theme.colors.text }}>{getSkillName(skillId)}</span>
                <span style={{ color: theme.colors.primary }}>+{amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="mt-4 px-6 py-2 font-mono text-sm transition-colors"
        style={{
          background: theme.colors.bgLight,
          border: `1px solid ${theme.colors.border}`,
          color: theme.colors.text,
        }}
      >
        닫기
      </button>
    </div>
  );
}
