# React 성능 최적화 가이드

> Vercel React Best Practices 기반, FSD 아키텍처 적용

## 핵심 원칙

1. **병렬 실행 가능한 작업은 항상 병렬로** - 순차 await 금지
2. **사용자가 필요할 때까지 로드하지 않기** - 동적 임포트 활용
3. **캐시할 수 있는 것은 캐시하기** - staleTime 전략

---

## 목차

| 문서 | 설명 | 우선순위 |
|------|------|----------|
| [비동기 워터폴 제거](./async-waterfall.md) | Promise.all, React Query 병렬화 | CRITICAL |
| [번들 크기 최적화](./bundle-optimization.md) | 동적 임포트, 코드 스플리팅 | CRITICAL |
| [데이터 페칭 최적화](./data-fetching.md) | staleTime 전략, 캐싱 계층 | HIGH |
| [리렌더링 최적화](./rendering-optimization.md) | useMemo, useCallback, 컴포넌트 분리 | MEDIUM |
| [PR 체크리스트](./checklist.md) | 코드 리뷰용 성능 체크리스트 | - |

---

## 빠른 참조

### staleTime 프리셋

```typescript
import { STALE_TIME } from "@/shared/config/queryConfig";

// 정적 데이터 (아이템, 몬스터 정의)
staleTime: STALE_TIME.STATIC    // Infinity

// 동적 데이터 (프로필, 인벤토리)
staleTime: STALE_TIME.DYNAMIC   // 30초

// 실시간 데이터 (채팅, 접속자)
staleTime: STALE_TIME.REALTIME  // 0
```

### 동적 임포트 패턴

```typescript
import dynamic from 'next/dynamic';

// 모달 컴포넌트
const StatusModal = dynamic(
  () => import("@/widgets/status-modal").then(m => m.StatusModal),
  { ssr: false }
);
```

### 병렬 요청 패턴

```typescript
// Bad: 순차 실행
const a = await fetchA();
const b = await fetchB();

// Good: 병렬 실행
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

---

## FSD 레이어별 적용 위치

| 레이어 | 적용 사항 |
|--------|----------|
| `shared/config/` | staleTime 프리셋, 성능 유틸리티 |
| `entities/*/queries/` | 적절한 staleTime 설정 |
| `entities/*/api/` | 병렬 fetch 구현 |
| `features/*/ui/` | 동적 임포트 (무거운 컴포넌트) |
| `widgets/` | 모달/패널 동적 임포트 |
| `app/` | 페이지 레벨 코드 스플리팅 |

---

## 관련 링크

- [Vercel React Best Practices](https://vercel.com/blog/introducing-react-best-practices)
- [CLAUDE.md - 코딩 컨벤션](../CLAUDE.md)
