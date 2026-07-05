"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useCountUp — 목표값이 바뀌면 이전값 → 새값으로 부드럽게 카운트업/다운.
 * 신규 의존성 없이 requestAnimationFrame만 사용한다.
 *
 * @param target   표시할 목표 숫자 (예: 보유 골드)
 * @param duration 애니메이션 시간(ms), 기본 600
 * @returns [표시용 값(정수), 방금 증가/감소했는지 여부]
 */
export function useCountUp(target: number, duration = 600): [number, 1 | 0 | -1] {
  const [display, setDisplay] = useState(target);
  const [dir, setDir] = useState<1 | 0 | -1>(0);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);
  const prevTarget = useRef(target);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const from = fromRef.current;
    const delta = target - from;
    setDir(delta > 0 ? 1 : delta < 0 ? -1 : 0);
    prevTarget.current = target;

    const start = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(from + delta * eased);
      setDisplay(val);
      fromRef.current = val;
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
        setDisplay(target);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return [display, dir];
}
