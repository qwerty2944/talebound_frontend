import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WeaponType } from "@/entities/ability";
import type {
  EquipmentSlot,
  EquipmentStats,
  WeaponHandType,
  OffHandItemType,
  AccessoryType,
  SpriteReference,
  EnhancementInfo,
  EquipmentSockets,
} from "@/entities/item";
import {
  calculateEnhancedStats,
  getEnhancementMultiplier,
} from "@/entities/item/types/enhancement";

// 장착된 아이템 정보
export interface EquippedItem {
  itemId: string;
  itemName: string;
  itemType: WeaponType | string;
  icon: string;
  // 무기 정보
  handType?: WeaponHandType;
  offHandType?: OffHandItemType;
  attackSpeed?: number; // 무기 공격속도 (0.65~1.15, 기본 1.0)
  elementDamage?: { element: string; value: number }; // 무기 속성 데미지
  // 장신구 정보
  accessoryType?: AccessoryType;
  // Unity 외형 (deprecated, use sprite)
  unityPartIndex?: number;
  // 스프라이트 + 색상 (새 시스템)
  sprite?: SpriteReference;
  // 스탯
  stats?: EquipmentStats;

  // === 인스턴스 시스템 (신규) ===
  /** 장비 인스턴스 ID (서버에서 관리) */
  instanceId?: string;
  /** 강화 정보 */
  enhancement?: EnhancementInfo;
  /** 소켓 정보 */
  sockets?: EquipmentSockets;
  /** 활성 룬워드 ID */
  activeRunewordId?: string;
  /** 소켓에서 오는 추가 스탯 */
  socketStats?: Partial<EquipmentStats>;
}

// 장착 가능 여부 결과
export interface CanEquipResult {
  canEquip: boolean;
  reason?: string;
}

// 장비 상태
interface EquipmentState {
  // 외형 슬롯 (6)
  mainHand: EquippedItem | null;
  offHand: EquippedItem | null;
  helmet: EquippedItem | null;
  armor: EquippedItem | null;
  cloth: EquippedItem | null;
  pants: EquippedItem | null;

  // 장신구 슬롯 (6)
  ring1: EquippedItem | null;
  ring2: EquippedItem | null;
  necklace: EquippedItem | null;
  earring1: EquippedItem | null;
  earring2: EquippedItem | null;
  bracelet: EquippedItem | null;

  // 배운 스킬 ID 목록
  learnedSkills: string[];

  // 액션
  equipItem: (slot: EquipmentSlot, item: EquippedItem) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  canEquipToSlot: (slot: EquipmentSlot, item: EquippedItem) => CanEquipResult;
  isOffHandDisabled: () => boolean;
  getTotalStats: () => EquipmentStats;
  getEquippedItem: (slot: EquipmentSlot) => EquippedItem | null;

  // 스킬 관련
  learnSkill: (skillId: string) => void;
  unlearnSkill: (skillId: string) => void;
  hasLearnedSkill: (skillId: string) => boolean;

  // 초기화 (테스트용)
  resetEquipment: () => void;
  initializeDefaultSkills: () => void;
}

const initialEquipmentState = {
  // 외형 슬롯
  mainHand: null,
  offHand: null,
  helmet: null,
  armor: null,
  cloth: null,
  pants: null,
  // 장신구 슬롯
  ring1: null,
  ring2: null,
  necklace: null,
  earring1: null,
  earring2: null,
  bracelet: null,
  // 어빌리티 (DB에서 로드)
  learnedSkills: [] as string[],
};

// 모든 슬롯 키
const ALL_SLOTS: EquipmentSlot[] = [
  "mainHand", "offHand", "helmet", "armor", "cloth", "pants",
  "ring1", "ring2", "necklace", "earring1", "earring2", "bracelet"
];

export const useEquipmentStore = create<EquipmentState>()(
  persist(
    (set, get) => ({
      ...initialEquipmentState,

      // 아이템 장착
      equipItem: (slot, item) => {
        // 양손무기 장착 시 오프핸드 자동 해제
        if (slot === "mainHand" && item.handType === "two_handed") {
          set({ [slot]: item, offHand: null });
        } else {
          set({ [slot]: item });
        }
      },

      // 아이템 해제
      unequipItem: (slot) => {
        set({ [slot]: null });
      },

      // 슬롯에 장착 가능 여부 확인
      canEquipToSlot: (slot, item) => {
        const state = get();

        // 양손무기 장착 시 오프핸드 확인
        if (slot === "mainHand" && item.handType === "two_handed" && state.offHand) {
          return { canEquip: false, reason: "보조 장비를 먼저 해제하세요" };
        }

        // 오프핸드 비활성화 체크
        if (slot === "offHand" && state.isOffHandDisabled()) {
          return { canEquip: false, reason: "양손 무기 장착 중" };
        }

        // 쌍수: 오프핸드에 무기 장착 시 주무기가 한손이어야 함
        if (slot === "offHand" && item.offHandType === "weapon") {
          if (!state.mainHand) {
            return { canEquip: false, reason: "주무기를 먼저 장착하세요" };
          }
          if (state.mainHand.handType !== "one_handed") {
            return { canEquip: false, reason: "한손 무기를 먼저 장착하세요" };
          }
        }

        return { canEquip: true };
      },

      // 오프핸드 비활성화 여부 (양손무기 장착 중)
      isOffHandDisabled: () => {
        const { mainHand } = get();
        return mainHand?.handType === "two_handed";
      },

      // 전체 장비 스탯 합산 (기본 + 강화 + 소켓)
      getTotalStats: () => {
        const state = get();
        const totalStats: EquipmentStats = {};

        for (const slot of ALL_SLOTS) {
          const item = state[slot] as EquippedItem | null;
          if (!item) continue;

          // 1. 기본 스탯 계산 (강화 배율 적용)
          if (item.stats) {
            const enhancementLevel = item.enhancement?.level ?? 0;
            const enhancedStats = enhancementLevel > 0
              ? calculateEnhancedStats(item.stats, enhancementLevel)
              : item.stats;

            for (const [key, value] of Object.entries(enhancedStats)) {
              if (typeof value === "number") {
                totalStats[key as keyof EquipmentStats] =
                  (totalStats[key as keyof EquipmentStats] || 0) + value;
              }
            }
          }

          // 2. 소켓 스탯 추가
          if (item.socketStats) {
            for (const [key, value] of Object.entries(item.socketStats)) {
              if (typeof value === "number") {
                totalStats[key as keyof EquipmentStats] =
                  (totalStats[key as keyof EquipmentStats] || 0) + value;
              }
            }
          }
        }

        return totalStats;
      },

      // 슬롯에 장착된 아이템 가져오기
      getEquippedItem: (slot) => {
        return get()[slot] as EquippedItem | null;
      },

      // 스킬 배우기
      learnSkill: (skillId) => {
        const { learnedSkills } = get();
        if (!learnedSkills.includes(skillId)) {
          set({ learnedSkills: [...learnedSkills, skillId] });
        }
      },

      // 스킬 잊기
      unlearnSkill: (skillId) => {
        const { learnedSkills } = get();
        set({ learnedSkills: learnedSkills.filter((id) => id !== skillId) });
      },

      // 스킬 보유 확인
      hasLearnedSkill: (skillId) => {
        return get().learnedSkills.includes(skillId);
      },

      // 장비 초기화
      resetEquipment: () => {
        set(initialEquipmentState);
      },

      // 어빌리티 초기화 (DB에서 로드되므로 빈 배열로 초기화)
      initializeDefaultSkills: () => {
        set({ learnedSkills: [] });
      },
    }),
    {
      name: "equipment-storage",
      version: 4, // v4: 어빌리티 시스템 통합 - learnedSkills 초기화
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mainHand: state.mainHand,
        offHand: state.offHand,
        helmet: state.helmet,
        armor: state.armor,
        cloth: state.cloth,
        pants: state.pants,
        ring1: state.ring1,
        ring2: state.ring2,
        necklace: state.necklace,
        earring1: state.earring1,
        earring2: state.earring2,
        bracelet: state.bracelet,
        learnedSkills: state.learnedSkills,
      }),
      // 기존 데이터 마이그레이션
      migrate: (persistedState, version) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persistedState as any;

        // v1 → v2 마이그레이션: 4슬롯 → 12슬롯
        if (state.weapon && !state.mainHand) {
          state.mainHand = state.weapon;
        }
        if (state.accessory && !state.ring1) {
          state.ring1 = state.accessory;
        }

        // 모든 슬롯 초기화 (누락된 필드 채우기)
        state.mainHand = state.mainHand ?? null;
        state.offHand = state.offHand ?? null;
        state.helmet = state.helmet ?? null;
        state.armor = state.armor ?? null;
        state.cloth = state.cloth ?? null;
        state.pants = state.pants ?? null;
        state.ring1 = state.ring1 ?? null;
        state.ring2 = state.ring2 ?? null;
        state.necklace = state.necklace ?? null;
        state.earring1 = state.earring1 ?? null;
        state.earring2 = state.earring2 ?? null;
        state.bracelet = state.bracelet ?? null;

        // v4: 기존 하드코딩 스킬 정리 (어빌리티는 DB에서 로드)
        state.learnedSkills = [];

        // 잘못된 데이터 정리
        delete state.weapon;
        delete state.accessory;

        return state;
      },
    }
  )
);

// ============ 유틸리티 함수 ============

// 장착 무기 타입 가져오기
export function getEquippedWeaponType(
  weapon: EquippedItem | null
): WeaponType | null {
  if (!weapon) return null;
  return weapon.itemType as WeaponType;
}

// 쌍수 장착 여부 확인
export function isDualWielding(state: EquipmentState): boolean {
  return (
    state.mainHand?.handType === "one_handed" &&
    state.offHand?.offHandType === "weapon"
  );
}

// 방패 장착 여부 확인
export function hasShieldEquipped(state: EquipmentState): boolean {
  return state.offHand?.offHandType === "shield";
}

// 장비된 슬롯 개수
export function getEquippedSlotCount(state: EquipmentState): number {
  return ALL_SLOTS.filter((slot) => state[slot] !== null).length;
}

// 호환성: weapon 별칭 (mainHand로 매핑)
export const useWeapon = () => {
  const mainHand = useEquipmentStore((state) => state.mainHand);
  return mainHand;
};
