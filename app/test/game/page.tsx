"use client";

import { DEFAULT_BODY_INDEX, getItemRaceRestriction, getFitRule } from "@/shared/lib/character/catalog";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { DynamicUnityCanvas, useAppearanceStore } from "@/features/character";
import { globalStyles } from "@/shared/ui";

// ===== 타입 정의 =====
interface EquipmentItem {
  id: string;
  nameKo: string;
  nameEn: string;
  description: string;
  rarity: string;
  spriteId: string;
  stats?: Record<string, unknown>;
  requirements?: { raceCategories?: string[]; level?: number };
}

interface EquipmentCategory {
  items: EquipmentItem[];
  spriteMapping: string;
  weaponType?: string;
}

interface Race {
  id: string;
  category: string;
  nameKo: string;
  nameEn: string;
  appearance?: {
    body?: {
      spriteId?: string;
      defaultColor?: string;
      availableSpriteIds?: string[];
    };
    skinTones?: {
      available: string[];
      default: string;
    };
  };
}

interface SpriteMapping {
  sprites: string[];
  nameToIndex: Record<string, number>;
  spriteMap: Record<string, string>;
  idToIndex?: Record<string, number>;
}

interface AppearanceItem {
  id: string;
  index: number;
  sprite: string;
  ko: string;
  race?: string;
}

// DB 저장 형식
interface EquipmentState {
  rightHandId: string | null;
  leftHandId: string | null;
  helmetId: string | null;
  armorId: string | null;
  clothId: string | null;
  pantsId: string | null;
  backId: string | null;
}

interface AppearanceState {
  raceId: string | null;
  hairId: string | null;
  eyeId: string | null;
  facehairId: string | null;
  hairColor: string;
  leftEyeColor: string;
  rightEyeColor: string;
  faceHairColor: string;
}

// Unity가 이해하는 형식 (스프라이트 인덱스 기반)
interface UnityEquipmentState {
  rightHand: { weaponType: string; spriteIndex: number; spriteName: string } | null;
  leftHand: { weaponType: string; spriteIndex: number; spriteName: string } | null;
  helmet: { spriteIndex: number; spriteName: string } | null;
  armor: { spriteIndex: number; spriteName: string } | null;
  cloth: { spriteIndex: number; spriteName: string } | null;
  pants: { spriteIndex: number; spriteName: string } | null;
  back: { spriteIndex: number; spriteName: string } | null;
}

interface UnityAppearanceState {
  bodyIndex: number;
  eyeIndex: number;
  hairIndex: number;
  facehairIndex: number;
  hairColor: string;
  leftEyeColor: string;
  rightEyeColor: string;
  faceHairColor: string;
}

// ===== 슬롯 설정 =====
const HAND_WEAPON_CATEGORIES = [
  { key: "sword", label: "검", weaponType: "Sword" },
  { key: "axe", label: "도끼", weaponType: "Axe" },
  { key: "bow", label: "활", weaponType: "Bow" },
  { key: "spear", label: "창", weaponType: "Spear" },
  { key: "wand", label: "지팡이", weaponType: "Wand" },
  { key: "dagger", label: "단검", weaponType: "Dagger" },
  { key: "shield", label: "방패", weaponType: "Shield" },
];

const ARMOR_SLOTS: { slot: keyof EquipmentState; label: string; category: string }[] = [
  { slot: "helmetId", label: "머리", category: "helmet" },
  { slot: "armorId", label: "갑옷", category: "armor" },
  { slot: "clothId", label: "옷", category: "cloth" },
  { slot: "pantsId", label: "다리", category: "pant" },
  { slot: "backId", label: "등", category: "back" },
];

export default function GameTestPage() {
  const { callUnity, clearAll, isUnityLoaded } = useAppearanceStore();

  // 데이터 로딩 상태
  const [loading, setLoading] = useState(true);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string>("eastern_human");

  // 장비 데이터
  const [equipmentData, setEquipmentData] = useState<Record<string, EquipmentCategory>>({});
  const [spriteMappings, setSpriteMappings] = useState<Record<string, SpriteMapping>>({});

  // 외형 데이터
  const [appearanceData, setAppearanceData] = useState<{
    body: AppearanceItem[];
    eye: AppearanceItem[];
    hair: AppearanceItem[];
    facehair: AppearanceItem[];
  }>({ body: [], eye: [], hair: [], facehair: [] });

  // DB 저장 형식 상태
  const [equipment, setEquipment] = useState<EquipmentState>({
    rightHandId: null,
    leftHandId: null,
    helmetId: null,
    armorId: null,
    clothId: null,
    pantsId: null,
    backId: null,
  });

  // 양손 무기 카테고리 선택
  const [rightHandCategory, setRightHandCategory] = useState("sword");
  const [leftHandCategory, setLeftHandCategory] = useState("shield");

  const [appearance, setAppearance] = useState<AppearanceState>({
    raceId: "eastern_human",
    hairId: null,
    eyeId: null,
    facehairId: null,
    hairColor: "#6B4226",
    leftEyeColor: "#6B4226",
    rightEyeColor: "#6B4226",
    faceHairColor: "#6B4226",
  });

  // Unity 상태 (스프라이트 인덱스 기반)
  const [unityEquipment, setUnityEquipment] = useState<UnityEquipmentState>({
    rightHand: null,
    leftHand: null,
    helmet: null,
    armor: null,
    cloth: null,
    pants: null,
    back: null,
  });

  const [unityAppearance, setUnityAppearance] = useState<UnityAppearanceState>({
    bodyIndex: DEFAULT_BODY_INDEX,
    eyeIndex: -1,
    hairIndex: -1,
    facehairIndex: -1,
    hairColor: "#6B4226",
    leftEyeColor: "#6B4226",
    rightEyeColor: "#6B4226",
    faceHairColor: "#6B4226",
  });

  // 페이지 진입 시 Unity 상태 초기화 (Human_1)
  useEffect(() => {
    if (!isUnityLoaded) return;
    clearAll();
    callUnity("JS_SetBody", String(DEFAULT_BODY_INDEX));
    callUnity("JS_SetHair", "-1");
    callUnity("JS_SetFacehair", "-1");
    callUnity("JS_SetHairColor", "#6B4226");
    callUnity("JS_SetEyeColor", "#6B4226");
    callUnity("JS_SetFacehairColor", "#6B4226");
  }, [clearAll, callUnity, isUnityLoaded]);

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      try {
        // 종족 데이터 로드
        const racesRes = await fetch("/data/appearance/races/races.json");
        const racesData = await racesRes.json();
        setRaces(racesData.races || []);

        // 외형 스프라이트 데이터 로드
        const [bodyRes, eyeRes, hairRes, facehairRes] = await Promise.all([
          fetch("/data/sprites/appearance/body.json"),
          fetch("/data/sprites/appearance/eye.json"),
          fetch("/data/sprites/appearance/hair.json"),
          fetch("/data/sprites/appearance/facehair.json"),
        ]);
        const [bodyData, eyeData, hairData, facehairData] = await Promise.all([
          bodyRes.json(),
          eyeRes.json(),
          hairRes.json(),
          facehairRes.json(),
        ]);
        setAppearanceData({
          body: bodyData.bodies || [],
          eye: eyeData.eyes || [],
          hair: hairData.hairs || [],
          facehair: facehairData.facehairs || [],
        });

        // 장비 데이터 로드 (무기 + 방어구)
        const [
          swordsRes, axesRes, bowsRes, spearsRes, wandsRes, daggersRes, shieldsRes,
          helmetsRes, armorsRes, clothsRes, pantsRes, backsRes
        ] = await Promise.all([
          fetch("/data/items/equipment/weapons/swords.json"),
          fetch("/data/items/equipment/weapons/axes.json"),
          fetch("/data/items/equipment/weapons/bows.json"),
          fetch("/data/items/equipment/weapons/spears.json"),
          fetch("/data/items/equipment/weapons/wands.json"),
          fetch("/data/items/equipment/weapons/daggers.json"),
          fetch("/data/items/equipment/weapons/shields.json"),
          fetch("/data/items/equipment/wearables/helmets.json"),
          fetch("/data/items/equipment/wearables/armors.json"),
          fetch("/data/items/equipment/wearables/clothes.json"),
          fetch("/data/items/equipment/wearables/pants.json"),
          fetch("/data/items/equipment/wearables/backs.json"),
        ]);
        const [
          swordsData, axesData, bowsData, spearsData, wandsData, daggersData, shieldsData,
          helmetsData, armorsData, clothsData, pantsData, backsData
        ] = await Promise.all([
          swordsRes.json(), axesRes.json(), bowsRes.json(), spearsRes.json(),
          wandsRes.json(), daggersRes.json(), shieldsRes.json(),
          helmetsRes.json(), armorsRes.json(), clothsRes.json(), pantsRes.json(), backsRes.json(),
        ]);

        setEquipmentData({
          sword: { items: swordsData.items || [], spriteMapping: swordsData.spriteMapping, weaponType: "Sword" },
          axe: { items: axesData.items || [], spriteMapping: axesData.spriteMapping, weaponType: "Axe" },
          bow: { items: bowsData.items || [], spriteMapping: bowsData.spriteMapping, weaponType: "Bow" },
          spear: { items: spearsData.items || [], spriteMapping: spearsData.spriteMapping, weaponType: "Spear" },
          wand: { items: wandsData.items || [], spriteMapping: wandsData.spriteMapping, weaponType: "Wand" },
          dagger: { items: daggersData.items || [], spriteMapping: daggersData.spriteMapping, weaponType: "Dagger" },
          shield: { items: shieldsData.items || [], spriteMapping: shieldsData.spriteMapping, weaponType: "Shield" },
          helmet: { items: helmetsData.items || [], spriteMapping: helmetsData.spriteMapping },
          armor: { items: armorsData.items || [], spriteMapping: armorsData.spriteMapping },
          cloth: { items: clothsData.items || [], spriteMapping: clothsData.spriteMapping },
          pant: { items: pantsData.items || [], spriteMapping: pantsData.spriteMapping },
          back: { items: backsData.items || [], spriteMapping: backsData.spriteMapping },
        });

        // 스프라이트 매핑 로드
        const [
          swordSpriteRes, axeSpriteRes, bowSpriteRes, spearSpriteRes, wandSpriteRes, daggerSpriteRes, shieldSpriteRes,
          helmetSpriteRes, armorSpriteRes, clothSpriteRes, pantSpriteRes, backSpriteRes
        ] = await Promise.all([
          fetch("/data/sprites/equipment/weapons/sword.json"),
          fetch("/data/sprites/equipment/weapons/axe.json"),
          fetch("/data/sprites/equipment/weapons/bow.json"),
          fetch("/data/sprites/equipment/weapons/spear.json"),
          fetch("/data/sprites/equipment/weapons/wand.json"),
          fetch("/data/sprites/equipment/weapons/dagger.json"),
          fetch("/data/sprites/equipment/weapons/shield.json"),
          fetch("/data/sprites/equipment/wearables/helmet.json"),
          fetch("/data/sprites/equipment/wearables/armor.json"),
          fetch("/data/sprites/equipment/wearables/cloth.json"),
          fetch("/data/sprites/equipment/wearables/pant.json"),
          fetch("/data/sprites/equipment/wearables/back.json"),
        ]);
        const [
          swordSprite, axeSprite, bowSprite, spearSprite, wandSprite, daggerSprite, shieldSprite,
          helmetSprite, armorSprite, clothSprite, pantSprite, backSprite
        ] = await Promise.all([
          swordSpriteRes.json(), axeSpriteRes.json(), bowSpriteRes.json(),
          spearSpriteRes.json(), wandSpriteRes.json(), daggerSpriteRes.json(), shieldSpriteRes.json(),
          helmetSpriteRes.json(), armorSpriteRes.json(), clothSpriteRes.json(), pantSpriteRes.json(), backSpriteRes.json(),
        ]);

        setSpriteMappings({
          sword: swordSprite,
          axe: axeSprite,
          bow: bowSprite,
          spear: spearSprite,
          wand: wandSprite,
          dagger: daggerSprite,
          shield: shieldSprite,
          helmet: helmetSprite,
          armor: armorSprite,
          cloth: clothSprite,
          pant: pantSprite,
          back: backSprite,
        });

        setLoading(false);
      } catch (err) {
        console.error("Failed to load data:", err);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 선택된 종족
  const selectedRace = useMemo(() => {
    return races.find(r => r.id === selectedRaceId);
  }, [races, selectedRaceId]);

  // 종족별 필터링된 신체 목록
  const filteredBodies = useMemo(() => {
    if (!selectedRace) return appearanceData.body;
    const body = selectedRace.appearance?.body;
    const availableSpriteIds = body?.availableSpriteIds ?? (body?.spriteId ? [body.spriteId] : []);
    if (!availableSpriteIds) return appearanceData.body;
    return appearanceData.body.filter(b => availableSpriteIds.includes(b.sprite));
  }, [selectedRace, appearanceData.body]);

  // 종족별 필터링된 눈 목록 (종족 필터가 없으면 전체 반환)
  const filteredEyes = useMemo(() => {
    return appearanceData.eye;
  }, [appearanceData.eye]);

  // 스프라이트 ID → Unity 인덱스 및 스프라이트 이름 변환
  const getSpriteInfo = useCallback((category: string, spriteId: string): { index: number; name: string } => {
    const mapping = spriteMappings[category];
    if (!mapping) return { index: -1, name: "" };

    const lowerId = spriteId.toLowerCase();

    // 1. spriteMap이 있으면 사용 (sword.json 등)
    if (mapping.spriteMap?.[lowerId]) {
      const actualName = mapping.spriteMap[lowerId];
      return {
        index: mapping.nameToIndex?.[actualName] ?? -1,
        name: actualName
      };
    }

    // 2. spriteMap이 없으면 대소문자 무시하고 nameToIndex에서 직접 찾기
    const matchingKey = Object.keys(mapping.nameToIndex || {}).find(
      (key) => key.toLowerCase() === lowerId
    );
    if (matchingKey) {
      return {
        index: mapping.nameToIndex[matchingKey],
        name: matchingKey
      };
    }

    return { index: -1, name: "" };
  }, [spriteMappings]);

  // 기존 호환용
  const getSpriteIndex = useCallback((category: string, spriteId: string): number => {
    return getSpriteInfo(category, spriteId).index;
  }, [getSpriteInfo]);

  // 장비 선택 핸들러
  const handleEquipmentSelect = useCallback((slot: keyof EquipmentState, itemId: string | null, category: string) => {
    if (!isUnityLoaded) return;
    if (itemId) {
      const item = equipmentData[category]?.items.find(i => i.id === itemId);
      if (!item || getItemRaceRestriction({ ...item, slot: category }, selectedRaceId)) return;
      if (getSpriteInfo(category, item.spriteId).index < 0) return;
    }
    setEquipment(prev => ({ ...prev, [slot]: itemId }));

    // 손 장비인지 확인
    const isHandSlot = slot === "rightHandId" || slot === "leftHandId";
    const isRightHand = slot === "rightHandId";

    const methodMap: Record<string, string> = {
      helmetId: "JS_SetHelmet",
      armorId: "JS_SetArmor",
      clothId: "JS_SetCloth",
      pantsId: "JS_SetPant",
      backId: "JS_SetBack",
    };

    // Unity 슬롯 키 매핑
    const unitySlotMap: Record<string, keyof UnityEquipmentState> = {
      rightHandId: "rightHand",
      leftHandId: "leftHand",
      helmetId: "helmet",
      armorId: "armor",
      clothId: "cloth",
      pantsId: "pants",
      backId: "back",
    };

    if (itemId === null) {
      // 장비 해제
      setUnityEquipment(prev => ({ ...prev, [unitySlotMap[slot]]: null }));
      if (isHandSlot) {
        const weaponType = equipmentData[category]?.weaponType || "Sword";
        callUnity(isRightHand ? "JS_SetRightWeapon" : "JS_SetLeftWeapon", `${weaponType},-1`);
      } else {
        callUnity(methodMap[slot] || "", "-1");
      }
    } else {
      // 아이템 찾기
      const item = equipmentData[category]?.items.find(i => i.id === itemId);
      if (!item) return;

      const spriteInfo = getSpriteInfo(category, item.spriteId);
      if (spriteInfo.index === -1) {
        console.warn(`Sprite not found for ${item.spriteId} in category ${category}`);
        return;
      }

      // Unity 상태 업데이트
      if (isHandSlot) {
        const weaponType = equipmentData[category]?.weaponType || "Sword";
        setUnityEquipment(prev => ({
          ...prev,
          [unitySlotMap[slot]]: { weaponType, spriteIndex: spriteInfo.index, spriteName: spriteInfo.name }
        }));
        callUnity(isRightHand ? "JS_SetRightWeapon" : "JS_SetLeftWeapon", `${weaponType},${spriteInfo.index}`);
      } else {
        setUnityEquipment(prev => ({
          ...prev,
          [unitySlotMap[slot]]: { spriteIndex: spriteInfo.index, spriteName: spriteInfo.name }
        }));
        callUnity(methodMap[slot] || "", spriteInfo.index.toString());
      }
    }
  }, [callUnity, equipmentData, getSpriteInfo, selectedRaceId, isUnityLoaded]);

  // 손 카테고리 변경 핸들러
  const handleHandCategoryChange = useCallback((hand: "right" | "left", category: string) => {
    if (hand === "right") {
      setRightHandCategory(category);
      setEquipment(prev => ({ ...prev, rightHandId: null }));
      const weaponType = equipmentData[category]?.weaponType || "Sword";
      callUnity("JS_SetRightWeapon", `${weaponType},-1`);
    } else {
      setLeftHandCategory(category);
      setEquipment(prev => ({ ...prev, leftHandId: null }));
      const weaponType = equipmentData[category]?.weaponType || "Shield";
      callUnity("JS_SetLeftWeapon", `${weaponType},-1`);
    }
  }, [callUnity, equipmentData]);

  // 외형 선택 핸들러 (ID 기반)
  const handleAppearanceSelect = useCallback((type: "eye" | "hair" | "facehair", id: string | null) => {
    if (type === "eye") {
      const eyeItem = appearanceData.eye.find(e => e.id === id);
      const index = eyeItem ? eyeItem.index : -1;
      setAppearance(prev => ({ ...prev, eyeId: id }));
      setUnityAppearance(prev => ({ ...prev, eyeIndex: index }));
      callUnity("JS_SetEye", index.toString());
    } else if (type === "hair") {
      const hairItem = appearanceData.hair.find(h => h.id === id);
      const index = hairItem ? hairItem.index : -1;
      setAppearance(prev => ({ ...prev, hairId: id }));
      setUnityAppearance(prev => ({ ...prev, hairIndex: index }));
      callUnity("JS_SetHair", index.toString());
    } else if (type === "facehair") {
      const facehairItem = appearanceData.facehair.find(f => f.id === id);
      const index = facehairItem ? facehairItem.index : -1;
      setAppearance(prev => ({ ...prev, facehairId: id }));
      setUnityAppearance(prev => ({ ...prev, facehairIndex: index }));
      callUnity("JS_SetFacehair", index.toString());
    }
  }, [callUnity, appearanceData]);

  // 색상 선택 핸들러
  const handleColorSelect = useCallback((type: "hair" | "leftEye" | "rightEye" | "facehair", color: string) => {
    if (type === "hair") {
      setAppearance(prev => ({ ...prev, hairColor: color }));
      setUnityAppearance(prev => ({ ...prev, hairColor: color }));
      callUnity("JS_SetHairColor", color);
    } else if (type === "leftEye") {
      setAppearance(prev => ({ ...prev, leftEyeColor: color }));
      setUnityAppearance(prev => ({ ...prev, leftEyeColor: color }));
      callUnity("JS_SetLeftEyeColor", color);
    } else if (type === "rightEye") {
      setAppearance(prev => ({ ...prev, rightEyeColor: color }));
      setUnityAppearance(prev => ({ ...prev, rightEyeColor: color }));
      callUnity("JS_SetRightEyeColor", color);
    } else if (type === "facehair") {
      setAppearance(prev => ({ ...prev, faceHairColor: color }));
      setUnityAppearance(prev => ({ ...prev, faceHairColor: color }));
      callUnity("JS_SetFacehairColor", color);
    }
  }, [callUnity]);

  // 양쪽 눈 색상 동시 변경
  const handleBothEyeColorSelect = useCallback((color: string) => {
    setAppearance(prev => ({ ...prev, leftEyeColor: color, rightEyeColor: color }));
    setUnityAppearance(prev => ({ ...prev, leftEyeColor: color, rightEyeColor: color }));
    callUnity("JS_SetEyeColor", color);
  }, [callUnity]);

  // 종족 변경 핸들러
  const handleRaceChange = useCallback((raceId: string) => {
    setSelectedRaceId(raceId);
    for (const config of ARMOR_SLOTS) {
      const item = equipmentData[config.category]?.items.find(item => item.id === equipment[config.slot]);
      if (item && getItemRaceRestriction({ ...item, slot: config.category }, raceId)) {
        handleEquipmentSelect(config.slot, null, config.category);
      }
    }

    // raceId 저장
    setAppearance(prev => ({ ...prev, raceId }));

    // 해당 종족의 spriteId와 defaultColor로 Unity 초기화
    const race = races.find(r => r.id === raceId);
    if (race?.appearance?.body) {
      const { spriteId, defaultColor } = race.appearance.body;

      // spriteId로 body 데이터에서 인덱스 찾기
      if (spriteId) {
        const bodyItem = appearanceData.body.find(b => b.sprite === spriteId);
        const bodyIndex = bodyItem?.index ?? 0;

        setUnityAppearance(prev => ({ ...prev, bodyIndex }));
        callUnity("JS_SetBody", bodyIndex.toString());
      }

      // defaultColor 적용 (스킨톤)
      if (defaultColor) {
        callUnity("JS_SetBodyColor", defaultColor);
      }
    }
  }, [races, callUnity, appearanceData.body, equipmentData, equipment, handleEquipmentSelect]);

  if (loading) {
    return (
      <div className="h-dvh w-full bg-gray-900 text-white flex items-center justify-center">
        <p>데이터 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* 헤더 */}
      <header className="flex-none p-3 border-b border-gray-700 safe-area-top flex items-center justify-between relative z-50">
        <h1 className="text-lg font-bold">게임 테스트 (ID 기반)</h1>
        <Link
          href="/test"
          className="text-sm text-gray-400 hover:text-white px-3 py-2"
        >
          ← 목록
        </Link>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row safe-area-bottom">
        {/* Unity 캔버스 */}
        <div className="flex-1 min-h-0 flex items-center justify-center p-2">
          <div className="w-full h-full max-w-2xl relative">
            <DynamicUnityCanvas />
          </div>
        </div>

        {/* 설정 패널 */}
        <div className="flex-none lg:w-80 max-h-[45vh] lg:max-h-full overflow-y-auto bg-gray-800 p-3 space-y-3">

          {/* 종족 선택 */}
          <section className="rounded-lg border border-yellow-500/50 bg-yellow-500/5 p-2">
            <h2 className="text-sm font-semibold mb-2 text-gray-300">🏷️ 종족</h2>
            <select
              className="w-full bg-gray-800 text-sm rounded px-2 py-1 border border-gray-600"
              aria-label="종족 선택" disabled={!isUnityLoaded}
              value={selectedRaceId}
              onChange={(e) => handleRaceChange(e.target.value)}
            >
              {races.map((race) => (
                <option key={race.id} value={race.id}>{race.nameKo}</option>
              ))}
            </select>
          </section>

          {/* 외형 섹션 */}
          <section className="rounded-lg border border-purple-500/50 bg-purple-500/5 p-2">
            <h2 className="text-sm font-semibold mb-2 text-gray-300">👤 외형</h2>
            <div className="space-y-1">
              {/* 눈 */}
              <div className="bg-gray-700/30 rounded p-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-8 text-gray-400 text-xs">눈</span>
                    <input type="color" value={appearance.leftEyeColor} onChange={(e) => handleColorSelect("leftEye", e.target.value)} className="w-5 h-5 rounded cursor-pointer" title="왼쪽 눈" />
                    <input type="color" value={appearance.rightEyeColor} onChange={(e) => handleColorSelect("rightEye", e.target.value)} className="w-5 h-5 rounded cursor-pointer" title="오른쪽 눈" />
                  </div>
                  <select className="bg-gray-800 text-xs rounded px-1 py-0.5 border border-gray-600 max-w-[140px]" value={appearance.eyeId || ""} onChange={(e) => handleAppearanceSelect("eye", e.target.value || null)}>
                    <option value="">없음</option>
                    {filteredEyes.map((eye) => (<option key={eye.id} value={eye.id}>{eye.ko}</option>))}
                  </select>
                </div>
              </div>

              {/* 머리 */}
              <div className="bg-gray-700/30 rounded p-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-8 text-gray-400 text-xs">머리</span>
                    <input type="color" value={appearance.hairColor} onChange={(e) => handleColorSelect("hair", e.target.value)} className="w-5 h-5 rounded cursor-pointer" />
                  </div>
                  <select className="bg-gray-800 text-xs rounded px-1 py-0.5 border border-gray-600 max-w-[140px]" value={appearance.hairId || ""} onChange={(e) => handleAppearanceSelect("hair", e.target.value || null)}>
                    <option value="">없음</option>
                    {appearanceData.hair.map((h) => (<option key={h.id} value={h.id}>{h.ko}</option>))}
                  </select>
                </div>
              </div>

              {/* 수염 */}
              <div className="bg-gray-700/30 rounded p-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-8 text-gray-400 text-xs">수염</span>
                    <input type="color" value={appearance.faceHairColor} onChange={(e) => handleColorSelect("facehair", e.target.value)} className="w-5 h-5 rounded cursor-pointer" />
                  </div>
                  <select className="bg-gray-800 text-xs rounded px-1 py-0.5 border border-gray-600 max-w-[140px]" value={appearance.facehairId || ""} onChange={(e) => handleAppearanceSelect("facehair", e.target.value || null)}>
                    <option value="">없음</option>
                    {appearanceData.facehair.map((f) => (<option key={f.id} value={f.id}>{f.ko}</option>))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* 양손 장비 섹션 */}
          <section className="rounded-lg border border-amber-500/50 bg-amber-500/5 p-2">
            <h2 className="text-sm font-semibold mb-2 text-gray-300">⚔️ 무기</h2>
            <div className="space-y-2">
              {/* 오른손 */}
              <div className="bg-gray-700/50 rounded p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">✋ 오른손</span>
                  <select
                    value={rightHandCategory}
                    onChange={(e) => handleHandCategoryChange("right", e.target.value)}
                    className="bg-gray-800 text-sm rounded px-2 py-1 border border-gray-600"
                  >
                    {HAND_WEAPON_CATEGORIES.map((cat) => (<option key={cat.key} value={cat.key}>{cat.label}</option>))}
                  </select>
                </div>
                {equipmentData[rightHandCategory] && (
                  <select className="w-full bg-gray-800 text-xs rounded px-2 py-1 border border-gray-600" value={equipment.rightHandId || ""} onChange={(e) => handleEquipmentSelect("rightHandId", e.target.value || null, rightHandCategory)}>
                    <option value="">없음</option>
                    {equipmentData[rightHandCategory].items.map((item) => (<option key={item.id} value={item.id}>{item.nameKo}</option>))}
                  </select>
                )}
              </div>

              {/* 왼손 */}
              <div className="bg-gray-700/50 rounded p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">🤚 왼손</span>
                  <select
                    value={leftHandCategory}
                    onChange={(e) => handleHandCategoryChange("left", e.target.value)}
                    className="bg-gray-800 text-sm rounded px-2 py-1 border border-gray-600"
                  >
                    {HAND_WEAPON_CATEGORIES.map((cat) => (<option key={cat.key} value={cat.key}>{cat.label}</option>))}
                  </select>
                </div>
                {equipmentData[leftHandCategory] && (
                  <select className="w-full bg-gray-800 text-xs rounded px-2 py-1 border border-gray-600" value={equipment.leftHandId || ""} onChange={(e) => handleEquipmentSelect("leftHandId", e.target.value || null, leftHandCategory)}>
                    <option value="">없음</option>
                    {equipmentData[leftHandCategory].items.map((item) => (<option key={item.id} value={item.id}>{item.nameKo}</option>))}
                  </select>
                )}
              </div>
            </div>
          </section>

          {/* 방어구 섹션 */}
          <section className="rounded-lg border border-indigo-500/50 bg-indigo-500/5 p-2">
            <h2 className="text-sm font-semibold mb-2 text-gray-300">🛡️ 장비</h2>
            <div className="space-y-1">
              {ARMOR_SLOTS.map((slotConfig) => {
                const categoryData = equipmentData[slotConfig.category];
                if (!categoryData || categoryData.items.length === 0) return null;

                return (
                  <div key={slotConfig.slot} className="bg-gray-700/30 rounded p-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="w-10 text-gray-400 text-xs">{slotConfig.label}</span>
                      <select
                        className="bg-gray-800 text-xs rounded px-1 py-0.5 border border-gray-600 max-w-[160px]"
                        aria-label={`${slotConfig.label} 장비 선택`} disabled={!isUnityLoaded}
                        value={equipment[slotConfig.slot] || ""}
                        onChange={(e) => handleEquipmentSelect(slotConfig.slot, e.target.value || null, slotConfig.category)}
                      >
                        <option value="">없음</option>
                        {categoryData.items.map(item => <option key={item.id} value={item.id}
                          disabled={!!getItemRaceRestriction({ ...item, slot: slotConfig.category }, selectedRaceId)}>
                          {item.nameKo}{getFitRule(slotConfig.category, item.spriteId) ? " · 엘프 전용" : ""}
                        </option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 디버그 JSON */}
          <section className="rounded-lg border border-gray-500/50 bg-gray-500/5 p-2">
            <h2 className="text-sm font-semibold mb-2 text-gray-300">🔧 디버그</h2>
            <div className="space-y-2">
              <details className="text-xs">
                <summary className="text-blue-400 cursor-pointer">Unity 형식</summary>
                <pre className="p-2 bg-gray-900 rounded text-xs font-mono text-blue-300 overflow-auto max-h-24 mt-1">
{JSON.stringify({ appearance: unityAppearance, equipment: unityEquipment }, null, 2)}
                </pre>
              </details>
              <details className="text-xs">
                <summary className="text-green-400 cursor-pointer">DB 형식</summary>
                <pre className="p-2 bg-gray-900 rounded text-xs font-mono text-green-300 overflow-auto max-h-24 mt-1">
{JSON.stringify({ appearance, equipment }, null, 2)}
                </pre>
              </details>
            </div>
          </section>

        </div>
      </div>

      <style jsx global>{globalStyles}</style>
    </div>
  );
}
