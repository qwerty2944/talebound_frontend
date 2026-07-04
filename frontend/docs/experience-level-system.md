# 경험치/레벨 시스템 (Experience/Level)

전투 승리 시 경험치 획득, 레벨업 처리.

## 레벨업 공식

```
필요 경험치 = 현재 레벨 × 100
```

| 레벨 | 필요 경험치 |
|------|------------|
| 1 | 100 |
| 5 | 500 |
| 10 | 1000 |
| 20 | 2000 |

## 경험치 보너스

| 조건 | 배율 |
|------|------|
| 높은 레벨 몬스터 | +10% × 레벨 차이 |
| 5레벨 이하 몬스터 | -50% |
| 기본 | 100% |

## 사용법

```typescript
import { checkLevelUp, getExpForLevel, updateProfile } from "@/entities/user";

// 레벨업 체크
const result = checkLevelUp(currentLevel, currentExp + gainedExp);
// { newLevel: 2, newExp: 50, leveledUp: true, levelsGained: 1 }

// 프로필 업데이트
await updateProfile({
  userId,
  level: result.newLevel,
  experience: result.newExp,
  gold: profile.gold + rewards.gold,
});
```

## 관련 파일

- `src/entities/user/lib/levelUp.ts` - checkLevelUp(), getExpForLevel()
- `src/features/combat/end-battle/` - 전투 종료 시 경험치/레벨업 처리
