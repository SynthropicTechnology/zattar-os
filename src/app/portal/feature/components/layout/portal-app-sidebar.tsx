"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import * as React from "react"
import {
  Calendar,
  Calculator,
  CreditCard,
  Gavel,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Sun,
} from "lucide-react"

import { NavMain } from "@/components/layout/sidebar/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { actionLogout } from "../../actions/portal-actions"

const portalNavItems = [
  { title: "Dashboard", url: "/portal/dashboard", icon: LayoutDashboard },
  { title: "Processos", url: "/portal/processos", icon: Gavel },
  { title: "Agendamentos", url: "/portal/agendamentos", icon: Calendar },
  { title: "Calculadoras", url: "/portal/calculadoras", icon: Calculator },
  { title: "Financeiro", url: "/portal/financeiro", icon: CreditCard },
  { title: "Meu Perfil", url: "/portal/perfil", icon: Settings },
]

function getInitials(name: string): string {
  if (!name?.trim()) return "C"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "C"
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase() || "C"
}

function PortalSidebarLogo() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center justify-center px-4 py-1.5 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
          <Image
            src="/logos/logomarca-dark.svg"
            alt="Zattar Advogados"
            width={375}
            height={225}
            className="h-auto w-full max-w-35 object-contain transition-all group-data-[collapsible=icon]:hidden"
            priority
          />
          <Image
            src="/logos/logo-small-dark.svg"
            alt="Z"
            width={40}
            height={40}
            className="hidden h-10 w-10 object-contain transition-all group-data-[collapsible=icon]:block"
            priority
          />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function PortalNavUser({ clientName }: { clientName: string }) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const initials = getInitials(clientName)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await actionLogout()
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{clientName}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">Cliente</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/portal/perfil")}>
                <Settings className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/portal/suporte")}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Suporte
              </DropdownMenuItem>
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
                <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function PortalAppSidebar({
  clientName = "Cliente",
  ...props
}: React.ComponentProps<typeof Sidebar> & { clientName?: string }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <PortalSidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={portalNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <PortalNavUser clientName={clientName} />
      </SidebarFooter>
    </Sidebar>
  )
}
