/**
 * 백엔드(Colyseus/Express) REST API 클라이언트.
 * Supabase 클라이언트를 대체한다.
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:2567";

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || API_URL.replace(/^http/, "ws");

const TOKEN_KEY = "talebound-token";

// ============ 토큰 관리 ============

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// ============ 에러 ============

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ============ fetch 래퍼 ============

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const json = (await res.json().catch(() => ({}))) as {
    data?: T;
    error?: string;
    code?: string;
  };

  if (!res.ok) {
    throw new ApiError(json.error || `요청 실패 (${res.status})`, res.status, json.code);
  }

  return (json.data !== undefined ? json.data : json) as T;
}

// ============ RPC (기존 supabase.rpc 대체) ============

/**
 * 백엔드 RPC 프록시 호출. 기존 DB 함수 이름/인자를 그대로 사용한다.
 * p_user_id는 서버가 JWT에서 주입하므로 보내지 않아도 된다.
 */
export async function rpc<T = unknown>(
  fn: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  return apiFetch<T>(`/api/rpc/${fn}`, { method: "POST", body: args });
}
