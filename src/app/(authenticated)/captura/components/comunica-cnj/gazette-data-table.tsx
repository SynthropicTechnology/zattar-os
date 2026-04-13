'use client';

import { cn } from '@/lib/utils';
import { useGazetteStore } from './hooks/use-gazette-store';
import type { ComunicacaoCNJEnriquecida } from '@/app/(authenticated)/captura/comunica-cnj/domain';

// ─── Badge Maps ────────────────────────────────────────────────────────────────

const TIPO_BADGE_MAP: Record<string, { label: string; className: string }> = {
  intimacao: { label: 'INT', className: 'bg-info/10 text-info' },
  intimação: { label: 'INT', className: 'bg-info/10 text-info' },
  despacho: { label: 'DES', className: 'bg-warning/10 text-warning' },
  sentenca: { label: 'SEN', className: 'bg-purple-500/10 text-purple-400' },
  sentença: { label: 'SEN', className: 'bg-purple-500/10 text-purple-400' },
  edital: { label: 'EDIT', className: 'bg-success/10 text-success' },
  certidao: { label: 'CERT', className: 'bg-muted/30 text-muted-foreground' },
  certidão: { label: 'CERT', className: 'bg-muted/30 text-muted-foreground' },
};

function getTipoBadge(tipo: string | null): { label: string; className: string } {
  if (!tipo) return { label: '—', className: 'bg-muted/30 text-muted-foreground' };
  const key = tipo.toLowerCase();
  return (
    TIPO_BADGE_MAP[key] ?? { label: tipo.slice(0, 4).toUpperCase(), className: 'bg-muted/30 text-muted-foreground' }
  );
}

// ─── Density Padding Map ───────────────────────────────────────────────────────

const DENSITY_TD_CLASS: Record<string, string> = {
  compacto: 'py-1.5',
  padrao: 'py-2.5',
  confortavel: 'py-3',
};

// ─── Prazo Badge ──────────────────────────────────────────────────────────────

function PrazoBadge({ dias }: { dias: number | null }) {
  if (dias === null) {
    return <span className="text-muted-foreground/20 text-[11px]">—</span>;
  }

  const className =
    dias < 3
      ? 'bg-destructive/10 text-destructive'
      : dias < 7
        ? 'bg-warning/10 text-warning'
        : 'bg-success/10 text-success';

  const label = dias < 0 ? `${Math.abs(dias)}d atrás` : `${dias}d`;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
        className,
      )}
    >
      {label}
    </span>
  );
}

// ─── Status Dot ───────────────────────────────────────────────────────────────

function StatusCell({ item }: { item: ComunicacaoCNJEnriquecida }) {
  const { statusVinculacao, matchSugestao } = item;

  if (statusVinculacao === 'vinculado') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-success shrink-0" aria-hidden />
        <span className="text-[11px] text-success">Vinculado</span>
      </div>
    );
  }

  if (statusVinculacao === 'pendente') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-warning shrink-0" aria-hidden />
        <span className="text-[11px] text-warning">Pendente</span>
      </div>
    );
  }

  if (statusVinculacao === 'orfao') {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className="size-2 rounded-full border-2 border-warning shrink-0"
          aria-hidden
        />
        <span className="text-[11px] text-warning">Órfão</span>
        {matchSugestao && (
          <span className="inline-flex items-center rounded px-1 py-0.5 text-[9px] font-semibold bg-info/10 text-info uppercase tracking-wide">
            AI
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="size-2 rounded-full bg-muted-foreground/30 shrink-0" aria-hidden />
      <span className="text-[11px] text-muted-foreground">—</span>
    </div>
  );
}

// ─── Pagination Footer ────────────────────────────────────────────────────────

interface PaginationFooterProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function PaginationFooter({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationFooterProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 text-[11px] text-muted-foreground shrink-0">
      {/* Left: range info */}
      <span>
        {total > 0 ? `${start}–${end} de ${total}` : '0 resultados'}
      </span>

      {/* Center: page buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={cn(
            'px-2 py-1 rounded border border-border/50 transition-colors',
            page <= 1
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-muted/30 cursor-pointer',
          )}
        >
          ‹
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const pageNum = i + 1;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                'w-7 h-7 rounded border transition-colors',
                page === pageNum
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border/50 hover:bg-muted/30 cursor-pointer',
              )}
            >
              {pageNum}
            </button>
          );
        })}
        {totalPages > 5 && (
          <span className="px-1 text-muted-foreground/50">…</span>
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            'px-2 py-1 rounded border border-border/50 transition-colors',
            page >= totalPages
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-muted/30 cursor-pointer',
          )}
        >
          ›
        </button>
      </div>

      {/* Right: page size selector */}
      <div className="flex items-center gap-1.5">
        <span>Por página</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded border border-border/50 bg-background px-1.5 py-0.5 text-[11px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          {[25, 50, 100].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── GazetteDataTable ─────────────────────────────────────────────────────────

export interface GazetteDataTableProps {
  /** Total items for pagination (defaults to comunicacoes.length) */
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function GazetteDataTable({
  total,
  page = 1,
  pageSize = 50,
  onPageChange,
  onPageSizeChange,
}: GazetteDataTableProps) {
  const { comunicacoes, comunicacaoSelecionada, selecionarComunicacao, densidade } =
    useGazetteStore();

  const tdPy = DENSITY_TD_CLASS[densidade] ?? 'py-2.5';
  const effectiveTotal = total ?? comunicacoes.length;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Scrollable table area */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full border-collapse text-left">
          {/* ── Header ── */}
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="border-b border-border/60">
              {/* Tipo */}
              <th
                scope="col"
                style={{ width: 72, minWidth: 72 }}
                className="px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/25"
              >
                Tipo
              </th>
              {/* Processo / Partes */}
              <th
                scope="col"
                className="px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/25"
              >
                Processo / Partes
              </th>
              {/* Órgão */}
              <th
                scope="col"
                style={{ width: 160, minWidth: 120 }}
                className="px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/25"
              >
                Órgão
              </th>
              {/* Fonte */}
              <th
                scope="col"
                style={{ width: 80, minWidth: 80 }}
                className="px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/25"
              >
                Fonte
              </th>
              {/* Data */}
              <th
                scope="col"
                style={{ width: 70, minWidth: 70 }}
                className="px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/25"
              >
                Data
              </th>
              {/* Prazo */}
              <th
                scope="col"
                style={{ width: 80, minWidth: 80 }}
                className="px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/25"
              >
                Prazo
              </th>
              {/* Status */}
              <th
                scope="col"
                style={{ width: 100, minWidth: 100 }}
                className="px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/25"
              >
                Status
              </th>
              {/* Actions */}
              <th
                scope="col"
                style={{ width: 40, minWidth: 40 }}
                className="px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/25"
              >
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {comunicacoes.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-10 text-center text-[13px] text-muted-foreground"
                >
                  Nenhuma comunicação encontrada
                </td>
              </tr>
            )}

            {comunicacoes.map((item) => {
              const isSelected = comunicacaoSelecionada?.id === item.id;
              const tipoBadge = getTipoBadge(item.tipoComunicacao);

              // Partes string
              const partesAutor = item.partesAutor?.join(', ') ?? '';
              const partesReu = item.partesReu?.join(', ') ?? '';
              const partesLabel = [partesAutor, partesReu].filter(Boolean).join(' • ');

              return (
                <tr
                  key={item.id}
                  onClick={() => selecionarComunicacao(item)}
                  className={cn(
                    'cursor-pointer border-b border-border/30 transition-colors duration-100',
                    'hover:bg-muted/30',
                    isSelected && 'bg-primary/[0.04] border-l-2 border-l-primary',
                  )}
                >
                  {/* Tipo */}
                  <td className={cn('px-3', tdPy)} style={{ width: 72 }}>
                    <span
                      className={cn(
                        'inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium',
                        tipoBadge.className,
                      )}
                    >
                      {tipoBadge.label}
                    </span>
                  </td>

                  {/* Processo / Partes */}
                  <td className={cn('px-3', tdPy)}>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[13px] font-medium tabular-nums truncate text-foreground">
                        {item.numeroProcessoMascara ?? item.numeroProcesso}
                      </span>
                      {partesLabel && (
                        <span className="text-[11px] text-muted-foreground/40 truncate">
                          {partesLabel}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Órgão */}
                  <td className={cn('px-3', tdPy)} style={{ width: 160 }}>
                    <span className="text-[11px] text-muted-foreground truncate block max-w-[160px]">
                      {item.nomeOrgao ?? item.siglaTribunal ?? '—'}
                    </span>
                  </td>

                  {/* Fonte */}
                  <td className={cn('px-3', tdPy)} style={{ width: 80 }}>
                    <span className="inline-flex items-center rounded border border-border px-1.5 py-0.5 text-[10px] bg-muted/30 text-muted-foreground">
                      {item.siglaTribunal ?? '—'}
                    </span>
                  </td>

                  {/* Data */}
                  <td className={cn('px-3', tdPy)} style={{ width: 70 }}>
                    <span className="text-[11px] tabular-nums text-muted-foreground whitespace-nowrap">
                      {item.dataDisponibilizacao
                        ? new Date(item.dataDisponibilizacao).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          })
                        : '—'}
                    </span>
                  </td>

                  {/* Prazo */}
                  <td className={cn('px-3', tdPy)} style={{ width: 80 }}>
                    <PrazoBadge dias={item.diasParaPrazo} />
                  </td>

                  {/* Status */}
                  <td className={cn('px-3', tdPy)} style={{ width: 100 }}>
                    <StatusCell item={item} />
                  </td>

                  {/* Actions */}
                  <td className={cn('px-3', tdPy)} style={{ width: 40 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selecionarComunicacao(item);
                      }}
                      className="flex items-center justify-center w-7 h-7 rounded hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      aria-label="Mais opções"
                    >
                      ⋯
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination Footer ── */}
      {(onPageChange || onPageSizeChange) && (
        <PaginationFooter
          total={effectiveTotal}
          page={page}
          pageSize={pageSize}
          onPageChange={onPageChange ?? (() => {})}
          onPageSizeChange={onPageSizeChange ?? (() => {})}
        />
      )}
    </div>
  );
}
