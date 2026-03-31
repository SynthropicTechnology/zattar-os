"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
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
  Clock,
  Sparkles,
} from "lucide-react"
import { usePermissoes } from "@/providers/user-provider"

// ─── Navigation data (mirrors app-sidebar.tsx) ─────────────────────────

interface HubNavItem {
  id: string
  title: string
  url: string
  icon: React.ElementType
  shortcut?: string
  description?: string
}

const navEscritorio: HubNavItem[] = [
  { id: "dashboard",   title: "Dashboard",   url: "/app/dashboard",           icon: LayoutDashboard, shortcut: "⌘1", description: "Visão geral" },
  { id: "audiencias",  title: "Audiências",   url: "/app/audiencias/semana",   icon: Calendar,        shortcut: "⌘2", description: "Pautas da semana" },
  { id: "contratos",   title: "Contratos",    url: "/app/contratos",           icon: FileText,        shortcut: "⌘3", description: "Gestão contratual" },
  { id: "expedientes", title: "Expedientes",  url: "/app/expedientes",         icon: FolderOpen,      shortcut: "⌘4", description: "Prazos e intimações" },
  { id: "obrigacoes",  title: "Obrigações",   url: "/app/acordos-condenacoes", icon: Handshake,       shortcut: "⌘5", description: "Acordos e prazos" },
  { id: "partes",      title: "Partes",       url: "/app/partes",              icon: Users,           shortcut: "⌘6", description: "Clientes e partes" },
  { id: "pericias",    title: "Perícias",     url: "/app/pericias",            icon: Microscope,      shortcut: "⌘7", description: "Laudos e perícias" },
  { id: "processos",   title: "Processos",    url: "/app/processos",           icon: Scale,           shortcut: "⌘8", description: "Casos ativos" },
]

const navServicos: HubNavItem[] = [
  { id: "agenda",         title: "Agenda",             url: "/app/agenda",                              icon: CalendarCheck,  description: "Compromissos" },
  { id: "assinatura",     title: "Assinatura Digital", url: "/app/assinatura-digital/documentos/lista", icon: PenTool,        description: "Assinar docs" },
  { id: "assistentes",    title: "Assistentes IA",     url: "/app/assistentes",                         icon: Bot,            description: "Agentes inteligentes" },
  { id: "chat",           title: "Chat",               url: "/app/chat",                                icon: MessageSquare,  description: "Mensagens" },
  { id: "diario",         title: "Diário Oficial",     url: "/app/comunica-cnj",                        icon: Bell,           description: "Publicações" },
  { id: "documentos",     title: "Documentos",         url: "/app/documentos",                          icon: FileEdit,       description: "Editor colaborativo" },
  { id: "email",          title: "E-mail",             url: "/app/mail",                                icon: Mail,           description: "Caixa de entrada" },
  { id: "jurisprudencia", title: "Jurisprudência",     url: "/app/pangea",                              icon: Search,         description: "Pesquisa legal" },
  { id: "notas",          title: "Notas",              url: "/app/notas",                               icon: FileEdit,       description: "Anotações rápidas" },
  { id: "pecas",          title: "Peças Jurídicas",    url: "/app/pecas-juridicas",                     icon: ScrollText,     description: "Gerar peças com IA" },
  { id: "projetos",       title: "Projetos",           url: "/app/project-management",                  icon: FolderKanban,   description: "Gestão de projetos" },
]

const navGestao: HubNavItem[] = [
  { id: "captura",    title: "Captura",    url: "/app/captura",    icon: Database,  description: "Automação PJE/TRT" },
  { id: "financeiro", title: "Financeiro", url: "/app/financeiro", icon: Briefcase, description: "Contas e fluxo" },
]

// ─── Recents (persisted in localStorage) ───────────────────────────────

const RECENTS_KEY = "command-hub-recents"
const MAX_RECENTS = 5

function useRecents() {
  const [recents, setRecents] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENTS_KEY)
      if (stored) setRecents(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  const addRecent = useCallback((id: string) => {
    setRecents((prev) => {
      const next = [id, ...prev.filter((r) => r !== id)].slice(0, MAX_RECENTS)
      try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  return { recents, addRecent }
}

// ─── All items helper ──────────────────────────────────────────────────

function getAllItems(canSeePangea: boolean, canSeeProjetos: boolean, isSuperAdmin: boolean) {
  const servicos = navServicos.filter((item) => {
    if (item.url === "/app/project-management") return canSeeProjetos
    if (item.url === "/app/pangea") return canSeePangea
    return true
  })

  const sections = [
    { label: "Escritório", items: navEscritorio },
    { label: "Serviços",   items: servicos },
  ]

  if (isSuperAdmin) {
    sections.push({ label: "Gestão", items: navGestao })
  }

  return sections
}

// ─── Hub Panel ─────────────────────────────────────────────────────────

function HubPanel({
  onClose,
  onNavigate,
  activeUrl,
  sections,
  recents,
}: {
  onClose: () => void
  onNavigate: (item: HubNavItem) => void
  activeUrl: string
  sections: { label: string; items: HubNavItem[] }[]
  recents: string[]
}) {
  const [search, setSearch] = useState("")
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const searchRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const allItems = sections.flatMap((s) => s.items)

  // Filter items based on search
  const filteredSections = search.trim()
    ? [{
        label: "Resultados",
        items: allItems.filter(
          (item) =>
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.description?.toLowerCase().includes(search.toLowerCase())
        ),
      }]
    : sections

  const allFilteredItems = filteredSections.flatMap((s) => s.items)

  // Focus search on open
  useEffect(() => {
    setSearch("")
    setFocusedIndex(-1)
    const timer = setTimeout(() => searchRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [])

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setFocusedIndex((prev) => Math.min(prev + 1, allFilteredItems.length - 1))
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setFocusedIndex((prev) => Math.max(prev - 1, -1))
      }
      if (e.key === "Enter" && focusedIndex >= 0 && allFilteredItems[focusedIndex]) {
        onNavigate(allFilteredItems[focusedIndex])
        onClose()
      }
    },
    [allFilteredItems, focusedIndex, onClose, onNavigate]
  )

  // Resolve recent items
  const recentItems = recents
    .map((id) => allItems.find((i) => i.id === id))
    .filter(Boolean) as HubNavItem[]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[99] bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-150" />

      {/* Panel */}
      <div
        ref={panelRef}
        onKeyDown={handleKeyDown}
        className="
          fixed top-3 left-3 z-[100] w-[440px] max-h-[calc(100vh-80px)]
          overflow-hidden rounded-2xl
          bg-popover/95 backdrop-blur-2xl
          border border-border/50
          shadow-[0_25px_60px_-12px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.05)_inset]
          animate-in slide-in-from-top-2 fade-in duration-200
        "
      >
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/30">
          <Search className="size-4 text-muted-foreground/50 shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setFocusedIndex(-1)
            }}
            placeholder="Buscar módulo..."
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/40 outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted/50 text-[10px] text-muted-foreground/60 font-mono">
            ESC
          </kbd>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-160px)] p-2 scrollbar-macos">
          {/* Recents (only when not searching and have recents) */}
          {!search.trim() && recentItems.length > 0 && (
            <div className="mb-1">
              <div className="flex items-center gap-2 px-3 py-2">
                <Clock className="size-3 text-muted-foreground/40" />
                <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest">
                  Recentes
                </span>
              </div>
              <div className="flex gap-1.5 px-2 pb-3">
                {recentItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeUrl.startsWith(item.url)
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item)
                        onClose()
                      }}
                      className={`
                        flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl
                        transition-all duration-200 cursor-pointer group
                        ${isActive
                          ? "bg-primary/10 ring-1 ring-primary/20"
                          : "hover:bg-muted/50"
                        }
                      `}
                    >
                      <div className={`
                        size-9 rounded-xl flex items-center justify-center
                        transition-all duration-200
                        ${isActive
                          ? "bg-primary/15 text-primary"
                          : "bg-muted/40 text-muted-foreground/60 group-hover:bg-muted/60 group-hover:text-foreground/80"
                        }
                      `}>
                        <Icon className="size-4" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground/70 group-hover:text-foreground/80 transition-colors">
                        {item.title.length > 8 ? item.title.slice(0, 7) + "…" : item.title}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="mx-3 border-t border-border/20" />
            </div>
          )}

          {/* Sections Grid */}
          {filteredSections.map((section) => (
            <div key={section.label} className="mb-1">
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest">
                  {section.label}
                </span>
                <span className="text-[10px] text-muted-foreground/30">{section.items.length}</span>
              </div>

              <div className="grid grid-cols-2 gap-0.5 px-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeUrl.startsWith(item.url)
                  const globalIndex = allFilteredItems.indexOf(item)
                  const isFocused = focusedIndex === globalIndex

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item)
                        onClose()
                      }}
                      onMouseEnter={() => setFocusedIndex(globalIndex)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl
                        transition-all duration-150 cursor-pointer text-left group
                        ${isActive
                          ? "bg-primary/10 ring-1 ring-primary/20"
                          : isFocused
                            ? "bg-muted/60"
                            : "hover:bg-muted/40"
                        }
                      `}
                    >
                      <div className={`
                        size-8 rounded-lg flex items-center justify-center shrink-0
                        transition-all duration-200
                        ${isActive
                          ? "bg-primary/15 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                          : "bg-muted/30 text-muted-foreground/60 group-hover:text-foreground/80"
                        }
                      `}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-[13px] font-medium truncate ${isActive ? "text-primary" : ""}`}>
                            {item.title}
                          </span>
                          {item.shortcut && (
                            <kbd className="text-[9px] text-muted-foreground/30 font-mono ml-1 shrink-0">
                              {item.shortcut}
                            </kbd>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[10px] text-muted-foreground/40 truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {allFilteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Search className="size-8 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground/40">Nenhum módulo encontrado</p>
              <p className="text-[11px] text-muted-foreground/30">Tente outro termo de busca</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/20 bg-muted/20">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/40">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted/60 font-mono text-[9px]">↑↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted/60 font-mono text-[9px]">↵</kbd>
              abrir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-muted/60 font-mono text-[9px]">esc</kbd>
              fechar
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/30">
            <Sparkles className="size-3" />
            <span>Sinesys</span>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Exported: CommandHub (Logo Trigger + Panel) ───────────────────────

export function CommandHub() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { data, temPermissao, isLoading } = usePermissoes()
  const { recents, addRecent } = useRecents()

  const canSeePangea = !isLoading && temPermissao("pangea", "listar")
  const canSeeProjetos = !isLoading && temPermissao("projetos", "listar")
  const isSuperAdmin = data?.isSuperAdmin || false

  const sections = React.useMemo(
    () => getAllItems(canSeePangea, canSeeProjetos, isSuperAdmin),
    [canSeePangea, canSeeProjetos, isSuperAdmin]
  )

  const handleNavigate = useCallback(
    (item: HubNavItem) => {
      addRecent(item.id)
      router.push(item.url)
      setIsOpen(false)
    },
    [addRecent, router]
  )

  // Global shortcut: ⌘ + /
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleGlobalKey)
    return () => window.removeEventListener("keydown", handleGlobalKey)
  }, [])

  return (
    <>
      {/* Logo Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative flex items-center justify-center
          size-10 rounded-xl cursor-pointer
          transition-all duration-300 ease-out
          ${isOpen
            ? "bg-primary/10 ring-2 ring-primary/30 scale-95"
            : "hover:bg-muted/50 hover:scale-105 active:scale-95"
          }
        `}
        title="Menu de navegação (⌘/)"
      >
        <Image
          src="/logos/logo-small-light.svg"
          alt="Zattar"
          width={28}
          height={28}
          className="h-7 w-7 object-contain dark:hidden transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(-10deg)" : "rotate(0deg)" }}
          priority
        />
        <Image
          src="/logos/logo-small-dark.svg"
          alt="Zattar"
          width={28}
          height={28}
          className="h-7 w-7 object-contain hidden dark:block transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(-10deg)" : "rotate(0deg)" }}
          priority
        />
      </button>

      {/* Hub Panel */}
      {isOpen && (
        <HubPanel
          onClose={() => setIsOpen(false)}
          onNavigate={handleNavigate}
          activeUrl={pathname || ""}
          sections={sections}
          recents={recents}
        />
      )}
    </>
  )
}
