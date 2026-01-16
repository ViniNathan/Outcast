"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { CustomCursor } from "@/components/UI/CustomCursor";
import { ScanlineOverlay } from "@/components/UI/ScanlineOverlay";

export function Providers({
  children,
  session,
}: Readonly<{
  children: React.ReactNode;
  session: Session | null;
}>) {
  return (
    <SessionProvider session={session}>
      <CustomCursor />
      <ScanlineOverlay />
      {children}
    </SessionProvider>
  );
}
