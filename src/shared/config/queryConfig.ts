/**
 * React Query 캐시 설정
 *
 * @see docs/performance/data-fetching.md
 */

/**
 * staleTime 프리셋
 *
 * - STATIC: 정적 데이터 (아이템, 몬스터, 맵 정의)
 * - DYNAMIC: 동적 데이터 (프로필, 인벤토리)
 * - REALTIME: 실시간 데이터 (채팅, 접속자)
 */
export const STALE_TIME = {
  /** 정적 데이터 - 변경되지 않음 */
  STATIC: Infinity,

  /** 동적 데이터 - 30초 후 stale */
  DYNAMIC: 30 * 1000,

  /** 실시간 데이터 - 항상 stale */
  REALTIME: 0,
} as const;

/**
 * gcTime (garbage collection) 프리셋
 *
 * 캐시가 비활성화된 후 메모리에 유지되는 시간
 */
export const GC_TIME = {
  /** 짧은 유지 - 5분 */
  SHORT: 5 * 60 * 1000,

  /** 중간 유지 - 10분 */
  MEDIUM: 10 * 60 * 1000,

  /** 긴 유지 - 30분 */
  LONG: 30 * 60 * 1000,
} as const;

/**
 * 일반적인 refetchInterval 프리셋
 */
export const REFETCH_INTERVAL = {
  /** 빠른 폴링 - 5초 (접속자 목록 등) */
  FAST: 5 * 1000,

  /** 보통 폴링 - 30초 */
  NORMAL: 30 * 1000,

  /** 느린 폴링 - 1분 (프로필 등) */
  SLOW: 60 * 1000,
} as const;

export type StaleTimeKey = keyof typeof STALE_TIME;
export type GcTimeKey = keyof typeof GC_TIME;
export type RefetchIntervalKey = keyof typeof REFETCH_INTERVAL;
