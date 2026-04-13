"use client"

import { type ReactNode } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  Gavel,
  Calendar,
  CreditCard,
  Calculator,
  User,
  LogOut,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"
import * as React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { actionLogout } from "../../actions/portal-actions"

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { label: "Início", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "Processos", href: "/portal/processos", icon: Gavel },
  { label: "Agenda", href: "/portal/agendamentos", icon: Calendar },
  { label: "Financeiro", href: "/portal/financeiro", icon: CreditCard },
  { label: "Serviços", href: "/portal/servicos", icon: Calculator },
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  if (!name?.trim()) return "C"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "C"
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase() || "C"
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

interface PortalShellProps {
  children: ReactNode
  clientName?: string
}

export function PortalShell({ children, clientName = "Cliente" }: PortalShellProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const initials = getInitials(clientName)

  React.useEffect(() => { setMounted(true) }, [])

  const handleLogout = async () => {
    await actionLogout()
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* ── Top header ── */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-lg px-4 md:px-8">
        <Link href="/portal/dashboard" className="flex items-center gap-2">
          <Image
            src="/logos/Sem%20Fundo%20SVG/logo-z-dark.svg"
            alt="Zattar"
            width={28}
            height={28}
            className="hidden dark:block"
            priority
          />
          <Image
            src="/logos/Sem%20Fundo%20SVG/logo-z-light.svg"
            alt="Zattar"
            width={28}
            height={28}
            className="block dark:hidden"
            priority
          />
          <span className="text-sm font-semibold tracking-tight text-foreground hidden sm:inline">
            Zattar
          </span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex items-center gap-2 cursor-pointer rounded-full p-0.5 hover:bg-muted transition-colors">
              <span className="text-sm text-portal-text-muted hidden sm:inline mr-1">
                {clientName.split(" ")[0]}
              </span>
              <Avatar>
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-foreground truncate">{clientName}</p>
              <p className="text-xs text-portal-text-muted">Portal do Cliente</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/portal/perfil">
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center justify-between"
              onSelect={(e) => e.preventDefault()}
            >
              <div className="flex items-center gap-2">
                {mounted && theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                <span>Tema escuro</span>
              </div>
              {mounted && (
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
                />
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* ── Desktop tab bar ── */}
      <nav
        className="hidden md:flex items-center justify-center gap-1 border-b border-border/40 bg-background px-4"
        role="tablist"
        aria-label="Navegação principal"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              role="tab"
              aria-selected={isActive}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:max-w-5xl">
          {children}
        </div>
      </main>

      {/* ── Bottom tab bar (mobile only) ── */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-around border-t border-border/60 bg-background/90 backdrop-blur-lg h-16 md:hidden safe-area-pb"
        role="tablist"
        aria-label="Navegação principal"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              role="tab"
              aria-selected={isActive}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[0.625rem] font-medium leading-none">{item.label}</span>
            </Link>
          )
        })}
      </nav>

    </div>
  )
}
