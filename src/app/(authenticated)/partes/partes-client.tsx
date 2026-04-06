'use client';

/**
 * PartesClient — Componente cliente do módulo Partes.
 *
 * Renderiza a UI "Glass Briefing" para gestão de clientes, partes contrárias,
 * terceiros e representantes usando os componentes compartilhados do dashboard.
 *
 * Uso:
 *   <PartesClient />
 *   <PartesClient initialStats={{ clientes: { total: 142, ativos: 138, novosMes: 5 }, ... }} />
 */

import { useState, useCallback } from 'react';
import {
  Plus,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Users,
  User,
  Gavel,
  Shield,
  Scale,
  X,
  Copy,
  ExternalLink,
  FileText,
  Mail,
  Phone,
  MapPin,
  Clock,
  Building2,
} from 'lucide-react';
import { usePartes, type TipoEntidade } from '@/app/(authenticated)/partes';
import { EntityCard, getInitials, timeAgo, type EntityCardData } from '@/components/dashboard/entity-card';
import { EntityListRow } from '@/components/dashboard/entity-list-row';
import { PulseStrip, type PulseItem } from '@/components/dashboard/pulse-strip';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle } from '@/components/dashboard/view-toggle';
import { GlassPanel } from '@/components/shared/glass-panel';
import { ClienteFormDialog } from './components/clientes/cliente-form';
import { ParteContrariaFormDialog } from './components/partes-contrarias/parte-contraria-form';
import { TerceiroFormDialog } from './components/terceiros/terceiro-form';
import { RepresentanteFormDialog } from './components/representantes/representante-form';
import { Heading } from '@/components/ui/typography';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatGroup {
  total: number;
  ativos: number;
  novosMes: number;
}

export interface PartesClientProps {
  initialStats?: {
    clientes: StatGroup;
    partesContrarias: StatGroup;
    terceiros: StatGroup;
    representantes: StatGroup;
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <GlassPanel className="p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl bg-muted-foreground/10 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-muted-foreground/10 rounded w-3/4" />
          <div className="h-2.5 bg-muted-foreground/8 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-1.5 mt-3">
        <div className="h-2 bg-muted-foreground/8 rounded w-full" />
        <div className="h-2 bg-muted-foreground/8 rounded w-2/3" />
      </div>
      <div className="flex justify-between mt-3 pt-3 border-t border-border/10">
        <div className="h-2 bg-muted-foreground/8 rounded w-24" />
        <div className="h-2 bg-muted-foreground/8 rounded w-12" />
      </div>
    </GlassPanel>
  );
}

function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl animate-pulse">
      <div className="size-8 rounded-lg bg-muted-foreground/10 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 bg-muted-foreground/10 rounded w-48" />
        <div className="h-2 bg-muted-foreground/8 rounded w-28" />
      </div>
      <div className="h-2 bg-muted-foreground/8 rounded w-16 hidden sm:block" />
      <div className="h-2 bg-muted-foreground/8 rounded w-10 hidden md:block" />
      <div className="h-2 bg-muted-foreground/8 rounded w-10" />
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

interface EntityDetailProps {
  data: EntityCardData;
  onClose: () => void;
}

function EntityDetail({ data, onClose }: EntityDetailProps) {
  const { config } = data;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(data.nome).catch(() => {});
  }, [data.nome]);

  return (
    <GlassPanel className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`size-12 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
            {data.tipo === 'pj' ? (
              <Building2 className={`size-5 ${config.color}`} />
            ) : (
              <span className={`text-sm font-bold ${config.color}`}>{getInitials(data.nome)}</span>
            )}
          </div>
          <div>
            <h2 className="text-base font-heading font-semibold">{data.nome}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                {config.label}
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                {data.tipo === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </span>
              {!data.ativo && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground/50">
                  Inativo
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar painel de detalhes"
          className="p-1.5 rounded-lg hover:bg-white/4 transition-colors cursor-pointer"
        >
          <X className="size-4 text-muted-foreground/60" />
        </button>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <InfoRow icon={FileText} label="Documento" value={data.documentoMasked} />
        {data.localizacao && data.localizacao !== '—' && (
          <InfoRow icon={MapPin} label="Localidade" value={data.localizacao} />
        )}
        {data.email && <InfoRow icon={Mail} label="E-mail" value={data.email} />}
        {data.telefone && <InfoRow icon={Phone} label="Telefone" value={data.telefone} />}
        <InfoRow
          icon={Clock}
          label="Atualizado"
          value={timeAgo(data.ultimaAtualizacao)}
        />
      </div>

      {/* Métricas */}
      <div className="flex gap-4 p-3 rounded-xl bg-white/3 border border-border/10 mb-5">
        <div className="flex-1 text-center">
          <p className="font-display text-xl font-bold">{data.metricas.ativos}</p>
          <p className="text-[9px] text-muted-foreground/60">Ativos</p>
        </div>
        <div className="w-px bg-border/10" />
        <div className="flex-1 text-center">
          <p className="font-display text-xl font-bold text-muted-foreground/50">
            {Math.max(0, data.metricas.total - data.metricas.ativos)}
          </p>
          <p className="text-[9px] text-muted-foreground/60">Encerrados</p>
        </div>
        <div className="w-px bg-border/10" />
        <div className="flex-1 text-center">
          <p className="font-display text-xl font-bold text-primary/70">{data.metricas.total}</p>
          <p className="text-[9px] text-muted-foreground/60">Total</p>
        </div>
      </div>

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {data.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/6 text-primary/60 border border-primary/10">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Nome social */}
      {data.nomeSocial && (
        <div className="mb-4 p-2.5 rounded-lg bg-white/2.5 border border-border/10">
          <p className="text-[9px] text-muted-foreground/55 uppercase tracking-wider mb-0.5">Nome fantasia / Social</p>
          <p className="text-xs text-muted-foreground/70">{data.nomeSocial}</p>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2 mt-5 pt-4 border-t border-border/10">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary/70 text-xs font-medium hover:bg-primary/15 transition-colors cursor-pointer">
          <ExternalLink className="size-3" />
          Ver perfil completo
        </button>
        <button
          onClick={handleCopy}
          aria-label="Copiar nome"
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/4 text-muted-foreground/50 text-xs font-medium hover:bg-white/6 transition-colors cursor-pointer"
        >
          <Copy className="size-3" />
        </button>
      </div>
    </GlassPanel>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="size-3 text-muted-foreground/55 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] text-muted-foreground/55 uppercase tracking-wider">{label}</p>
        <p className="text-[11px] font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 24;

export function PartesClient({ initialStats }: PartesClientProps) {
  const [activeTab, setActiveTab] = useState<TipoEntidade>('todos');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedParte, setSelectedParte] = useState<EntityCardData | null>(null);
  const [pagina, setPagina] = useState(1);

  // Criação de parte
  type CreateType = 'clientes' | 'partes_contrarias' | 'terceiros' | 'representantes';
  const [createType, setCreateType] = useState<CreateType | null>(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const { partes, isLoading, error, total, refetch } = usePartes({
    tipoEntidade: activeTab,
    busca: search,
    pagina,
    limite: PAGE_SIZE,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Fechar painel ao trocar de tab
  const handleTabChange = useCallback((id: string) => {
    setActiveTab(id as TipoEntidade);
    setSelectedParte(null);
    setPagina(1);
  }, []);

  const handleSelect = useCallback((data: EntityCardData) => {
    setSelectedParte((prev) => (prev?.id === data.id ? null : data));
  }, []);

  const handleNovaParte = useCallback(() => {
    if (activeTab !== 'todos') {
      setCreateType(activeTab as CreateType);
    } else {
      setShowTypeMenu((prev) => !prev);
    }
  }, [activeTab]);

  const handleCreateSuccess = useCallback(() => {
    setCreateType(null);
    refetch();
  }, [refetch]);

  // Stats — preferem initialStats quando disponíveis, senão usa total da tab ativa
  const stats = initialStats ?? {
    clientes: { total: 0, ativos: 0, novosMes: 0 },
    partesContrarias: { total: 0, ativos: 0, novosMes: 0 },
    terceiros: { total: 0, ativos: 0, novosMes: 0 },
    representantes: { total: 0, ativos: 0, novosMes: 0 },
  };

  const totalGeral =
    stats.clientes.total +
    stats.partesContrarias.total +
    stats.terceiros.total +
    stats.representantes.total;

  const novosEsteMes =
    stats.clientes.novosMes +
    stats.partesContrarias.novosMes +
    stats.terceiros.novosMes +
    stats.representantes.novosMes;

  // PulseStrip items
  const pulseItems: PulseItem[] = [
    {
      label: 'Clientes',
      total: stats.clientes.total || (activeTab === 'clientes' ? total : 0),
      delta: stats.clientes.novosMes > 0 ? `+${stats.clientes.novosMes}` : undefined,
      icon: User,
      color: 'text-primary',
    },
    {
      label: 'Partes Contrárias',
      total: stats.partesContrarias.total || (activeTab === 'partes_contrarias' ? total : 0),
      delta: stats.partesContrarias.novosMes > 0 ? `+${stats.partesContrarias.novosMes}` : undefined,
      icon: Gavel,
      color: 'text-warning',
    },
    {
      label: 'Terceiros',
      total: stats.terceiros.total || (activeTab === 'terceiros' ? total : 0),
      delta: stats.terceiros.novosMes > 0 ? `+${stats.terceiros.novosMes}` : undefined,
      icon: Shield,
      color: 'text-info',
    },
    {
      label: 'Representantes',
      total: stats.representantes.total || (activeTab === 'representantes' ? total : 0),
      delta: stats.representantes.novosMes > 0 ? `+${stats.representantes.novosMes}` : undefined,
      icon: Scale,
      color: 'text-success',
    },
  ];

  // Tabs
  const tabs: TabPillOption[] = [
    { id: 'todos', label: 'Todos', count: totalGeral || (activeTab === 'todos' ? total : undefined) },
    { id: 'clientes', label: 'Clientes', count: stats.clientes.total || (activeTab === 'clientes' ? total : undefined) },
    { id: 'partes_contrarias', label: 'Partes Contrárias', count: stats.partesContrarias.total || (activeTab === 'partes_contrarias' ? total : undefined) },
    { id: 'terceiros', label: 'Terceiros', count: stats.terceiros.total || (activeTab === 'terceiros' ? total : undefined) },
    { id: 'representantes', label: 'Representantes', count: stats.representantes.total || (activeTab === 'representantes' ? total : undefined) },
  ];

  const skeletonCount = 6;

  const createOptions: { type: CreateType; label: string; icon: typeof User }[] = [
    { type: 'clientes', label: 'Cliente', icon: User },
    { type: 'partes_contrarias', label: 'Parte Contrária', icon: Gavel },
    { type: 'terceiros', label: 'Terceiro', icon: Shield },
    { type: 'representantes', label: 'Representante', icon: Scale },
  ];

  const buttonLabel = activeTab !== 'todos'
    ? `Novo ${createOptions.find((o) => o.type === activeTab)?.label ?? 'Registro'}`
    : 'Nova parte';

  return (
    <div className="max-w-350 mx-auto space-y-5">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">Partes</Heading>
          <p className="text-sm text-muted-foreground/50 mt-0.5">
            {totalGeral > 0
              ? `${totalGeral.toLocaleString('pt-BR')} registros${novosEsteMes > 0 ? ` · ${novosEsteMes} novos este mês` : ''}`
              : total > 0
                ? `${total.toLocaleString('pt-BR')} registros`
                : 'Gestão de clientes, partes e representantes'}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={handleNovaParte}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="size-3.5" />
            {buttonLabel}
          </button>

          {/* Dropdown de tipo (só na tab "Todos") */}
          {showTypeMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTypeMenu(false)} />
              <div className="absolute right-0 top-full mt-1.5 z-50 w-56 rounded-xl border border-border/20 bg-popover shadow-lg p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                {createOptions.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => {
                      setCreateType(opt.type);
                      setShowTypeMenu(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors cursor-pointer text-left"
                  >
                    <opt.icon className="size-4 text-muted-foreground/60" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Pulse Strip ─────────────────────────────────────────── */}
      <PulseStrip items={pulseItems} />

      {/* ── Insight Banner ──────────────────────────────────────── */}
      <div className="rounded-lg border border-primary/10 bg-primary/4 px-3.5 py-2 text-[11px] font-medium text-primary/70 flex items-center gap-2 cursor-pointer hover:bg-primary/6 transition-colors">
        <AlertCircle className="size-3.5 shrink-0" />
        <span>Verifique clientes sem processos ativos e cadastros com dados incompletos</span>
        <ChevronRight className="size-3 ml-auto shrink-0" />
      </div>

      {/* ── Tabs + Search + View Toggle ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <TabPills tabs={tabs} active={activeTab} onChange={handleTabChange} />
        <div className="flex items-center gap-2 flex-1 justify-end">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPagina(1); }}
            placeholder="Buscar por nome, CPF, CNPJ..."
          />
          <ViewToggle mode={viewMode} onChange={(m) => setViewMode(m as 'cards' | 'list')} />
        </div>
      </div>

      {/* ── Error State ─────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/4 px-4 py-3 text-xs text-destructive/80 flex items-center gap-2">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Content: Cards + Optional Detail ────────────────────── */}
      <div className={`grid gap-3 ${selectedParte ? 'lg:grid-cols-[1fr_380px]' : ''}`}>
        {/* Cards/List Grid */}
        <div
          className={
            viewMode === 'cards'
              ? `grid grid-cols-1 sm:grid-cols-2 ${selectedParte ? '' : 'lg:grid-cols-3'} gap-3`
              : 'flex flex-col gap-1.5'
          }
        >
          {isLoading
            ? Array.from({ length: skeletonCount }).map((_, i) =>
                viewMode === 'cards' ? (
                  <CardSkeleton key={i} />
                ) : (
                  <ListRowSkeleton key={i} />
                )
              )
            : partes.map((parte) =>
                viewMode === 'cards' ? (
                  <EntityCard
                    key={parte.id}
                    data={parte}
                    onClick={handleSelect}
                  />
                ) : (
                  <EntityListRow
                    key={parte.id}
                    data={parte}
                    onClick={handleSelect}
                    selected={selectedParte?.id === parte.id}
                  />
                )
              )}

          {!isLoading && !error && partes.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <Users className="size-8 text-muted-foreground/45 mb-3" />
              <p className="text-sm font-medium text-muted-foreground/50">
                Nenhuma parte encontrada
              </p>
              <p className="text-xs text-muted-foreground/55 mt-1">
                {search ? 'Tente ajustar a busca' : 'Tente ajustar os filtros'}
              </p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedParte && (
          <div className="hidden lg:block sticky top-4 self-start">
            <EntityDetail data={selectedParte} onClose={() => setSelectedParte(null)} />
          </div>
        )}
      </div>

      {/* ── Paginação ──────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground/50">
            {((pagina - 1) * PAGE_SIZE) + 1}–{Math.min(pagina * PAGE_SIZE, total)} de {total.toLocaleString('pt-BR')}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina <= 1}
              className="flex items-center justify-center size-8 rounded-lg hover:bg-white/4 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="size-4 text-muted-foreground/60" />
            </button>
            <span className="text-xs font-medium tabular-nums px-2">
              {pagina} / {totalPages}
            </span>
            <button
              onClick={() => setPagina((p) => Math.min(totalPages, p + 1))}
              disabled={pagina >= totalPages}
              className="flex items-center justify-center size-8 rounded-lg hover:bg-white/4 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="size-4 text-muted-foreground/60" />
            </button>
          </div>
        </div>
      )}

      {/* ── Dialogs de criação ─────────────────────────────────── */}
      <ClienteFormDialog
        open={createType === 'clientes'}
        onOpenChange={(open) => { if (!open) setCreateType(null); }}
        onSuccess={handleCreateSuccess}
        mode="create"
      />
      <ParteContrariaFormDialog
        open={createType === 'partes_contrarias'}
        onOpenChange={(open) => { if (!open) setCreateType(null); }}
        onSuccess={handleCreateSuccess}
        mode="create"
      />
      <TerceiroFormDialog
        open={createType === 'terceiros'}
        onOpenChange={(open) => { if (!open) setCreateType(null); }}
        onSuccess={handleCreateSuccess}
        mode="create"
      />
      <RepresentanteFormDialog
        open={createType === 'representantes'}
        onOpenChange={(open) => { if (!open) setCreateType(null); }}
        onSuccess={handleCreateSuccess}
        mode="create"
      />
    </div>
  );
}
