import { authSignUp } from "@/shared/api";

export interface SignUpParams {
  email: string;
  password: string;
  redirectUrl?: string;
}

/**
 * 이메일 회원가입 (자체 JWT 인증 — 이메일 확인 절차 없음, 즉시 로그인됨)
 */
export async function signUp(params: SignUpParams): Promise<void> {
  await authSignUp(params.email, params.password);
}
