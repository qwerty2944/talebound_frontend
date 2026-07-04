import { apiFetch, getToken, setToken, ApiError } from "./http";

// ============ 타입 ============

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSessionData {
  token: string;
  user: AuthUser;
}

export type AuthSession = AuthSessionData | null;

export interface AuthSubscription {
  unsubscribe: () => void;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
  hasCharacter: boolean;
}

// ============ 인증 상태 변경 이벤트 ============

type AuthListener = (session: AuthSession) => void;
const listeners = new Set<AuthListener>();

function emit(session: AuthSession): void {
  for (const listener of listeners) listener(session);
}

// ============ API ============

/**
 * 현재 세션 조회 (토큰 검증 포함)
 */
export async function getSession(): Promise<AuthSession> {
  const token = getToken();
  if (!token) return null;

  try {
    const data = await apiFetch<{ user: AuthUser }>("/api/auth/me");
    return { token, user: data.user };
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      setToken(null); // 만료/무효 토큰 정리
      return null;
    }
    console.error("Failed to get session:", e);
    return null;
  }
}

/**
 * 인증 상태 변경 구독
 */
export function subscribeToAuthChanges(
  callback: (session: AuthSession) => void
): AuthSubscription | null {
  listeners.add(callback);
  return {
    unsubscribe: () => listeners.delete(callback),
  };
}

export function isAuthAvailable(): boolean {
  return true;
}

// ============ 로그인/가입/로그아웃 ============

export async function authSignUp(email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: { email, password },
  });
  setToken(data.token);
  emit({ token: data.token, user: data.user });
  return data;
}

export async function authSignIn(email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  setToken(data.token);
  emit({ token: data.token, user: data.user });
  return data;
}

/**
 * 백필 유저(Supabase 이전 계정) 비밀번호 재설정
 */
export async function authResetPassword(email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/auth/reset-password", {
    method: "POST",
    body: { email, password },
  });
  setToken(data.token);
  emit({ token: data.token, user: data.user });
  return data;
}

export async function authSignOut(): Promise<void> {
  setToken(null);
  emit(null);
}
