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
  DropdownMenuLabel,
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
        <button className="flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/perfil')}>
            <BadgeCheck className="mr-2 h-4 w-4" />
            Conta
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/notificacoes')}>
            <Bell className="mr-2 h-4 w-4" />
            Notificações
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.open('/ajuda', '_blank')}>
            <HelpCircle className="mr-2 h-4 w-4" />
            Ajuda
          </DropdownMenuItem>
          {isSuperAdmin && (
            <DropdownMenuItem onClick={() => router.push('/app/configuracoes')}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center justify-between cursor-pointer"
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
              onCheckedChange={toggleTheme}
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
