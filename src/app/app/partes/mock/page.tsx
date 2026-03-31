'use client';

import { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Scale,
  ChevronRight,
  LayoutGrid,
  List,
  Filter,
  ArrowUpRight,
  Clock,
  AlertCircle,
  Building2,
  User,
  Shield,
  Gavel,
  X,
  Copy,
  ExternalLink,
  Calendar,
  FileText,
} from 'lucide-react';

// ============================================================================
// PARTES MOCK — Protótipo "Glass Briefing" para gestão de partes
// ============================================================================
// Acesse em: /app/partes/mock
// Conceito: Não é uma tabela de dados. É um CRM jurídico visual.
// ============================================================================

// ─── Types ──────────────────────────────────────────────────────────────

type TipoPessoa = 'pf' | 'pj';
type TipoEntidade = 'cliente' | 'parte_contraria' | 'terceiro' | 'representante';

interface Parte {
  id: number;
  nome: string;
  nomeSocial?: string;
  tipo: TipoPessoa;
  tipoEntidade: TipoEntidade;
  documento: string;
  documentoMasked: string;
  email?: string;
  telefone?: string;
  estado: string;
  cidade: string;
  ativo: boolean;
  processosAtivos: number;
  processosTotal: number;
  ultimaAtualizacao: string;
  tags?: string[];
}

// ─── Mock data ──────────────────────────────────────────────────────────

const MOCK_PARTES: Parte[] = [
  { id: 1, nome: 'Maria Fernanda Silva Santos', tipo: 'pf', tipoEntidade: 'cliente', documento: '123.456.789-10', documentoMasked: '•••.•••.789-10', email: 'maria.silva@email.com', telefone: '(11) 98765-4321', estado: 'SP', cidade: 'São Paulo', ativo: true, processosAtivos: 3, processosTotal: 5, ultimaAtualizacao: '2026-03-28', tags: ['trabalhista', 'prioritário'] },
  { id: 2, nome: 'Tech Solutions Ltda.', nomeSocial: 'TechSol', tipo: 'pj', tipoEntidade: 'cliente', documento: '12.345.678/0001-90', documentoMasked: '••.•••.678/0001-90', email: 'contato@techsol.com.br', telefone: '(21) 3333-4444', estado: 'RJ', cidade: 'Rio de Janeiro', ativo: true, processosAtivos: 12, processosTotal: 18, ultimaAtualizacao: '2026-03-30', tags: ['empresarial', 'grande porte'] },
  { id: 3, nome: 'João Carlos Pereira', tipo: 'pf', tipoEntidade: 'cliente', documento: '987.654.321-00', documentoMasked: '•••.•••.321-00', email: 'joao.pereira@gmail.com', telefone: '(31) 99876-5432', estado: 'MG', cidade: 'Belo Horizonte', ativo: true, processosAtivos: 1, processosTotal: 2, ultimaAtualizacao: '2026-03-25' },
  { id: 4, nome: 'Construtora Nova Era S/A', tipo: 'pj', tipoEntidade: 'parte_contraria', documento: '98.765.432/0001-10', documentoMasked: '••.•••.432/0001-10', email: 'juridico@novaera.com.br', telefone: '(11) 2222-3333', estado: 'SP', cidade: 'Campinas', ativo: true, processosAtivos: 8, processosTotal: 14, ultimaAtualizacao: '2026-03-29', tags: ['reincidente'] },
  { id: 5, nome: 'Roberto Mendes de Almeida', tipo: 'pf', tipoEntidade: 'parte_contraria', documento: '456.789.123-45', documentoMasked: '•••.•••.123-45', telefone: '(41) 98765-1234', estado: 'PR', cidade: 'Curitiba', ativo: true, processosAtivos: 2, processosTotal: 3, ultimaAtualizacao: '2026-03-20' },
  { id: 6, nome: 'Ana Beatriz Costa', tipo: 'pf', tipoEntidade: 'cliente', documento: '321.654.987-00', documentoMasked: '•••.•••.987-00', email: 'ana.costa@outlook.com', estado: 'RS', cidade: 'Porto Alegre', ativo: false, processosAtivos: 0, processosTotal: 1, ultimaAtualizacao: '2025-11-15' },
  { id: 7, nome: 'Dr. Marcos Antônio Vieira', tipo: 'pf', tipoEntidade: 'representante', documento: '111.222.333-44', documentoMasked: '•••.•••.333-44', email: 'marcos.vieira@oab.org.br', telefone: '(11) 97777-8888', estado: 'SP', cidade: 'São Paulo', ativo: true, processosAtivos: 15, processosTotal: 42, ultimaAtualizacao: '2026-03-31', tags: ['OAB/SP 123456'] },
  { id: 8, nome: 'Indústrias Paulista Ltda.', tipo: 'pj', tipoEntidade: 'parte_contraria', documento: '55.666.777/0001-88', documentoMasked: '••.•••.777/0001-88', email: 'legal@paulista.ind.br', estado: 'SP', cidade: 'Sorocaba', ativo: true, processosAtivos: 4, processosTotal: 6, ultimaAtualizacao: '2026-03-27' },
  { id: 9, nome: 'Carlos Eduardo Ferreira', tipo: 'pf', tipoEntidade: 'terceiro', documento: '999.888.777-66', documentoMasked: '•••.•••.777-66', email: 'perito.ferreira@gmail.com', telefone: '(19) 99888-7766', estado: 'SP', cidade: 'Campinas', ativo: true, processosAtivos: 3, processosTotal: 7, ultimaAtualizacao: '2026-03-26', tags: ['perito', 'engenharia'] },
  { id: 10, nome: 'Fernanda Oliveira Lima', tipo: 'pf', tipoEntidade: 'cliente', documento: '444.555.666-77', documentoMasked: '•••.•••.666-77', email: 'fernanda.lima@email.com', estado: 'BA', cidade: 'Salvador', ativo: true, processosAtivos: 2, processosTotal: 2, ultimaAtualizacao: '2026-03-22', tags: ['previdenciário'] },
  { id: 11, nome: 'Banco Central do Brasil', tipo: 'pj', tipoEntidade: 'parte_contraria', documento: '00.038.166/0001-05', documentoMasked: '••.•••.166/0001-05', estado: 'DF', cidade: 'Brasília', ativo: true, processosAtivos: 1, processosTotal: 1, ultimaAtualizacao: '2026-03-15' },
  { id: 12, nome: 'Dra. Patrícia Souza', tipo: 'pf', tipoEntidade: 'representante', documento: '222.333.444-55', documentoMasked: '•••.•••.444-55', email: 'patricia.souza@advocacia.com', telefone: '(21) 98888-9999', estado: 'RJ', cidade: 'Rio de Janeiro', ativo: true, processosAtivos: 8, processosTotal: 23, ultimaAtualizacao: '2026-03-30', tags: ['OAB/RJ 654321'] },
];

const STATS = {
  clientes: { total: 142, novosMes: 5, ativos: 138 },
  partesContrarias: { total: 89, novosMes: 3, ativos: 89 },
  terceiros: { total: 23, novosMes: 1, ativos: 21 },
  representantes: { total: 18, novosMes: 0, ativos: 18 },
};

// ─── Helpers ────────────────────────────────────────────────────────────

const TIPO_ENTIDADE_CONFIG: Record<TipoEntidade, { label: string; icon: typeof Users; color: string; bg: string }> = {
  cliente: { label: 'Cliente', icon: User, color: 'text-primary/70', bg: 'bg-primary/8' },
  parte_contraria: { label: 'Parte Contrária', icon: Gavel, color: 'text-warning/70', bg: 'bg-warning/8' },
  terceiro: { label: 'Terceiro', icon: Shield, color: 'text-info/70', bg: 'bg-info/8' },
  representante: { label: 'Representante', icon: Scale, color: 'text-success/70', bg: 'bg-success/8' },
};

function getInitials(nome: string): string {
  return nome.split(' ').filter(p => p.length > 2).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 7) return `${days}d atrás`;
  if (days < 30) return `${Math.floor(days / 7)}sem atrás`;
  return `${Math.floor(days / 30)}m atrás`;
}

// ─── Glass Components ───────────────────────────────────────────────────

function GlassPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border/20 glass-widget bg-transparent transition-all duration-200 ${className}`}>
      {children}
    </div>
  );
}

// ─── Tab Pill Navigation ────────────────────────────────────────────────

type TabId = 'todos' | 'clientes' | 'partes_contrarias' | 'terceiros' | 'representantes';

const TABS: { id: TabId; label: string; count: number }[] = [
  { id: 'todos', label: 'Todos', count: STATS.clientes.total + STATS.partesContrarias.total + STATS.terceiros.total + STATS.representantes.total },
  { id: 'clientes', label: 'Clientes', count: STATS.clientes.total },
  { id: 'partes_contrarias', label: 'Partes Contrárias', count: STATS.partesContrarias.total },
  { id: 'terceiros', label: 'Terceiros', count: STATS.terceiros.total },
  { id: 'representantes', label: 'Representantes', count: STATS.representantes.total },
];

function TabPills({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-border/[0.06] overflow-x-auto">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
            transition-all duration-200 cursor-pointer
            ${active === tab.id
              ? 'bg-primary/12 text-primary shadow-sm'
              : 'text-muted-foreground/50 hover:text-muted-foreground/70 hover:bg-white/4'
            }
          `}
        >
          {tab.label}
          <span className={`text-[10px] tabular-nums ${active === tab.id ? 'text-primary/50' : 'text-muted-foreground/30'}`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Entity Card ────────────────────────────────────────────────────────

function EntityCard({ parte, onSelect }: { parte: Parte; onSelect: (p: Parte) => void }) {
  const config = TIPO_ENTIDADE_CONFIG[parte.tipoEntidade];
  const Icon = config.icon;

  return (
    <GlassPanel className="p-4 hover:scale-[1.01] cursor-pointer group">
      <div onClick={() => onSelect(parte)}>
        {/* Header: Avatar + Name + Type badge */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`size-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
            {parte.tipo === 'pj' ? (
              <Building2 className={`size-4 ${config.color}`} />
            ) : (
              <span className={`text-xs font-bold ${config.color}`}>{getInitials(parte.nome)}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold truncate">{parte.nome}</h3>
              {!parte.ativo && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground/50">Inativo</span>
              )}
            </div>
            {parte.nomeSocial && (
              <p className="text-[10px] text-muted-foreground/40 truncate">{parte.nomeSocial}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                {config.label}
              </span>
              <span className="text-[10px] text-muted-foreground/40 tabular-nums">
                {parte.documentoMasked}
              </span>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[10px] text-muted-foreground/50">
          {parte.email && (
            <span className="flex items-center gap-1 truncate max-w-[180px]">
              <Mail className="size-2.5 shrink-0" />
              {parte.email}
            </span>
          )}
          {parte.telefone && (
            <span className="flex items-center gap-1">
              <Phone className="size-2.5 shrink-0" />
              {parte.telefone}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="size-2.5 shrink-0" />
            {parte.cidade}, {parte.estado}
          </span>
        </div>

        {/* Footer: Processos + atualização */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/10">
          <div className="flex items-center gap-1.5">
            <Scale className="size-3 text-muted-foreground/30" />
            <span className="text-[10px] font-medium">
              {parte.processosAtivos}
              <span className="text-muted-foreground/30"> / {parte.processosTotal} processos</span>
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground/30 flex items-center gap-1">
            <Clock className="size-2.5" />
            {timeAgo(parte.ultimaAtualizacao)}
          </span>
        </div>

        {/* Tags */}
        {parte.tags && parte.tags.length > 0 && (
          <div className="flex gap-1 mt-2">
            {parte.tags.map((tag) => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/[0.05] text-primary/50">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

// ─── Entity Detail Slide ────────────────────────────────────────────────

function EntityDetail({ parte, onClose }: { parte: Parte; onClose: () => void }) {
  const config = TIPO_ENTIDADE_CONFIG[parte.tipoEntidade];
  const Icon = config.icon;

  const mockProcessos = [
    { numero: '0001234-56.2024.5.01.0001', status: 'Ativo', tipo: 'Trabalhista', fase: 'Instrução' },
    { numero: '0009876-12.2025.8.19.0001', status: 'Ativo', tipo: 'Cível', fase: 'Recurso' },
    { numero: '0004567-89.2023.5.02.0001', status: 'Arquivado', tipo: 'Trabalhista', fase: 'Encerrado' },
  ];

  const mockTimeline = [
    { data: '30 mar', acao: 'Audiência de instrução realizada', tipo: 'audiencia' },
    { data: '28 mar', acao: 'Expediente baixado — contestação', tipo: 'expediente' },
    { data: '22 mar', acao: 'Documento anexado ao processo', tipo: 'documento' },
    { data: '15 mar', acao: 'Processo distribuído para a vara', tipo: 'processo' },
  ];

  return (
    <GlassPanel className="p-5 md:col-span-2 lg:col-span-1">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`size-12 rounded-xl ${config.bg} flex items-center justify-center`}>
            {parte.tipo === 'pj' ? (
              <Building2 className={`size-5 ${config.color}`} />
            ) : (
              <span className={`text-sm font-bold ${config.color}`}>{getInitials(parte.nome)}</span>
            )}
          </div>
          <div>
            <h2 className="text-base font-heading font-semibold">{parte.nome}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                {config.label}
              </span>
              <span className="text-[10px] text-muted-foreground/40">{parte.tipo === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors cursor-pointer">
          <X className="size-4 text-muted-foreground/40" />
        </button>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <InfoRow icon={FileText} label="Documento" value={parte.documento} copyable />
        <InfoRow icon={MapPin} label="Localidade" value={`${parte.cidade}, ${parte.estado}`} />
        {parte.email && <InfoRow icon={Mail} label="E-mail" value={parte.email} copyable />}
        {parte.telefone && <InfoRow icon={Phone} label="Telefone" value={parte.telefone} />}
      </div>

      {/* Stats */}
      <div className="flex gap-4 p-3 rounded-xl bg-white/[0.03] border border-border/10 mb-5">
        <div className="flex-1 text-center">
          <p className="font-display text-xl font-bold">{parte.processosAtivos}</p>
          <p className="text-[9px] text-muted-foreground/40">Ativos</p>
        </div>
        <div className="w-px bg-border/10" />
        <div className="flex-1 text-center">
          <p className="font-display text-xl font-bold text-muted-foreground/50">{parte.processosTotal - parte.processosAtivos}</p>
          <p className="text-[9px] text-muted-foreground/40">Encerrados</p>
        </div>
        <div className="w-px bg-border/10" />
        <div className="flex-1 text-center">
          <p className="font-display text-xl font-bold text-primary/70">{parte.processosTotal}</p>
          <p className="text-[9px] text-muted-foreground/40">Total</p>
        </div>
      </div>

      {/* Processos relacionados */}
      <div className="mb-5">
        <h3 className="text-xs font-heading font-semibold mb-2 flex items-center gap-1.5">
          <Scale className="size-3.5 text-muted-foreground/40" />
          Processos
        </h3>
        <div className="space-y-1.5">
          {mockProcessos.map((p) => (
            <div key={p.numero} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/4 transition-colors cursor-pointer">
              <div className={`size-1.5 rounded-full ${p.status === 'Ativo' ? 'bg-success/60' : 'bg-muted-foreground/20'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono text-muted-foreground/60 truncate">{p.numero}</p>
                <p className="text-[9px] text-muted-foreground/35">{p.tipo} &middot; {p.fase}</p>
              </div>
              <ChevronRight className="size-3 text-muted-foreground/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h3 className="text-xs font-heading font-semibold mb-2 flex items-center gap-1.5">
          <Clock className="size-3.5 text-muted-foreground/40" />
          Atividade Recente
        </h3>
        <div className="relative">
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border/15" />
          {mockTimeline.map((ev, i) => (
            <div key={i} className="flex items-start gap-3 py-1.5 relative">
              <div className="size-2.5 rounded-full bg-primary/30 mt-1 relative z-10" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px]">{ev.acao}</p>
                <p className="text-[9px] text-muted-foreground/30">{ev.data}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-5 pt-4 border-t border-border/10">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary/70 text-xs font-medium hover:bg-primary/15 transition-colors cursor-pointer">
          <ExternalLink className="size-3" />
          Ver perfil completo
        </button>
        <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/4 text-muted-foreground/50 text-xs font-medium hover:bg-white/6 transition-colors cursor-pointer">
          <Copy className="size-3" />
        </button>
      </div>
    </GlassPanel>
  );
}

function InfoRow({ icon: Icon, label, value, copyable }: { icon: typeof Mail; label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="size-3 text-muted-foreground/30 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] text-muted-foreground/35 uppercase tracking-wider">{label}</p>
        <p className="text-[11px] font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function PartesMockPage() {
  const [activeTab, setActiveTab] = useState<TabId>('todos');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedParte, setSelectedParte] = useState<Parte | null>(null);

  // Filter partes
  const filteredPartes = MOCK_PARTES.filter((p) => {
    if (activeTab !== 'todos') {
      const tabToType: Record<string, TipoEntidade> = {
        clientes: 'cliente',
        partes_contrarias: 'parte_contraria',
        terceiros: 'terceiro',
        representantes: 'representante',
      };
      if (p.tipoEntidade !== tabToType[activeTab]) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      return p.nome.toLowerCase().includes(s) || p.documento.includes(s) || p.email?.toLowerCase().includes(s);
    }
    return true;
  });

  const totalGeral = STATS.clientes.total + STATS.partesContrarias.total + STATS.terceiros.total + STATS.representantes.total;
  const novosEsteMes = STATS.clientes.novosMes + STATS.partesContrarias.novosMes + STATS.terceiros.novosMes + STATS.representantes.novosMes;

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Partes</h1>
          <p className="text-sm text-muted-foreground/50 mt-0.5">
            {totalGeral} registros &middot; {novosEsteMes} novos este mês
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm">
          <Plus className="size-3.5" />
          Nova parte
        </button>
      </div>

      {/* ── Pulse Strip ─────────────────────────────────────────── */}
      <GlassPanel className="px-5 py-3">
        <div className="flex items-center gap-6 overflow-x-auto">
          {([
            { label: 'Clientes', total: STATS.clientes.total, novos: STATS.clientes.novosMes, icon: User, color: 'text-primary' },
            { label: 'Partes Contrárias', total: STATS.partesContrarias.total, novos: STATS.partesContrarias.novosMes, icon: Gavel, color: 'text-warning' },
            { label: 'Terceiros', total: STATS.terceiros.total, novos: STATS.terceiros.novosMes, icon: Shield, color: 'text-info' },
            { label: 'Representantes', total: STATS.representantes.total, novos: STATS.representantes.novosMes, icon: Scale, color: 'text-success' },
          ] as const).map((s, i) => (
            <div key={s.label} className="flex items-center gap-3 shrink-0">
              {i > 0 && <div className="w-px h-8 bg-border/10 -ml-3" />}
              <s.icon className={`size-4 ${s.color}/40`} />
              <div>
                <p className="font-display text-lg font-bold tabular-nums">{s.total}</p>
                <p className="text-[10px] text-muted-foreground/40">
                  {s.label}
                  {s.novos > 0 && <span className="text-success/60 ml-1">+{s.novos}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* ── Insight Banner ──────────────────────────────────────── */}
      <div className="rounded-lg border border-primary/10 bg-primary/[0.04] px-3.5 py-2 text-[11px] font-medium text-primary/70 flex items-center gap-2">
        <AlertCircle className="size-3.5 shrink-0" />
        <span>5 clientes sem processos ativos há 90+ dias &middot; 2 partes contrárias com dados incompletos</span>
        <ChevronRight className="size-3 ml-auto shrink-0" />
      </div>

      {/* ── Tabs + Search + View Toggle ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <TabPills active={activeTab} onChange={setActiveTab} />
        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/30" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF, CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 pl-8 pr-3 py-1.5 rounded-lg bg-white/4 border border-border/15 text-xs placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/20 transition-all"
            />
          </div>
          {/* View toggle */}
          <div className="flex p-0.5 rounded-lg bg-border/[0.06]">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'cards' ? 'bg-primary/12 text-primary' : 'text-muted-foreground/30 hover:text-muted-foreground/50'}`}
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'list' ? 'bg-primary/12 text-primary' : 'text-muted-foreground/30 hover:text-muted-foreground/50'}`}
            >
              <List className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content: Cards + Optional Detail ────────────────────── */}
      <div className={`grid gap-3 ${selectedParte ? 'lg:grid-cols-[1fr_380px]' : ''}`}>
        {/* Cards/List Grid */}
        <div className={viewMode === 'cards'
          ? `grid grid-cols-1 sm:grid-cols-2 ${selectedParte ? '' : 'lg:grid-cols-3'} gap-3`
          : 'flex flex-col gap-1.5'
        }>
          {filteredPartes.map((parte) =>
            viewMode === 'cards' ? (
              <EntityCard key={parte.id} parte={parte} onSelect={setSelectedParte} />
            ) : (
              <EntityListRow key={parte.id} parte={parte} onSelect={setSelectedParte} selected={selectedParte?.id === parte.id} />
            )
          )}

          {filteredPartes.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <Users className="size-8 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground/50">Nenhuma parte encontrada</p>
              <p className="text-xs text-muted-foreground/30 mt-1">Tente ajustar os filtros ou a busca</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedParte && (
          <div className="hidden lg:block sticky top-4 self-start">
            <EntityDetail parte={selectedParte} onClose={() => setSelectedParte(null)} />
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <p className="text-center text-[10px] text-muted-foreground/25 pb-4">
        {'Protótipo — Partes com Glass Briefing — dados fictícios'}
      </p>
    </div>
  );
}

// ─── List Row (alternative view) ────────────────────────────────────────

function EntityListRow({ parte, onSelect, selected }: { parte: Parte; onSelect: (p: Parte) => void; selected: boolean }) {
  const config = TIPO_ENTIDADE_CONFIG[parte.tipoEntidade];

  return (
    <div
      onClick={() => onSelect(parte)}
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-150
        ${selected ? 'bg-primary/[0.06] border border-primary/15' : 'hover:bg-white/4 border border-transparent'}
      `}
    >
      {/* Avatar */}
      <div className={`size-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
        {parte.tipo === 'pj' ? (
          <Building2 className={`size-3.5 ${config.color}`} />
        ) : (
          <span className={`text-[10px] font-bold ${config.color}`}>{getInitials(parte.nome)}</span>
        )}
      </div>

      {/* Name + doc */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{parte.nome}</p>
        <p className="text-[10px] text-muted-foreground/35 tabular-nums">{parte.documentoMasked}</p>
      </div>

      {/* Type */}
      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color} shrink-0 hidden sm:block`}>
        {config.label}
      </span>

      {/* Location */}
      <span className="text-[10px] text-muted-foreground/35 shrink-0 hidden md:block w-16 text-right">{parte.estado}</span>

      {/* Processos */}
      <span className="text-[10px] font-medium tabular-nums shrink-0 w-12 text-right">
        {parte.processosAtivos}
        <span className="text-muted-foreground/25"> proc</span>
      </span>

      {/* Time */}
      <span className="text-[9px] text-muted-foreground/25 shrink-0 w-14 text-right hidden lg:block">{timeAgo(parte.ultimaAtualizacao)}</span>

      <ChevronRight className="size-3.5 text-muted-foreground/15 shrink-0" />
    </div>
  );
}
