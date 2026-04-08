'use client';

import * as React from 'react';
import {
  AlertTriangle,
  Clock,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  X,
  SearchX,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Heading } from '@/components/ui/typography';
import { UrgencyDot } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { GRAU_TRIBUNAL_LABELS, type Expediente, getExpedientePartyNames } from '../domain';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsuarioData {
  id: number;
  nomeExibicao?: string;
  nome_exibicao?: string;
  nomeCompleto?: string;
  nome?: string;
}

interface TipoExpedienteData {
  id: number;
  tipoExpediente?: string;
  tipo_expediente?: string;
}

export interface ExpedientesControlViewProps {
  expedientes: Expediente[];
  usuariosData: UsuarioData[];
  tiposExpedientesData: TipoExpedienteData[];
  onBaixar?: (expediente: Expediente) => void;
  onViewDetail?: (expediente: Expediente) => void;
}

type UrgencyLevel = 'critico' | 'alto' | 'medio' | 'baixo' | 'ok';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUsuarioNome(usuario: UsuarioData): string {
  return (
    usuario.nomeExibicao ||
    usuario.nome_exibicao ||
    usuario.nomeCompleto ||
    usuario.nome ||
    `Usuario ${usuario.id}`
  );
}

function normalizarData(dataISO: string | null | undefined): Date | null {
  if (!dataISO) return null;
  const data = new Date(dataISO);
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function calcularDiasRestantes(expediente: Expediente): number | null {
  const prazo = normalizarData(expediente.dataPrazoLegalParte);
  if (!prazo) return null;
  const hoje = new Date();
  const hojeZerado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((prazo.getTime() - hojeZerado.getTime()) / 86400000);
}

function formatarDataCurta(dataISO: string | null | undefined): string {
  if (!dataISO) return '—';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dataISO));
  } catch {
    return '—';
  }
}

function getExpedienteUrgencyLevel(
  expediente: Expediente,
  diasRestantes: number | null,
): UrgencyLevel {
  if (expediente.baixadoEm) return 'ok';
  if (expediente.prazoVencido || (diasRestantes !== null && diasRestantes < 0)) return 'critico';
  if (diasRestantes === 0) return 'alto';
  if (diasRestantes !== null && diasRestantes <= 3) return 'medio';
  return 'baixo';
}

function getDiasLabel(diasRestantes: number | null, prazoVencido: boolean): string {
  if (diasRestantes === null) return 'Sem prazo';
  if (prazoVencido || diasRestantes < 0) return `${Math.abs(diasRestantes)}d vencido`;
  if (diasRestantes === 0) return 'Vence hoje';
  if (diasRestantes === 1) return 'Vence amanhã';
  return `${diasRestantes}d restantes`;
}

const URGENCY_TEXT_CLASS: Record<UrgencyLevel, string> = {
  critico: 'text-destructive/80 font-semibold',
  alto: 'text-warning/80 font-semibold',
  medio: 'text-primary/70',
  baixo: 'text-muted-foreground/45',
  ok: 'text-success/60',
};

const URGENCY_BORDER: Record<UrgencyLevel, string> = {
  critico: 'border-l-[3px] border-l-destructive/70',
  alto: 'border-l-[3px] border-l-warning/70',
  medio: 'border-l-[3px] border-l-primary/50',
  baixo: 'border-l-[3px] border-l-border/30',
  ok: 'border-l-[3px] border-l-success/40',
};

// ─── InfoRow ─────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-[9px] text-muted-foreground/55 uppercase tracking-wider">{label}</span>
      <span className="text-right text-[11px] font-medium">{value}</span>
    </div>
  );
}

// ─── Inline Copy Button ─────────────────────────────────────────────────────

function InlineCopy({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }, [text]);

  const onKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
      e.preventDefault();
      handleCopy(e);
    }
  }, [handleCopy]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      onKeyDown={onKeyDown}
      title={copied ? 'Copiado!' : label}
      className="inline-flex items-center justify-center size-4 rounded hover:bg-muted/50 transition-colors shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 group-focus-within:opacity-100 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
    >
      {copied ? (
        <Check className="size-2.5 text-success" />
      ) : (
        <Copy className="size-2.5 text-muted-foreground/50" />
      )}
    </button>
  );
}

// ─── QueueCard ────────────────────────────────────────────────────────────────

function QueueCard({
  expediente,
  responsavelNome,
  tipoNome,
  selected,
  onSelect,
  onBaixar,
  onViewDetail,
}: {
  expediente: Expediente;
  responsavelNome: string | null;
  tipoNome: string | null;
  selected: boolean;
  onSelect: () => void;
  onBaixar?: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onViewDetail?: (e: React.MouseEvent | React.KeyboardEvent) => void;
}) {
  const diasRestantes = calcularDiasRestantes(expediente);
  const urgencyLevel = getExpedienteUrgencyLevel(expediente, diasRestantes);
  const diasLabel = getDiasLabel(diasRestantes, expediente.prazoVencido);
  const grauLabel = GRAU_TRIBUNAL_LABELS[expediente.grau] ?? expediente.grau;
  const partes = getExpedientePartyNames(expediente);

  return (
    <GlassPanel
      depth={1}
      className={cn(
        'group w-full cursor-pointer text-left transition-all duration-200 p-0',
        'border-border/40 hover:border-primary/30 hover:bg-accent/50 hover:shadow-md',
        URGENCY_BORDER[urgencyLevel],
        selected && 'border-primary/40 bg-primary/5 ring-1 ring-primary/20',
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
        className="p-4 focus:outline-none"
      >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <UrgencyDot level={urgencyLevel} />
          <span className="truncate text-sm font-semibold">
            {tipoNome || 'Sem tipo'}
          </span>
        </div>
        <span className={cn('shrink-0 text-[10px] tabular-nums', URGENCY_TEXT_CLASS[urgencyLevel])}>
          {diasLabel}
        </span>
      </div>

      {/* Identificação do Processo (Seção 2) */}
      <div className="mt-3 pt-3 border-t border-border/10">
        {/* Partes (autora vs ré) */}
        {(partes.autora || partes.re) && (
          <div className="flex items-center gap-1.5 min-w-0 mb-1.5 focus-within:ring-0">
            <p className="text-sm font-medium text-foreground truncate">
              <span>{partes.autora || '—'}</span>
              <span className="mx-1.5 font-normal text-muted-foreground/60">vs</span>
              <span>{partes.re || '—'}</span>
            </p>
            <InlineCopy 
              text={`${partes.autora || ''} vs ${partes.re || ''}`} 
              label="Copiar parte" 
            />
          </div>
        )}

        {/* Número do processo */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] text-muted-foreground/70 truncate">
            Nº {expediente.numeroProcesso}
          </span>
          <InlineCopy text={expediente.numeroProcesso || ''} label="Copiar número do processo" />
        </div>

        {/* Órgão jurisdicional */}
        {(expediente.descricaoOrgaoJulgador || expediente.siglaOrgaoJulgador) && (
          <p className="mt-0.5 text-[11px] text-muted-foreground/55">
            {expediente.descricaoOrgaoJulgador || expediente.siglaOrgaoJulgador}
          </p>
        )}
      </div>

      {/* Corpo: Resumo e Observações (Seção 3) */}
      {(expediente.descricaoArquivos || expediente.observacoes) && (
        <div className="mt-3 space-y-1.5">
          {expediente.descricaoArquivos && (
            <p className="text-[11px] leading-relaxed text-muted-foreground/70 whitespace-pre-wrap">
              {expediente.descricaoArquivos}
            </p>
          )}
          {expediente.observacoes && (
            <p className="text-[11px] leading-relaxed text-muted-foreground/55 whitespace-pre-wrap">
              {expediente.observacoes}
            </p>
          )}
        </div>
      )}

      {/* Badges + responsavel (Seção 4) */}
      <div className="mt-3 pt-3 border-t border-border/10 flex items-center gap-1.5">
        {expediente.trt && (
          <SemanticBadge
            category="tribunal"
            value={expediente.trt}
            className="px-1.5 text-[9px]"
          >
            {expediente.trt}
          </SemanticBadge>
        )}
        <SemanticBadge
          category="grau"
          value={expediente.grau}
          className="px-1.5 text-[9px]"
        >
          {grauLabel}
        </SemanticBadge>
        {responsavelNome && (
          <span className="ml-auto truncate text-[9px] text-muted-foreground/50">
            {responsavelNome}
          </span>
        )}
      </div>

      {/* Hover actions */}
      {(onBaixar || onViewDetail) && (
        <div className="mt-2.5 hidden items-center gap-1.5 group-hover:flex">
          {onBaixar && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onBaixar(e); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation(); e.preventDefault(); onBaixar(e);
                }
              }}
              className="flex h-6 items-center gap-1 rounded-md bg-primary/10 px-2 text-[10px] font-medium text-primary/80 transition-colors hover:bg-primary/20 cursor-pointer"
            >
              <CheckCircle2 className="size-3" />
              Concluir
            </button>
          )}
          {onViewDetail && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onViewDetail(e); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation(); e.preventDefault(); onViewDetail(e);
                }
              }}
              className="flex h-6 items-center gap-1 rounded-md border border-border/20 px-2 text-[10px] font-medium text-muted-foreground/60 transition-colors hover:border-border/40 hover:text-muted-foreground/80 cursor-pointer"
            >
              <ExternalLink className="size-3" />
              Detalhes
            </button>
          )}
        </div>
      )}
      </div>
    </GlassPanel>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
  count,
  accentClass,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  accentClass: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={cn('size-4', accentClass)} />
      <Heading level="subsection" as="h3" className="text-xs font-medium uppercase tracking-wider text-muted-foreground/50">
        {label}
      </Heading>
      <span className="text-[10px] tabular-nums text-muted-foreground/40">{count}</span>
    </div>
  );
}

// ─── DetailPanel ─────────────────────────────────────────────────────────────

function DetailPanel({
  expediente,
  tipoNome,
  responsavelNome,
  onClose,
  onBaixar,
  onViewDetail,
}: {
  expediente: Expediente;
  tipoNome: string | null;
  responsavelNome: string | null;
  onClose: () => void;
  onBaixar?: (expediente: Expediente) => void;
  onViewDetail?: (expediente: Expediente) => void;
}) {
  const grauLabel = GRAU_TRIBUNAL_LABELS[expediente.grau] ?? expediente.grau;

  return (
    <GlassPanel depth={2} className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Heading level="card" className="truncate text-sm">
            {tipoNome || 'Expediente'}
          </Heading>
          <p className="mt-0.5 tabular-nums text-[11px] text-muted-foreground/55">
            {expediente.numeroProcesso}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel de detalhes"
          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-foreground/4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5 text-muted-foreground/50" />
        </button>
      </div>

      {/* Info rows */}
      <div className="mt-4 space-y-3">
        {expediente.trt && (
          <InfoRow
            label="Tribunal"
            value={
              <SemanticBadge category="tribunal" value={expediente.trt}>
                {expediente.trt}
              </SemanticBadge>
            }
          />
        )}
        <InfoRow
          label="Grau"
          value={
            <SemanticBadge category="grau" value={expediente.grau}>
              {grauLabel}
            </SemanticBadge>
          }
        />
        <InfoRow
          label="Prazo"
          value={formatarDataCurta(expediente.dataPrazoLegalParte)}
        />
        {expediente.dataCienciaParte && (
          <InfoRow
            label="Ciência"
            value={formatarDataCurta(expediente.dataCienciaParte)}
          />
        )}
        <InfoRow
          label="Parte Autora"
          value={getExpedientePartyNames(expediente).autora || '—'}
        />
        <InfoRow
          label="Parte Ré"
          value={getExpedientePartyNames(expediente).re || '—'}
        />
        {responsavelNome && (
          <InfoRow label="Responsável" value={responsavelNome} />
        )}
        {expediente.descricaoOrgaoJulgador && (
          <InfoRow label="Órgão" value={expediente.descricaoOrgaoJulgador} />
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-2">
        {onBaixar && (
          <Button
            className="h-9 w-full gap-2 text-xs"
            onClick={() => onBaixar(expediente)}
          >
            <CheckCircle2 className="size-3.5" />
            Concluir expediente
          </Button>
        )}
        {onViewDetail && (
          <Button
            variant="outline"
            className="h-9 w-full gap-2 text-xs"
            onClick={() => onViewDetail(expediente)}
          >
            <ExternalLink className="size-3.5" />
            Ver detalhes completos
          </Button>
        )}
      </div>
    </GlassPanel>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ExpedientesControlView({
  expedientes,
  usuariosData,
  tiposExpedientesData,
  onBaixar,
  onViewDetail,
}: ExpedientesControlViewProps) {
  const [selected, setSelected] = React.useState<Expediente | null>(null);

  // Build lookup maps from props
  const usuariosMap = React.useMemo(() => {
    const map = new Map<number, string>();
    usuariosData.forEach((u) => map.set(u.id, getUsuarioNome(u)));
    return map;
  }, [usuariosData]);

  const tiposMap = React.useMemo(() => {
    const map = new Map<number, string>();
    tiposExpedientesData.forEach((t) => {
      const nome =
        t.tipoExpediente ||
        ('tipo_expediente' in t ? t.tipo_expediente : undefined) ||
        `Tipo ${t.id}`;
      map.set(t.id, nome as string);
    });
    return map;
  }, [tiposExpedientesData]);

  // Keep selected in sync when expedientes list changes
  React.useEffect(() => {
    if (!selected) return;
    const aindaExiste = expedientes.some((e) => e.id === selected.id);
    if (!aindaExiste) setSelected(null);
  }, [expedientes, selected]);

  // Group by urgency
  const { vencidos, hojeItems, proximosItems, noPrazoItems, semPrazoItems } =
    React.useMemo(() => {
      const vencidos: Expediente[] = [];
      const hojeItems: Expediente[] = [];
      const proximosItems: Expediente[] = [];
      const noPrazoItems: Expediente[] = [];
      const semPrazoItems: Expediente[] = [];

      for (const exp of expedientes) {
        const diasRestantes = calcularDiasRestantes(exp);

        if (diasRestantes === null) {
          semPrazoItems.push(exp);
        } else if (exp.prazoVencido || diasRestantes < 0) {
          vencidos.push(exp);
        } else if (diasRestantes === 0) {
          hojeItems.push(exp);
        } else if (diasRestantes <= 3) {
          proximosItems.push(exp);
        } else {
          noPrazoItems.push(exp);
        }
      }

      // Sort each group by dias restantes ascending (vencidos: mais antigos primeiro)
      const sortByDias = (a: Expediente, b: Expediente) => {
        const aDias = calcularDiasRestantes(a);
        const bDias = calcularDiasRestantes(b);
        if (aDias === null && bDias !== null) return 1;
        if (aDias !== null && bDias === null) return -1;
        if (aDias !== null && bDias !== null) return aDias - bDias;
        return (a.numeroProcesso || '').localeCompare(b.numeroProcesso || '');
      };

      vencidos.sort(sortByDias);
      hojeItems.sort(sortByDias);
      proximosItems.sort(sortByDias);
      noPrazoItems.sort(sortByDias);

      return { vencidos, hojeItems, proximosItems, noPrazoItems, semPrazoItems };
    }, [expedientes]);

  const sections = React.useMemo(
    () =>
      [
        {
          key: 'vencidos',
          label: 'Vencidos',
          icon: AlertTriangle,
          items: vencidos,
          accentClass: 'text-destructive',
        },
        {
          key: 'hoje',
          label: 'Vence hoje',
          icon: Clock,
          items: hojeItems,
          accentClass: 'text-warning',
        },
        {
          key: 'proximos',
          label: 'Próximos 3 dias',
          icon: CalendarClock,
          items: proximosItems,
          accentClass: 'text-primary',
        },
        {
          key: 'prazo',
          label: 'No prazo',
          icon: CheckCircle2,
          items: noPrazoItems,
          accentClass: 'text-muted-foreground/60',
        },
        {
          key: 'semPrazo',
          label: 'Sem prazo definido',
          icon: CircleDashed,
          items: semPrazoItems,
          accentClass: 'text-muted-foreground/40',
        },
      ].filter((s) => s.items.length > 0),
    [vencidos, hojeItems, proximosItems, noPrazoItems, semPrazoItems],
  );

  // Empty state
  if (expedientes.length === 0) {
    return (
      <GlassPanel depth={1} className="flex min-h-52 flex-col items-center justify-center p-8 text-center">
        <SearchX className="size-8 text-muted-foreground/20" />
        <Heading level="card" className="mt-4 text-sm text-muted-foreground/50">
          Nenhum expediente encontrado
        </Heading>
        <p className="mt-1.5 max-w-sm text-xs text-muted-foreground/30">
          Ajuste os filtros ou a busca para ampliar o recorte operacional.
        </p>
      </GlassPanel>
    );
  }

  const selectedTipoNome = selected?.tipoExpedienteId
    ? (tiposMap.get(selected.tipoExpedienteId) ?? null)
    : null;
  const selectedResponsavelNome = selected?.responsavelId
    ? (usuariosMap.get(selected.responsavelId) ?? null)
    : null;

  const mainContent = (
    <div className="space-y-6">
      {sections.map(({ key, label, icon, items, accentClass }) => (
        <section key={key}>
          <SectionHeader
            icon={icon}
            label={label}
            count={items.length}
            accentClass={accentClass}
          />
          <div className={cn(
            'grid gap-2.5',
            selected
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          )}>
            {items.map((exp) => {
              const tipoNome = exp.tipoExpedienteId
                ? (tiposMap.get(exp.tipoExpedienteId) ?? null)
                : null;
              const responsavelNome = exp.responsavelId
                ? (usuariosMap.get(exp.responsavelId) ?? null)
                : null;

              return (
                <QueueCard
                  key={exp.id}
                  expediente={exp}
                  tipoNome={tipoNome}
                  responsavelNome={responsavelNome}
                  selected={selected?.id === exp.id}
                  onSelect={() =>
                    setSelected((prev) => (prev?.id === exp.id ? null : exp))
                  }
                  onBaixar={
                    onBaixar
                      ? (e) => {
                          e.stopPropagation();
                          onBaixar(exp);
                        }
                      : undefined
                  }
                  onViewDetail={
                    onViewDetail
                      ? (e) => {
                          e.stopPropagation();
                          onViewDetail(exp);
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );

  if (!selected) {
    return mainContent;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      {/* Main queue */}
      <div className="min-w-0">{mainContent}</div>

      {/* Detail panel — desktop only, mobile falls back to hover actions on card */}
      <div className="hidden lg:block">
        <div className="sticky top-4 self-start">
          <DetailPanel
            expediente={selected}
            tipoNome={selectedTipoNome}
            responsavelNome={selectedResponsavelNome}
            onClose={() => setSelected(null)}
            onBaixar={onBaixar}
            onViewDetail={onViewDetail}
          />
        </div>
      </div>
    </div>
  );
}
