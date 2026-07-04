# 피로도 시스템 (Stamina)

행동에 피로도를 소모하고, 시간이 지나면 자동 회복.

## 피로도 소모

| 행동 | 소모량 |
|------|--------|
| 맵 이동 | 5 |
| 전투 시작 | 3 |
| 전투 턴당 | 1 |
| PvP 결투 | 10 |

## 피로도 회복

```
회복 속도 = 1분당 1 피로도
최대 피로도 = 100 (기본)
```

## DB 컬럼 (profiles)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `stamina` | INTEGER | 현재 피로도 |
| `max_stamina` | INTEGER | 최대 피로도 |
| `stamina_updated_at` | TIMESTAMP | 마지막 업데이트 시간 |

## DB 함수

| 함수 | 설명 |
|------|------|
| `consume_stamina(user_id, amount)` | 피로도 소모 (자동 회복 적용) |
| `restore_stamina(user_id, amount)` | 피로도 회복 |
| `calculate_stamina(current, max, last_updated)` | 시간 기반 회복량 계산 |

## 사용법

```typescript
import { consumeStamina, STAMINA_COST } from "@/entities/user";

// 피로도 소모
const result = await consumeStamina(userId, STAMINA_COST.MAP_MOVE);
if (!result.success) {
  toast.error(result.message); // "피로도가 부족합니다"
}
```

## 자동 적용 위치

- `useStartBattle`: 전투 시작 시 피로도 소모
- `useUpdateLocation`: 맵 이동 시 피로도 소모
- `useProfile`: 1분마다 자동 리프레시 (피로도 회복 반영)

## 관련 파일

- `src/entities/user/api/index.ts` - consumeStamina(), restoreStamina()
- `src/entities/user/types/constants.ts` - STAMINA_COST 상수
- `src/features/stamina/` - 피로도 관련 액션
