# 리렌더링 최적화

> 우선순위: MEDIUM

## 핵심 원칙

불필요한 리렌더링을 방지하되, **과도한 최적화는 피합니다**.

---

## useMemo / useCallback 적용 기준

### 사용해야 하는 경우

1. **비용이 큰 계산**
```typescript
// Good: 복잡한 필터링/정렬
const sortedItems = useMemo(() => {
  return items
    .filter(item => item.rarity >= minRarity)
    .sort((a, b) => b.value - a.value);
}, [items, minRarity]);
```

2. **자식 컴포넌트에 전달되는 객체/배열**
```typescript
// Good: 매번 새 객체 생성 방지
const playerStats = useMemo(() => ({
  hp: currentHp,
  mp: currentMp,
  attack: baseAttack + bonusAttack,
}), [currentHp, currentMp, baseAttack, bonusAttack]);

<StatDisplay stats={playerStats} />
```

3. **자식 컴포넌트에 전달되는 콜백**
```typescript
// Good: memo된 자식의 리렌더링 방지
const handleAttack = useCallback((targetId: string) => {
  executeAttack(targetId, weaponType);
}, [weaponType]);

<ActionButton onClick={handleAttack} />
```

### 사용하지 않아도 되는 경우

1. **단순 값 계산**
```typescript
// Bad: 과도한 최적화
const displayName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);

// Good: 그냥 계산
const displayName = `${firstName} ${lastName}`;
```

2. **컴포넌트 내부에서만 사용하는 값**
```typescript
// Bad: 불필요
const isLowHp = useMemo(() => hp < maxHp * 0.3, [hp, maxHp]);

// Good: 그냥 계산
const isLowHp = hp < maxHp * 0.3;
```

---

## useState 초기화 최적화

### 문제

복잡한 초기값 계산이 매 렌더링마다 실행됩니다.

```typescript
// Bad: 매 렌더링마다 JSON.parse 실행
const [config, setConfig] = useState(
  JSON.parse(localStorage.getItem('config') || '{}')
);
```

### 해결책

콜백 패턴을 사용하면 초기화 시에만 실행됩니다.

```typescript
// Good: 초기화 시에만 실행
const [config, setConfig] = useState(() =>
  JSON.parse(localStorage.getItem('config') || '{}')
);
```

### 적용 대상

- localStorage/sessionStorage 읽기
- 복잡한 객체 생성
- 계산 비용이 큰 초기값

---

## 컴포넌트 분리 전략

### 리렌더링 범위 최소화

자주 변하는 부분과 정적인 부분을 분리합니다.

```typescript
// Bad: 타이머가 전체 리렌더링 유발
function GamePanel() {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <Header />           {/* 매초 리렌더링 */}
      <Timer time={time} />
      <Content />          {/* 매초 리렌더링 */}
      <Footer />           {/* 매초 리렌더링 */}
    </div>
  );
}

// Good: 타이머만 분리
function GamePanel() {
  return (
    <div>
      <Header />
      <TimerContainer />   {/* 타이머 상태를 내부에서 관리 */}
      <Content />
      <Footer />
    </div>
  );
}

function TimerContainer() {
  const [time, setTime] = useState(0);
  // ...
  return <Timer time={time} />;
}
```

### Zustand 선택적 구독

필요한 상태만 구독합니다.

```typescript
// Bad: 전체 스토어 구독 → 모든 변경에 리렌더링
const store = useBattleStore();
const hp = store.playerCurrentHp;

// Good: 필요한 값만 구독
const hp = useBattleStore(state => state.playerCurrentHp);
```

---

## FSD 적용 패턴

### features/*/ui/

무거운 컴포넌트는 memo로 감쌉니다.

```typescript
// features/combat/ui/BattleLog.tsx
import { memo } from 'react';

interface BattleLogProps {
  logs: BattleLogEntry[];
}

export const BattleLog = memo(function BattleLog({ logs }: BattleLogProps) {
  return (
    <div>
      {logs.map(log => (
        <LogEntry key={log.id} log={log} />
      ))}
    </div>
  );
});
```

### entities/*/ui/

리스트 컴포넌트는 아이템을 memo합니다.

```typescript
// entities/monster/ui/MonsterList.tsx
import { memo } from 'react';

const MonsterItem = memo(function MonsterItem({ monster, onSelect }) {
  return (
    <button onClick={() => onSelect(monster.id)}>
      {monster.nameKo}
    </button>
  );
});

export function MonsterList({ monsters, onSelect }) {
  return (
    <div>
      {monsters.map(monster => (
        <MonsterItem
          key={monster.id}
          monster={monster}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
```

---

## 프로젝트 현황

### 잘 되어 있는 곳

- `useAppearancePart` 훅 - 필요한 상태만 선택
- `useMemo` / `useCallback` - 25개 파일에서 사용 중

### 주의 사항

- 과도한 memo 남용 금지
- React DevTools Profiler로 실제 병목 확인 후 최적화

---

## 체크리스트

- [ ] 비용이 큰 계산은 useMemo 사용
- [ ] 자식에 전달되는 객체/함수는 useMemo/useCallback 고려
- [ ] useState 초기화에 복잡한 계산이 있으면 콜백 패턴 사용
- [ ] 자주 변하는 상태는 별도 컴포넌트로 분리
- [ ] Zustand 선택적 구독 활용
- [ ] 리스트 아이템은 memo 고려
