# 데이터 페칭 최적화

> 우선순위: HIGH

## 핵심 개념

React Query의 `staleTime`을 데이터 특성에 맞게 설정합니다.

---

## staleTime 전략

### 프리셋 정의

```typescript
// shared/config/queryConfig.ts
export const STALE_TIME = {
  STATIC: Infinity,        // 정적 데이터
  DYNAMIC: 30 * 1000,      // 동적 데이터 (30초)
  REALTIME: 0,             // 실시간 데이터
};

export const GC_TIME = {
  SHORT: 5 * 60 * 1000,    // 5분
  MEDIUM: 10 * 60 * 1000,  // 10분
  LONG: 30 * 60 * 1000,    // 30분
};
```

### 데이터 분류

| 분류 | staleTime | gcTime | 예시 |
|------|-----------|--------|------|
| **정적** | `Infinity` | 30분 | 아이템 정의, 몬스터 정의, 맵 정의, 어빌리티 |
| **동적** | 30초 | 10분 | 프로필, 인벤토리, 장비 |
| **실시간** | 0 | 5분 | 채팅, 접속자 목록, 전투 상태 |

---

## FSD 적용 예시

### 정적 데이터 (entities/*/queries/)

게임 데이터 정의는 변경되지 않으므로 캐시를 유지합니다.

```typescript
// entities/monster/queries/index.ts
import { STALE_TIME, GC_TIME } from "@/shared/config/queryConfig";

export function useMonsters() {
  return useQuery({
    queryKey: monsterKeys.all,
    queryFn: fetchMonsters,
    staleTime: STALE_TIME.STATIC,  // Infinity
    gcTime: GC_TIME.LONG,          // 30분
  });
}

// entities/item/queries/index.ts
export function useItems() {
  return useQuery({
    queryKey: itemKeys.all,
    queryFn: fetchItems,
    staleTime: STALE_TIME.STATIC,
    gcTime: GC_TIME.LONG,
  });
}

// entities/ability/queries/index.ts
export function useAbilities() {
  return useQuery({
    queryKey: abilityKeys.all,
    queryFn: fetchAbilities,
    staleTime: STALE_TIME.STATIC,
    gcTime: GC_TIME.LONG,
  });
}
```

### 동적 데이터 (entities/*/queries/)

사용자 데이터는 적절한 간격으로 리페치합니다.

```typescript
// entities/user/queries/useProfile.ts
import { STALE_TIME, GC_TIME } from "@/shared/config/queryConfig";

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.detail(userId || ""),
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: STALE_TIME.DYNAMIC,   // 30초
    gcTime: GC_TIME.MEDIUM,          // 10분
    refetchInterval: 60 * 1000,      // 1분마다 백그라운드 리페치
  });
}

// entities/inventory/queries/useInventory.ts
export function useInventory(characterId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.list(characterId || ""),
    queryFn: () => fetchInventory(characterId!),
    enabled: !!characterId,
    staleTime: STALE_TIME.DYNAMIC,
    gcTime: GC_TIME.MEDIUM,
  });
}
```

### 실시간 데이터

실시간 데이터는 Supabase Realtime 또는 staleTime: 0을 사용합니다.

```typescript
// 방법 1: Supabase Realtime (권장)
// features/chat/lib/useRealtimeChat.ts
const channel = supabase.channel('chat').subscribe();

// 방법 2: 짧은 polling
export function useOnlineUsers() {
  return useQuery({
    queryKey: ['onlineUsers'],
    queryFn: fetchOnlineUsers,
    staleTime: STALE_TIME.REALTIME,  // 0
    refetchInterval: 5000,           // 5초마다
  });
}
```

---

## 캐싱 계층

### 현재 구조

```
Browser Cache (HTTP)
        ↓
React Query Cache (메모리)
        ↓
Supabase Storage / Database
```

### 정적 데이터 로드 순서

```typescript
// entities/monster/api/index.ts
export async function fetchMonsters(): Promise<Monster[]> {
  // 1. Supabase Storage에서 시도
  const { data, error } = await supabase.storage
    .from('game-data')
    .download('monsters.json');

  if (data) {
    return JSON.parse(await data.text());
  }

  // 2. 로컬 fallback
  const response = await fetch('/data/monsters.json');
  return response.json();
}
```

---

## 최적화 패턴

### 1. 프리페칭

사용자가 필요로 하기 전에 미리 로드합니다.

```typescript
// 맵 이동 시 해당 맵의 몬스터 프리페치
const queryClient = useQueryClient();

const handleMapHover = (mapId: string) => {
  queryClient.prefetchQuery({
    queryKey: monsterKeys.byMap(mapId),
    queryFn: () => fetchMonstersByMap(mapId),
    staleTime: STALE_TIME.STATIC,
  });
};
```

### 2. 플레이스홀더 데이터

로딩 중 이전 데이터를 표시합니다.

```typescript
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.detail(userId || ""),
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    placeholderData: (previousData) => previousData,
  });
}
```

### 3. 선택적 구독

필요한 데이터만 구독합니다.

```typescript
// 전체 프로필 대신 레벨만 구독
const { data: level } = useProfile(userId, {
  select: (data) => data?.level,
});
```

---

## 현재 프로젝트 현황

### 잘 되어 있는 곳

- `useProfile`: staleTime 30초, refetchInterval 1분 설정
- `useMonsters`: staleTime 5분 설정

### 개선 필요한 곳

| 쿼리 | 현재 | 권장 |
|------|------|------|
| `useItems` | 기본값 | `staleTime: Infinity` |
| `useAbilities` | 기본값 | `staleTime: Infinity` |
| `useMaps` | 기본값 | `staleTime: Infinity` |
| 스프라이트 데이터 | useEffect | React Query로 마이그레이션 |

---

## 체크리스트

- [ ] 새 쿼리 추가 시 staleTime 설정
- [ ] 정적 데이터는 `STALE_TIME.STATIC` 사용
- [ ] 동적 데이터는 `STALE_TIME.DYNAMIC` 사용
- [ ] 실시간 데이터는 Realtime 또는 짧은 polling 사용
- [ ] gcTime을 적절히 설정하여 메모리 관리
