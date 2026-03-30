'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { MacOSDock, type DockItem } from '@/components/ui/mac-os-dock'
import { usePermissoes } from '@/providers/user-provider'

// ─── Dock icons (icons8 outline style + Liquid Glass) ──────────────────
// Icons sourced from icons8.com — white outline 96px PNGs
// Liquid Glass effect applied via mac-os-dock.tsx container

function DockIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="w-full h-full p-[22%]">
      <Image
        src={src}
        alt={alt}
        width={96}
        height={96}
        className="w-full h-full object-contain drop-shadow-[0_1px_2px_rgba(255,255,255,0.3)]"
        draggable={false}
      />
    </div>
  )
}

// ─── Navigation data (mirrors app-sidebar.tsx) ──────────────────────────

interface NavItemDef {
  id: string
  title: string
  url: string
}

const navPrincipal: NavItemDef[] = [
  { id: 'dashboard',   title: 'Dashboard',   url: '/app/dashboard'           },
  { id: 'audiencias',  title: 'Audiências',  url: '/app/audiencias/semana'   },
  { id: 'contratos',   title: 'Contratos',   url: '/app/contratos'           },
  { id: 'expedientes', title: 'Expedientes', url: '/app/expedientes'         },
  { id: 'obrigacoes',  title: 'Obrigações',  url: '/app/acordos-condenacoes' },
  { id: 'partes',      title: 'Partes',      url: '/app/partes'              },
  { id: 'pericias',    title: 'Perícias',    url: '/app/pericias'            },
  { id: 'processos',   title: 'Processos',   url: '/app/processos'           },
]

const navServicos: NavItemDef[] = [
  { id: 'agenda',         title: 'Agenda',             url: '/app/calendar'                            },
  { id: 'assinatura',     title: 'Assinatura Digital', url: '/app/assinatura-digital/documentos/lista' },
  { id: 'assistentes',    title: 'Assistentes',        url: '/app/assistentes'                         },
  { id: 'chat',           title: 'Chat',               url: '/app/chat'                                },
  { id: 'diario',         title: 'Diário Oficial',     url: '/app/comunica-cnj'                        },
  { id: 'documentos',     title: 'Documentos',         url: '/app/documentos'                          },
  { id: 'email',          title: 'E-mail',             url: '/app/mail'                                },
  { id: 'jurisprudencia', title: 'Jurisprudência',     url: '/app/pangea'                              },
  { id: 'notas',          title: 'Notas',              url: '/app/notas'                               },
  { id: 'pecas',          title: 'Peças Jurídicas',    url: '/app/pecas-juridicas'                     },
  { id: 'projetos',       title: 'Projetos',           url: '/app/project-management'                  },
]

const navGestao: NavItemDef[] = [
  { id: 'captura',    title: 'Captura',    url: '/app/captura'    },
  { id: 'financeiro', title: 'Financeiro', url: '/app/financeiro' },
]

const DASHBOARD_URL = '/app/dashboard'

// ─── AppDock component ──────────────────────────────────────────────────

export function AppDock() {
  const router = useRouter()
  const pathname = usePathname()
  const { data, temPermissao, isLoading } = usePermissoes()
  const canSeePangea = !isLoading && temPermissao('pangea', 'listar')
  const canSeeProjetos = !isLoading && temPermissao('projetos', 'listar')
  const isSuperAdmin = data?.isSuperAdmin || false

  // Same filtering logic as app-sidebar.tsx
  const allItems = React.useMemo(() => {
    const servicos = navServicos.filter((item) => {
      if (item.url === '/app/project-management') return canSeeProjetos
      if (item.url === '/app/pangea') return canSeePangea
      return true
    })

    const items = [...navPrincipal, ...servicos]
    if (isSuperAdmin) items.push(...navGestao)

    return items.sort((a, b) => {
      if (a.url === DASHBOARD_URL) return -1
      if (b.url === DASHBOARD_URL) return 1
      return a.title.localeCompare(b.title, 'pt-BR')
    })
  }, [canSeePangea, canSeeProjetos, isSuperAdmin])

  // Build dock items with macOS PNG icons
  const dockItems: DockItem[] = React.useMemo(
    () =>
      allItems.map((item) => ({
        id: item.id,
        name: item.title,
        icon: (
          <DockIcon
            src={`/icons/dock/${item.id}.png`}
            alt={item.title}
          />
        ),
      })),
    [allItems]
  )

  // Detect active route(s)
  const activeItems = React.useMemo(
    () =>
      allItems
        .filter((item) => pathname?.startsWith(item.url))
        .map((item) => item.id),
    [allItems, pathname]
  )

  const handleItemClick = React.useCallback(
    (itemId: string) => {
      const item = allItems.find((i) => i.id === itemId)
      if (item) router.push(item.url)
    },
    [allItems, router]
  )

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50">
      <MacOSDock
        items={dockItems}
        onItemClick={handleItemClick}
        activeItems={activeItems}
      />
    </div>
  )
}
