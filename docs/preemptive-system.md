# 선공/비선공 시스템 (Preemptive Strike)

몬스터 behavior 필드를 활용한 선공 시스템.

## 행동 패턴별 선공 규칙

| behavior | 선공 | 설명 |
|----------|------|------|
| **passive** | 플레이어 | 절대 공격 안 함 (훈련용 허수아비) |
| **defensive** | 플레이어 | 방어적, 플레이어가 먼저 공격 |
| **aggressive** | **몬스터** | 공격적, 몬스터가 선제공격 |

## 전투 플로우

```
전투 시작
  ↓
행동 패턴 확인
  ├─ aggressive → 몬스터 선제공격 (1초 후)
  │                 ↓
  │              플레이어 턴
  │
  └─ passive/defensive → 플레이어 턴
                           ↓
                        몬스터 반격 (aggressive/defensive만)
  ↓
이후 일반 턴제 진행
```

## 몬스터별 선공 현황

| 몬스터 | behavior | 선공 |
|--------|----------|------|
| 허수아비 | passive | 플레이어 (공격 안 함) |
| 다람쥐 | aggressive | **몬스터** |
| 늙은 다람쥐 | defensive | 플레이어 |
| 늑대 | aggressive | **몬스터** |
| 숲거미 | aggressive | **몬스터** |

## BattleState 필드

```typescript
interface BattleState {
  // 선공 시스템
  isPreemptivePhase: boolean;    // 선제공격 단계인지
  monsterGoesFirst: boolean;     // 몬스터가 선공인지
}
```

## 관련 파일

- `src/application/stores/battleStore.ts` - 선공 상태 관리, monsterPreemptiveAttack 액션
- `src/features/game/ui/BattlePanel.tsx` - 선제공격 useEffect 훅
