/**
 * 성능 최적화 유틸리티
 *
 * @see docs/performance/README.md
 */

import dynamic from "next/dynamic";
import type { ComponentType, ReactNode } from "react";

/**
 * 모달 컴포넌트를 위한 동적 임포트 래퍼
 *
 * @example
 * ```typescript
 * const StatusModal = lazyModal(
 *   () => import("@/widgets/status-modal").then(m => m.StatusModal)
 * );
 * ```
 */
export function lazyModal<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>
) {
  return dynamic(
    () =>
      importFn().then((mod) => {
        // default export 또는 직접 컴포넌트 처리
        if ("default" in mod) return mod;
        return { default: mod as ComponentType<P> };
      }),
    { ssr: false }
  );
}

/**
 * 로딩 컴포넌트를 포함한 동적 임포트 래퍼
 *
 * @example
 * ```typescript
 * const BattlePanel = lazyWithLoading(
 *   () => import("@/features/combat/ui/BattlePanel"),
 *   () => <div>로딩 중...</div>
 * );
 * ```
 */
export function lazyWithLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  LoadingComponent: () => ReactNode
) {
  return dynamic(importFn, {
    ssr: false,
    loading: LoadingComponent,
  });
}

/**
 * 병렬 fetch 래퍼
 *
 * Promise.all의 타입 안전 버전
 *
 * @example
 * ```typescript
 * const [users, posts] = await parallelFetch(
 *   fetchUsers(),
 *   fetchPosts()
 * );
 * ```
 */
export async function parallelFetch<T extends readonly unknown[]>(
  ...promises: { [K in keyof T]: Promise<T[K]> }
): Promise<T> {
  return Promise.all(promises) as Promise<T>;
}

/**
 * 조건부 병렬 fetch
 *
 * 조건이 true인 promise만 실행하고 null로 채움
 *
 * @example
 * ```typescript
 * const [user, posts] = await conditionalFetch([
 *   { condition: !!userId, promise: fetchUser(userId) },
 *   { condition: includePosts, promise: fetchPosts() },
 * ]);
 * ```
 */
export async function conditionalFetch<T extends unknown[]>(
  items: { condition: boolean; promise: Promise<T[number]> }[]
): Promise<(T[number] | null)[]> {
  const promises = items.map((item) =>
    item.condition ? item.promise : Promise.resolve(null)
  );
  return Promise.all(promises);
}
