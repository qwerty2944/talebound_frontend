import { authSignOut } from "@/shared/api";

/**
 * 로그아웃 처리
 */
export async function signOut(): Promise<void> {
  await authSignOut();
}
