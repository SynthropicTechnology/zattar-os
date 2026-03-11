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
    title: "Dashboard",
    url: "/app/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Partes",
    url: "/app/partes",
    icon: Users,
    items: [
      { title: "Clientes", url: "/app/partes/clientes" },
      { title: "Partes Contrárias", url: "/app/partes/partes-contrarias" },
      { title: "Terceiros", url: "/app/partes/terceiros" },
      { title: "Representantes", url: "/app/partes/representantes" },
    ],
  },
  {
    title: "Contratos",
    url: "/app/contratos",
    icon: FileText,
  },
  {
    title: "Processos",
    url: "/app/processos",
    icon: Scale,
  },
  {
    title: "Audiências",
    url: "/app/audiencias/semana",
    icon: Calendar,
  },
  {
    title: "Expedientes",
    url: "/app/expedientes",
    icon: FolderOpen,
  },
  {
    title: "Perícias",
    url: "/app/pericias",
    icon: Microscope,
  },
  {
    title: "Obrigações",
    url: "/app/acordos-condenacoes",
    icon: Handshake,
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
    title: "Notas",
    url: "/app/notas",
    icon: FileEdit,
  },
  {
    title: "Documentos",
    url: "/app/documentos",
    icon: FileEdit,
  },
  {
    title: "Peças Jurídicas",
    url: "/app/pecas-juridicas",
    icon: ScrollText,
  },
  {
    title: "Diário Oficial",
    url: "/app/comunica-cnj",
    icon: Bell,
  },
  {
    title: "Jurisprudência",
    url: "/app/pangea",
    icon: Search,
  },
  {
    title: "Chat",
    url: "/app/chat",
    icon: MessageSquare,
  },
  {
    title: "E-mail",
    url: "/app/mail",
    icon: Mail,
  },
  {
    title: "Assistentes",
    url: "/app/assistentes",
    icon: Bot,
  },
  {
    title: "Assinatura Digital",
    url: "/app/assinatura-digital/documentos/lista",
    icon: PenTool,
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
    title: "Financeiro",
    url: "/app/financeiro",
    icon: Briefcase,
  },
  {
    title: "Captura",
    url: "/app/captura",
    icon: Database,
  },
]

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
      .map((item) => item)
  }, [canSeePangea, canSeeProjetos])

  const todosItens = React.useMemo(() => {
    const items = [...navPrincipal, ...navServicosFiltrado]
    if (isSuperAdmin) {
      items.push(...navGestao)
    }
    return items
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
