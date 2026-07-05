"use client";

import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "./AuthProvider";
import { ToasterConfig } from "./ToasterConfig";

// Re-export for external use
export { useUnityBridge } from "./UnityProvider";
export { UnityProvider } from "./UnityProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          {children}
          <ToasterConfig />
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
