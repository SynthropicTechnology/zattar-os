'use client';

import { GlassPanel } from '@/components/shared/glass-panel';
import { cn } from '@/lib/utils';
import type { ComunicacaoCNJEnriquecida } from '@/app/(authenticated)/captura/comunica-cnj/domain';
import { useGazetteStore } from './hooks/use-gazette-store';

// ─── Tipo badge helpers ───────────────────────────────────────────────────────

type TipoComunicacao = 'intimacao' | 'despacho' | 'sentenca' | 'edital';

const TIPO_BADGE_CONFIG: Record<
  TipoComunicacao,
  { label: string; className: string }
> = {
  intimacao: {
    label: 'INTIMAÇÃO',
    className: 'bg-info/10 text-info',
  },
  despacho: {
    label: 'DESPACHO',
    className: 'bg-warning/10 text-warning',
  },
  sentenca: {
    label: 'SENTENÇA',
    className: 'bg-purple-500/10 text-purple-400',
  },
  edital: {
    label: 'EDITAL',
    className: 'bg-success/10 text-success',
  },
};

function normalizeTipo(tipo: string | null | undefined): TipoComunicacao | null {
  if (!tipo) return null;
  const lower = tipo.toLowerCase();
  if (lower.includes('intima')) return 'intimacao';
  if (lower.includes('despach')) return 'despacho';
  if (lower.includes('senten') || lower.includes('acórdão') || lower.includes('acordao')) return 'sentenca';
  if (lower.includes('edital')) return 'edital';
  return null;
}

function TipoBadge({ tipo }: { tipo: string | null | undefined }) {
  const key = normalizeTipo(tipo);
  const config = key ? TIPO_BADGE_CONFIG[key] : null;

  if (!config) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-muted/20 text-muted-foreground">
        {tipo ?? '—'}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

function FonteBadge({ sigla }: { sigla: string | null | undefined }) {
  if (!sigla) return null;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/6 text-primary/70 border border-primary/10">
      {sigla}
    </span>
  );
}

// ─── Status dot ──────────────────────────────────────────────────────────────

function StatusDot({
  status,
  temSugestaoAI,
}: {
  status: ComunicacaoCNJEnriquecida['statusVinculacao'];
  temSugestaoAI?: boolean;
}) {
  if (status === 'vinculado') {
    return <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" aria-label="Vinculado" />;
  }

  if (status === 'pendente') {
    return <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" aria-label="Pendente" />;
  }

  if (status === 'orfao') {
    return (
      <span className="flex items-center gap-1">
        <span
          className="w-1.5 h-1.5 rounded-full border border-warning bg-transparent shrink-0"
          aria-label="Órfão"
        />
        {temSugestaoAI && (
          <span className="text-[8px] px-1 bg-primary/10 text-primary rounded font-medium">
            IA
          </span>
        )}
      </span>
    );
  }

  return null;
}

// ─── Prazo chip ──────────────────────────────────────────────────────────────

function PrazoChip({ dias }: { dias: number | null }) {
  if (dias === null) return null;

  const isUrgent = dias <= 3;
  const isWarning = dias <= 7 && dias > 3;

  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
        isUrgent
          ? 'bg-destructive/10 text-destructive'
          : isWarning
            ? 'bg-warning/10 text-warning'
            : 'bg-muted/20 text-muted-foreground',
      )}
    >
      {dias === 0 ? 'Hoje' : dias < 0 ? `${Math.abs(dias)}d atrás` : `${dias}d`}
    </span>
  );
}

// ─── Card footer actions ──────────────────────────────────────────────────────

function FooterActions({
  isOrfao,
  onVincular,
}: {
  isOrfao: boolean;
  onVincular?: () => void;
}) {
  if (isOrfao) {
    return (
      <button
        className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded text-[10px] font-medium hover:bg-primary/20 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onVincular?.();
        }}
        type="button"
      >
        Vincular
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        className="px-2 py-0.5 border border-border rounded text-[10px] text-muted-foreground/40 hover:text-muted-foreground hover:border-border/60 transition-colors"
        onClick={(e) => e.stopPropagation()}
        type="button"
      >
        PDF
      </button>
      <button
        className="px-2 py-0.5 border border-border rounded text-[10px] text-muted-foreground/40 hover:text-muted-foreground hover:border-border/60 transition-colors"
        onClick={(e) => e.stopPropagation()}
        type="button"
      >
        Detalhes
      </button>
    </div>
  );
}

// ─── Individual card ─────────────────────────────────────────────────────────

function GazetteCard({ item }: { item: ComunicacaoCNJEnriquecida }) {
  const selecionarComunicacao = useGazetteStore((s) => s.selecionarComunicacao);
  const isOrfao = item.statusVinculacao === 'orfao';

  // Build meta line: "Autor vs. Réu · Órgão"
  const autorNome = item.partesAutor?.[0] ?? null;
  const reuNome = item.partesReu?.[0] ?? null;
  const partesMeta = [autorNome, reuNome].filter(Boolean).join(' vs. ');
  const orgao = item.nomeOrgao ?? null;
  const meta = [partesMeta, orgao].filter(Boolean).join(' · ');

  // Format date
  const dataFormatada = item.dataDisponibilizacao
    ? (() => {
        try {
          return new Date(item.dataDisponibilizacao).toLocaleDateString('pt-BR');
        } catch {
          return item.dataDisponibilizacao;
        }
      })()
    : '—';

  return (
    <div
      className="cursor-pointer rounded-2xl transition-all duration-200"
      onClick={() => selecionarComunicacao(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selecionarComunicacao(item);
        }
      }}
    >
      <GlassPanel
        depth={2}
        className={cn(
          'transition-all duration-200 p-0 overflow-hidden h-full',
          'hover:border-primary/20 hover:bg-primary/3',
          isOrfao && 'border-warning/15 bg-warning/2',
        )}
      >
        {/* Card body */}
        <div className="p-3 flex flex-col gap-2">

          {/* Header row: tipo badge + fonte badge + spacer + prazo + status dot */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <TipoBadge tipo={item.tipoComunicacao} />
            <FonteBadge sigla={item.siglaTribunal} />
            <div className="flex-1" />
            <PrazoChip dias={item.diasParaPrazo} />
            <StatusDot
              status={item.statusVinculacao}
              temSugestaoAI={!!item.matchSugestao}
            />
          </div>

          {/* Processo number */}
          <p
            className="text-[12px] font-bold tabular-nums text-foreground leading-tight truncate"
            title={item.numeroProcessoMascara ?? item.numeroProcesso}
          >
            {item.numeroProcessoMascara ?? item.numeroProcesso}
          </p>

          {/* Meta: partes + órgão */}
          {meta && (
            <p className="text-[11px] text-muted-foreground leading-tight truncate">
              {meta}
            </p>
          )}

          {/* Excerpt */}
          {item.texto && (
            <p className="text-[11px] text-muted-foreground/60 leading-snug line-clamp-2">
              &ldquo;{item.texto}&rdquo;
            </p>
          )}

          {/* Divider */}
          <div className="border-t border-border/20" />

          {/* Footer: date + actions */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {dataFormatada}
            </span>
            <FooterActions isOrfao={isOrfao} />
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

// ─── Grid ────────────────────────────────────────────────────────────────────

export function GazetteCardGrid() {
  const comunicacoes = useGazetteStore((s) => s.comunicacoes);

  if (comunicacoes.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center text-muted-foreground text-sm">
        Nenhuma publicação encontrada.
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {comunicacoes.map((item) => (
          <GazetteCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
