// ============ Equipment Feature ============
// 장비 시스템 Public API
//
// FSD 구조:
// features/equipment/
// ├── enhance/           # 강화하다
// ├── insert-rune/       # 룬 삽입하다
// ├── remove-rune/       # 룬 제거하다
// ├── activate-runeword/ # 룬워드 활성화하다
// ├── api/               # 공용 API
// ├── queries/           # 공용 쿼리
// ├── lib/               # 공용 라이브러리
// ├── ui/                # 공용 UI
// └── index.ts           # Public API

// ============ Actions (동사형) ============

// 강화하다
export { useEnhance } from "./enhance";

// 룬 삽입하다
export { useInsertRune } from "./insert-rune";

// 룬 제거하다
export { useRemoveRune } from "./remove-rune";

// 룬워드 활성화하다
export { useActivateRuneword } from "./activate-runeword";

// ============ API ============

export {
  // 타입
  type EnhanceParams,
  type EnhanceResponse,
  type InsertRuneParams,
  type InsertRuneResponse,
  type RemoveRuneParams,
  type RemoveRuneResponse,
  type ActivateRunewordParams,
  type ActivateRunewordResponse,
  // API 함수
  enhance,
  insertRune,
  removeRune,
  activateRuneword,
  createInstance,
  fetchInstances,
  fetchInstance,
  deleteInstance,
} from "./api";

// ============ Queries ============

export {
  equipmentKeys,
  useEquipmentInstances,
  useEquipmentInstance,
  useInvalidateEquipment,
} from "./queries";

// ============ Lib ============

export {
  getInsertedRuneIds,
  checkRunewordCompletion,
  canCreateRuneword,
  formatRunewordEffects,
} from "./lib";

// ============ UI ============

export {
  EnhancePanel,
  EnhanceResult,
  SocketPanel,
  SocketSlotComponent,
} from "./ui";
