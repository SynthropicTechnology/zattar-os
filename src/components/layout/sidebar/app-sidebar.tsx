"use client"

import * as React from "react"
import {
  Bell,
  Bot,
  Briefcase,
  Calendar,
  CalendarCheck,
  Database,
  FileEdit,
  FileText,
  FolderKanban,
  FolderOpen,
  Handshake,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Microscope,
  PenTool,
  Scale,
  ScrollText,
  Search,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/layout/sidebar/nav-main"

import { SidebarLogo } from "@/components/layout/sidebar/sidebar-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { usePermissoes } from "@/providers/user-provider"

// Nav Principal - Funcionalidades core do escritório
const navPrincipal = [
  {
    title: "Audiências",
    url: "/app/audiencias/semana",
    icon: Calendar,
  },
  {
    title: "Contratos",
    url: "/app/contratos",
    icon: FileText,
  },
  {
    title: "Dashboard",
    url: "/app/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Expedientes",
    url: "/app/expedientes",
    icon: FolderOpen,
  },
  {
    title: "Obrigações",
    url: "/app/acordos-condenacoes",
    icon: Handshake,
  },
  {
    title: "Partes",
    url: "/app/partes",
    icon: Users,
  },
  {
    title: "Perícias",
    url: "/app/pericias",
    icon: Microscope,
  },
  {
    title: "Processos",
    url: "/app/processos",
    icon: Scale,
  },
]

// Nav Serviços - Ferramentas e utilitários
const navServicos = [
  {
    title: "Agenda",
    url: "/app/calendar",
    icon: CalendarCheck,
  },
  {
    title: "Assinatura Digital",
    url: "/app/assinatura-digital/documentos/lista",
    icon: PenTool,
  },
  {
    title: "Assistentes",
    url: "/app/assistentes",
    icon: Bot,
  },
  {
    title: "Chat",
    url: "/app/chat",
    icon: MessageSquare,
  },
  {
    title: "Diário Oficial",
    url: "/app/comunica-cnj",
    icon: Bell,
  },
  {
    title: "Documentos",
    url: "/app/documentos",
    icon: FileEdit,
  },
  {
    title: "E-mail",
    url: "/app/mail",
    icon: Mail,
  },
  {
    title: "Jurisprudência",
    url: "/app/pangea",
    icon: Search,
  },
  {
    title: "Notas",
    url: "/app/notas",
    icon: FileEdit,
  },
  {
    title: "Peças Jurídicas",
    url: "/app/pecas-juridicas",
    icon: ScrollText,
  },
  {
    title: "Projetos",
    url: "/app/project-management",
    icon: FolderKanban,
  },
]

// Nav Gestão - Ferramentas administrativas (apenas super admin)
const navGestao = [
  {
    title: "Captura",
    url: "/app/captura",
    icon: Database,
  },
  {
    title: "Financeiro",
    url: "/app/financeiro",
    icon: Briefcase,
  },
]

const DASHBOARD_URL = "/app/dashboard"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data, temPermissao, isLoading: loadingPermissoes } = usePermissoes()
  const canSeePangea = !loadingPermissoes && temPermissao("pangea", "listar")
  const canSeeProjetos = !loadingPermissoes && temPermissao("projetos", "listar")
  const isSuperAdmin = data?.isSuperAdmin || false

  const navServicosFiltrado = React.useMemo(() => {
    return navServicos
      .filter((item) => {
        // Ocultar módulo "Projetos" inteiro se sem permissão
        if (item.url === "/app/project-management") {
          return canSeeProjetos
        }
        // Ocultar Jurisprudência sem permissão de Pangea
        if (item.url === "/app/pangea") {
          return canSeePangea
        }
        return true
      })

  }, [canSeePangea, canSeeProjetos])

  const todosItens = React.useMemo(() => {
    const items = [...navPrincipal, ...navServicosFiltrado]
    if (isSuperAdmin) {
      items.push(...navGestao)
    }

    return items.sort((a, b) => {
      if (a.url === DASHBOARD_URL) {
        return -1
      }

      if (b.url === DASHBOARD_URL) {
        return 1
      }

      return a.title.localeCompare(b.title, "pt-BR")
    })
  }, [navServicosFiltrado, isSuperAdmin])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={todosItens} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
