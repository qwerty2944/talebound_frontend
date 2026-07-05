// ============ 시간대 (Period) ============

export type Period = "dawn" | "day" | "dusk" | "night";

export interface PeriodInfo {
  id: Period;
  nameKo: string;
  nameEn: string;
  icon: string;
  startHour: number;
  endHour: number;
}

export const PERIOD_INFO: Record<Period, PeriodInfo> = {
  dawn: {
    id: "dawn",
    nameKo: "새벽",
    nameEn: "Dawn",
    icon: "🌅",
    startHour: 5,
    endHour: 7,
  },
  day: {
    id: "day",
    nameKo: "낮",
    nameEn: "Day",
    icon: "☀️",
    startHour: 7,
    endHour: 18,
  },
  dusk: {
    id: "dusk",
    nameKo: "황혼",
    nameEn: "Dusk",
    icon: "🌆",
    startHour: 18,
    endHour: 20,
  },
  night: {
    id: "night",
    nameKo: "밤",
    nameEn: "Night",
    icon: "🌙",
    startHour: 20,
    endHour: 5, // 다음날 5시까지
  },
};

// ============ 게임 시간 ============

export interface GameTime {
  gameHour: number; // 0-23
  gameMinute: number; // 0-59
  period: Period;
  periodProgress: number; // 0-100 (현재 시간대 내 진행률)
  nextPeriodIn: number; // 다음 시간대까지 남은 ms
  cycleHours: number; // 사이클 설정 (2 또는 4)
}

export interface GameSettings {
  id: string;
  day_cycle_hours: number;
  game_epoch: string;
  current_game_hour: number;
  current_period: Period;
  updated_at: string;
}

// ============ 시간대별 분위기 (밝기) ============

export type DayBrightness = "bright" | "dim" | "dark";

export function getPeriodBrightness(period: Period): DayBrightness {
  switch (period) {
    case "day":
      return "bright";
    case "dawn":
    case "dusk":
      return "dim";
    case "night":
      return "dark";
  }
}

// 낮인지 밤인지 간단히 판단
export function isDay(period: Period): boolean {
  return period === "day" || period === "dawn";
}

export function isNight(period: Period): boolean {
  return period === "night" || period === "dusk";
}

// ============ 시간대별 명도 오버레이 ============

export interface PeriodOverlayStyle {
  background: string;
  opacity: number;
}

/**
 * 시간대에 따른 UI 명도 오버레이 스타일
 * - day: 오버레이 없음 (밝음)
 * - dawn: 약간 푸른빛 (여명)
 * - dusk: 약간 붉은빛 (노을)
 * - night: 어두운 파란빛 (밤)
 */
export function getPeriodOverlayStyle(period: Period): PeriodOverlayStyle {
  // 상단(하늘)에서 하단(지면)으로 자연스럽게 번지는 세로 그라데이션.
  switch (period) {
    case "day":
      return { background: "transparent", opacity: 0 };
    case "dawn":
      // 여명: 위쪽 옅은 하늘색 → 아래 은은한 살구빛
      return {
        background:
          "linear-gradient(180deg, rgba(135, 206, 235, 0.14) 0%, rgba(255, 214, 170, 0.06) 60%, transparent 100%)",
        opacity: 1,
      };
    case "dusk":
      // 노을: 위쪽 주황 → 아래 보랏빛
      return {
        background:
          "linear-gradient(180deg, rgba(255, 140, 0, 0.16) 0%, rgba(148, 60, 90, 0.1) 70%, transparent 100%)",
        opacity: 1,
      };
    case "night":
      // 밤: 전반적인 미드나잇 블루 + 하단 짙은 어둠
      return {
        background:
          "linear-gradient(180deg, rgba(25, 25, 112, 0.2) 0%, rgba(10, 10, 40, 0.28) 100%)",
        opacity: 1,
      };
  }
}
