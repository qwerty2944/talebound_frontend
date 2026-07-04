import { create } from "zustand";

// ============ 타입 정의 ============

/**
 * 접속 중인 플레이어 정보
 * - Player = 현재 게임 세션에서 활동 중인 캐릭터
 */
export interface OnlinePlayer {
  userId: string;        // Auth User ID
  characterName: string; // 캐릭터 이름
}

/** @deprecated OnlinePlayer를 사용하세요 */
export type OnlineUser = OnlinePlayer;

export interface MapInfo {
  id: string;
  name: string;
  description: string;
}

interface GameState {
  // 상태
  currentMap: MapInfo | null;
  onlinePlayers: OnlinePlayer[];
  isConnected: boolean;
  activeCharacterName: string;  // 현재 플레이 중인 캐릭터명

  // 액션
  setCurrentMap: (map: MapInfo) => void;
  setOnlinePlayers: (players: OnlinePlayer[]) => void;
  addOnlinePlayer: (player: OnlinePlayer) => void;
  removeOnlinePlayer: (userId: string) => void;
  setConnected: (connected: boolean) => void;
  setActiveCharacterName: (name: string) => void;
  reset: () => void;

  // @deprecated aliases (하위호환)
  /** @deprecated onlinePlayers를 사용하세요 */
  onlineUsers: OnlinePlayer[];
  /** @deprecated activeCharacterName를 사용하세요 */
  myCharacterName: string;
  /** @deprecated setOnlinePlayers를 사용하세요 */
  setOnlineUsers: (users: OnlinePlayer[]) => void;
  /** @deprecated addOnlinePlayer를 사용하세요 */
  addOnlineUser: (user: OnlinePlayer) => void;
  /** @deprecated removeOnlinePlayer를 사용하세요 */
  removeOnlineUser: (userId: string) => void;
  /** @deprecated setActiveCharacterName를 사용하세요 */
  setMyCharacterName: (name: string) => void;
}

// ============ 초기 상태 ============

const initialState = {
  currentMap: null,
  onlinePlayers: [],
  isConnected: false,
  activeCharacterName: "",
  // 하위호환 aliases (동기화됨)
  onlineUsers: [] as OnlinePlayer[],
  myCharacterName: "",
};

// ============ 스토어 ============

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setCurrentMap: (map) => set({ currentMap: map }),

  // onlinePlayers 설정 시 onlineUsers도 동기화
  setOnlinePlayers: (players) => set({ onlinePlayers: players, onlineUsers: players }),

  addOnlinePlayer: (player) => {
    const { onlinePlayers } = get();
    if (!onlinePlayers.find((p) => p.userId === player.userId)) {
      const updated = [...onlinePlayers, player];
      set({ onlinePlayers: updated, onlineUsers: updated });
    }
  },

  removeOnlinePlayer: (userId) => {
    const { onlinePlayers } = get();
    const updated = onlinePlayers.filter((p) => p.userId !== userId);
    set({ onlinePlayers: updated, onlineUsers: updated });
  },

  setConnected: (connected) => set({ isConnected: connected }),

  // activeCharacterName 설정 시 myCharacterName도 동기화
  setActiveCharacterName: (name) => set({ activeCharacterName: name, myCharacterName: name }),

  // 하위호환 setter aliases
  setOnlineUsers: (users) => set({ onlinePlayers: users, onlineUsers: users }),
  addOnlineUser: (user) => {
    const { onlinePlayers } = get();
    if (!onlinePlayers.find((p) => p.userId === user.userId)) {
      const updated = [...onlinePlayers, user];
      set({ onlinePlayers: updated, onlineUsers: updated });
    }
  },
  removeOnlineUser: (userId) => {
    const { onlinePlayers } = get();
    const updated = onlinePlayers.filter((p) => p.userId !== userId);
    set({ onlinePlayers: updated, onlineUsers: updated });
  },
  setMyCharacterName: (name) => set({ activeCharacterName: name, myCharacterName: name }),

  reset: () => set(initialState),
}));
