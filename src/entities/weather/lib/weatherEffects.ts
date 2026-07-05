import type { WeatherType } from "../types";

// ============ 날씨 버프 타입 ============

export interface WeatherBuff {
  id: string;
  nameKo: string;
  nameEn: string;
  icon: string;
  weathers: WeatherType[]; // 적용되는 날씨
  effect: {
    type: "element" | "stat";
    target: string; // 속성명 또는 스탯명
    modifier: number; // 배율 (1.1 = +10%, 0.9 = -10%)
  };
  description: string;
}

// ============ 날씨 버프 정의 ============

export const WEATHER_BUFFS: WeatherBuff[] = [
  // Sunny: 신성 +10%, 암흑 -10%
  {
    id: "sunny_holy_boost",
    nameKo: "햇빛의 축복",
    nameEn: "Sunlight Blessing",
    icon: "☀️",
    weathers: ["sunny"],
    effect: { type: "element", target: "holy", modifier: 1.1 },
    description: "맑은 날 신성 마법 +10%",
  },
  {
    id: "sunny_dark_penalty",
    nameKo: "빛의 제약",
    nameEn: "Sunlight Weakness",
    icon: "☀️",
    weathers: ["sunny"],
    effect: { type: "element", target: "dark", modifier: 0.9 },
    description: "맑은 날 암흑 마법 -10%",
  },

  // Rainy: 번개 +15%, 화염 -10%
  {
    id: "rainy_lightning_boost",
    nameKo: "빗속의 번개",
    nameEn: "Storm Conductor",
    icon: "🌧️",
    weathers: ["rainy"],
    effect: { type: "element", target: "lightning", modifier: 1.15 },
    description: "비 오는 날 번개 마법 +15%",
  },
  {
    id: "rainy_fire_penalty",
    nameKo: "빗속의 화염",
    nameEn: "Doused Flames",
    icon: "🌧️",
    weathers: ["rainy"],
    effect: { type: "element", target: "fire", modifier: 0.9 },
    description: "비 오는 날 화염 마법 -10%",
  },

  // Stormy: 번개 +25%
  {
    id: "stormy_lightning_boost",
    nameKo: "폭풍의 전기",
    nameEn: "Storm Power",
    icon: "⛈️",
    weathers: ["stormy"],
    effect: { type: "element", target: "lightning", modifier: 1.25 },
    description: "폭풍 중 번개 마법 +25%",
  },

  // Foggy: 암흑 +15%
  {
    id: "foggy_dark_boost",
    nameKo: "안개 속 어둠",
    nameEn: "Fog Shroud",
    icon: "🌫️",
    weathers: ["foggy"],
    effect: { type: "element", target: "dark", modifier: 1.15 },
    description: "안개 낀 날 암흑 마법 +15%",
  },
];

// ============ 버프 조회 함수 ============

/**
 * 현재 날씨에 활성화된 모든 버프를 반환합니다.
 */
export function getActiveWeatherBuffs(weather: WeatherType): WeatherBuff[] {
  return WEATHER_BUFFS.filter((buff) => buff.weathers.includes(weather));
}

/**
 * 특정 속성에 대한 날씨 배율을 반환합니다.
 * 여러 버프가 적용될 경우 곱연산합니다.
 *
 * @example
 * const multiplier = getWeatherElementMultiplier("lightning", "stormy"); // 1.25
 * const multiplier = getWeatherElementMultiplier("dark", "sunny"); // 0.9
 */
export function getWeatherElementMultiplier(
  element: string,
  weather: WeatherType
): number {
  const buffs = WEATHER_BUFFS.filter(
    (b) =>
      b.effect.type === "element" &&
      b.effect.target === element &&
      b.weathers.includes(weather)
  );

  // 버프가 여러 개면 곱연산
  return buffs.reduce((mult, b) => mult * b.effect.modifier, 1.0);
}

/**
 * 특정 스탯에 대한 날씨 배율을 반환합니다.
 */
export function getWeatherStatMultiplier(
  stat: string,
  weather: WeatherType
): number {
  const buff = WEATHER_BUFFS.find(
    (b) =>
      b.effect.type === "stat" &&
      b.effect.target === stat &&
      b.weathers.includes(weather)
  );
  return buff?.effect.modifier ?? 1.0;
}

/**
 * 날씨에 따른 마법 속성 버프 정보를 반환합니다.
 * UI 표시용입니다.
 */
export function getWeatherBuffInfo(weather: WeatherType): {
  element: string;
  bonus: number;
  buffName: string;
}[] {
  const buffs = WEATHER_BUFFS.filter(
    (b) => b.effect.type === "element" && b.weathers.includes(weather)
  );

  return buffs.map((buff) => ({
    element: buff.effect.target,
    bonus: Math.round((buff.effect.modifier - 1) * 100),
    buffName: buff.nameKo,
  }));
}

// ============ 날씨 배경 오버레이 ============

export interface WeatherOverlayStyle {
  background: string;
  opacity: number;
}

/**
 * 날씨에 따른 배경 틴트 오버레이 스타일.
 * 시간대(period) 오버레이 위에 얇게 덧입혀 분위기를 강화한다.
 * - sunny: 오버레이 없음 (기본 밝음)
 * - cloudy: 옅은 회색으로 채도 낮춤
 * - rainy: 푸른빛 + 상단 어둠
 * - stormy: 짙은 남색 + 상단 어둠 (음산함)
 * - foggy: 뿌연 흰빛으로 대비 낮춤
 */
export function getWeatherOverlayStyle(weather: WeatherType): WeatherOverlayStyle {
  switch (weather) {
    case "sunny":
      return { background: "transparent", opacity: 0 };
    case "cloudy":
      return {
        background:
          "linear-gradient(180deg, rgba(120, 130, 140, 0.12) 0%, rgba(120, 130, 140, 0.05) 100%)",
        opacity: 1,
      };
    case "rainy":
      return {
        background:
          "linear-gradient(180deg, rgba(70, 100, 140, 0.18) 0%, rgba(40, 60, 90, 0.1) 100%)",
        opacity: 1,
      };
    case "stormy":
      return {
        background:
          "linear-gradient(180deg, rgba(30, 40, 70, 0.28) 0%, rgba(15, 20, 40, 0.18) 100%)",
        opacity: 1,
      };
    case "foggy":
      return {
        background:
          "linear-gradient(180deg, rgba(200, 205, 210, 0.14) 0%, rgba(180, 185, 190, 0.08) 100%)",
        opacity: 1,
      };
  }
}
