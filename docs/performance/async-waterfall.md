# 비동기 워터폴 제거

> 우선순위: CRITICAL

## 문제

순차적 await는 불필요한 대기 시간을 만듭니다.

```typescript
// Bad: 총 대기 시간 = 200ms + 150ms = 350ms
const userData = await fetchUserData(userId);    // 200ms
const settings = await fetchSettings(userId);     // 150ms
```

```
시간 →
|-- fetchUserData (200ms) --|
                            |-- fetchSettings (150ms) --|
                                                        ↳ 350ms
```

---

## 해결책

### 1. Promise.all 사용

독립적인 요청은 항상 병렬로 실행합니다.

```typescript
// Good: 총 대기 시간 = max(200ms, 150ms) = 200ms
const [userData, settings] = await Promise.all([
  fetchUserData(userId),
  fetchSettings(userId),
]);
```

```
시간 →
|-- fetchUserData (200ms) --|
|-- fetchSettings (150ms) --|
                            ↳ 200ms
```

### 2. Early Return 패턴

조건 체크를 await 전에 수행합니다.

```typescript
// Bad: skipProcessing=true여도 userData 대기
async function handleRequest(userId: string, skipProcessing: boolean) {
  const userData = await fetchUserData(userId);
  if (skipProcessing) return { skipped: true };
  return processUserData(userData);
}

// Good: 불필요한 대기 제거
async function handleRequest(userId: string, skipProcessing: boolean) {
  if (skipProcessing) return { skipped: true };
  const userData = await fetchUserData(userId);
  return processUserData(userData);
}
```

### 3. React Query 병렬 쿼리

React Query 훅은 자동으로 병렬 실행됩니다.

```typescript
function GamePage() {
  // 이 두 쿼리는 자동으로 병렬 실행됨
  const { data: profile } = useProfile(userId);
  const { data: maps } = useMaps();
  const { data: monsters } = useMonsters();

  // ...
}
```

### 4. 의존성이 있는 쿼리

`enabled` 옵션으로 의존성을 관리합니다.

```typescript
function GamePage() {
  const { data: profile } = useProfile(userId);

  // profile이 로드된 후에만 실행
  const { data: npcs } = useNpcsByMap(profile?.currentMapId, {
    enabled: !!profile?.currentMapId,
  });
}
```

---

## FSD 적용 위치

### entities/*/api/

API 레이어에서 병렬 fetch를 구현합니다.

```typescript
// entities/ability/api/index.ts
export async function fetchAbilities(): Promise<Ability[]> {
  const [spells, skills] = await Promise.all([
    fetch('/data/abilities/spells.json').then(r => r.json()),
    fetch('/data/abilities/combatskills.json').then(r => r.json()),
  ]);
  return [...spells, ...skills];
}
```

### entities/*/queries/

React Query 훅에서 의존성을 관리합니다.

```typescript
// entities/monster/queries/index.ts
export function useMonstersByMap(mapId: string | undefined) {
  return useQuery({
    queryKey: monsterKeys.byMap(mapId || ""),
    queryFn: () => fetchMonstersByMap(mapId!),
    enabled: !!mapId,  // mapId가 있을 때만 실행
  });
}
```

### app/ 페이지

useEffect 체인을 React Query 훅으로 대체합니다.

```typescript
// Bad: useEffect 체인 (순차 실행)
useEffect(() => {
  if (session) fetchProfile();
}, [session]);

useEffect(() => {
  if (profile) fetchMaps();
}, [profile]);

// Good: React Query (병렬 + 의존성)
const { data: profile } = useProfile(session?.user?.id);
const { data: maps } = useMaps();
const { data: npcs } = useNpcs(profile?.currentMapId, {
  enabled: !!profile?.currentMapId,
});
```

---

## 현재 프로젝트 적용 현황

### 잘 되어 있는 곳

- `entities/ability/api/` - spells + skills 병렬 로드
- `entities/inventory/api/` - personal + storage 병렬 로드
- `widgets/status-modal/` - 스프라이트 데이터 병렬 로드

### 개선 필요한 곳

- `app/game/page.tsx` - 4개의 useEffect 체인 → React Query로 통합 권장

---

## 체크리스트

- [ ] 새로운 `await` 추가 시 병렬화 가능한지 검토
- [ ] 독립적인 API 호출은 `Promise.all` 사용
- [ ] React Query 훅은 조건부 `enabled` 활용
- [ ] Early return으로 불필요한 await 제거
