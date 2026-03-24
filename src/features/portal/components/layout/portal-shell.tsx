"use client";

import { PortalSidebar } from "./sidebar";
import { PortalHeader } from "./header";
import { ReactNode } from "react";

interface PortalShellProps {
  children: ReactNode;
}

export function PortalShell({ children }: PortalShellProps) {
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-on-surface font-body selection:bg-primary/30">
      <PortalSidebar />
      <PortalHeader />
      <main className="pl-72 pt-28 pr-8 pb-12 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
