import { authSignIn } from "@/shared/api";

export interface SignInParams {
  email: string;
  password: string;
}

export interface SignInResult {
  userId: string;
  hasCharacter: boolean;
}

/**
 * 이메일/비밀번호로 로그인
 * 백필 계정(비밀번호 미설정)은 ApiError(code: "PASSWORD_RESET_REQUIRED")를 던진다.
 */
export async function signIn(params: SignInParams): Promise<SignInResult> {
  const data = await authSignIn(params.email, params.password);

  return {
    userId: data.user.id,
    hasCharacter: data.hasCharacter,
  };
}
