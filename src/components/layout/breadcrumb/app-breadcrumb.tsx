"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBreadcrumb } from "@/components/layout/breadcrumb/breadcrumb-context"
import { useViewport } from "@/hooks/use-viewport"

// Mapeamento de rotas para labels customizados
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  clientes: "Clientes",
  contratos: "Contratos",
  processos: "Processos",
  audiencias: "Audiências",
  expedientes: "Expedientes",
  captura: "Captura",
  usuarios: "Usuários",
  perfil: "Perfil",
  "partes-contrarias": "Partes Contrárias",
  documentos: "Documentos",
  configuracoes: "Configurações",
  relatorios: "Relatórios",
  financeiro: "Financeiro",
  agendamentos: "Agendamentos",
  notificacoes: "Notificações",
  protocolos: "Protocolos",
  publicacoes: "Publicações",
  custas: "Custas",
  honorarios: "Honorários",
  historico: "Histórico",
  movimentacoes: "Movimentações",
  andamentos: "Andamentos",
  obrigacoes: "Obrigações",
  // Assinatura Digital
  "assinatura-digital": "Assinatura Digital",
  novo: "Novo Documento",
  editar: "Editar Documento",
  revisar: "Revisar Documento",
  lista: "Lista de Documentos",
}

// Função para formatar o segmento da rota em um label legível
function formatRouteSegment(segment: string): string {
  // Se existe um label customizado, usa ele
  if (routeLabels[segment]) {
    return routeLabels[segment]
  }

  // Remove hífens e capitaliza palavras
  return segment
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function AppBreadcrumb() {
  const pathname = usePathname()
  const { overrides } = useBreadcrumb()
  const viewport = useViewport()

  // Divide o pathname em segmentos e remove strings vazias
  const segments = pathname.split("/").filter(Boolean)

  // Se estiver na raiz, não mostra breadcrumb ou mostra apenas "Home"
  if (segments.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Início</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  // Gera os breadcrumbs
  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")

    // Verifica se existe override para este caminho
    const override = overrides.find((o) => o.path === href)
    const label = override ? override.label : formatRouteSegment(segment)

    const isLast = index === segments.length - 1

    return {
      href,
      label,
      isLast,
    }
  })

  // Trunca texto longo com ellipsis
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + "..."
  }

  // Mobile: mostra apenas current + parent
  // Tablet/Desktop: mostra caminho completo
  const isMobile = viewport.width < 768

  if (isMobile && breadcrumbs.length > 2) {
    // Mobile com mais de 2 níveis: mostra ellipsis menu + parent + current
    const hiddenBreadcrumbs = breadcrumbs.slice(0, -2)
    const visibleBreadcrumbs = breadcrumbs.slice(-2)

    return (
      <Breadcrumb>
        <BreadcrumbList>
          {/* Dropdown menu para níveis ocultos */}
          <BreadcrumbItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1">
                <BreadcrumbEllipsis />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {/* Home link */}
                <DropdownMenuItem asChild>
                  <Link href="/">Início</Link>
                </DropdownMenuItem>
                {/* Hidden breadcrumbs */}
                {hiddenBreadcrumbs.map((breadcrumb) => (
                  <DropdownMenuItem key={breadcrumb.href} asChild>
                    <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {/* Visible breadcrumbs (parent + current) */}
          {visibleBreadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {breadcrumb.isLast ? (
                  <BreadcrumbPage className="max-w-37.5 truncate">
                    {truncateText(breadcrumb.label, 30)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={breadcrumb.href} className="max-w-30 truncate">
                      {truncateText(breadcrumb.label, 25)}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  if (isMobile && breadcrumbs.length <= 2) {
    // Mobile com 1-2 níveis: mostra todos com truncamento
    return (
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {breadcrumb.isLast ? (
                  <BreadcrumbPage className="max-w-37.5 truncate">
                    {truncateText(breadcrumb.label, 30)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={breadcrumb.href} className="max-w-30 truncate">
                      {truncateText(breadcrumb.label, 25)}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  // Desktop: mostra caminho completo
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Link para home sempre visível em desktop */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Início</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.length > 0 && <BreadcrumbSeparator />}
        {breadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={breadcrumb.href}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {breadcrumb.isLast ? (
                <BreadcrumbPage className="max-w-37.5 truncate">
                  {truncateText(breadcrumb.label, 50)}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={breadcrumb.href} className="max-w-30 truncate">
                    {truncateText(breadcrumb.label, 40)}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

