"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth";
import { useGameStore } from "@/application/stores";
import { ChatBox, useRealtimeChat } from "@/features/chat";
import { PlayerList } from "@/entities/player";
import { MapSelector } from "@/entities/map";
import { MonsterList } from "@/entities/monster";
import { NpcList, useNpcsByMap, type Npc } from "@/entities/npc";
import { questKeys } from "@/entities/quest";
import { useDungeonsByMap } from "@/entities/dungeon";
import { useEnterDungeon, useAdvanceWave } from "@/features/dungeon";
import { InjuryDisplay } from "@/entities/status";
import {
  useProfile,
  getMainCharacter,
  getFatiguePercent,
  getMaxFatigueFromProfile,
  getCurrentFatigue,
  FATIGUE_COST,
} from "@/entities/user";
import {
  useMaps,
  getMapById,
  getMapDisplayName,
} from "@/entities/map";
import type { Monster } from "@/entities/monster";
import { useProficiencies } from "@/entities/ability";
import type { CharacterStats } from "@/entities/character";
import {
  useCharacterTraitsWithDetails,
  calculateAggregatedEffects,
  applyStatModifiers,
} from "@/entities/trait";
import type { Trait } from "@/entities/trait";
import type { ProficiencyType, CombatProficiencyType } from "@/entities/ability";
import { GameTimeClock, AtmosphericText, useRealtimeGameTime, getPeriodOverlayStyle } from "@/entities/game-time";
import { WeatherDisplay, useRealtimeWeather, getWeatherOverlayStyle } from "@/entities/weather";
import { useBattleStore, usePvpStore, useDungeonStore } from "@/application/stores";
import { useStartBattle, useEndBattle } from "@/features/combat";
import { useRealtimeDuel, DuelRequestModal, DuelBattlePanel } from "@/features/duel";
import { useDuelAction } from "@/features/pvp";
import { useUpdateLocation } from "@/features/player";
import { useCheckDailyLogin } from "@/features/login-streak";
import { useThemeStore } from "@/application/stores";
import { CollapsibleSection, LevelUpBanner } from "@/shared/ui";
import type { DailyLoginResult } from "@/entities/user";

// 동적 임포트: 조건부 렌더링 컴포넌트 (번들 최적화)
// @see docs/performance/bundle-optimization.md
const BattlePanel = dynamic(
  () => import("@/features/combat").then((m) => m.BattlePanel),
  { ssr: false }
);

const StatusModal = dynamic(
  () => import("@/widgets/status-modal").then((m) => m.StatusModal),
  { ssr: false }
);

const WorldMapModal = dynamic(
  () => import("@/entities/map").then((m) => m.WorldMapModal),
  { ssr: false }
);


const HealerDialog = dynamic(
  () => import("@/entities/npc").then((m) => m.HealerDialog),
  { ssr: false }
);

const QuestDialog = dynamic(
  () => import("@/entities/quest").then((m) => m.QuestDialog),
  { ssr: false }
);

const LoginStreakModal = dynamic(
  () => import("@/features/login-streak").then((m) => m.LoginStreakModal),
  { ssr: false }
);

export default function GamePage() {
  const router = useRouter();
  const { theme, setThemeByTerrain } = useThemeStore();
  const { session, signOut } = useAuthStore();
  const { currentMap, setCurrentMap, isConnected, setMyCharacterName, myCharacterName } =
    useGameStore();

  // React Query로 서버 상태 관리
  const { data: profile, isLoading: profileLoading } = useProfile(session?.user?.id);
  const { data: maps = [] } = useMaps();

  // 로컬 UI 상태 - 프로필에서 마지막 위치 로드
  const [mapId, setMapId] = useState<string | null>(null);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedNpc, setSelectedNpc] = useState<Npc | null>(null);
  const [levelUpBanner, setLevelUpBanner] = useState<{ newLevel: number; levelsGained: number } | null>(null);

  // 연속 로그인 시스템
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [loginResult, setLoginResult] = useState<DailyLoginResult | null>(null);
  const checkDailyLogin = useCheckDailyLogin();
  const hasCheckedLogin = useRef(false);

  // NPC 조회
  const { data: npcs = [] } = useNpcsByMap(mapId || "starting_village");

  const queryClient = useQueryClient();

  // 전투 관련
  const { battle } = useBattleStore();
  const { start: startBattle } = useStartBattle({ userId: session?.user?.id });
  const { data: proficiencies } = useProficiencies(session?.user?.id);

  // 던전 관련
  const { data: dungeons = [] } = useDungeonsByMap(mapId || "starting_village");
  const clearRun = useDungeonStore((s) => s.clearRun);
  const { enter: enterDungeon } = useEnterDungeon();
  const { advance: advanceWave } = useAdvanceWave(session?.user?.id);

  // 맵 이동 (피로도 소모)
  const updateLocation = useUpdateLocation();

  // PvP 관련
  const { declineNotice, setDeclineNotice } = usePvpStore();

  // 시간대별 명도 오버레이
  const { gameTime } = useRealtimeGameTime();
  const periodOverlay = getPeriodOverlayStyle(gameTime?.period || "day");

  // 날씨 배경 틴트 오버레이
  const { weather } = useRealtimeWeather();
  const weatherOverlay = getWeatherOverlayStyle(weather?.currentWeather || "sunny");

  // 결투 거절 알림 표시
  useEffect(() => {
    if (declineNotice) {
      toast(`${declineNotice.targetName}님이 결투를 거절했습니다.`, {
        icon: "⚔️",
        duration: 3000,
      });
      setDeclineNotice(null);
    }
  }, [declineNotice, setDeclineNotice]);

  const mainCharacter = getMainCharacter(profile);
  const fatiguePercent = getFatiguePercent(profile);

  // 특성 효과 집계 (전투 스탯 보정용)
  const { data: characterTraitsData } = useCharacterTraitsWithDetails(session?.user?.id);
  const traitEffects = useMemo(() => {
    const traits = (characterTraitsData ?? [])
      .map((ct) => ct.trait)
      .filter((t): t is Trait => t !== undefined);
    if (traits.length === 0) return null;
    return calculateAggregatedEffects(traits);
  }, [characterTraitsData]);

  // 특성 스탯 보정을 적용한 전투용 스탯.
  // applyStatModifiers는 7개 기본 스탯만 반환하므로, 기존 스탯 위에 덮어써
  // 선택적 전투 스탯(physicalAttack 등)을 보존한다. 특성이 없으면 원본 그대로.
  const combatStats = useMemo<CharacterStats | undefined>(() => {
    const base = mainCharacter?.stats;
    if (!base) return undefined;
    if (!traitEffects) return base;
    return { ...base, ...applyStatModifiers(base, traitEffects) };
  }, [mainCharacter?.stats, traitEffects]);

  // 헤더 HP/MP 표시용 (전투 시작 계산과 동일 공식)
  const headerMaxHp = 50 + (mainCharacter?.stats?.con ?? 10) * 5 + (profile?.level ?? 1) * 10;
  const headerMaxMp = 20 + (mainCharacter?.stats?.wis ?? 10) * 3 + (mainCharacter?.stats?.int ?? 10);
  const headerHp = profile?.currentHp ?? headerMaxHp;
  const headerMp = profile?.currentMp ?? headerMaxMp;
  const hpPercent = Math.max(0, Math.min(100, (headerHp / headerMaxHp) * 100));
  const mpPercent = Math.max(0, Math.min(100, (headerMp / headerMaxMp) * 100));

  // 캐릭터 정보 로드
  useEffect(() => {
    if (!session?.user?.id) {
      router.push("/login");
      return;
    }

    if (profile && !profileLoading) {
      if (!profile.character) {
        router.push("/character-create");
        return;
      }

      setMyCharacterName(profile.character.name);
    }
  }, [session, profile, profileLoading, router, setMyCharacterName]);

  // 연속 로그인 체크 (프로필 로드 후 1회)
  useEffect(() => {
    if (
      profile &&
      !profileLoading &&
      session?.user?.id &&
      !hasCheckedLogin.current &&
      !checkDailyLogin.isPending
    ) {
      hasCheckedLogin.current = true;

      checkDailyLogin.mutate(session.user.id, {
        onSuccess: (result) => {
          if (result.isNewDay) {
            setLoginResult(result);
            setShowStreakModal(true);
          }
        },
      });
    }
  }, [profile, profileLoading, session?.user?.id, checkDailyLogin]);

  // 프로필에서 마지막 위치 로드 (초기 로드 시)
  useEffect(() => {
    if (profile && maps.length > 0 && mapId === null) {
      const savedMapId = profile.currentMapId || "starting_village";
      const savedMap = getMapById(maps, savedMapId);
      if (savedMap) {
        setMapId(savedMapId);
        setCurrentMap({
          id: savedMap.id,
          name: getMapDisplayName(savedMap),
          description: savedMap.descriptionKo || "",
        });
      } else {
        // 저장된 맵이 없으면 기본 위치로
        const defaultMap = getMapById(maps, "starting_village");
        if (defaultMap) {
          setMapId("starting_village");
          setCurrentMap({
            id: defaultMap.id,
            name: getMapDisplayName(defaultMap),
            description: defaultMap.descriptionKo || "",
          });
        }
      }
    }
  }, [profile, maps, mapId, setCurrentMap]);

  // 서버에서 맵 변경 시 동기화 (패배 후 귀환 등)
  // 주의: mapId를 의존성에서 제거하여 사용자 이동 시 경쟁 조건 방지
  useEffect(() => {
    if (profile && maps.length > 0 && profile.currentMapId) {
      const serverMapId = profile.currentMapId;
      const serverMap = getMapById(maps, serverMapId);
      if (serverMap) {
        setMapId(serverMapId);
        setCurrentMap({
          id: serverMap.id,
          name: getMapDisplayName(serverMap),
          description: serverMap.descriptionKo || "",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.currentMapId, maps, setCurrentMap]);

  // 맵 변경 시 테마 자동 적용 (terrain 기반)
  useEffect(() => {
    if (mapId && maps.length > 0) {
      const currentMapData = getMapById(maps, mapId);
      if (currentMapData?.terrain) {
        setThemeByTerrain(currentMapData.terrain);
      }
    }
  }, [mapId, maps, setThemeByTerrain]);

  const { sendMessage, room } = useRealtimeChat({
    mapId: mapId || "starting_village",
    userId: session?.user?.id || "",
    characterName: myCharacterName,
  });

  // ============ PvP 결투 ============
  const {
    requestDuel,
    respondToDuel,
    pendingRequests,
    activeDuel,
    isInDuel,
    broadcastAction,
    broadcastDuelEnd,
    resetDuel,
  } = useRealtimeDuel({
    mapId: mapId || "starting_village",
    userId: session?.user?.id || "",
    characterName: myCharacterName,
    room,
    stats: mainCharacter?.stats,
    proficiencies,
    level: profile?.level ?? 1,
    currentHp: profile?.currentHp,
  });

  const duelAction = useDuelAction({
    userId: session?.user?.id || "",
    onAction: broadcastAction,
    onVictory: () => {
      const duel = usePvpStore.getState().activeDuel;
      const myId = session?.user?.id;
      if (duel && myId) {
        broadcastDuelEnd({
          duelId: duel.duelId,
          winnerId: myId,
          loserId: duel.player1.id === myId ? duel.player2.id : duel.player1.id,
          reason: "knockout",
        });
        toast.success("🏆 결투 승리!");
      }
    },
  });

  const handleMapChange = async (newMapId: string) => {
    const newMap = getMapById(maps, newMapId);
    if (newMap && session?.user?.id && myCharacterName) {
      // 피로도 사전 체크 - 부족하면 이동 자체를 막음
      const currentFatigue = getCurrentFatigue(profile);
      if (currentFatigue < FATIGUE_COST.MAP_MOVE) {
        toast.error("피로도가 부족합니다");
        return;
      }

      // 피로도 충분하면 로컬 상태 업데이트
      setMapId(newMapId);
      setCurrentMap({
        id: newMap.id,
        name: getMapDisplayName(newMap),
        description: newMap.descriptionKo || "",
      });

      try {
        // 피로도 소모 + 위치 업데이트
        await updateLocation.mutateAsync({
          userId: session.user.id,
          characterName: myCharacterName,
          mapId: newMapId,
        });
      } catch (error) {
        console.error("Failed to move:", error);
        // 서버 에러 시 이전 위치로 롤백
        const prevMapId = profile?.currentMapId || "starting_village";
        const prevMap = getMapById(maps, prevMapId);
        if (prevMap) {
          setMapId(prevMapId);
          setCurrentMap({
            id: prevMap.id,
            name: getMapDisplayName(prevMap),
            description: prevMap.descriptionKo || "",
          });
        }
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // 전투 종료 (경험치/골드/레벨업 처리)
  const { endBattle } = useEndBattle({
    userId: session?.user?.id,
    onVictory: (rewards) => {
      console.log("[Battle] Victory! Rewards:", rewards);
      // 레벨업 시 축하 배너 연출
      if (rewards.levelUp) {
        setLevelUpBanner({
          newLevel: rewards.levelUp.newLevel,
          levelsGained: rewards.levelUp.levelsGained,
        });
      }
      // 전투 승리 시 퀘스트 kill 진행도가 서버에서 갱신됨 → 목록 무효화
      if (session?.user?.id) {
        queryClient.invalidateQueries({ queryKey: questKeys.list(session.user.id) });
      }
    },
    onDefeat: () => {
      console.log("[Battle] Defeat...");
    },
    onFled: () => {
      console.log("[Battle] Fled!");
    },
  });

  // 전투 시작
  const handleSelectMonster = useCallback(
    (monster: Monster) => {
      if (!profile || battle.isInBattle) return;

      // 최대 HP 계산 (CON 기반: 50 + CON * 5 + level * 10)
      const baseCon = mainCharacter?.stats?.con ?? 10;
      const maxHp = 50 + baseCon * 5 + profile.level * 10;

      // 최대 MP 계산 (WIS * 3 + INT + 20)
      const baseInt = mainCharacter?.stats?.int ?? 10;
      const baseWis = mainCharacter?.stats?.wis ?? 10;
      const maxMp = 20 + baseWis * 3 + baseInt;

      // 저장된 HP/MP 사용 (null이면 최대값)
      const playerHp = profile.currentHp ?? maxHp;
      const playerMp = profile.currentMp ?? maxMp;

      startBattle(monster, playerHp, maxHp, playerMp, maxMp);
    },
    [profile, battle.isInBattle, startBattle, mainCharacter]
  );

  // 전투 승리 - 던전 런 중이면 웨이브 진행(서버 정산), 아니면 일반 endBattle
  const handleVictory = useCallback((drops: { itemId: string; quantity: number }[]) => {
    if (useDungeonStore.getState().activeRun) {
      advanceWave();
    } else {
      endBattle(drops);
    }
  }, [endBattle, advanceWave]);

  // 전투 패배 - 던전 런은 폐기하고 일반 패배 처리(HP=1, 귀환)
  const handleDefeat = useCallback(() => {
    if (useDungeonStore.getState().activeRun) clearRun();
    endBattle();
  }, [endBattle, clearRun]);

  // 도주 - 던전 런은 폐기
  const handleFlee = useCallback(() => {
    if (useDungeonStore.getState().activeRun) clearRun();
    endBattle();
  }, [endBattle, clearRun]);

  // 던전 입장
  const handleEnterDungeon = useCallback(
    (dungeonId: string) => {
      if (!profile || battle.isInBattle) return;
      const dungeon = dungeons.find((d) => d.id === dungeonId);
      if (!dungeon) return;
      const baseCon = mainCharacter?.stats?.con ?? 10;
      const maxHp = 50 + baseCon * 5 + profile.level * 10;
      const baseInt = mainCharacter?.stats?.int ?? 10;
      const baseWis = mainCharacter?.stats?.wis ?? 10;
      const maxMp = 20 + baseWis * 3 + baseInt;
      const playerHp = profile.currentHp ?? maxHp;
      const playerMp = profile.currentMp ?? maxMp;
      enterDungeon(dungeon, { playerHp, playerMaxHp: maxHp, playerMp, playerMaxMp: maxMp });
    },
    [profile, battle.isInBattle, dungeons, mainCharacter, enterDungeon]
  );

  // NPC 선택 핸들러
  const handleSelectNpc = useCallback(
    (npcId: string) => {
      const npc = npcs.find((n) => n.id === npcId);
      if (npc) {
        setSelectedNpc(npc);
      }
    },
    [npcs]
  );

  if (profileLoading || !profile) {
    return (
      <div
        className="h-dvh w-full flex items-center justify-center"
        style={{ background: theme.colors.bg }}
      >
        <div className="text-center">
          <div
            className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-4"
            style={{ borderColor: theme.colors.primary, borderTopColor: "transparent" }}
          />
          <p className="font-mono" style={{ color: theme.colors.textMuted }}>
            게임 로딩 중...
          </p>
        </div>
      </div>
    );
  }

  if (!session?.user?.id || !myCharacterName) {
    return null;
  }

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden" style={{ background: theme.colors.bg }}>
      {/* 피로도 게이지 (상단 바) */}
      <div className="flex-none h-1.5" style={{ background: theme.colors.bgDark }}>
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${fatiguePercent}%`,
            background:
              fatiguePercent > 50
                ? theme.colors.success
                : fatiguePercent > 20
                ? theme.colors.warning
                : theme.colors.error,
          }}
        />
      </div>

      {/* 헤더 */}
      <header
        className="flex-none px-2 sm:px-3 py-2 border-b"
        style={{
          background: theme.colors.bgLight,
          borderColor: theme.colors.border,
        }}
      >
        {/* 상단 바: 피로도 + 시간/날씨 + 설정 */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* 왼쪽: HP/MP/피로도 */}
          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-mono min-w-0">
            <div className="flex items-center gap-1" title={`HP ${headerHp}/${headerMaxHp}`}>
              <span>❤️</span>
              <div className="w-10 sm:w-16 h-1.5 rounded overflow-hidden" style={{ background: theme.colors.bgDark }}>
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${hpPercent}%`,
                    background: hpPercent > 50 ? theme.colors.success : hpPercent > 20 ? theme.colors.warning : theme.colors.error,
                  }}
                />
              </div>
              <span className="hidden sm:inline" style={{ color: theme.colors.textDim }}>{headerHp}</span>
            </div>
            <div className="flex items-center gap-1" title={`MP ${headerMp}/${headerMaxMp}`}>
              <span>💧</span>
              <div className="w-10 sm:w-16 h-1.5 rounded overflow-hidden" style={{ background: theme.colors.bgDark }}>
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${mpPercent}%`, background: theme.colors.primary }}
                />
              </div>
              <span className="hidden sm:inline" style={{ color: theme.colors.textDim }}>{headerMp}</span>
            </div>
            <div className="items-center gap-1 hidden sm:flex">
              <span style={{ color: theme.colors.textMuted }}>피로도</span>
              <span
                className="font-medium"
                style={{ color: fatiguePercent <= 20 ? theme.colors.error : theme.colors.textDim }}
              >
                {getCurrentFatigue(profile)}/{getMaxFatigueFromProfile(profile)}
              </span>
            </div>
          </div>

          {/* 중앙: 시간 + 날씨 (모바일에서 아이콘만) */}
          <div className="flex items-center gap-1 sm:gap-2">
            <GameTimeClock compact />
            <WeatherDisplay compact />
          </div>

          {/* 오른쪽: 로그아웃 */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={handleSignOut}
              className="text-[10px] sm:text-xs font-mono transition-colors p-1"
              style={{ color: theme.colors.textMuted }}
              title="로그아웃"
            >
              <span className="sm:hidden">🚪</span>
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>

        {/* 메인 헤더: 맵 정보 + 캐릭터 */}
        <div className="flex items-center justify-between gap-2">
          {/* 왼쪽: 맵 아이콘 + 정보 */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-lg sm:text-xl flex-shrink-0">
              {getMapById(maps, mapId || "starting_village")?.icon || "🏠"}
            </span>
            <div className="min-w-0 flex-1">
              <h1
                className="text-sm sm:text-lg font-bold font-mono truncate"
                style={{ color: theme.colors.text }}
              >
                {currentMap?.name || "시작 마을"}
              </h1>
              <p
                className="text-[10px] sm:text-xs font-mono truncate hidden sm:block"
                style={{ color: theme.colors.textMuted }}
              >
                {currentMap?.description}
              </p>
              <AtmosphericText mapId={mapId || "starting_village"} className="mt-0.5 sm:mt-1 hidden md:block" />
            </div>
          </div>

          {/* 오른쪽: 캐릭터 정보 + 접속 상태 */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* 상태창 버튼 */}
            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 transition-colors"
              style={{
                background: theme.colors.bgDark,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
              }}
            >
              <span className="text-xs sm:text-sm">👤</span>
              <span className="text-xs sm:text-sm font-mono font-medium max-w-[60px] sm:max-w-none truncate">
                {myCharacterName}
              </span>
              <span
                className="text-[10px] sm:text-xs font-mono"
                style={{ color: theme.colors.textMuted }}
              >
                Lv.{profile.level}
              </span>
              {/* 부상 표시 */}
              {profile.injuries.length > 0 && (
                <InjuryDisplay injuries={profile.injuries} compact />
              )}
            </button>
            {/* 재화 표시 */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-mono">
              <span style={{ color: theme.colors.warning }}>💰 {profile.gold.toLocaleString()}</span>
              <span className="hidden md:inline" style={{ color: theme.colors.primary }}>💎 {profile.gems.toLocaleString()}</span>
            </div>
            {/* 접속 상태 */}
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: isConnected ? theme.colors.success : theme.colors.error }}
              title={isConnected ? "접속됨" : "연결 끊김"}
            />
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 p-3 gap-3">
        {/* 채팅 영역 (메인) */}
        <div className="flex-1 min-h-0 lg:min-w-0">
          <ChatBox
            userId={session.user.id}
            onSend={sendMessage}
            isConnected={isConnected}
          />
        </div>

        {/* 사이드바 */}
        <div className="flex-none lg:w-64 flex flex-col gap-2 min-h-0 max-h-[50vh] lg:max-h-full overflow-y-auto">
          {/* 접속 유저 */}
          <CollapsibleSection id="sidebar_players" title="접속 유저" icon="👥" defaultOpen={true}>
            <PlayerList
              currentUserId={session.user.id}
              compact
              canDuel={!battle.isInBattle && !isInDuel}
              onDuelRequest={(target) => {
                requestDuel(target.userId, target.characterName);
                toast(`${target.characterName}님에게 결투를 신청했습니다.`, { icon: "⚔️" });
              }}
            />
          </CollapsibleSection>

          {/* 몬스터 목록 */}
          <CollapsibleSection id="sidebar_monsters" title="몬스터" icon="👹" defaultOpen={true}>
            <MonsterList
              mapId={mapId || "starting_village"}
              playerLevel={profile.level}
              onSelectMonster={handleSelectMonster}
              disabled={battle.isInBattle}
              compact
            />
          </CollapsibleSection>

          {/* NPC 목록 */}
          <CollapsibleSection id="sidebar_npcs" title="NPC" icon="🧑‍🤝‍🧑" defaultOpen={true}>
            <NpcList
              mapId={mapId || "starting_village"}
              onSelectNpc={handleSelectNpc}
              disabled={battle.isInBattle}
              compact
            />
          </CollapsibleSection>

          {/* 던전 (입장 가능한 맵에서만) */}
          {dungeons.length > 0 && (
            <CollapsibleSection id="sidebar_dungeons" title="던전" icon="🏛️" defaultOpen={true}>
              <div className="flex flex-col gap-2">
                {dungeons.map((d) => {
                  const levelOk = profile.level >= d.minLevel;
                  const disabled = battle.isInBattle || !levelOk;
                  return (
                    <button
                      key={d.id}
                      onClick={() => handleEnterDungeon(d.id)}
                      disabled={disabled}
                      className="w-full px-3 py-2 text-left text-xs font-mono transition-colors"
                      style={{
                        background: theme.colors.bgDark,
                        border: `1px solid ${theme.colors.border}`,
                        color: disabled ? theme.colors.textMuted : theme.colors.text,
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.6 : 1,
                      }}
                      title={d.descriptionKo}
                    >
                      <div className="flex items-center justify-between">
                        <span>{d.icon} {d.nameKo}</span>
                        <span style={{ color: theme.colors.warning }}>
                          {levelOk ? `${d.waves.length}웨이브` : `🔒 Lv.${d.minLevel}`}
                        </span>
                      </div>
                      <div style={{ color: theme.colors.textMuted }}>
                        피로도 {d.fatigueCost}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CollapsibleSection>
          )}

          {/* 이동 */}
          <CollapsibleSection id="sidebar_travel" title="이동" icon="🚶" defaultOpen={true}>
            <MapSelector
              currentMapId={mapId || "starting_village"}
              onMapChange={handleMapChange}
              playerLevel={profile.level}
              compact
            />
          </CollapsibleSection>

          {/* 월드맵 버튼 (별도 분리) */}
          <button
            onClick={() => setShowWorldMap(true)}
            className="w-full px-3 py-2 text-sm font-mono font-medium transition-colors flex items-center justify-center gap-2"
            style={{
              background: theme.colors.bgLight,
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.text,
              borderRadius: "4px",
            }}
          >
            <span>🌍</span>
            <span>월드맵</span>
          </button>
        </div>
      </div>

      {/* 전투 패널 */}
      {battle.isInBattle && mainCharacter?.stats && session?.user?.id && (
        <BattlePanel
          userId={session.user.id}
          characterStats={combatStats ?? mainCharacter.stats}
          proficiencies={proficiencies}
          traitEffects={traitEffects}
          onFlee={handleFlee}
          onVictory={handleVictory}
          onDefeat={handleDefeat}
        />
      )}

      {/* 월드맵 모달 */}
      <WorldMapModal
        open={showWorldMap}
        onClose={() => setShowWorldMap(false)}
        currentMapId={mapId || "starting_village"}
        onMapSelect={handleMapChange}
        playerLevel={profile.level}
      />

      {/* 치료사 NPC 다이얼로그 */}
      {selectedNpc && selectedNpc.type === "healer" && (
        <HealerDialog
          npc={selectedNpc}
          injuries={profile.injuries}
          playerGold={profile.gold}
          userId={session.user.id}
          onClose={() => setSelectedNpc(null)}
        />
      )}

      {/* 퀘스트 NPC 다이얼로그 */}
      {selectedNpc && selectedNpc.type === "quest" && (
        <QuestDialog
          npc={selectedNpc}
          userId={session.user.id}
          playerLevel={profile.level}
          currentMapId={mapId || "starting_village"}
          onClose={() => setSelectedNpc(null)}
        />
      )}

      {/* 결투 신청 수신 모달 */}
      {pendingRequests.length > 0 && !isInDuel && (
        <DuelRequestModal
          request={pendingRequests[0]}
          onAccept={() => respondToDuel(pendingRequests[0].challengerId, true)}
          onDecline={() => respondToDuel(pendingRequests[0].challengerId, false)}
        />
      )}

      {/* 결투 패널 */}
      {activeDuel && (
        <DuelBattlePanel
          userId={session.user.id}
          duel={activeDuel}
          onAttack={(attackType) => duelAction.attack(attackType as CombatProficiencyType)}
          onFlee={() => duelAction.flee()}
          onClose={resetDuel}
        />
      )}

      {/* 상태창 모달 */}
      <StatusModal open={showStatusModal} onClose={() => setShowStatusModal(false)} />

      {/* 연속 로그인 모달 */}
      {loginResult && (
        <LoginStreakModal
          open={showStreakModal}
          onClose={() => setShowStreakModal(false)}
          result={loginResult}
        />
      )}

      {/* 레벨업 축하 배너 */}
      {levelUpBanner && (
        <LevelUpBanner
          newLevel={levelUpBanner.newLevel}
          levelsGained={levelUpBanner.levelsGained}
          onDone={() => setLevelUpBanner(null)}
        />
      )}

      {/* 날씨 배경 틴트 오버레이 (시간대 오버레이 아래) */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: weatherOverlay.background,
          opacity: weatherOverlay.opacity,
          zIndex: 9,
        }}
      />

      {/* 시간대별 명도 오버레이 */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: periodOverlay.background,
          opacity: periodOverlay.opacity,
          zIndex: 10,
        }}
      />
    </div>
  );
}
