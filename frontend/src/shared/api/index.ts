// HTTP 클라이언트 (Supabase 대체)
export {
  apiFetch,
  rpc,
  getToken,
  setToken,
  ApiError,
  API_URL,
  WS_URL,
} from "./http";

// 인증 API
export {
  getSession,
  subscribeToAuthChanges,
  isAuthAvailable,
  authSignIn,
  authSignUp,
  authSignOut,
  authResetPassword,
  type AuthSession,
  type AuthSessionData,
  type AuthUser,
  type AuthSubscription,
} from "./auth";

// 게임 데이터 API
export {
  getEyeMappings,
  getHairMappings,
  getFacehairMappings,
  getBodyMappings,
  getAllMappings,
  clearMappingCache,
} from "./gameData";

// 타입은 shared/types에서 re-export
export type {
  EyeMapping,
  HairMapping,
  FacehairMapping,
  BodyMapping,
  AllMappings,
} from "../types/game-data";
