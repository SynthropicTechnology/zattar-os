"use client";

import * as React from "react";
import { BrandMark } from "@/components/shared/brand-mark";
import { Lock } from "lucide-react";

export interface PublicPageShellProps {
  children: React.ReactNode;
  showAvatar?: boolean;
  avatarInitials?: string;
}

export function PublicPageShell({
  children,
  showAvatar = false,
  avatarInitials = "",
}: PublicPageShellProps) {
  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-muted dark:bg-background">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      {/* Header */}
      <header className="shrink-0 z-50 bg-card dark:bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-2 sm:py-3 flex items-center justify-center relative">
          {/* Logo - centralizado */}
          <BrandMark
            variant="auto"
            size="custom"
            priority
            className="h-8 sm:h-10 w-auto"
          />

          {/* Avatar */}
          {showAvatar && (
            <div
              className="absolute right-4 h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium"
              aria-label={`Avatar do usuário: ${avatarInitials}`}
            >
              {avatarInitials}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 min-h-0 flex flex-col items-center justify-start p-2 sm:py-6 sm:px-4 md:py-8 md:px-6">
        <div className="w-full h-full max-w-lg sm:max-w-xl md:max-w-2xl">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 relative bg-card dark:bg-card border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-2 sm:py-3">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
            <span>Protegido com segurança por Synthropic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
