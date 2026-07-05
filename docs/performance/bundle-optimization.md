# 번들 크기 최적화

> 우선순위: CRITICAL

## 문제

모든 컴포넌트를 정적 임포트하면 초기 번들 크기가 커집니다.

```typescript
// Bad: 페이지 로드 시 모든 컴포넌트가 함께 로드됨
import { StatusModal } from "@/widgets/status-modal";
import { WorldMapModal } from "@/entities/map";
import { HealerDialog } from "@/entities/npc";
import { BattlePanel } from "@/features/combat";
```

사용자가 모달을 열지 않아도 모든 코드가 다운로드됩니다.

---

## 해결책

### 1. Next.js dynamic() 사용

조건부로 렌더링되는 컴포넌트는 동적 임포트합니다.

```typescript
import dynamic from 'next/dynamic';

// 모달 컴포넌트 - 열릴 때만 로드
const StatusModal = dynamic(
  () => import("@/widgets/status-modal").then(m => m.StatusModal),
  { ssr: false }
);

const WorldMapModal = dynamic(
  () => import("@/entities/map").then(m => m.WorldMapModal),
  { ssr: false }
);
```

### 2. 로딩 UI 제공

동적 로드 중 스켈레톤 UI를 표시합니다.

```typescript
const StatusModal = dynamic(
  () => import("@/widgets/status-modal").then(m => m.StatusModal),
  {
    ssr: false,
    loading: () => <ModalSkeleton />,
  }
);
```

### 3. SSR 비활성화

클라이언트 전용 컴포넌트는 `ssr: false`를 설정합니다.

```typescript
// Unity 컴포넌트 - 브라우저에서만 동작
const DynamicUnityCanvas = dynamic(
  () => import("./UnityCanvas").then(m => m.UnityCanvas),
  { ssr: false }
);
```

---

## 동적 임포트 대상

### 모달 컴포넌트

| 컴포넌트 | 위치 | 이유 |
|---------|------|------|
| `StatusModal` | `widgets/status-modal` | 상태창 열 때만 필요 |
| `WorldMapModal` | `entities/map/ui` | 월드맵 열 때만 필요 |
| `HealerDialog` | `entities/npc/ui` | NPC 대화 시에만 필요 |
| `ThemeSettingsModal` | `shared/ui` | 설정 열 때만 필요 |

### 패널 컴포넌트

| 컴포넌트 | 위치 | 이유 |
|---------|------|------|
| `BattlePanel` | `features/combat/ui` | 전투 중에만 필요 |
| `DuelRequestModal` | `features/duel/ui` | PvP 요청 시에만 필요 |
| `DuelBattlePanel` | `features/duel/ui` | PvP 중에만 필요 |

### Unity 컴포넌트

| 컴포넌트 | 위치 | 이유 |
|---------|------|------|
| `DynamicUnityCanvas` | `features/character/ui` | 이미 적용됨 |

---

## FSD 적용 패턴

### features/*/ui/index.ts

기능 UI를 동적 임포트로 export합니다.

```typescript
// features/combat/ui/index.ts
import dynamic from 'next/dynamic';

// 정적 export (항상 필요한 컴포넌트)
export { ActionPanel } from './ActionPanel';
export { BattleLog } from './BattleLog';

// 동적 export (조건부 컴포넌트)
export const BattlePanel = dynamic(
  () => import('./BattlePanel').then(m => m.BattlePanel),
  { ssr: false }
);
```

### widgets/*/index.ts

위젯을 동적 임포트로 export합니다.

```typescript
// widgets/status-modal/index.ts
import dynamic from 'next/dynamic';

export const StatusModal = dynamic(
  () => import('./ui/StatusModal').then(m => m.StatusModal),
  { ssr: false }
);
```

### app/ 페이지

페이지에서 동적 컴포넌트를 사용합니다.

```typescript
// app/game/page.tsx
import dynamic from 'next/dynamic';

const StatusModal = dynamic(
  () => import("@/widgets/status-modal").then(m => m.StatusModal),
  { ssr: false }
);

const WorldMapModal = dynamic(
  () => import("@/entities/map").then(m => m.WorldMapModal),
  { ssr: false }
);

export default function GamePage() {
  const [showStatus, setShowStatus] = useState(false);
  const [showMap, setShowMap] = useState(false);

  return (
    <>
      {/* 메인 컨텐츠 */}

      {showStatus && <StatusModal onClose={() => setShowStatus(false)} />}
      {showMap && <WorldMapModal onClose={() => setShowMap(false)} />}
    </>
  );
}
```

---

## 번들 분석

### 빌드 후 분석

```bash
# 번들 크기 확인
npm run build

# 상세 분석 (선택)
npx @next/bundle-analyzer
```

### 기대 효과

| 변경 | 예상 절감 |
|------|----------|
| 모달 5개 동적 임포트 | 초기 JS ~50-100KB 감소 |
| Unity 컴포넌트 | 이미 적용됨 |
| 전투 패널 | 비전투 시 ~30KB 절감 |

---

## 체크리스트

- [ ] 모달 컴포넌트는 동적 임포트 사용
- [ ] 조건부 렌더링 컴포넌트는 동적 임포트 고려
- [ ] `ssr: false` 설정 (클라이언트 전용)
- [ ] 로딩 UI 제공 (UX 향상)
