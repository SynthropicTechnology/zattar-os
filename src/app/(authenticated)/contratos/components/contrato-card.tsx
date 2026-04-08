'use client';

/**
 * ContratoCard — Card de vidro para um contrato individual.
 *
 * Usado em visualizações kanban e pipeline.
 * Exibe: avatar, nome, parte contrária, tipo, cobrança, processo vinculado,
 * data de cadastro, valor e dias no estágio.
 *
 * A linha colorida do estágio fica no topo do card, dentro do overflow-hidden
 * para não vazar fora do border-radius.
 */

import { Clock, Building2, Scale } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { fmtMoeda } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContratoCardData {
  id: number;
  cliente: string;
  clienteTipo: 'pf' | 'pj';
  parteContraria?: string;
  tipo: string;
  cobranca: string;
  segmento: string;
  status: string;
  valor: number;
  cadastradoEm: string;
  responsavel: string;
  diasNoEstagio: number;
  processosVinculados: number;
  /** Número do primeiro processo vinculado (se distribuído) */
  numeroProcesso?: string;
  /** Data de criação do contrato (createdAt) */
  criadoEm?: string;
  /** TRT do primeiro processo vinculado */
  trtProcesso?: string;
}

export interface ContratoCardProps {
  contrato: ContratoCardData;
  stageColor?: string;
  onClick?: (c: ContratoCardData) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(nome: string): string {
  return nome
    .split(' ')
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function fmtDataCurta(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch {
    return '—';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContratoCard({ contrato: c, stageColor, onClick }: ContratoCardProps) {
  const isStuck = c.diasNoEstagio > 30;

  return (
    <GlassPanel
      className={`cursor-pointer hover:bg-white/6 transition-all relative overflow-hidden ${isStuck ? 'ring-1 ring-warning/20' : ''}`}
    >
      {/* Stage color accent — top bar, clipped by overflow-hidden */}
      {stageColor && (
        <div
          className="h-0.5 opacity-40"
          style={{ backgroundColor: stageColor }}
        />
      )}

      {/* Clickable overlay */}
      <button
        type="button"
        className="absolute inset-0 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/30 outline-none"
        aria-label={`Ver contrato de ${c.cliente}`}
        onClick={() => onClick?.(c)}
      />

      <div className="p-3">
        <div className="flex items-start gap-2.5">
          {/* Avatar */}
          <IconContainer size="md" className="bg-primary/8">
            {c.clienteTipo === 'pj' ? (
              <Building2 className="size-3.5 text-primary/60" />
            ) : (
              <span className="text-[9px] font-bold text-primary/60">{getInitials(c.cliente)}</span>
            )}
          </IconContainer>

          <div className="flex-1 min-w-0">
            {/* Client name */}
            <p className="text-[11px] font-semibold truncate leading-tight">{c.cliente}</p>
            {c.parteContraria && (
              <p className="text-[9px] text-muted-foreground/55 truncate">vs. {c.parteContraria}</p>
            )}

            {/* Tags */}
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/6 text-primary/50">
                {c.tipo}
              </span>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-border/10 text-muted-foreground/60">
                {c.cobranca}
              </span>
              {c.processosVinculados > 0 && (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-info/6 text-info/50">
                  {c.processosVinculados} proc.
                </span>
              )}
            </div>

            {/* Processo vinculado (se distribuído) */}
            {c.numeroProcesso && (
              <div className="flex items-center gap-1 mt-1.5">
                <Scale className="size-2.5 text-muted-foreground/40" />
                <span className="text-[9px] text-muted-foreground/55 tabular-nums truncate">
                  {c.numeroProcesso}
                </span>
              </div>
            )}

            {/* Data de cadastro */}
            <div className="flex items-center gap-2 mt-1.5 text-[9px] text-muted-foreground/50">
              <span>Cadastro: {fmtDataCurta(c.cadastradoEm)}</span>
            </div>

            {/* Bottom: valor + dias */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] font-bold tabular-nums text-primary/70">
                {fmtMoeda(c.valor)}
              </span>
              <span
                className={`text-[9px] flex items-center gap-0.5 ${isStuck ? 'text-warning/60' : 'text-muted-foreground/55'
                  }`}
              >
                <Clock className="size-2.5" />
                {c.diasNoEstagio}d
              </span>
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
