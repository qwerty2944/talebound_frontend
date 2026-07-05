import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, AuthSessionData } from "@/shared/api";
import { signOut as signOutApi } from "@/features/auth/sign-out";

interface AuthStore {
  user: AuthUser | null;
  session: AuthSessionData | null;

  setUser: (user: AuthUser | null) => void;
  setSession: (session: AuthSessionData | null) => void;
  clear: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      session: null,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session, user: session?.user ?? null }),
      clear: () => set({ user: null, session: null }),
      signOut: async () => {
        await signOutApi();
        set({ user: null, session: null });
      },
    }),
    {
      name: "talebound-auth",
      partialize: (state) => ({ user: state.user }), // session은 저장하지 않음
    }
  )
);
