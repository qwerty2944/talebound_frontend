import { apiFetch } from "@/shared/api";
import type { WeatherSettings } from "../types";

/**
 * 날씨 설정을 조회합니다.
 * game_settings에서 날씨 관련 컬럼만 추출합니다.
 */
export async function fetchWeatherSettings(): Promise<WeatherSettings | null> {
  try {
    const data = await apiFetch<
      (WeatherSettings & Record<string, unknown>) | null
    >("/api/game-settings");
    if (!data) return null;

    return {
      weather_cycle_hours: data.weather_cycle_hours,
      weather_epoch: data.weather_epoch,
      current_weather: data.current_weather,
    } as WeatherSettings;
  } catch (error) {
    console.error("[WeatherSettings] Fetch error:", error);
    return null;
  }
}
