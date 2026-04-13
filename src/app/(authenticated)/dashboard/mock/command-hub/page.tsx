'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Search,
  LayoutDashboard,
  Scale,
  FileText,
  Users,
  Inbox,
  Gavel,
  Microscope,
  Calendar,
  PenTool,
  Bot,
  MessageCircle,
  Newspaper,
  FileEdit,
  Mail,
  BookOpen,
  StickyNote,
  ScrollText,
  FolderKanban,
  Radar,
  Wallet,
  ArrowRight,
  Clock,
  Sparkles,
  Command,
} from 'lucide-react';

// ============================================================================
// COMMAND HUB MOCK — "Launchpad na Logo"
// ============================================================================
// Conceito: Dropdown inovador na logo do header que substitui o AppDock.
// Combina: macOS Launchpad (grid) + Linear (estética) + Raycast (search inline)
// Acesse em: /app/dashboard/mock/command-hub
// ============================================================================

// ─── Navigation data ───────────────────────────────────────────────────

interface NavItem {
  id: string;
  title: string;
  url: string;
  icon: React.ElementType;
  shortcut?: string;
  description?: string;
}

const navEscritorio: NavItem[] = [
  { id: 'dashboard', title: 'Dashboard', url: '/app/dashboard', icon: LayoutDashboard, shortcut: '⌘1', description: 'Visão geral' },
  { id: 'processos', title: 'Processos', url: '/app/processos', icon: Scale, shortcut: '⌘2', description: '127 ativos' },
  { id: 'contratos', title: 'Contratos', url: '/app/contratos', icon: FileText, shortcut: '⌘3', description: '42 vigentes' },
  { id: 'partes', title: 'Partes', url: '/app/partes', icon: Users, shortcut: '⌘4', description: 'Clientes e partes' },
  { id: 'expedientes', title: 'Expedientes', url: '/app/expedientes', icon: Inbox, shortcut: '⌘5', description: '14 pendentes' },
  { id: 'audiencias', title: 'Audiências', url: '/app/audiencias/semana', icon: Gavel, shortcut: '⌘6', description: '3 esta semana' },
  { id: 'obrigacoes', title: 'Obrigações', url: '/app/obrigacoes', icon: ScrollText, shortcut: '⌘7', description: 'Acordos e prazos' },
  { id: 'pericias', title: 'Perícias', url: '/app/pericias', icon: Microscope, shortcut: '⌘8', description: '5 em andamento' },
];

const navServicos: NavItem[] = [
  { id: 'agenda', title: 'Agenda', url: '/app/agenda', icon: Calendar, description: 'Compromissos' },
  { id: 'assinatura', title: 'Assinatura Digital', url: '/app/assinatura-digital/documentos/lista', icon: PenTool, description: 'Assinar docs' },
  { id: 'assistentes', title: 'Assistentes IA', url: '/app/assistentes', icon: Bot, description: 'Agentes inteligentes' },
  { id: 'chat', title: 'Chat', url: '/app/chat', icon: MessageCircle, description: 'Mensagens' },
  { id: 'diario', title: 'Diário Oficial', url: '/app/comunica-cnj', icon: Newspaper, description: 'Publicações' },
  { id: 'documentos', title: 'Documentos', url: '/app/documentos', icon: FileEdit, description: 'Editor colaborativo' },
  { id: 'email', title: 'E-mail', url: '/app/mail', icon: Mail, description: 'Caixa de entrada' },
  { id: 'jurisprudencia', title: 'Jurisprudência', url: '/app/pangea', icon: BookOpen, description: 'Pesquisa legal' },
  { id: 'notas', title: 'Notas', url: '/app/notas', icon: StickyNote, description: 'Anotações rápidas' },
  { id: 'pecas', title: 'Peças Jurídicas', url: '/app/pecas-juridicas', icon: ScrollText, description: 'Gerar peças com IA' },
  { id: 'projetos', title: 'Projetos', url: '/app/project-management', icon: FolderKanban, description: 'Gestão de projetos' },
];

const navGestao: NavItem[] = [
  { id: 'captura', title: 'Captura', url: '/app/captura', icon: Radar, description: 'Automação PJE/TRT' },
  { id: 'financeiro', title: 'Financeiro', url: '/app/financeiro', icon: Wallet, description: 'Contas e fluxo' },
];

const allSections = [
  { label: 'Escritório', items: navEscritorio },
  { label: 'Serviços', items: navServicos },
  { label: 'Gestão', items: navGestao },
];

// ─── Recents (simulação) ───────────────────────────────────────────────

const RECENTS = ['dashboard', 'processos', 'expedientes', 'chat', 'documentos'];

// ─── Command Hub Component ─────────────────────────────────────────────

function CommandHub({
  isOpen,
  onClose,
  onNavigate,
  activeItem,
}: {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
  activeItem?: string;
}) {
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Filter items based on search
  const filteredSections = search.trim()
    ? [{
      label: 'Resultados',
      items: [...navEscritorio, ...navServicos, ...navGestao].filter(
        (item) =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.description?.toLowerCase().includes(search.toLowerCase())
      ),
    }]
    : allSections;

  const allFilteredItems = filteredSections.flatMap((s) => s.items);

  // Focus search on open
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setFocusedIndex(-1);
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, allFilteredItems.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
      }
      if (e.key === 'Enter' && focusedIndex >= 0 && allFilteredItems[focusedIndex]) {
        onNavigate(allFilteredItems[focusedIndex].url);
        onClose();
      }
    },
    [allFilteredItems, focusedIndex, onClose, onNavigate]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-99 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-150" />

      {/* Panel */}
      <div
        ref={panelRef}
        onKeyDown={handleKeyDown}
        className="
          fixed top-3 left-3 z-100 w-110calc(100vh-80px)]
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
              setSearch(e.target.value);
              setFocusedIndex(-1);
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

          {/* Recents (only when not searching) */}
          {!search.trim() && (
            <div className="mb-1">
              <div className="flex items-center gap-2 px-3 py-2">
                <Clock className="size-3 text-muted-foreground/40" />
                <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest">
                  Recentes
                </span>
              </div>
              <div className="flex gap-1.5 px-2 pb-3">
                {RECENTS.map((id) => {
                  const item = [...navEscritorio, ...navServicos, ...navGestao].find((i) => i.id === id);
                  if (!item) return null;
                  const Icon = item.icon;
                  const isActive = activeItem === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.url);
                        onClose();
                      }}
                      className={`
                        flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl
                        transition-all duration-200 cursor-pointer group
                        ${isActive
                          ? 'bg-primary/10 ring-1 ring-primary/20'
                          : 'hover:bg-muted/50'
                        }
                      `}
                    >
                      <div className={`
                        size-9 rounded-xl flex items-center justify-center
                        transition-all duration-200
                        ${isActive
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted/40 text-muted-foreground/60 group-hover:bg-muted/60 group-hover:text-foreground/80'
                        }
                      `}>
                        <Icon className="size-4" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground/70 group-hover:text-foreground/80 transition-colors">
                        {item.title.length > 8 ? item.title.slice(0, 7) + '…' : item.title}
                      </span>
                    </button>
                  );
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
                {section.items.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = activeItem === item.id;
                  const globalIndex = allFilteredItems.indexOf(item);
                  const isFocused = focusedIndex === globalIndex;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.url);
                        onClose();
                      }}
                      onMouseEnter={() => setFocusedIndex(globalIndex)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl
                        transition-all duration-150 cursor-pointer text-left group
                        ${isActive
                          ? 'bg-primary/10 ring-1 ring-primary/20'
                          : isFocused
                            ? 'bg-muted/60'
                            : 'hover:bg-muted/40'
                        }
                      `}
                      style={{
                        animationDelay: `${idx * 25}ms`,
                      }}
                    >
                      <div className={`
                        size-8 rounded-lg flex items-center justify-center shrink-0
                        transition-all duration-200
                        ${isActive
                          ? 'bg-primary/15 text-primary shadow-[0_0_12px_var(--glow-primary)]'
                          : 'bg-muted/30 text-muted-foreground/60 group-hover:text-foreground/80'
                        }
                      `}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-[13px] font-medium truncate ${isActive ? 'text-primary' : ''}`}>
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
                  );
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
            <span>ZattarOS v2</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Logo Trigger ──────────────────────────────────────────────────────

function LogoTrigger({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center
        size-10 rounded-xl cursor-pointer
        transition-all duration-300 ease-out
        ${isOpen
          ? 'bg-primary/10 ring-2 ring-primary/30 scale-95'
          : 'hover:bg-muted/50 hover:scale-105 active:scale-95'
        }
      `}
      title="Menu de navegação (⌘/)"
    >
      <Image
        src="/logos/Sem%20Fundo%20SVG/logo-z-light.svg"
        alt="Zattar"
        width={28}
        height={28}
        className="h-7 w-7 object-contain dark:hidden transition-transform duration-300"
        style={{ transform: isOpen ? 'rotate(-10deg)' : 'rotate(0deg)' }}
        priority
      />
      <Image
        src="/logos/Sem%20Fundo%20SVG/logo-z-dark.svg"
        alt="Zattar"
        width={28}
        height={28}
        className="h-7 w-7 object-contain hidden dark:block transition-transform duration-300"
        style={{ transform: isOpen ? 'rotate(-10deg)' : 'rotate(0deg)' }}
        priority
      />

      {/* Subtle glow ring when hub is open */}
      {isOpen && (
        <div className="absolute inset-0 rounded-xl ring-2 ring-primary/20 animate-pulse" />
      )}
    </button>
  );
}

// ─── Simulated Header ──────────────────────────────────────────────────

function MockHeader({
  activeItem,
  onNavigate,
}: {
  activeItem: string;
  onNavigate: (url: string) => void;
}) {
  const [hubOpen, setHubOpen] = useState(false);

  // Global shortcut: ⌘ + /
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setHubOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-4 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-2 z-40">
        {/* Logo Trigger */}
        <LogoTrigger isOpen={hubOpen} onClick={() => setHubOpen(!hubOpen)} />

        {/* Center: Search */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-2 px-4 h-9 rounded-xl bg-muted/30 border border-border/20 text-muted-foreground/40 text-sm">
              <Search className="size-3.5" />
              <span>Buscar...</span>
              <kbd className="ml-auto text-[10px] font-mono bg-muted/50 px-1.5 py-0.5 rounded">⌘K</kbd>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Simulated action buttons */}
          <button className="size-8 rounded-lg flex items-center justify-center hover:bg-muted/40 transition-colors cursor-pointer text-muted-foreground/60">
            <Command className="size-4" />
          </button>
          <div className="h-4 w-px bg-border/30" />
          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-[11px] font-bold text-primary">
            JM
          </div>
        </div>
      </div>

      {/* Command Hub */}
      <CommandHub
        isOpen={hubOpen}
        onClose={() => setHubOpen(false)}
        onNavigate={onNavigate}
        activeItem={activeItem}
      />
    </>
  );
}

// ─── Sample Content (simula conteúdo da dashboard) ─────────────────────

function SampleContent({ activeItem, onNavigate }: { activeItem: string; onNavigate: (url: string) => void }) {
  const item = [...navEscritorio, ...navServicos, ...navGestao].find((i) => i.id === activeItem);
  const Icon = item?.icon || LayoutDashboard;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
      {/* Current module indicator */}
      <div className="flex flex-col items-center gap-4">
        <div className="size-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="size-10 text-primary/60" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-heading font-bold">{item?.title || 'Dashboard'}</h2>
          <p className="text-sm text-muted-foreground/50 mt-1">{item?.description}</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="glass-widget rounded-2xl border border-border/20 p-6 max-w-md w-full space-y-4">
        <h3 className="text-sm font-medium text-center">Experimente o Command Hub</h3>
        <div className="space-y-3">
          <InstructionRow
            shortcut="Clique na logo"
            description="Abre o Command Hub com todos os módulos"
          />
          <InstructionRow
            shortcut="⌘ + /"
            description="Atalho para abrir/fechar o hub"
          />
          <InstructionRow
            shortcut="Digite para filtrar"
            description="Busca inteligente em todos os módulos"
          />
          <InstructionRow
            shortcut="↑ ↓ + Enter"
            description="Navegação completa pelo teclado"
          />
          <InstructionRow
            shortcut="ESC"
            description="Fecha o hub"
          />
        </div>
      </div>

      {/* Quick navigation chips */}
      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
        {navEscritorio.slice(0, 4).map((nav) => {
          const NavIcon = nav.icon;
          return (
            <button
              key={nav.id}
              onClick={() => onNavigate(nav.url)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200 cursor-pointer
                ${activeItem === nav.id
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                  : 'bg-muted/30 text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground/80'
                }
              `}
            >
              <NavIcon className="size-3.5" />
              {nav.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InstructionRow({ shortcut, description }: { shortcut: string; description: string }) {
  return (
    <div className="flex items-center gap-3">
      <kbd className="shrink-0 min-w-30 text-right px-2 py-1 rounded-md bg-muted/40 text-[11px] font-mono text-muted-foreground/60">
        {shortcut}
      </kbd>
      <ArrowRight className="size-3 text-muted-foreground/30 shrink-0" />
      <span className="text-[12px] text-muted-foreground/60">{description}</span>
    </div>
  );
}

// ─── Main Mock Page ────────────────────────────────────────────────────

export default function CommandHubMockPage() {
  const [activeItem, setActiveItem] = useState('dashboard');

  const handleNavigate = (url: string) => {
    // In mock: just update the active indicator
    const item = [...navEscritorio, ...navServicos, ...navGestao].find((i) => i.url === url);
    if (item) setActiveItem(item.id);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background canvas-dots">
      {/* Header com Command Hub */}
      <MockHeader activeItem={activeItem} onNavigate={handleNavigate} />

      {/* Content */}
      <SampleContent activeItem={activeItem} onNavigate={handleNavigate} />

      {/* Footer note */}
      <p className="text-center text-[10px] text-muted-foreground/30 pb-4">
        {'Protótipo — Command Hub — clique na logo "Z" ou pressione ⌘/ para abrir'}
      </p>
    </div>
  );
}
