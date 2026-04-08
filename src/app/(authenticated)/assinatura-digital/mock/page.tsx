'use client';

import { useState } from 'react';
import {
  FileSignature,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Send,
  Users,
  ChevronRight,
  GitBranch,
  List,
  LayoutGrid,
  Camera,
  X,
  ExternalLink,
  Copy,
  Mail,
  RotateCcw,
  Download,
  Shield,
} from 'lucide-react';
import {
  GlassPanel,
  InsightBanner,
  ProgressRing,
  AnimatedNumber,
  Sparkline,
} from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { TabPills } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { Heading } from '@/components/ui/typography';

// ============================================================================
// ASSINATURA DIGITAL MOCK — "Signature Command Center"
// ============================================================================
// Acesse em: /app/assinatura-digital/mock
// ============================================================================

// ─── Types ──────────────────────────────────────────────────────────────

type DocStatus = 'rascunho' | 'pronto' | 'concluido' | 'cancelado';

interface Assinante {
  nome: string;
  email?: string;
  tipo: 'cliente' | 'representante' | 'parte_contraria' | 'convidado';
  status: 'pendente' | 'concluido';
  diasPendente?: number;
  concluidoEm?: string;
}

interface Documento {
  id: number;
  uuid: string;
  titulo: string;
  status: DocStatus;
  assinantes: Assinante[];
  criadoEm: string;
  atualizadoEm: string;
  criadoPor: string;
  selfieHabilitada: boolean;
  origem: 'documento' | 'formulario';
}

// ─── Mock Data ──────────────────────────────────────────────────────────

const DOCS: Documento[] = [
  {
    id: 1, uuid: 'a1b2c3', titulo: 'Contrato de Honorários — Maria Silva', status: 'pronto',
    assinantes: [
      { nome: 'Maria Fernanda Silva', email: 'maria@email.com', tipo: 'cliente', status: 'concluido', concluidoEm: '2026-03-29' },
      { nome: 'Dr. Marcos Vieira', email: 'marcos@escritorio.com', tipo: 'representante', status: 'concluido', concluidoEm: '2026-03-29' },
      { nome: 'João Carlos Pereira', email: 'joao@email.com', tipo: 'parte_contraria', status: 'pendente', diasPendente: 2 },
    ],
    criadoEm: '2026-03-28', atualizadoEm: '2026-03-30', criadoPor: 'Dr. Marcos', selfieHabilitada: true, origem: 'documento',
  },
  {
    id: 2, uuid: 'd4e5f6', titulo: 'Procuração Ad Judicia — Tech Solutions', status: 'pronto',
    assinantes: [
      { nome: 'Tech Solutions Ltda.', email: 'legal@techsol.com', tipo: 'cliente', status: 'pendente', diasPendente: 7 },
      { nome: 'Dra. Patrícia Souza', email: 'patricia@escritorio.com', tipo: 'representante', status: 'concluido', concluidoEm: '2026-03-25' },
    ],
    criadoEm: '2026-03-24', atualizadoEm: '2026-03-24', criadoPor: 'Dra. Patrícia', selfieHabilitada: false, origem: 'documento',
  },
  {
    id: 3, uuid: 'g7h8i9', titulo: 'Acordo Extrajudicial — Construtora Nova Era', status: 'concluido',
    assinantes: [
      { nome: 'Construtora Nova Era S/A', email: 'juridico@novaera.com', tipo: 'parte_contraria', status: 'concluido', concluidoEm: '2026-03-25' },
      { nome: 'Ana Beatriz Costa', email: 'ana@email.com', tipo: 'cliente', status: 'concluido', concluidoEm: '2026-03-26' },
      { nome: 'Dr. Marcos Vieira', email: 'marcos@escritorio.com', tipo: 'representante', status: 'concluido', concluidoEm: '2026-03-27' },
    ],
    criadoEm: '2026-03-20', atualizadoEm: '2026-03-27', criadoPor: 'Dr. Marcos', selfieHabilitada: true, origem: 'formulario',
  },
  {
    id: 4, uuid: 'j1k2l3', titulo: 'Contrato de Prestação de Serviços', status: 'rascunho',
    assinantes: [],
    criadoEm: '2026-03-30', atualizadoEm: '2026-03-30', criadoPor: 'Dr. Marcos', selfieHabilitada: false, origem: 'documento',
  },
  {
    id: 5, uuid: 'm4n5o6', titulo: 'Termo de Confissão de Dívida — Roberto Mendes', status: 'pronto',
    assinantes: [
      { nome: 'Roberto Mendes', email: 'roberto@email.com', tipo: 'cliente', status: 'pendente', diasPendente: 12 },
      { nome: 'Dr. Marcos Vieira', email: 'marcos@escritorio.com', tipo: 'representante', status: 'pendente', diasPendente: 12 },
    ],
    criadoEm: '2026-03-19', atualizadoEm: '2026-03-19', criadoPor: 'Dr. Marcos', selfieHabilitada: true, origem: 'documento',
  },
  {
    id: 6, uuid: 'p7q8r9', titulo: 'Declaração de Hipossuficiência — Fernanda Oliveira', status: 'concluido',
    assinantes: [
      { nome: 'Fernanda Oliveira Lima', email: 'fernanda@email.com', tipo: 'cliente', status: 'concluido', concluidoEm: '2026-03-16' },
    ],
    criadoEm: '2026-03-15', atualizadoEm: '2026-03-16', criadoPor: 'Dra. Patrícia', selfieHabilitada: false, origem: 'formulario',
  },
  {
    id: 7, uuid: 's1t2u3', titulo: 'Contrato de Assessoria Jurídica — Indústrias Paulista', status: 'cancelado',
    assinantes: [
      { nome: 'Indústrias Paulista Ltda.', email: 'juridico@paulista.ind.br', tipo: 'cliente', status: 'pendente' },
    ],
    criadoEm: '2026-03-10', atualizadoEm: '2026-03-22', criadoPor: 'Dr. Marcos', selfieHabilitada: false, origem: 'documento',
  },
  {
    id: 8, uuid: 'v4w5x6', titulo: 'Procuração — Ana Beatriz Costa', status: 'rascunho',
    assinantes: [
      { nome: 'Ana Beatriz Costa', email: 'ana@email.com', tipo: 'cliente', status: 'pendente' },
    ],
    criadoEm: '2026-03-31', atualizadoEm: '2026-03-31', criadoPor: 'Dra. Patrícia', selfieHabilitada: false, origem: 'documento',
  },
  {
    id: 9, uuid: 'y7z8a1', titulo: 'Termo de Acordo Trabalhista — Carlos Eduardo', status: 'concluido',
    assinantes: [
      { nome: 'Carlos Eduardo Ferreira', email: 'carlos@email.com', tipo: 'cliente', status: 'concluido', concluidoEm: '2026-03-22' },
      { nome: 'Dra. Patrícia Souza', email: 'patricia@escritorio.com', tipo: 'representante', status: 'concluido', concluidoEm: '2026-03-23' },
    ],
    criadoEm: '2026-03-18', atualizadoEm: '2026-03-23', criadoPor: 'Dra. Patrícia', selfieHabilitada: true, origem: 'documento',
  },
];

const STATS = {
  total: 23,
  rascunhos: 4,
  aguardando: 8,
  concluidos: 9,
  cancelados: 2,
  taxaConclusao: 82,
  tempoMedio: 3.4,
  trendMensal: [12, 15, 18, 14, 20, 23],
};

// ─── Helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; cssColor: string; icon: typeof Clock; bg: string }> = {
  rascunho: { label: 'Rascunho', color: 'text-muted-foreground/50', cssColor: 'var(--muted-foreground)', icon: FileText, bg: 'bg-muted-foreground/8' },
  pronto: { label: 'Aguardando', color: 'text-warning/70', cssColor: 'var(--warning)', icon: Send, bg: 'bg-warning/8' },
  concluido: { label: 'Concluído', color: 'text-success/70', cssColor: 'var(--success)', icon: CheckCircle2, bg: 'bg-success/8' },
  cancelado: { label: 'Cancelado', color: 'text-destructive/50', cssColor: 'var(--destructive)', icon: XCircle, bg: 'bg-destructive/8' },
};

function getSignerProgress(doc: Documento): { signed: number; total: number; percent: number } {
  const total = doc.assinantes.length;
  const signed = doc.assinantes.filter(a => a.status === 'concluido').length;
  return { signed, total, percent: total > 0 ? Math.round((signed / total) * 100) : 0 };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 7) return `${days}d atrás`;
  return `${Math.floor(days / 7)}sem atrás`;
}

// ─── Pipeline ───────────────────────────────────────────────────────────

function SignaturePipeline() {
  const stages = [
    { status: 'rascunho' as DocStatus, count: STATS.rascunhos },
    { status: 'pronto' as DocStatus, count: STATS.aguardando },
    { status: 'concluido' as DocStatus, count: STATS.concluidos },
  ];
  const maxCount = Math.max(...stages.map(s => s.count));

  return (
    <GlassPanel className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="size-4 text-muted-foreground/50" />
        <Heading level="section" className="text-widget-title">Pipeline de Assinaturas</Heading>
        <span className="text-[10px] text-muted-foreground/55 ml-auto">
          {STATS.cancelados} cancelado{STATS.cancelados !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-stretch gap-3">
        {stages.map((stage, i) => {
          const cfg = STATUS_CONFIG[stage.status];
          const Icon = cfg.icon;
          const prevCount = i > 0 ? stages[i - 1].count : stage.count;
          const convRate = i > 0 && prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : null;
          const barWidth = maxCount > 0 ? Math.max(15, (stage.count / maxCount) * 100) : 15;

          return (
            <div key={stage.status} className="flex-1 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Icon className={`size-3.5 ${cfg.color}`} />
                <span className="text-[10px] text-muted-foreground/50">{cfg.label}</span>
              </div>
              <p className="font-display text-2xl font-bold">{stage.count}</p>
              <div
                className="h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${barWidth}%`, backgroundColor: cfg.cssColor, opacity: 0.5 }}
              />
              {convRate !== null ? (
                <span className={`text-[9px] ${convRate >= 70 ? 'text-success/50' : 'text-warning/50'}`}>
                  {convRate}% conversão
                </span>
              ) : (
                <span className="text-[9px] text-transparent">-</span>
              )}
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

// ─── Stats Strip ────────────────────────────────────────────────────────

function StatsStrip() {
  return (
    <GlassPanel className="px-5 py-3">
      <div className="flex items-center gap-6 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <FileSignature className="size-4 text-muted-foreground/55" />
          <div>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Total</p>
            <p className="font-display text-lg font-bold tabular-nums">
              <AnimatedNumber value={STATS.total} />
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        <div className="shrink-0">
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Taxa Conclusão</p>
          <div className="flex items-center gap-2">
            <ProgressRing percent={STATS.taxaConclusao} size={32} color="var(--success)" />
            <span className="text-xs font-bold text-success/70">{STATS.taxaConclusao}%</span>
          </div>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        <div className="shrink-0">
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Tempo Médio</p>
          <p className="font-display text-base font-bold tabular-nums">{STATS.tempoMedio}d</p>
          <p className="text-[9px] text-muted-foreground/55">para conclusão</p>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        <div className="flex items-center gap-3 shrink-0">
          <div>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Tendência 6m</p>
            <p className="text-xs font-semibold text-success/60">+3 este mês</p>
          </div>
          <Sparkline data={STATS.trendMensal} width={60} height={20} color="var(--success)" />
        </div>
      </div>
    </GlassPanel>
  );
}

// ─── Document Card ──────────────────────────────────────────────────────

function DocumentCard({ doc, onSelect }: { doc: Documento; onSelect: (d: Documento) => void }) {
  const cfg = STATUS_CONFIG[doc.status];
  const Icon = cfg.icon;
  const progress = getSignerProgress(doc);
  const hasPendingLong = doc.assinantes.some(a => a.status === 'pendente' && (a.diasPendente ?? 0) > 7);

  return (
    <GlassPanel className={`p-4 cursor-pointer hover:scale-[1.01] ${hasPendingLong ? 'ring-1 ring-warning/15' : ''}`}>
      <div onClick={() => onSelect(doc)}>
        <div className="flex items-start gap-3">
          <div className={`size-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`size-4 ${cfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold truncate leading-tight">{doc.titulo}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
              {doc.selfieHabilitada && <Camera className="size-3 text-muted-foreground/50" />}
              {doc.origem === 'formulario' && (
                <span className="text-[8px] px-1 py-0.5 rounded bg-info/6 text-info/40">formulário</span>
              )}
            </div>
          </div>
        </div>

        {doc.assinantes.length > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <ProgressRing
              percent={progress.percent}
              size={36}
              color={progress.percent === 100 ? 'var(--success)' : 'var(--primary)'}
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1">
                {doc.assinantes.map((a, i) => (
                  <SignerPill key={i} assinante={a} />
                ))}
              </div>
            </div>
          </div>
        )}

        {doc.assinantes.length === 0 && doc.status === 'rascunho' && (
          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground/55">
            <Users className="size-3" />
            Sem assinantes configurados
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/10">
          <span className="text-[9px] text-muted-foreground/55">{doc.criadoPor}</span>
          <span className="text-[9px] text-muted-foreground/50 flex items-center gap-1">
            <Clock className="size-2.5" />
            {timeAgo(doc.atualizadoEm)}
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}

function SignerPill({ assinante: a }: { assinante: Assinante }) {
  const isDone = a.status === 'concluido';
  const isLate = !isDone && (a.diasPendente ?? 0) > 7;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border transition-colors ${
        isDone
          ? 'bg-success/6 border-success/15 text-success/60'
          : isLate
          ? 'bg-warning/6 border-warning/15 text-warning/60'
          : 'bg-border/6 border-border/15 text-muted-foreground/60'
      }`}
    >
      {isDone ? <CheckCircle2 className="size-2.5" /> : <Clock className="size-2.5" />}
      <span className="truncate max-w-20">{a.nome.split(' ')[0]}</span>
      {isLate && <span className="text-[7px] text-warning/50">{a.diasPendente}d</span>}
    </span>
  );
}

// ─── Document Detail Panel ──────────────────────────────────────────────

function DocumentDetail({ doc, onClose }: { doc: Documento; onClose: () => void }) {
  const cfg = STATUS_CONFIG[doc.status];
  const Icon = cfg.icon;
  const progress = getSignerProgress(doc);

  return (
    <GlassPanel className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`size-5 ${cfg.color}`} />
          </div>
          <div className="min-w-0">
            <Heading level="section" className="text-sm leading-tight">{doc.titulo}</Heading>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
              {doc.selfieHabilitada && (
                <span className="text-[8px] flex items-center gap-0.5 text-muted-foreground/55">
                  <Camera className="size-2.5" /> Selfie
                </span>
              )}
              {doc.origem === 'formulario' && (
                <span className="text-[8px] flex items-center gap-0.5 text-info/40">
                  <FileText className="size-2.5" /> Formulário
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors cursor-pointer">
          <X className="size-4 text-muted-foreground/60" />
        </button>
      </div>

      {/* Progress */}
      {doc.assinantes.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-border/10 mb-4">
          <ProgressRing
            percent={progress.percent}
            size={48}
            color={progress.percent === 100 ? 'var(--success)' : 'var(--primary)'}
          />
          <div>
            <p className="text-sm font-bold">{progress.signed}/{progress.total} assinantes</p>
            <p className="text-[10px] text-muted-foreground/60">
              {progress.percent === 100 ? 'Todos assinaram' : `${progress.total - progress.signed} pendente${progress.total - progress.signed > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      )}

      {/* Signers list */}
      <div className="mb-4">
        <Heading level="card" className="text-xs mb-2 flex items-center gap-1.5">
          <Users className="size-3.5 text-muted-foreground/60" />
          Assinantes
        </Heading>
        <div className="space-y-1.5">
          {doc.assinantes.map((a, i) => {
            const isDone = a.status === 'concluido';
            const isLate = !isDone && (a.diasPendente ?? 0) > 7;

            return (
              <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/3 transition-colors">
                <div className={`size-2 rounded-full shrink-0 ${isDone ? 'bg-success/60' : isLate ? 'bg-warning/60 animate-pulse' : 'bg-muted-foreground/20'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium">{a.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {a.email && (
                      <span className="text-[9px] text-muted-foreground/55 flex items-center gap-0.5">
                        <Mail className="size-2" />{a.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {isDone ? (
                    <span className="text-[9px] text-success/60 flex items-center gap-0.5">
                      <CheckCircle2 className="size-2.5" />
                      {a.concluidoEm ? timeAgo(a.concluidoEm) : 'Assinado'}
                    </span>
                  ) : isLate ? (
                    <span className="text-[9px] text-warning/60">{a.diasPendente}d pendente</span>
                  ) : (
                    <span className="text-[9px] text-muted-foreground/55">Pendente</span>
                  )}
                </div>
              </div>
            );
          })}
          {doc.assinantes.length === 0 && (
            <p className="text-[10px] text-muted-foreground/55 text-center py-4">Sem assinantes configurados</p>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-[10px]">
        <div>
          <p className="text-muted-foreground/55 uppercase tracking-wider text-[9px]">Criado por</p>
          <p className="font-medium mt-0.5">{doc.criadoPor}</p>
        </div>
        <div>
          <p className="text-muted-foreground/55 uppercase tracking-wider text-[9px]">Criado em</p>
          <p className="font-medium mt-0.5">{new Date(doc.criadoEm).toLocaleDateString('pt-BR')}</p>
        </div>
        <div>
          <p className="text-muted-foreground/55 uppercase tracking-wider text-[9px]">Atualizado</p>
          <p className="font-medium mt-0.5">{timeAgo(doc.atualizadoEm)}</p>
        </div>
        <div>
          <p className="text-muted-foreground/55 uppercase tracking-wider text-[9px]">Verificação</p>
          <p className="font-medium mt-0.5 flex items-center gap-1 text-success/60">
            <Shield className="size-2.5" /> Íntegro
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-border/10">
        {doc.status === 'pronto' && doc.assinantes.some(a => a.status === 'pendente') && (
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-warning/10 text-warning/70 text-xs font-medium hover:bg-warning/15 transition-colors cursor-pointer">
            <RotateCcw className="size-3" />
            Reenviar convites
          </button>
        )}
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary/70 text-xs font-medium hover:bg-primary/15 transition-colors cursor-pointer">
          <ExternalLink className="size-3" />
          Ver documento
        </button>
        <button className="flex items-center justify-center px-3 py-2 rounded-lg bg-white/4 text-muted-foreground/50 hover:bg-white/6 transition-colors cursor-pointer">
          <Download className="size-3" />
        </button>
        <button className="flex items-center justify-center px-3 py-2 rounded-lg bg-white/4 text-muted-foreground/50 hover:bg-white/6 transition-colors cursor-pointer">
          <Copy className="size-3" />
        </button>
      </div>
    </GlassPanel>
  );
}

// ─── Document List Row ──────────────────────────────────────────────────

function DocumentListRow({ doc, onSelect, selected }: { doc: Documento; onSelect: (d: Documento) => void; selected: boolean }) {
  const cfg = STATUS_CONFIG[doc.status];
  const progress = getSignerProgress(doc);
  const hasPendingLong = doc.assinantes.some(a => a.status === 'pendente' && (a.diasPendente ?? 0) > 7);

  return (
    <div
      onClick={() => onSelect(doc)}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all
        ${selected ? 'bg-primary/6 border border-primary/15' : `hover:bg-white/4 border border-transparent ${hasPendingLong ? 'ring-1 ring-warning/10' : ''}`}`}
    >
      <div className={`size-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
        <cfg.icon className={`size-3.5 ${cfg.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{doc.titulo}</p>
        <p className="text-[10px] text-muted-foreground/55">{doc.criadoPor} &middot; {timeAgo(doc.criadoEm)}</p>
      </div>

      {doc.assinantes.length > 0 && (
        <div className="flex items-center gap-1.5 shrink-0">
          <ProgressRing percent={progress.percent} size={24} color={progress.percent === 100 ? 'var(--success)' : 'var(--primary)'} />
          <span className="text-[10px] tabular-nums text-muted-foreground/60">{progress.signed}/{progress.total}</span>
        </div>
      )}

      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} shrink-0 hidden sm:block`}>
        {cfg.label}
      </span>

      <div className="items-center gap-1 shrink-0 hidden md:flex">
        {doc.selfieHabilitada && <Camera className="size-3 text-muted-foreground/45" />}
        {doc.origem === 'formulario' && <FileText className="size-3 text-info/30" />}
      </div>

      <ChevronRight className="size-3.5 text-muted-foreground/60 shrink-0" />
    </div>
  );
}

// ─── View Options ───────────────────────────────────────────────────────

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'cards', icon: LayoutGrid, label: 'Cartões' },
  { id: 'lista', icon: List, label: 'Lista' },
];

// ============================================================================
// PAGE
// ============================================================================

export default function AssinaturaDigitalMockPage() {
  const [viewMode, setViewMode] = useState('cards');
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('todos');
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);

  const filteredDocs = DOCS.filter(d => {
    if (activeStatus !== 'todos' && d.status !== activeStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return d.titulo.toLowerCase().includes(s) || d.criadoPor.toLowerCase().includes(s) || d.assinantes.some(a => a.nome.toLowerCase().includes(s));
    }
    return true;
  });

  const pendingSigners = DOCS.flatMap(d => d.assinantes.filter(a => a.status === 'pendente' && (a.diasPendente ?? 0) > 7));

  const handleSelect = (doc: Documento) => {
    setSelectedDoc(prev => prev?.id === doc.id ? null : doc);
  };

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page" className="text-2xl tracking-tight">Assinatura Digital</Heading>
          <p className="text-sm text-muted-foreground/50 mt-0.5">
            {STATS.total} documentos &middot; {STATS.aguardando} aguardando assinatura
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm">
          <Plus className="size-3.5" />
          Novo documento
        </button>
      </div>

      {/* ── Stats Strip ─────────────────────────────────── */}
      <StatsStrip />

      {/* ── Pipeline ────────────────────────────────────── */}
      <SignaturePipeline />

      {/* ── Insight ─────────────────────────────────────── */}
      {pendingSigners.length > 0 && (
        <InsightBanner type="warning">
          {pendingSigners.length} assinante{pendingSigners.length > 1 ? 's' : ''} sem assinar há 7+ dias — considere reenviar os convites
        </InsightBanner>
      )}

      {/* ── Controls ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <TabPills
          tabs={[
            { id: 'todos', label: 'Todos', count: STATS.total },
            { id: 'rascunho', label: 'Rascunhos', count: STATS.rascunhos },
            { id: 'pronto', label: 'Aguardando', count: STATS.aguardando },
            { id: 'concluido', label: 'Concluídos', count: STATS.concluidos },
            { id: 'cancelado', label: 'Cancelados', count: STATS.cancelados },
          ]}
          active={activeStatus}
          onChange={setActiveStatus}
        />
        <div className="flex items-center gap-2 flex-1 justify-end">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar documento, assinante..." />
          <ViewToggle mode={viewMode} onChange={setViewMode} options={VIEW_OPTIONS} />
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div className={`grid gap-3 ${selectedDoc ? 'lg:grid-cols-[1fr_380px]' : ''}`}>
        {/* Cards/List */}
        <div>
          {filteredDocs.length > 0 ? (
            viewMode === 'cards' ? (
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${selectedDoc ? '' : 'lg:grid-cols-3'} gap-3`}>
                {filteredDocs.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} onSelect={handleSelect} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredDocs.map(doc => (
                  <DocumentListRow key={doc.id} doc={doc} onSelect={handleSelect} selected={selectedDoc?.id === doc.id} />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileSignature className="size-8 text-muted-foreground/45 mb-3" />
              <p className="text-sm font-medium text-muted-foreground/50">Nenhum documento encontrado</p>
              <p className="text-xs text-muted-foreground/55 mt-1">Tente ajustar os filtros ou a busca</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedDoc && (
          <div className="hidden lg:block sticky top-4 self-start">
            <DocumentDetail doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      <p className="text-center text-[10px] text-muted-foreground/50 pb-4">
        {'Protótipo — Signature Command Center — dados fictícios'}
      </p>
    </div>
  );
}
