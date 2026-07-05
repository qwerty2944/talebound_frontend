import { create } from "zustand";

// ============ 던전 런 상태 ============
// 서버가 runToken 체인으로 진행을 통제한다. 클라이언트는 진행 중인 런만 보관한다.

export interface DungeonRun {
  dungeonId: string;
  wave: number; // 현재 진행 중인 웨이브 인덱스 (0-based)
  totalWaves: number;
  runToken: string; // 다음 advance에 제출할 서버 토큰
}

interface DungeonState {
  activeRun: DungeonRun | null;
  setRun: (run: DungeonRun) => void;
  updateRun: (patch: Partial<DungeonRun>) => void;
  clearRun: () => void;
}

export const useDungeonStore = create<DungeonState>((set) => ({
  activeRun: null,
  setRun: (run) => set({ activeRun: run }),
  updateRun: (patch) =>
    set((state) => (state.activeRun ? { activeRun: { ...state.activeRun, ...patch } } : state)),
  clearRun: () => set({ activeRun: null }),
}));
