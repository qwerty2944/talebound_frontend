"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ApiError, authResetPassword } from "@/shared/api";
import { signIn, signUp } from "../api";
import type { LoginFormData } from "../ui/LoginForm";
import type { SignupFormData } from "../ui/SignupForm";

// ============ 상수 ============

const SAVED_EMAILS_KEY = "mud-saved-emails";
const MAX_SAVED_EMAILS = 5;

// ============ 로컬 스토리지 유틸 ============

function getSavedEmails(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(SAVED_EMAILS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveEmail(email: string) {
  if (typeof window === "undefined") return;
  try {
    const emails = getSavedEmails().filter((e) => e !== email);
    emails.unshift(email);
    localStorage.setItem(
      SAVED_EMAILS_KEY,
      JSON.stringify(emails.slice(0, MAX_SAVED_EMAILS))
    );
  } catch {}
}

function removeEmailFromStorage(email: string) {
  if (typeof window === "undefined") return;
  try {
    const emails = getSavedEmails().filter((e) => e !== email);
    localStorage.setItem(SAVED_EMAILS_KEY, JSON.stringify(emails));
  } catch {}
}

// ============ 훅 ============

export type AuthMode = "login" | "signup" | "reset";

interface UseAuthReturn {
  // 상태
  mode: AuthMode;
  loading: boolean;
  error: string | null;
  message: string | null;
  savedEmails: string[];

  // 액션
  handleLogin: (data: LoginFormData) => Promise<void>;
  handleSignup: (data: SignupFormData) => Promise<void>;
  handleResetPassword: (data: SignupFormData) => Promise<void>;
  switchMode: () => void;
  removeEmail: (email: string) => void;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savedEmails, setSavedEmails] = useState<string[]>([]);

  useEffect(() => {
    setSavedEmails(getSavedEmails());
  }, []);

  const handleLogin = useCallback(async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await signIn({
        email: data.email,
        password: data.password,
      });

      saveEmail(data.email);
      router.push(result.hasCharacter ? "/game" : "/character-create");
    } catch (err) {
      // 기존 Supabase 계정: 비밀번호 재설정 필요
      if (err instanceof ApiError && err.code === "PASSWORD_RESET_REQUIRED") {
        setMode("reset");
        setMessage("계정 시스템이 이전되었습니다. 새 비밀번호를 설정해주세요.");
        setError(null);
        return;
      }
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSignup = useCallback(async (data: SignupFormData) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await signUp({
        email: data.email,
        password: data.password,
      });
      // 자체 인증: 이메일 확인 없이 즉시 로그인 → 캐릭터 생성으로
      saveEmail(data.email);
      router.push("/character-create");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleResetPassword = useCallback(async (data: SignupFormData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authResetPassword(data.email, data.password);
      saveEmail(data.email);
      router.push(result.hasCharacter ? "/game" : "/character-create");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const switchMode = useCallback(() => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setError(null);
    setMessage(null);
  }, []);

  const removeEmail = useCallback((email: string) => {
    removeEmailFromStorage(email);
    setSavedEmails(getSavedEmails());
  }, []);

  return {
    mode,
    loading,
    error,
    message,
    savedEmails,
    handleLogin,
    handleSignup,
    handleResetPassword,
    switchMode,
    removeEmail,
  };
}
