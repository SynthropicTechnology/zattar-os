/**
 * EntityCard — Cartão visual de entidade jurídica (parte, cliente, representante, etc.)
 * ============================================================================
 * Exibe avatar, nome, tipo, contato, métricas de processos e tags.
 * Segue a estética "Glass Briefing" — vidro, compacto, identidade visual por tipo.
 *
 * USO:
 *   <EntityCard data={entityData} onClick={(d) => setSelected(d)} />
 * ============================================================================
 */

'use client';

import { Building2, Mail, Phone, MapPin, Scale, Clock } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { GlassPanel } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EntityCardConfig {
  label: string;
  icon: LucideIcon;
  color: string;  // e.g. 'text-primary/70'
  bg: string;     // e.g. 'bg-primary/8'
}

export interface EntityCardData {
  id: number | string;
  nome: string;
  nomeSocial?: string;
  tipo: 'pf' | 'pj';
  config: EntityCardConfig;
  documentoMasked: string;
  email?: string;
  telefone?: string;
  localizacao: string;  // "São Paulo, SP"
  ativo: boolean;
  metricas: { label: string; ativos: number; total: number };
  ultimaAtualizacao: string;  // ISO date
  tags?: string[];
}

interface EntityCardProps {
  data: EntityCardData;
  onClick?: (data: EntityCardData) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getInitials(nome: string): string {
  return nome
    .split(' ')
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 7) return `${days}d atrás`;
  if (days < 30) return `${Math.floor(days / 7)}sem atrás`;
  return `${Math.floor(days / 30)}m atrás`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EntityCard({ data, onClick }: EntityCardProps) {
  const { config } = data;

  return (
    <GlassPanel className="p-4 hover:scale-[1.01] cursor-pointer group">
      <div onClick={() => onClick?.(data)}>
        {/* Header: Avatar + Nome + Badge tipo */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`size-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
            {data.tipo === 'pj' ? (
              <Building2 className={`size-4 ${config.color}`} />
            ) : (
              <span className={`text-xs font-bold ${config.color}`}>{getInitials(data.nome)}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold truncate">{data.nome}</h3>
              {!data.ativo && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground/50">
                  Inativo
                </span>
              )}
            </div>
            {data.nomeSocial && (
              <p className="text-[10px] text-muted-foreground/60 truncate">{data.nomeSocial}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                {config.label}
              </span>
              <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                {data.documentoMasked}
              </span>
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[10px] text-muted-foreground/50">
          {data.email && (
            <span className="flex items-center gap-1 truncate max-w-45">
              <Mail className="size-2.5 shrink-0" />
              {data.email}
            </span>
          )}
          {data.telefone && (
            <span className="flex items-center gap-1">
              <Phone className="size-2.5 shrink-0" />
              {data.telefone}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="size-2.5 shrink-0" />
            {data.localizacao}
          </span>
        </div>

        {/* Rodapé: Métricas + atualização */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/10">
          <div className="flex items-center gap-1.5">
            <Scale className="size-3 text-muted-foreground/55" />
            <span className="text-[10px] font-medium">
              {data.metricas.ativos}
              <span className="text-muted-foreground/55"> / {data.metricas.total} {data.metricas.label}</span>
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground/55 flex items-center gap-1">
            <Clock className="size-2.5" />
            {timeAgo(data.ultimaAtualizacao)}
          </span>
        </div>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex gap-1 mt-2">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/50"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
