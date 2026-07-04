# PR 성능 체크리스트

코드 리뷰 시 확인할 성능 관련 항목입니다.

---

## 비동기 처리

- [ ] **새로운 await 추가 시** 병렬화 가능한지 검토했나요?
  - 독립적인 요청은 `Promise.all` 사용
  - React Query 훅은 자동 병렬 실행

- [ ] **Early return** 패턴을 적용했나요?
  - 조건 체크는 await 전에 수행

- [ ] **useEffect 체인**이 있나요?
  - React Query `enabled` 옵션으로 대체 권장

---

## 번들 크기

- [ ] **모달/패널 컴포넌트**를 동적 임포트했나요?
  ```typescript
  const Modal = dynamic(() => import('./Modal'), { ssr: false });
  ```

- [ ] **조건부 렌더링 컴포넌트**가 있나요?
  - 사용 빈도가 낮으면 동적 임포트 고려

- [ ] **새로운 라이브러리** 추가 시 번들 영향을 확인했나요?
  - `npm run build` 후 번들 크기 확인

---

## 데이터 페칭

- [ ] **새 쿼리**에 적절한 staleTime을 설정했나요?
  - 정적 데이터: `STALE_TIME.STATIC` (Infinity)
  - 동적 데이터: `STALE_TIME.DYNAMIC` (30초)
  - 실시간 데이터: `STALE_TIME.REALTIME` (0)

- [ ] **gcTime**을 설정했나요?
  - 캐시 메모리 관리를 위해 필요

- [ ] **enabled 조건**이 적절한가요?
  - 의존성이 없을 때 불필요한 요청 방지

---

## 리렌더링

- [ ] **비용이 큰 계산**에 useMemo를 사용했나요?
  - 필터링, 정렬, 복잡한 변환

- [ ] **자식에 전달되는 객체/함수**를 메모이제이션했나요?
  - memo된 자식의 리렌더링 방지

- [ ] **useState 초기화**에 복잡한 계산이 있나요?
  - 콜백 패턴 사용: `useState(() => expensiveInit())`

- [ ] **Zustand 선택적 구독**을 사용했나요?
  - `useStore(state => state.specificValue)`

---

## FSD 레이어 규칙

- [ ] **entities/*/queries/**
  - staleTime 설정 확인
  - queryKey 네이밍 규칙 준수

- [ ] **features/*/ui/**
  - 무거운 컴포넌트 동적 임포트
  - useCallback으로 이벤트 핸들러 감싸기

- [ ] **shared/config/**
  - 공용 설정은 여기에 정의

---

## 빠른 확인 명령어

```bash
# 번들 크기 확인
npm run build

# 타입 체크
npm run type-check

# 린트
npm run lint
```

---

## 참고 문서

- [비동기 워터폴 제거](./async-waterfall.md)
- [번들 크기 최적화](./bundle-optimization.md)
- [데이터 페칭 최적화](./data-fetching.md)
- [리렌더링 최적화](./rendering-optimization.md)
