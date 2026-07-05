"use client";

import { ReactNode } from "react";
import { UnityProvider } from "@/application/providers";

interface GameLayoutProps {
  children: ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {
  return <UnityProvider>{children}</UnityProvider>;
}
