"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  BadgeCheck,
  Bell,
  HelpCircle,
  LogOut,
  Moon,
  Settings,
  Sun,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { resolveAvatarUrl } from "@/lib/avatar-url"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser, useAuthSession } from "@/providers/user-provider"

function getInitials(name: string): string {
  if (!name?.trim()) return "U"

  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "U"
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }

  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase() || "U"
}

export function HeaderUserMenu() {
  const userData = useUser()
  const { logout } = useAuthSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (userData.isLoading || !userData.nomeExibicao) {
    return <Skeleton className="h-8 w-8 rounded-full" />
  }

  const name = userData.nomeExibicao || userData.nomeCompleto || "Usuário"
  const email = userData.emailCorporativo || userData.emailPessoal || ""
  const avatar = resolveAvatarUrl(userData.avatarUrl) || ""
  const isSuperAdmin = userData.isSuperAdmin || false
  const initials = getInitials(name)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2">
          <Avatar className="cursor-pointer ring-2 ring-border/30 transition-all duration-200 hover:ring-primary/40">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-xl border-border/20 bg-popover/80 p-0 shadow-lg backdrop-blur-xl dark:bg-popover/70"
        align="start"
        sideOffset={8}
      >
        {/* ── User identity ── */}
        <div className="relative px-3 pb-3 pt-3.5">
          <div className="pointer-events-none absolute inset-0 rounded-t-xl bg-linear-to-br from-primary/6 via-transparent to-transparent" />
          <div className="relative flex items-center gap-2.5">
            <div className="shrink-0 rounded-full bg-linear-to-br from-primary/40 to-primary/10 p-[1.5px]">
              <Avatar size="lg" className="ring-[1.5px] ring-background">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="grid flex-1 gap-px">
              <span className="truncate text-[13px] font-semibold leading-tight tracking-tight">
                {name}
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground/70">
                {email}
              </span>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="mx-2.5 bg-border/30" />

        {/* ── Navigation ── */}
        <DropdownMenuGroup className="p-1">
          <DropdownMenuItem
            onClick={() => router.push('/perfil')}
            className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-1.75 text-[13px] transition-colors duration-150 focus:bg-primary/6 focus:text-foreground"
          >
            <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground/60" />
            Conta
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push('/notificacoes')}
            className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-1.75 text-[13px] transition-colors duration-150 focus:bg-primary/6 focus:text-foreground"
          >
            <Bell className="h-3.5 w-3.5 text-muted-foreground/60" />
            Notificações
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => window.open('/ajuda', '_blank')}
            className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-1.75 text-[13px] transition-colors duration-150 focus:bg-primary/6 focus:text-foreground"
          >
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
            Ajuda
          </DropdownMenuItem>
          {isSuperAdmin && (
            <DropdownMenuItem
              onClick={() => router.push('/app/configuracoes')}
              className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-1.75 text-[13px] transition-colors duration-150 focus:bg-primary/6 focus:text-foreground"
            >
              <Settings className="h-3.5 w-3.5 text-muted-foreground/60" />
              Configurações
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="mx-2.5 bg-border/30" />

        {/* ── Theme toggle ── */}
        <div className="p-1">
          <DropdownMenuItem
            className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-1.75 text-[13px] transition-colors duration-150 focus:bg-primary/6 focus:text-foreground"
            onSelect={(e) => e.preventDefault()}
          >
            <div className="flex flex-1 items-center gap-2.5">
              {mounted && theme === "dark" ? (
                <Moon className="h-3.5 w-3.5 text-muted-foreground/60" />
              ) : (
                <Sun className="h-3.5 w-3.5 text-muted-foreground/60" />
              )}
              Tema escuro
            </div>
            {mounted && (
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
              />
            )}
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="mx-2.5 bg-border/30" />

        {/* ── Logout ── */}
        <div className="p-1">
          <DropdownMenuItem
            onClick={() => logout()}
            className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-1.75 text-[13px] text-muted-foreground transition-colors duration-150 focus:bg-destructive/6 focus:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
