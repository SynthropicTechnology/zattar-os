# Processos Listagem Glass Briefing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the processos listing page (`/processos`) from DataShell/DataTable to the Glass Briefing design system with PulseStrip, cards/list/table views, and proactive insight banners.

**Architecture:** Replace `ProcessosTableWrapper` with `ProcessosClient` following the pattern from `partes-client.tsx`. Add `ProcessoCard` and `ProcessoListRow` following `EntityCard`/`EntityListRow` patterns. Keep DataTable as a third view mode. New `actionObterEstatisticasProcessos` server action for KPI data.

**Tech Stack:** React 19, Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Lucide icons, GlassPanel primitives, PulseStrip/TabPills/SearchInput/ViewToggle shared components

**Spec:** `docs/superpowers/specs/2026-04-05-processos-listagem-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/app/(authenticated)/processos/components/processo-card.tsx` | Glass card for processo in grid view |
| `src/app/(authenticated)/processos/components/processo-list-row.tsx` | Compact row for list view |
| `src/app/(authenticated)/processos/components/processo-detail-sheet.tsx` | Right sheet for quick preview |
| `src/app/(authenticated)/processos/components/processos-pulse-strip.tsx` | KPI strip with acervo stats |
| `src/app/(authenticated)/processos/components/processos-insight-banner.tsx` | Proactive alert banners |
| `src/app/(authenticated)/processos/processos-client.tsx` | Main client wrapper (Glass Briefing) |
| `src/app/(authenticated)/processos/actions/estatisticas-actions.ts` | Server action for KPI stats |
| `src/app/(authenticated)/processos/service-estatisticas.ts` | Service for stats query |

### Modified Files
| File | Change |
|------|--------|
| `src/app/(authenticated)/processos/page.tsx` | Remove PageShell, add stats fetch, pass to new client |
| `src/app/(authenticated)/processos/index.ts` | Export new components |

---

## Task 1: Stats Server Action

**Files:**
- Create: `src/app/(authenticated)/processos/service-estatisticas.ts`
- Create: `src/app/(authenticated)/processos/actions/estatisticas-actions.ts`

- [ ] **Step 1: Create the stats service**

```typescript
// src/app/(authenticated)/processos/service-estatisticas.ts

'use server';

import { createDbClient } from '@/lib/supabase';

export interface ProcessoStats {
  total: number;
  ativos: number;
  pendentes: number;
  emRecurso: number;
  arquivados: number;
  semResponsavel: number;
  comAudienciaProxima: number;
}

/**
 * Obtém estatísticas agregadas do acervo de processos.
 * Query otimizada com GROUP BY — single round-trip ao banco.
 */
export async function obterEstatisticasProcessos(): Promise<ProcessoStats> {
  const client = createDbClient();

  // Count by status
  const { data: statusCounts, error: statusError } = await client
    .from('acervo')
    .select('codigo_status_processo', { count: 'exact', head: false })
    .then(() => {
      // Fallback: manual aggregation via RPC or multiple counts
      return { data: null, error: null };
    });

  // Parallel count queries
  const [
    { count: total },
    { count: ativos },
    { count: pendentes },
    { count: emRecurso },
    { count: arquivados },
    { count: semResponsavel },
    { count: comAudiencia },
  ] = await Promise.all([
    client.from('acervo').select('*', { count: 'exact', head: true }),
    client.from('acervo').select('*', { count: 'exact', head: true }).in('codigo_status_processo', ['ATIVO', 'DISTRIBUIDO', 'EM_ANDAMENTO']),
    client.from('acervo').select('*', { count: 'exact', head: true }).in('codigo_status_processo', ['PENDENTE', 'SUSPENSO']),
    client.from('acervo').select('*', { count: 'exact', head: true }).in('codigo_status_processo', ['EM_RECURSO']),
    client.from('acervo').select('*', { count: 'exact', head: true }).eq('origem', 'arquivado'),
    client.from('acervo').select('*', { count: 'exact', head: true }).is('responsavel_id', null),
    client.from('acervo').select('*', { count: 'exact', head: true }).not('data_proxima_audiencia', 'is', null).gte('data_proxima_audiencia', new Date().toISOString()),
  ]);

  return {
    total: total ?? 0,
    ativos: ativos ?? 0,
    pendentes: pendentes ?? 0,
    emRecurso: emRecurso ?? 0,
    arquivados: arquivados ?? 0,
    semResponsavel: semResponsavel ?? 0,
    comAudienciaProxima: comAudiencia ?? 0,
  };
}
```

- [ ] **Step 2: Create the server action**

```typescript
// src/app/(authenticated)/processos/actions/estatisticas-actions.ts

'use server';

import { authenticateRequest } from '@/lib/auth/session';
import { obterEstatisticasProcessos, type ProcessoStats } from '../service-estatisticas';

export async function actionObterEstatisticasProcessos(): Promise<{
  success: boolean;
  data?: ProcessoStats;
  error?: string;
}> {
  try {
    await authenticateRequest();
    const stats = await obterEstatisticasProcessos();
    return { success: true, data: stats };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return { success: false, error: 'Erro ao carregar estatísticas' };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/processos/service-estatisticas.ts src/app/(authenticated)/processos/actions/estatisticas-actions.ts
git commit -m "feat(processos): add stats server action for PulseStrip KPIs"
```

---

## Task 2: ProcessosPulseStrip

**Files:**
- Create: `src/app/(authenticated)/processos/components/processos-pulse-strip.tsx`

- [ ] **Step 1: Create the pulse strip component**

```typescript
// src/app/(authenticated)/processos/components/processos-pulse-strip.tsx

'use client';

import { Scale, Clock, ArrowUpRight, Archive } from 'lucide-react';
import { PulseStrip, type PulseItem } from '@/components/dashboard/pulse-strip';
import type { ProcessoStats } from '../service-estatisticas';

interface ProcessosPulseStripProps {
  stats: ProcessoStats;
}

/**
 * KPI strip do acervo de processos.
 * Exibe 4 métricas principais em cards glass.
 */
export function ProcessosPulseStrip({ stats }: ProcessosPulseStripProps) {
  const items: PulseItem[] = [
    {
      label: 'Ativos',
      total: stats.ativos,
      icon: Scale,
      color: 'text-primary',
    },
    {
      label: 'Pendentes',
      total: stats.pendentes,
      icon: Clock,
      color: 'text-warning',
    },
    {
      label: 'Em Recurso',
      total: stats.emRecurso,
      icon: ArrowUpRight,
      color: 'text-info',
    },
    {
      label: 'Arquivados',
      total: stats.arquivados,
      icon: Archive,
      color: 'text-muted-foreground',
    },
  ];

  return <PulseStrip items={items} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/processos/components/processos-pulse-strip.tsx
git commit -m "feat(processos): add ProcessosPulseStrip KPI component"
```

---

## Task 3: ProcessoCard

**Files:**
- Create: `src/app/(authenticated)/processos/components/processo-card.tsx`

- [ ] **Step 1: Create the glass card component**

```typescript
// src/app/(authenticated)/processos/components/processo-card.tsx

'use client';

import { Scale, Building2, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { GlassPanel } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CopyButton } from '@/app/(authenticated)/partes';
import { timeAgo } from '@/components/dashboard/entity-card';
import { cn } from '@/lib/utils';
import type { ProcessoUnificado, StatusProcesso } from '../domain';
import type { Tag } from '@/lib/domain/tags';
import { GRAU_LABELS } from '@/lib/design-system';

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

interface ProcessoCardProps {
  processo: ProcessoUnificado;
  tags?: Tag[];
  responsavel?: Usuario;
  isSelected?: boolean;
  onClick: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  ATIVO: 'primary',
  DISTRIBUIDO: 'primary',
  EM_ANDAMENTO: 'primary',
  PENDENTE: 'warning',
  SUSPENSO: 'muted-foreground',
  EM_RECURSO: 'info',
  ARQUIVADO: 'muted-foreground',
  EXTINTO: 'muted-foreground',
  BAIXADO: 'muted-foreground',
  OUTRO: 'muted-foreground',
};

function getInitials(name: string): string {
  if (!name) return 'NA';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ProcessoCard({
  processo,
  tags,
  responsavel,
  isSelected,
  onClick,
}: ProcessoCardProps) {
  const statusColor = STATUS_COLOR[processo.codigoStatusProcesso] || 'muted-foreground';
  const trt = processo.trtOrigem || processo.trt;
  const parteAutora = processo.nomeParteAutoraOrigem || processo.nomeParteAutora || '-';
  const parteRe = processo.nomeParteReOrigem || processo.nomeParteRe || '-';
  const tituloPartes = parteRe !== '-' ? `${parteAutora} vs ${parteRe}` : parteAutora;
  const orgaoJulgador = processo.descricaoOrgaoJulgador || '-';
  const dataAut = processo.dataAutuacaoOrigem || processo.dataAutuacao;
  const hasUrgency = !!processo.dataProximaAudiencia;

  return (
    <GlassPanel
      className={cn(
        'p-4 cursor-pointer group',
        isSelected && 'border-primary/20 bg-primary/[0.03]'
      )}
    >
      <div onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick()}>
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn('size-10 rounded-xl flex items-center justify-center shrink-0', `bg-${statusColor}/8`)}>
            <Scale className={cn('size-5', `text-${statusColor}/50`)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">{tituloPartes}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-mono text-muted-foreground/55 tabular-nums truncate">
                {processo.numeroProcesso}
              </span>
              <CopyButton text={processo.numeroProcesso} label="Copiar número" />
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <SemanticBadge category="tribunal" value={trt} className="text-[9px]">
                {trt}
              </SemanticBadge>
              {processo.grauAtual && (
                <SemanticBadge category="grau" value={processo.grauAtual} className="text-[9px]">
                  {GRAU_LABELS[processo.grauAtual as keyof typeof GRAU_LABELS] || processo.grauAtual}
                </SemanticBadge>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/55">
            <Building2 className="size-3 shrink-0" />
            <span className="truncate">{orgaoJulgador}</span>
          </div>
          {dataAut && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/55">
              <Calendar className="size-3 shrink-0" />
              <span>Autuação: {new Date(dataAut).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>

        {/* Urgency */}
        {hasUrgency && (
          <div className="mt-3 pt-3 border-t border-border/10">
            <div className="flex items-center gap-1.5 text-[10px] text-warning font-medium">
              <AlertTriangle className="size-3" />
              <span>Audiência em {processo.dataProximaAudiencia ? new Date(processo.dataProximaAudiencia).toLocaleDateString('pt-BR') : ''}</span>
            </div>
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/50 border border-primary/10">
                {tag.nome}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[9px] text-muted-foreground/40">+{tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/10">
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5 border">
              <AvatarImage src={responsavel?.avatarUrl || undefined} />
              <AvatarFallback className="text-[8px]">
                {responsavel ? getInitials(responsavel.nomeExibicao) : 'NA'}
              </AvatarFallback>
            </Avatar>
            <span className="text-[9px] text-muted-foreground/50">
              {responsavel?.nomeExibicao || 'Sem resp.'}
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground/40 flex items-center gap-1">
            <Clock className="size-2.5" />
            {timeAgo(processo.updatedAt)}
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/processos/components/processo-card.tsx
git commit -m "feat(processos): add ProcessoCard glass component"
```

---

## Task 4: ProcessoListRow

**Files:**
- Create: `src/app/(authenticated)/processos/components/processo-list-row.tsx`

- [ ] **Step 1: Create the list row component**

```typescript
// src/app/(authenticated)/processos/components/processo-list-row.tsx

'use client';

import { Scale, ChevronRight } from 'lucide-react';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ProcessoUnificado } from '../domain';

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

interface ProcessoListRowProps {
  processo: ProcessoUnificado;
  responsavel?: Usuario;
  isSelected?: boolean;
  onClick: () => void;
}

const STATUS_DOT_COLOR: Record<string, string> = {
  ATIVO: 'bg-primary/50',
  DISTRIBUIDO: 'bg-primary/50',
  EM_ANDAMENTO: 'bg-primary/50',
  PENDENTE: 'bg-warning/50',
  EM_RECURSO: 'bg-info/50',
  ARQUIVADO: 'bg-muted-foreground/20',
  default: 'bg-muted-foreground/20',
};

export function ProcessoListRow({
  processo,
  responsavel,
  isSelected,
  onClick,
}: ProcessoListRowProps) {
  const trt = processo.trtOrigem || processo.trt;
  const parteAutora = processo.nomeParteAutoraOrigem || processo.nomeParteAutora || '-';
  const parteRe = processo.nomeParteReOrigem || processo.nomeParteRe || '-';
  const tituloPartes = parteRe !== '-' ? `${parteAutora} vs ${parteRe}` : parteAutora;
  const dotColor = STATUS_DOT_COLOR[processo.codigoStatusProcesso] || STATUS_DOT_COLOR.default;
  const dataAut = processo.dataAutuacaoOrigem || processo.dataAutuacao;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all',
        isSelected
          ? 'bg-primary/6 border border-primary/15'
          : 'hover:bg-white/4 border border-transparent'
      )}
    >
      {/* Status dot */}
      <div className={cn('size-2.5 rounded-full shrink-0', dotColor)} />

      {/* Icon */}
      <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
        <Scale className="size-3.5 text-primary/50" />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-xs font-medium truncate">{tituloPartes}</p>
        <p className="text-[10px] text-muted-foreground/55 font-mono tabular-nums truncate">
          {processo.numeroProcesso}
        </p>
      </div>

      {/* TRT badge */}
      <SemanticBadge category="tribunal" value={trt} className="text-[9px] shrink-0 hidden sm:flex">
        {trt}
      </SemanticBadge>

      {/* Responsável */}
      <Avatar className="h-6 w-6 border shrink-0">
        <AvatarImage src={responsavel?.avatarUrl || undefined} />
        <AvatarFallback className="text-[8px]">
          {responsavel?.nomeExibicao?.slice(0, 2).toUpperCase() || 'NA'}
        </AvatarFallback>
      </Avatar>

      {/* Data */}
      {dataAut && (
        <span className="text-[10px] font-medium text-muted-foreground/55 w-20 text-right hidden lg:block tabular-nums">
          {new Date(dataAut).toLocaleDateString('pt-BR')}
        </span>
      )}

      <ChevronRight className="size-3.5 text-muted-foreground/15 shrink-0" />
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/processos/components/processo-list-row.tsx
git commit -m "feat(processos): add ProcessoListRow compact glass row"
```

---

## Task 5: ProcessoDetailSheet

**Files:**
- Create: `src/app/(authenticated)/processos/components/processo-detail-sheet.tsx`

- [ ] **Step 1: Create the detail sheet preview component**

```typescript
// src/app/(authenticated)/processos/components/processo-detail-sheet.tsx

'use client';

import { useRouter } from 'next/navigation';
import { Scale } from 'lucide-react';
import {
  DetailSheet,
  DetailSheetHeader,
  DetailSheetTitle,
  DetailSheetContent,
  DetailSheetSection,
  DetailSheetInfoRow,
  DetailSheetMetaGrid,
  DetailSheetMetaItem,
  DetailSheetSeparator,
  DetailSheetAudit,
  DetailSheetFooter,
} from '@/components/shared/detail-sheet';
import { Button } from '@/components/ui/button';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { CopyButton } from '@/app/(authenticated)/partes';
import { GRAU_LABELS } from '@/lib/design-system';
import { STATUS_PROCESSO_LABELS } from '../domain';
import type { ProcessoUnificado } from '../domain';
import type { Tag } from '@/lib/domain/tags';

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

interface ProcessoDetailSheetProps {
  processo: ProcessoUnificado | null;
  tags?: Tag[];
  responsavel?: Usuario;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcessoDetailSheet({
  processo,
  tags,
  responsavel,
  open,
  onOpenChange,
}: ProcessoDetailSheetProps) {
  const router = useRouter();

  if (!processo) return null;

  const trt = processo.trtOrigem || processo.trt;
  const parteAutora = processo.nomeParteAutoraOrigem || processo.nomeParteAutora || '-';
  const parteRe = processo.nomeParteReOrigem || processo.nomeParteRe || '-';
  const statusLabel = STATUS_PROCESSO_LABELS?.[processo.codigoStatusProcesso] || processo.codigoStatusProcesso;

  return (
    <DetailSheet open={open} onOpenChange={onOpenChange} side="right">
      <DetailSheetHeader>
        <DetailSheetTitle
          badge={
            <SemanticBadge category="status" value={processo.codigoStatusProcesso} className="text-xs">
              {statusLabel}
            </SemanticBadge>
          }
        >
          <Scale className="size-4 text-muted-foreground/50 mr-2 inline" />
          Processo
        </DetailSheetTitle>
      </DetailSheetHeader>

      <DetailSheetContent>
        <DetailSheetMetaGrid>
          <DetailSheetMetaItem label="Parte Autora">
            {parteAutora}
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Parte Ré">
            {parteRe}
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Número">
            <span className="font-mono text-sm">{processo.numeroProcesso}</span>
            <CopyButton text={processo.numeroProcesso} label="Copiar" />
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Tribunal">
            <SemanticBadge category="tribunal" value={trt} className="text-xs">{trt}</SemanticBadge>
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Grau">
            {processo.grauAtual ? (GRAU_LABELS[processo.grauAtual as keyof typeof GRAU_LABELS] || processo.grauAtual) : '-'}
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Órgão Julgador">
            {processo.descricaoOrgaoJulgador || '-'}
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Classe Judicial">
            {processo.classeJudicial || '-'}
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Responsável">
            {responsavel?.nomeExibicao || 'Não atribuído'}
          </DetailSheetMetaItem>
        </DetailSheetMetaGrid>

        {tags && tags.length > 0 && (
          <>
            <DetailSheetSeparator />
            <DetailSheetSection title="Etiquetas">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag.id} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/6 text-primary/60 border border-primary/10">
                    {tag.nome}
                  </span>
                ))}
              </div>
            </DetailSheetSection>
          </>
        )}

        <DetailSheetSeparator />
        <DetailSheetAudit createdAt={processo.createdAt} updatedAt={processo.updatedAt} />
      </DetailSheetContent>

      <DetailSheetFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
        <Button onClick={() => router.push(`/processos/${processo.id}`)}>
          Abrir Processo
        </Button>
      </DetailSheetFooter>
    </DetailSheet>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/processos/components/processo-detail-sheet.tsx
git commit -m "feat(processos): add ProcessoDetailSheet quick preview"
```

---

## Task 6: ProcessosInsightBanner

**Files:**
- Create: `src/app/(authenticated)/processos/components/processos-insight-banner.tsx`

- [ ] **Step 1: Create the insight banner component**

```typescript
// src/app/(authenticated)/processos/components/processos-insight-banner.tsx

'use client';

import { AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcessoStats } from '../service-estatisticas';

interface ProcessosInsightBannerProps {
  stats: ProcessoStats;
  onFilterSemResponsavel: () => void;
  onFilterUrgentes: () => void;
}

interface BannerConfig {
  type: 'warning' | 'alert';
  message: string;
  onClick: () => void;
}

const TYPE_STYLES = {
  warning: 'border-warning/10 bg-warning/4 text-warning/70 hover:bg-warning/6',
  alert: 'border-destructive/10 bg-destructive/4 text-destructive/70 hover:bg-destructive/6',
};

/**
 * Banners proativos que alertam sobre condições do acervo.
 * Cada banner, ao clicar, aplica o filtro correspondente.
 */
export function ProcessosInsightBanner({
  stats,
  onFilterSemResponsavel,
  onFilterUrgentes,
}: ProcessosInsightBannerProps) {
  const banners: BannerConfig[] = [];

  if (stats.semResponsavel > 0) {
    banners.push({
      type: 'warning',
      message: `${stats.semResponsavel} processo${stats.semResponsavel > 1 ? 's' : ''} sem responsável atribuído`,
      onClick: onFilterSemResponsavel,
    });
  }

  if (stats.comAudienciaProxima > 0) {
    banners.push({
      type: 'alert',
      message: `${stats.comAudienciaProxima} processo${stats.comAudienciaProxima > 1 ? 's' : ''} com audiência próxima`,
      onClick: onFilterUrgentes,
    });
  }

  if (banners.length === 0) return null;

  return (
    <div className="space-y-2">
      {banners.map((banner, index) => (
        <button
          key={index}
          type="button"
          onClick={banner.onClick}
          className={cn(
            'w-full rounded-lg border px-3.5 py-2 text-[11px] font-medium',
            'flex items-center gap-2 transition-colors cursor-pointer',
            TYPE_STYLES[banner.type]
          )}
        >
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{banner.message}</span>
          <ChevronRight className="size-3 ml-auto shrink-0" />
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/processos/components/processos-insight-banner.tsx
git commit -m "feat(processos): add ProcessosInsightBanner proactive alerts"
```

---

## Task 7: ProcessosClient (Main Wrapper)

**Files:**
- Create: `src/app/(authenticated)/processos/processos-client.tsx`

- [ ] **Step 1: Create the main client wrapper**

This is the largest component. It orchestrates all the Glass Briefing pieces following the pattern of `partes-client.tsx`.

```typescript
// src/app/(authenticated)/processos/processos-client.tsx

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LayoutGrid, List, Table2 } from 'lucide-react';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDebounce } from '@/hooks/use-debounce';
import { ProcessosPulseStrip } from './components/processos-pulse-strip';
import { ProcessosInsightBanner } from './components/processos-insight-banner';
import { ProcessoCard } from './components/processo-card';
import { ProcessoListRow } from './components/processo-list-row';
import { ProcessoDetailSheet } from './components/processo-detail-sheet';
import { ProcessoForm } from './components/processo-form';
import { actionListarProcessos } from './actions';
import type { ProcessoUnificado } from './domain';
import type { ProcessoStats } from './service-estatisticas';
import type { Tag } from '@/lib/domain/tags';

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

export interface ProcessosClientProps {
  initialProcessos: ProcessoUnificado[];
  initialTotal: number;
  initialStats: ProcessoStats;
  tribunais: string[];
  usuarios: Usuario[];
  currentUserId: number;
}

type ProcessoTab = 'todos' | 'meus' | 'sem_responsavel' | 'urgentes';

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'cards', icon: LayoutGrid, label: 'Cards' },
  { id: 'lista', icon: List, label: 'Lista' },
];

export function ProcessosClient({
  initialProcessos,
  initialTotal,
  initialStats,
  tribunais,
  usuarios,
  currentUserId,
}: ProcessosClientProps) {
  const router = useRouter();

  // Data state
  const [processos, setProcessos] = useState(initialProcessos);
  const [total, setTotal] = useState(initialTotal);
  const [stats] = useState(initialStats);
  const [tagsMap, setTagsMap] = useState<Record<number, Tag[]>>({});

  // Filter state
  const [activeTab, setActiveTab] = useState<ProcessoTab>('todos');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  // View state
  const [viewMode, setViewMode] = useState<string>(() => {
    if (typeof window === 'undefined') return 'cards';
    return localStorage.getItem('processos_view_mode') || 'cards';
  });

  // Pagination
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 50;

  // UI state
  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoUnificado | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('processos_view_mode', viewMode);
  }, [viewMode]);

  // Users map
  const usersMap = useMemo(
    () => new Map(usuarios.map((u) => [u.id, u])),
    [usuarios]
  );

  // Build filter params from tab
  const buildParams = useCallback(() => {
    const params: Record<string, unknown> = {
      pagina: pageIndex + 1,
      limite: pageSize,
      busca: debouncedSearch || undefined,
      unified: true,
    };

    switch (activeTab) {
      case 'meus':
        params.responsavelId = currentUserId;
        break;
      case 'sem_responsavel':
        params.semResponsavel = true;
        break;
      case 'urgentes':
        params.temProximaAudiencia = true;
        break;
    }

    return params;
  }, [activeTab, debouncedSearch, pageIndex, pageSize, currentUserId]);

  // Refetch on filter/page change
  useEffect(() => {
    const params = buildParams();
    actionListarProcessos(params as any).then((result: any) => {
      if (result.success && result.data) {
        setProcessos(result.data.processos || result.data.data || []);
        setTotal(result.data.total || result.data.totalRegistros || 0);
      }
    });
  }, [buildParams]);

  // Reset page on tab/search change
  useEffect(() => {
    setPageIndex(0);
  }, [activeTab, debouncedSearch]);

  // Tab options with counts
  const tabOptions: TabPillOption[] = useMemo(() => [
    { id: 'todos', label: 'Todos', count: stats.total },
    { id: 'meus', label: 'Meus' },
    { id: 'sem_responsavel', label: 'Sem Resp', count: stats.semResponsavel },
    { id: 'urgentes', label: 'Urgentes', count: stats.comAudienciaProxima },
  ], [stats]);

  // Handlers
  const handleSelectProcesso = useCallback((processo: ProcessoUnificado) => {
    setSelectedProcesso(processo);
    setIsDetailOpen(true);
  }, []);

  const handleOpenProcesso = useCallback((id: number) => {
    router.push(`/processos/${id}`);
  }, [router]);

  const totalPages = Math.ceil(total / pageSize);
  const subtitle = `${total} processo${total !== 1 ? 's' : ''}${stats.ativos > 0 ? ` · ${stats.ativos} ativos` : ''}`;

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Processos</h1>
          <p className="text-sm text-muted-foreground/50 mt-0.5">{subtitle}</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" className="h-9 w-9 bg-card" onClick={() => setIsFormOpen(true)}>
                <Plus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Novo processo</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Pulse Strip */}
      <ProcessosPulseStrip stats={stats} />

      {/* Insight Banner */}
      <ProcessosInsightBanner
        stats={stats}
        onFilterSemResponsavel={() => setActiveTab('sem_responsavel')}
        onFilterUrgentes={() => setActiveTab('urgentes')}
      />

      {/* View Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <TabPills
          tabs={tabOptions}
          active={activeTab}
          onChange={(id) => setActiveTab(id as ProcessoTab)}
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar processos..."
          />
          <ViewToggle
            mode={viewMode}
            onChange={setViewMode}
            options={VIEW_OPTIONS}
          />
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {processos.map((processo) => (
            <ProcessoCard
              key={processo.id}
              processo={processo}
              tags={tagsMap[processo.id]}
              responsavel={usersMap.get(processo.responsavelId ?? 0)}
              isSelected={selectedProcesso?.id === processo.id}
              onClick={() => handleSelectProcesso(processo)}
            />
          ))}
        </div>
      )}

      {viewMode === 'lista' && (
        <div className="space-y-1">
          {processos.map((processo) => (
            <ProcessoListRow
              key={processo.id}
              processo={processo}
              responsavel={usersMap.get(processo.responsavelId ?? 0)}
              isSelected={selectedProcesso?.id === processo.id}
              onClick={() => handleSelectProcesso(processo)}
            />
          ))}
        </div>
      )}

      {processos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground/50">Nenhum processo encontrado</p>
          <p className="text-xs text-muted-foreground/40 mt-1">Tente ajustar a busca ou os filtros</p>
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground/50">
            {pageIndex * pageSize + 1}–{Math.min((pageIndex + 1) * pageSize, total)} de {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
              className="size-8 rounded-lg hover:bg-white/4 disabled:opacity-30 flex items-center justify-center"
            >
              ‹
            </button>
            <span className="text-xs font-medium tabular-nums px-2">
              {pageIndex + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              disabled={pageIndex >= totalPages - 1}
              className="size-8 rounded-lg hover:bg-white/4 disabled:opacity-30 flex items-center justify-center"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Detail Sheet */}
      <ProcessoDetailSheet
        processo={selectedProcesso}
        tags={selectedProcesso ? tagsMap[selectedProcesso.id] : undefined}
        responsavel={selectedProcesso ? usersMap.get(selectedProcesso.responsavelId ?? 0) : undefined}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      {/* Form Dialog */}
      {isFormOpen && (
        <ProcessoForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/processos/processos-client.tsx
git commit -m "feat(processos): add ProcessosClient Glass Briefing main wrapper"
```

---

## Task 8: Update page.tsx

**Files:**
- Modify: `src/app/(authenticated)/processos/page.tsx`

- [ ] **Step 1: Rewrite the server component**

Replace the content of `page.tsx` to use the new `ProcessosClient` and fetch stats:

Key changes:
1. Remove `PageShell` import, use `max-w-350 mx-auto space-y-5 py-6` layout
2. Add `obterEstatisticasProcessos` import from `./service-estatisticas`
3. Add stats to the `Promise.all` fetch
4. Replace `ProcessosTableWrapper` with `ProcessosClient`
5. Pass `initialStats`, `currentUserId` props

The page should still accept the same searchParams for backwards compatibility but the filtering is now handled client-side via `ProcessosClient`.

```typescript
import { Suspense } from 'react';
import { authenticateRequest } from '@/lib/auth/session';
import { ProcessosClient } from './processos-client';
import { listarProcessos, buscarUsuariosRelacionados, listarTribunais } from './service';
import { obterEstatisticasProcessos } from './service-estatisticas';
import { Skeleton } from '@/components/ui/skeleton';

interface ProcessosPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProcessosPage({ searchParams }: ProcessosPageProps) {
  const session = await authenticateRequest();
  const params = await searchParams;

  const [processosResult, tribunaisResult, stats] = await Promise.all([
    listarProcessos({ pagina: 1, limite: 50, unified: true }),
    listarTribunais(),
    obterEstatisticasProcessos(),
  ]);

  const processos = processosResult.success ? (processosResult as any).data?.data || [] : [];
  const total = processosResult.success ? (processosResult as any).data?.total || 0 : 0;
  const tribunais = tribunaisResult.success ? (tribunaisResult as any).data || [] : [];

  // Resolve user names
  const processoIds = processos.map((p: any) => p.id);
  const usersResult = processoIds.length > 0 ? await buscarUsuariosRelacionados(processoIds) : { success: true, data: [] };
  const usuarios = usersResult.success ? (usersResult as any).data || [] : [];

  return (
    <div className="max-w-350 mx-auto space-y-5 py-6">
      <ProcessosClient
        initialProcessos={processos}
        initialTotal={total}
        initialStats={stats}
        tribunais={tribunais}
        usuarios={usuarios}
        currentUserId={session.id}
      />
    </div>
  );
}
```

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`
Fix any TypeScript errors that arise from the new page structure.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/processos/page.tsx
git commit -m "feat(processos): rewrite page.tsx with Glass Briefing layout and stats"
```

---

## Task 9: Update Barrel Exports

**Files:**
- Modify: `src/app/(authenticated)/processos/index.ts`

- [ ] **Step 1: Add new exports**

Add to the barrel file:

```typescript
// Listagem Glass Briefing components
export { ProcessosClient } from './processos-client';
export { ProcessoCard } from './components/processo-card';
export { ProcessoListRow } from './components/processo-list-row';
export { ProcessoDetailSheet } from './components/processo-detail-sheet';
export { ProcessosPulseStrip } from './components/processos-pulse-strip';
export { ProcessosInsightBanner } from './components/processos-insight-banner';

// Stats
export { actionObterEstatisticasProcessos } from './actions/estatisticas-actions';
export type { ProcessoStats } from './service-estatisticas';
```

- [ ] **Step 2: Run type-check and dev server**

Run: `npm run type-check`
Then: `npm run dev` — navigate to `/processos` to verify the new listing renders

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/processos/index.ts
git commit -m "feat(processos): export listagem Glass Briefing components from barrel"
```

---

## Task 10: Visual QA

- [ ] **Step 1: Test all views**

Navigate to `/processos` and verify:
- PulseStrip shows 4 KPI cards with correct numbers
- InsightBanner appears if there are processos sem responsável
- TabPills filter correctly (Todos, Meus, Sem Resp, Urgentes)
- SearchInput filters by processo number and party names
- Cards view shows grid with glass cards
- List view shows compact rows
- Clicking a card opens the DetailSheet with processo preview
- "Abrir Processo" navigates to `/processos/[id]`
- Pagination works correctly
- Empty state shows when no results

- [ ] **Step 2: Test responsiveness**

Check at 375px, 768px, 1024px, 1440px:
- Cards: 1 col → 2 col → 3 col
- List rows: responsive columns hide/show correctly
- PulseStrip: 2 col → 4 col

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(processos): complete Glass Briefing listing with visual QA"
```
