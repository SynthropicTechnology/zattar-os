# Usuarios Glass Briefing Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire usuarios module to Glass Briefing design system with 3 view modes (Grid/Lista/Organograma), two-column profile layout, activity heatmap, profile completeness tracking, and improved permissions matrix.

**Architecture:** Hybrid unified client (`usuarios-client.tsx`) manages all 3 views with lazy-loaded Organograma. Profile page uses two-column layout (sticky sidebar + tabbed content). New shared primitive components (StatusDot, CompletenessRing, RoleBanner) are composed into cards and profile.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, GlassPanel depth system, Lucide icons, SVG for heatmap/ring/org-chart.

**Spec:** `docs/superpowers/specs/2026-04-14-usuarios-glass-briefing-redesign.md`

---

## File Structure

### New Files
- `src/app/(authenticated)/usuarios/components/shared/user-completeness-ring.tsx` — SVG ring showing profile completion %
- `src/app/(authenticated)/usuarios/components/shared/user-status-dot.tsx` — Online/away/offline dot based on auth logs
- `src/app/(authenticated)/usuarios/components/shared/role-banner.tsx` — Mini gradient banner by cargo color
- `src/app/(authenticated)/usuarios/components/shared/completeness-utils.ts` — Pure functions for completeness calculation
- `src/app/(authenticated)/usuarios/components/list/user-kpi-strip.tsx` — KPI metrics strip for listing page
- `src/app/(authenticated)/usuarios/components/list/usuarios-toolbar.tsx` — TabPills + Filters + Search + ViewToggle
- `src/app/(authenticated)/usuarios/components/list/usuarios-list-view.tsx` — DataTable view
- `src/app/(authenticated)/usuarios/components/list/usuarios-org-view.tsx` — Org chart (lazy)
- `src/app/(authenticated)/usuarios/components/list/department-group-header.tsx` — Collapsible group header
- `src/app/(authenticated)/usuarios/components/activities/activity-heatmap.tsx` — GitHub-style heatmap
- `src/app/(authenticated)/usuarios/components/permissions/permission-toggle.tsx` — Toggle switch with diff
- `src/app/(authenticated)/usuarios/components/permissions/role-preset-select.tsx` — Preset dropdown
- `src/app/(authenticated)/usuarios/components/detail/profile-sidebar.tsx` — Sticky sidebar for profile
- `src/app/(authenticated)/usuarios/actions/heatmap-actions.ts` — Server action for heatmap data

### Rewritten Files
- `src/app/(authenticated)/usuarios/components/usuarios-page-content.tsx` → `usuarios-client.tsx` — Unified client with 3 views
- `src/app/(authenticated)/usuarios/components/shared/usuario-card.tsx` — Glass card with banner, ring, stats
- `src/app/(authenticated)/usuarios/components/list/usuarios-grid-view.tsx` — Grid with grouping
- `src/app/(authenticated)/usuarios/components/permissions/permissoes-matriz.tsx` — Toggle + presets + diff
- `src/app/(authenticated)/usuarios/[id]/usuario-detalhes.tsx` — Two-column layout

### Updated Files
- `src/app/(authenticated)/usuarios/page.tsx` — Import new client
- `src/app/(authenticated)/usuarios/index.ts` — Update barrel exports
- `src/app/(authenticated)/usuarios/components/forms/usuario-create-dialog.tsx` — Wizard steps
- `src/app/(authenticated)/usuarios/components/forms/usuario-edit-dialog.tsx` — Glass sections
- `src/app/(authenticated)/usuarios/components/cargos/cargos-management-dialog.tsx` — Color picker
- `src/app/(authenticated)/usuarios/components/activities/atividades-cards.tsx` — Glass treatment
- `src/app/(authenticated)/usuarios/components/logs/auth-logs-timeline.tsx` — Glass cards

### Kept As-Is
- `src/app/(authenticated)/usuarios/domain.ts`
- `src/app/(authenticated)/usuarios/service.ts`
- `src/app/(authenticated)/usuarios/repository.ts`
- `src/app/(authenticated)/usuarios/utils.ts`
- `src/app/(authenticated)/usuarios/hooks/*`
- `src/app/(authenticated)/usuarios/actions/usuarios-actions.ts`
- `src/app/(authenticated)/usuarios/components/avatar/avatar-edit-dialog.tsx`
- `src/app/(authenticated)/usuarios/components/cover/cover-edit-dialog.tsx`
- `src/app/(authenticated)/usuarios/components/password/redefinir-senha-dialog.tsx`

---

## Task 1: Profile Completeness Utilities

**Files:**
- Create: `src/app/(authenticated)/usuarios/components/shared/completeness-utils.ts`

- [ ] **Step 1: Create completeness calculation utility**

```typescript
// src/app/(authenticated)/usuarios/components/shared/completeness-utils.ts
import type { Usuario } from '../../domain';

export interface CompletenessItem {
  key: string;
  label: string;
  done: boolean;
}

/**
 * Calcula a lista de itens de completude e o score do perfil.
 * OAB só é exigida se cargo é advogado ou diretor.
 */
export function calcularCompleteness(usuario: Usuario): {
  items: CompletenessItem[];
  score: number;
  total: number;
  completed: number;
} {
  const cargoNome = usuario.cargo?.nome?.toLowerCase() ?? '';
  const exigeOab = cargoNome === 'advogado' || cargoNome === 'diretor';

  const items: CompletenessItem[] = [
    { key: 'avatar', label: 'Avatar enviado', done: !!usuario.avatarUrl },
    { key: 'telefone', label: 'Telefone adicionado', done: !!usuario.telefone },
    {
      key: 'endereco',
      label: 'Endereço completo',
      done: !!(
        usuario.endereco?.logradouro &&
        usuario.endereco?.cidade &&
        usuario.endereco?.estado
      ),
    },
    { key: 'emailPessoal', label: 'Email pessoal', done: !!usuario.emailPessoal },
    { key: 'dataNascimento', label: 'Data de nascimento', done: !!usuario.dataNascimento },
    { key: 'rg', label: 'RG preenchido', done: !!usuario.rg },
  ];

  if (exigeOab) {
    items.splice(1, 0, {
      key: 'oab',
      label: 'OAB preenchida',
      done: !!(usuario.oab && usuario.ufOab),
    });
  }

  const completed = items.filter((i) => i.done).length;
  const total = items.length;
  const score = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { items, score, total, completed };
}

/**
 * Retorna a cor semântica baseada no score.
 */
export function getCompletenessColor(score: number): 'success' | 'warning' | 'destructive' {
  if (score >= 70) return 'success';
  if (score >= 30) return 'warning';
  return 'destructive';
}

/**
 * Retorna a classe CSS da cor do score.
 */
export function getCompletenessColorClass(score: number): string {
  const color = getCompletenessColor(score);
  return color === 'success'
    ? 'text-success'
    : color === 'warning'
      ? 'text-warning'
      : 'text-destructive';
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/shared/completeness-utils.ts
git commit -m "feat(usuarios): add profile completeness calculation utilities"
```

---

## Task 2: UserStatusDot Component

**Files:**
- Create: `src/app/(authenticated)/usuarios/components/shared/user-status-dot.tsx`

- [ ] **Step 1: Create status dot component**

```tsx
// src/app/(authenticated)/usuarios/components/shared/user-status-dot.tsx
'use client';

import { cn } from '@/lib/utils';

export type UserStatus = 'online' | 'away' | 'offline';

interface UserStatusDotProps {
  status: UserStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
} as const;

const BORDER_MAP = {
  sm: 'border-[2px]',
  md: 'border-[2.5px]',
  lg: 'border-[3px]',
} as const;

const COLOR_MAP: Record<UserStatus, string> = {
  online: 'bg-success',
  away: 'bg-warning',
  offline: 'bg-muted-foreground/25',
};

/**
 * Determina o status com base no timestamp do último login.
 * < 15min = online, < 2h = away, > 2h = offline
 */
export function getStatusFromLastLogin(lastLoginAt: string | null): UserStatus {
  if (!lastLoginAt) return 'offline';

  const diff = Date.now() - new Date(lastLoginAt).getTime();
  const minutes = diff / 60_000;

  if (minutes < 15) return 'online';
  if (minutes < 120) return 'away';
  return 'offline';
}

export function UserStatusDot({ status, size = 'md', className }: UserStatusDotProps) {
  return (
    <span
      className={cn(
        'rounded-full border-background block shrink-0',
        SIZE_MAP[size],
        BORDER_MAP[size],
        COLOR_MAP[status],
        status === 'online' && 'animate-pulse',
        className,
      )}
      aria-label={status === 'online' ? 'Online' : status === 'away' ? 'Ausente' : 'Offline'}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/shared/user-status-dot.tsx
git commit -m "feat(usuarios): add UserStatusDot component with auth-log based status"
```

---

## Task 3: UserCompletenessRing Component

**Files:**
- Create: `src/app/(authenticated)/usuarios/components/shared/user-completeness-ring.tsx`

- [ ] **Step 1: Create SVG ring component**

```tsx
// src/app/(authenticated)/usuarios/components/shared/user-completeness-ring.tsx
'use client';

import { cn } from '@/lib/utils';
import { getCompletenessColor } from './completeness-utils';

interface UserCompletenessRingProps {
  score: number; // 0-100
  size?: number; // px — diameter of the ring (avatar sits inside)
  strokeWidth?: number;
  className?: string;
}

const COLOR_MAP = {
  success: 'stroke-success',
  warning: 'stroke-warning',
  destructive: 'stroke-destructive',
} as const;

export function UserCompletenessRing({
  score,
  size = 60,
  strokeWidth = 2,
  className,
}: UserCompletenessRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getCompletenessColor(score);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('absolute top-0 left-0 pointer-events-none', className)}
      aria-hidden="true"
    >
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-border/10"
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={cn(COLOR_MAP[color], 'transition-all duration-700')}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
      />
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/shared/user-completeness-ring.tsx
git commit -m "feat(usuarios): add UserCompletenessRing SVG component"
```

---

## Task 4: RoleBanner Component

**Files:**
- Create: `src/app/(authenticated)/usuarios/components/shared/role-banner.tsx`

- [ ] **Step 1: Create banner gradient component**

```tsx
// src/app/(authenticated)/usuarios/components/shared/role-banner.tsx
'use client';

import { cn } from '@/lib/utils';

interface RoleBannerProps {
  cargoNome: string | null | undefined;
  inactive?: boolean;
  height?: string;
  className?: string;
}

/**
 * Mapa de gradientes por nome do cargo (case-insensitive).
 * Novas cores podem ser adicionadas ao gerenciar cargos.
 */
const CARGO_GRADIENTS: Record<string, string> = {
  diretor: 'from-primary/40 to-primary/15',
  advogado: 'from-info/35 to-info/12',
  advogada: 'from-info/35 to-info/12',
  estagiário: 'from-success/35 to-success/12',
  estagiária: 'from-success/35 to-success/12',
  secretário: 'from-warning/35 to-warning/12',
  secretária: 'from-warning/35 to-warning/12',
};

const DEFAULT_GRADIENT = 'from-border/10 to-border/4';

export function getRoleBannerGradient(cargoNome: string | null | undefined): string {
  if (!cargoNome) return DEFAULT_GRADIENT;
  return CARGO_GRADIENTS[cargoNome.toLowerCase()] ?? DEFAULT_GRADIENT;
}

export function RoleBanner({ cargoNome, inactive, height = 'h-14', className }: RoleBannerProps) {
  const gradient = getRoleBannerGradient(cargoNome);

  return (
    <div
      className={cn(
        'relative w-full bg-linear-to-br overflow-hidden',
        gradient,
        height,
        inactive && 'grayscale',
        className,
      )}
    >
      {/* Subtle highlight overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background/60" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/shared/role-banner.tsx
git commit -m "feat(usuarios): add RoleBanner gradient component by cargo"
```

---

## Task 5: UsuarioCard Redesign

**Files:**
- Rewrite: `src/app/(authenticated)/usuarios/components/shared/usuario-card.tsx`

- [ ] **Step 1: Rewrite card with Glass Briefing**

```tsx
// src/app/(authenticated)/usuarios/components/shared/usuario-card.tsx
'use client';

import * as React from 'react';
import type { Usuario } from '../../domain';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvatarUrl, formatarOab } from '../../utils';
import { RoleBanner } from './role-banner';
import { UserStatusDot, getStatusFromLastLogin } from './user-status-dot';
import { UserCompletenessRing } from './user-completeness-ring';
import {
  calcularCompleteness,
  getCompletenessColor,
  getCompletenessColorClass,
} from './completeness-utils';

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface UsuarioCardProps {
  usuario: Usuario;
  /** Timestamp do último login (auth logs) para determinar status */
  lastLoginAt?: string | null;
  /** Estatísticas de atividade: processos, audiencias, pendentes */
  stats?: { processos: number; audiencias: number; pendentes: number };
  onView: (usuario: Usuario) => void;
}

export function UsuarioCard({ usuario, lastLoginAt, stats, onView }: UsuarioCardProps) {
  const { score } = calcularCompleteness(usuario);
  const status = getStatusFromLastLogin(lastLoginAt ?? null);
  const cargoNome = usuario.cargo?.nome;
  const temOab = !!(usuario.oab?.trim());
  const cargoLower = cargoNome?.toLowerCase();
  const deveExibirOab = (cargoLower === 'advogado' || cargoLower === 'advogada' || cargoLower === 'diretor') && temOab;
  const inactive = !usuario.ativo;
  const completenessColorClass = getCompletenessColorClass(score);
  const completenessColor = getCompletenessColor(score);

  // Role badge color
  const roleBadgeClass = cargoLower === 'diretor'
    ? 'bg-primary/12 text-primary'
    : cargoLower === 'advogado' || cargoLower === 'advogada'
      ? 'bg-info/12 text-info'
      : cargoLower === 'estagiário' || cargoLower === 'estagiária'
        ? 'bg-success/12 text-success'
        : cargoLower === 'secretário' || cargoLower === 'secretária'
          ? 'bg-warning/12 text-warning'
          : 'bg-muted/12 text-muted-foreground';

  return (
    <GlassPanel
      depth={1}
      className={cn(
        'overflow-hidden cursor-pointer transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-lg hover:border-border/30',
        inactive && 'opacity-55',
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onView(usuario)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onView(usuario);
          }
        }}
      >
        {/* Mini banner */}
        <RoleBanner cargoNome={cargoNome} inactive={inactive} />

        {/* Inactive badge */}
        {inactive && (
          <span className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md bg-destructive/15 text-destructive text-[10px] font-semibold backdrop-blur-sm">
            Inativo
          </span>
        )}

        {/* Completeness badge */}
        {!inactive && (
          <span
            className={cn(
              'absolute top-1 right-3 z-10 px-1.5 py-px rounded text-[9px] font-semibold',
              completenessColor === 'success' && 'bg-success/15 text-success',
              completenessColor === 'warning' && 'bg-warning/15 text-warning',
              completenessColor === 'destructive' && 'bg-destructive/15 text-destructive',
            )}
          >
            {score}%
          </span>
        )}

        {/* Avatar area */}
        <div className="px-4 -mt-7 relative z-2">
          <div className="relative inline-block">
            <UserCompletenessRing score={inactive ? 0 : score} size={60} />
            <Avatar className="size-13 border-[3px] border-background m-1">
              <AvatarImage
                src={getAvatarUrl(usuario.avatarUrl) || undefined}
                alt={usuario.nomeExibicao}
              />
              <AvatarFallback className="text-sm font-medium">
                {getInitials(usuario.nomeExibicao || usuario.nomeCompleto)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0.5 right-0.5">
              <UserStatusDot status={inactive ? 'offline' : status} size="sm" />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 pb-3.5">
          {/* Name */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-sm font-semibold truncate">
              {usuario.nomeCompleto}
            </span>
            {usuario.isSuperAdmin && (
              <ShieldAlert className="size-3.5 text-destructive shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/40 truncate mt-0.5">
            {usuario.emailCorporativo}
          </p>

          {/* Badges */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {cargoNome && (
              <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold', roleBadgeClass)}>
                {cargoNome}
              </span>
            )}
            {deveExibirOab && (
              <span className="px-1.5 py-0.5 rounded bg-info/8 text-[9px] text-info/70">
                ⚖ {formatarOab(usuario.oab, usuario.ufOab)}
              </span>
            )}
          </div>

          {/* Stats row */}
          {stats && (
            <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-border/10">
              <StatChip label="Processos" value={stats.processos} inactive={inactive} />
              <StatChip label="Audiências" value={stats.audiencias} inactive={inactive} />
              <StatChip label="Pendentes" value={stats.pendentes} inactive={inactive} />
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}

function StatChip({ label, value, inactive }: { label: string; value: number; inactive?: boolean }) {
  return (
    <div className="flex-1 text-center rounded-md bg-muted/3 py-1">
      <div className={cn('text-sm font-bold tabular-nums', inactive && 'text-muted-foreground/35')}>
        {inactive ? '—' : value}
      </div>
      <div className="text-[8px] uppercase tracking-wider text-muted-foreground/35 mt-0.5">
        {label}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/shared/usuario-card.tsx
git commit -m "refactor(usuarios): redesign UsuarioCard with Glass Briefing, banner, ring, stats"
```

---

## Task 6: UserKpiStrip Component

**Files:**
- Create: `src/app/(authenticated)/usuarios/components/list/user-kpi-strip.tsx`

- [ ] **Step 1: Create KPI strip**

```tsx
// src/app/(authenticated)/usuarios/components/list/user-kpi-strip.tsx
'use client';

import { Users, CheckCircle, Scale, AlertTriangle } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { AnimatedNumber } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import type { Usuario } from '../../domain';
import { calcularCompleteness } from '../shared/completeness-utils';

interface UserKpiStripProps {
  usuarios: Usuario[];
}

export function UserKpiStrip({ usuarios }: UserKpiStripProps) {
  const total = usuarios.length;
  const ativos = usuarios.filter((u) => u.ativo).length;
  const comOab = usuarios.filter((u) => u.oab?.trim()).length;
  const incompletos = usuarios.filter(
    (u) => u.ativo && calcularCompleteness(u).score < 70,
  ).length;

  const items = [
    {
      label: 'Total Membros',
      value: total,
      pct: 100,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/8',
      barColor: 'bg-primary',
    },
    {
      label: 'Ativos',
      value: ativos,
      pct: total > 0 ? Math.round((ativos / total) * 100) : 0,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/8',
      barColor: 'bg-success',
    },
    {
      label: 'Advogados OAB',
      value: comOab,
      pct: total > 0 ? Math.round((comOab / total) * 100) : 0,
      icon: Scale,
      color: 'text-info',
      bgColor: 'bg-info/8',
      barColor: 'bg-info',
    },
    {
      label: 'Perfis Incompletos',
      value: incompletos,
      pct: total > 0 ? Math.round((incompletos / total) * 100) : 0,
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/8',
      barColor: 'bg-warning',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <GlassPanel key={item.label} depth={2} className="px-4 py-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 font-semibold">
                {item.label}
              </p>
              <div className="text-2xl font-bold mt-1">
                <AnimatedNumber value={item.value} />
              </div>
            </div>
            <IconContainer size="md" className={item.bgColor}>
              <item.icon className={`size-4 ${item.color}`} />
            </IconContainer>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${item.barColor} transition-all duration-700`}
                style={{ width: `${item.pct}%` }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground/40 tabular-nums">
              {item.pct}%
            </span>
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/list/user-kpi-strip.tsx
git commit -m "feat(usuarios): add UserKpiStrip with Glass depth=2 and AnimatedNumber"
```

---

## Task 7: UsuariosToolbar Component

**Files:**
- Create: `src/app/(authenticated)/usuarios/components/list/usuarios-toolbar.tsx`

- [ ] **Step 1: Create toolbar with TabPills + Search + ViewToggle**

```tsx
// src/app/(authenticated)/usuarios/components/list/usuarios-toolbar.tsx
'use client';

import { LayoutGrid, List, GitBranch } from 'lucide-react';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { FilterPopover } from '@/app/(authenticated)/partes';

export type UsuariosViewMode = 'grid' | 'lista' | 'organograma';

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'grid', icon: LayoutGrid, label: 'Grid' },
  { id: 'lista', icon: List, label: 'Lista' },
  { id: 'organograma', icon: GitBranch, label: 'Organograma' },
];

interface UsuariosToolbarProps {
  /** Counts for tab pills */
  counts: { total: number; ativos: number; inativos: number; comOab: number };
  /** Active tab filter */
  activeTab: string;
  onTabChange: (id: string) => void;
  /** Search */
  search: string;
  onSearchChange: (value: string) => void;
  /** View mode */
  viewMode: UsuariosViewMode;
  onViewModeChange: (mode: string) => void;
  /** Cargo filter */
  cargoFiltro: string;
  onCargoFiltroChange: (value: string) => void;
  cargosOptions: { value: string; label: string }[];
}

export function UsuariosToolbar({
  counts,
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  cargoFiltro,
  onCargoFiltroChange,
  cargosOptions,
}: UsuariosToolbarProps) {
  const tabs: TabPillOption[] = [
    { id: 'todos', label: 'Todos', count: counts.total },
    { id: 'ativos', label: 'Ativos', count: counts.ativos },
    { id: 'inativos', label: 'Inativos', count: counts.inativos },
    { id: 'com-oab', label: 'Com OAB', count: counts.comOab },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <TabPills tabs={tabs} active={activeTab} onChange={onTabChange} />
        <FilterPopover
          label="Cargo"
          options={cargosOptions}
          value={cargoFiltro}
          onValueChange={onCargoFiltroChange}
          defaultValue="all"
        />
      </div>
      <div className="flex items-center gap-2 flex-1 justify-end">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Buscar usuário..."
        />
        <ViewToggle
          mode={viewMode}
          onChange={onViewModeChange}
          options={VIEW_OPTIONS}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/list/usuarios-toolbar.tsx
git commit -m "feat(usuarios): add UsuariosToolbar with TabPills, Search, ViewToggle"
```

---

## Task 8: Department Group Header

**Files:**
- Create: `src/app/(authenticated)/usuarios/components/list/department-group-header.tsx`

- [ ] **Step 1: Create collapsible group header**

```tsx
// src/app/(authenticated)/usuarios/components/list/department-group-header.tsx
'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getRoleBannerGradient } from '../shared/role-banner';
import { getAvatarUrl } from '../../utils';
import type { Usuario } from '../../domain';

interface DepartmentGroupHeaderProps {
  cargoNome: string;
  members: Usuario[];
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function DepartmentGroupHeader({
  cargoNome,
  members,
  defaultOpen = true,
  children,
}: DepartmentGroupHeaderProps) {
  const [open, setOpen] = useState(defaultOpen);
  const gradient = getRoleBannerGradient(cargoNome);
  const displayMembers = members.slice(0, 5);

  return (
    <div>
      <GlassPanel
        depth={1}
        className={cn(
          'px-4 py-3 cursor-pointer flex items-center gap-3',
          open && 'mb-3',
          !open && 'mb-0',
        )}
      >
        <button
          type="button"
          className="flex items-center gap-3 w-full"
          onClick={() => setOpen(!open)}
        >
          {/* Color bar */}
          <div className={cn('w-1 h-6 rounded-sm bg-linear-to-b shrink-0', gradient)} />

          {/* Title + count */}
          <span className="text-sm font-semibold flex-1 text-left">{cargoNome}</span>
          <span className="text-xs text-muted-foreground/40">
            {members.length} {members.length === 1 ? 'membro' : 'membros'}
          </span>

          {/* Avatar stack */}
          <div className="flex -space-x-2 ml-2">
            {displayMembers.map((m) => (
              <Avatar key={m.id} className="size-7 border-2 border-background">
                <AvatarImage src={getAvatarUrl(m.avatarUrl) || undefined} alt={m.nomeExibicao} />
                <AvatarFallback className="text-[9px] font-medium">
                  {getInitials(m.nomeExibicao)}
                </AvatarFallback>
              </Avatar>
            ))}
            {members.length > 5 && (
              <div className="size-7 rounded-full bg-muted/30 border-2 border-background flex items-center justify-center text-[9px] text-muted-foreground font-medium">
                +{members.length - 5}
              </div>
            )}
          </div>

          {/* Chevron */}
          <ChevronDown
            className={cn(
              'size-4 text-muted-foreground/40 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </button>
      </GlassPanel>

      {/* Content */}
      {open && children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/list/department-group-header.tsx
git commit -m "feat(usuarios): add DepartmentGroupHeader with avatar stack"
```

---

## Task 9: UsuariosGridView Rewrite

**Files:**
- Rewrite: `src/app/(authenticated)/usuarios/components/list/usuarios-grid-view.tsx`

- [ ] **Step 1: Rewrite grid view with grouping support**

```tsx
// src/app/(authenticated)/usuarios/components/list/usuarios-grid-view.tsx
'use client';

import * as React from 'react';
import { Users } from 'lucide-react';
import { UsuarioCard } from '../shared/usuario-card';
import { DepartmentGroupHeader } from './department-group-header';
import { EmptyState } from '@/components/shared/empty-state';
import type { Usuario } from '../../domain';

interface UsuariosGridViewProps {
  usuarios: Usuario[];
  /** Map de usuarioId → lastLoginAt para status dots */
  lastLoginMap?: Map<number, string | null>;
  /** Map de usuarioId → stats para os cards */
  statsMap?: Map<number, { processos: number; audiencias: number; pendentes: number }>;
  /** Agrupar por cargo */
  grouped?: boolean;
  onView: (usuario: Usuario) => void;
}

export function UsuariosGridView({
  usuarios,
  lastLoginMap,
  statsMap,
  grouped = false,
  onView,
}: UsuariosGridViewProps) {
  if (usuarios.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum usuário encontrado"
        description="Tente ajustar os filtros ou a busca."
      />
    );
  }

  if (grouped) {
    const groups = groupByCargo(usuarios);
    return (
      <div className="space-y-4">
        {groups.map((group) => (
          <DepartmentGroupHeader
            key={group.cargo}
            cargoNome={group.cargo}
            members={group.members}
          >
            <CardGrid
              usuarios={group.members}
              lastLoginMap={lastLoginMap}
              statsMap={statsMap}
              onView={onView}
            />
          </DepartmentGroupHeader>
        ))}
      </div>
    );
  }

  return (
    <CardGrid
      usuarios={usuarios}
      lastLoginMap={lastLoginMap}
      statsMap={statsMap}
      onView={onView}
    />
  );
}

function CardGrid({
  usuarios,
  lastLoginMap,
  statsMap,
  onView,
}: {
  usuarios: Usuario[];
  lastLoginMap?: Map<number, string | null>;
  statsMap?: Map<number, { processos: number; audiencias: number; pendentes: number }>;
  onView: (usuario: Usuario) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {usuarios.map((usuario) => (
        <UsuarioCard
          key={usuario.id}
          usuario={usuario}
          lastLoginAt={lastLoginMap?.get(usuario.id) ?? null}
          stats={statsMap?.get(usuario.id)}
          onView={onView}
        />
      ))}
    </div>
  );
}

/** Agrupa por cargo, com "Sem cargo" ao final */
function groupByCargo(usuarios: Usuario[]): { cargo: string; members: Usuario[] }[] {
  const map = new Map<string, Usuario[]>();

  for (const u of usuarios) {
    const cargo = u.cargo?.nome ?? 'Sem cargo';
    const arr = map.get(cargo) ?? [];
    arr.push(u);
    map.set(cargo, arr);
  }

  // Mover "Sem cargo" ao final
  const entries = Array.from(map.entries());
  const semCargo = entries.findIndex(([c]) => c === 'Sem cargo');
  if (semCargo > -1) {
    const [removed] = entries.splice(semCargo, 1);
    entries.push(removed);
  }

  return entries.map(([cargo, members]) => ({ cargo, members }));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/list/usuarios-grid-view.tsx
git commit -m "refactor(usuarios): rewrite UsuariosGridView with grouping and Glass cards"
```

---

## Task 10: UsuariosListView (DataTable)

**Files:**
- Create: `src/app/(authenticated)/usuarios/components/list/usuarios-list-view.tsx`

- [ ] **Step 1: Create DataTable view**

```tsx
// src/app/(authenticated)/usuarios/components/list/usuarios-list-view.tsx
'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, RotateCcw, ShieldAlert } from 'lucide-react';
import { DataShell } from '@/components/shared/data-shell/data-shell';
import { DataTable } from '@/components/shared/data-shell/data-table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAvatarUrl, formatarOab } from '../../utils';
import { UserStatusDot, getStatusFromLastLogin } from '../shared/user-status-dot';
import { calcularCompleteness, getCompletenessColor } from '../shared/completeness-utils';
import type { Usuario } from '../../domain';

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface UsuariosListViewProps {
  usuarios: Usuario[];
  lastLoginMap?: Map<number, string | null>;
  statsMap?: Map<number, { processos: number; audiencias: number; pendentes: number }>;
  onView: (usuario: Usuario) => void;
}

export function UsuariosListView({ usuarios, lastLoginMap, statsMap, onView }: UsuariosListViewProps) {
  const columns: ColumnDef<Usuario, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'nomeCompleto',
        header: 'Usuário',
        cell: ({ row }) => {
          const u = row.original;
          const status = getStatusFromLastLogin(lastLoginMap?.get(u.id) ?? null);
          return (
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Avatar className="size-8.5
                  <AvatarImage src={getAvatarUrl(u.avatarUrl) || undefined} alt={u.nomeExibicao} />
                  <AvatarFallback className="text-xs font-medium">
                    {getInitials(u.nomeExibicao)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5">
                  <UserStatusDot status={u.ativo ? status : 'offline'} size="sm" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-sm font-semibold truncate">
                  {u.nomeCompleto}
                  {u.isSuperAdmin && <ShieldAlert className="size-3 text-destructive shrink-0" />}
                </div>
                <div className="text-[11px] text-muted-foreground/40 truncate">{u.emailCorporativo}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorFn: (u) => u.cargo?.nome ?? '',
        id: 'cargo',
        header: 'Cargo',
        cell: ({ row }) => {
          const nome = row.original.cargo?.nome;
          if (!nome) return <span className="text-muted-foreground/40">—</span>;
          return (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/8 text-muted-foreground">
              {nome}
            </span>
          );
        },
      },
      {
        id: 'oab',
        header: 'OAB',
        cell: ({ row }) => {
          const u = row.original;
          if (!u.oab?.trim()) return <span className="text-muted-foreground/40">—</span>;
          return (
            <span className="px-1.5 py-0.5 rounded bg-info/8 text-[10px] text-info/70">
              ⚖ {formatarOab(u.oab, u.ufOab)}
            </span>
          );
        },
      },
      {
        accessorKey: 'ativo',
        header: 'Status',
        cell: ({ row }) => {
          const ativo = row.original.ativo;
          return (
            <span
              className={cn(
                'px-2 py-0.5 rounded-md text-[11px] font-medium',
                ativo ? 'bg-success/12 text-success' : 'bg-destructive/12 text-destructive',
              )}
            >
              {ativo ? 'Ativo' : 'Inativo'}
            </span>
          );
        },
      },
      {
        id: 'processos',
        header: 'Processos',
        cell: ({ row }) => {
          const count = statsMap?.get(row.original.id)?.processos;
          return (
            <span className="tabular-nums font-semibold text-sm">
              {count ?? '—'}
            </span>
          );
        },
      },
      {
        id: 'perfil',
        header: 'Perfil',
        cell: ({ row }) => {
          const { score } = calcularCompleteness(row.original);
          const color = getCompletenessColor(score);
          const barColor =
            color === 'success' ? 'bg-success' : color === 'warning' ? 'bg-warning' : 'bg-destructive';
          return (
            <div className="flex items-center gap-2">
              <div className="w-12 h-1 rounded-full bg-muted/30 overflow-hidden">
                <div className={cn('h-full rounded-full', barColor)} style={{ width: `${score}%` }} />
              </div>
              <span className="text-[11px] text-muted-foreground/40 tabular-nums">{score}%</span>
            </div>
          );
        },
      },
      {
        id: 'acoes',
        header: '',
        size: 80,
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="size-7" onClick={() => onView(u)} aria-label="Ver perfil">
                <Eye className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" aria-label={u.ativo ? 'Editar' : 'Reativar'}>
                {u.ativo ? <Pencil className="size-3.5" /> : <RotateCcw className="size-3.5" />}
              </Button>
            </div>
          );
        },
      },
    ],
    [lastLoginMap, statsMap, onView],
  );

  return (
    <DataShell>
      <DataTable
        columns={columns}
        data={usuarios}
        onRowClick={onView}
        density="compact"
        emptyMessage="Nenhum usuário encontrado"
        ariaLabel="Lista de usuários"
      />
    </DataShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/list/usuarios-list-view.tsx
git commit -m "feat(usuarios): add UsuariosListView with DataTable and Glass styling"
```

---

## Task 11: Organograma View (Lazy-Loaded)

**Files:**
- Create: `src/app/(authenticated)/usuarios/components/list/usuarios-org-view.tsx`

- [ ] **Step 1: Create org chart component**

This is the most complex new component. V1 uses flat grouping by cargo (no `supervisorId` needed).

```tsx
// src/app/(authenticated)/usuarios/components/list/usuarios-org-view.tsx
'use client';

import * as React from 'react';
import { GitBranch, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '../../utils';
import type { Usuario } from '../../domain';

interface UsuariosOrgViewProps {
  usuarios: Usuario[];
  onView: (usuario: Usuario) => void;
}

/** Hierarquia de cargos para ordenar os níveis (maior → menor) */
const CARGO_HIERARCHY: Record<string, number> = {
  diretor: 0,
  advogado: 1,
  advogada: 1,
  secretário: 2,
  secretária: 2,
  estagiário: 3,
  estagiária: 3,
};

function getCargoLevel(cargoNome: string | null | undefined): number {
  if (!cargoNome) return 99;
  return CARGO_HIERARCHY[cargoNome.toLowerCase()] ?? 50;
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UsuariosOrgView({ usuarios, onView }: UsuariosOrgViewProps) {
  const [zoom, setZoom] = React.useState(100);

  const activeUsers = usuarios.filter((u) => u.ativo);

  if (activeUsers.length === 0) {
    return (
      <EmptyState
        icon={GitBranch}
        title="Sem hierarquia"
        description="Cadastre usuários ativos para visualizar o organograma."
      />
    );
  }

  // Agrupar por nível de cargo
  const levels = groupByLevel(activeUsers);

  return (
    <GlassPanel depth={1} className="p-6 overflow-x-auto">
      {/* Controls */}
      <div className="flex justify-end gap-1.5 mb-4">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 bg-transparent"
          onClick={() => setZoom((z) => Math.max(50, z - 10))}
        >
          <ZoomOut className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 bg-transparent text-xs tabular-nums"
          onClick={() => setZoom(100)}
        >
          {zoom}%
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 bg-transparent"
          onClick={() => setZoom((z) => Math.min(150, z + 10))}
        >
          <ZoomIn className="size-3.5" />
        </Button>
      </div>

      {/* Org tree */}
      <div
        className="flex flex-col items-center gap-0 min-w-150 transition-transform duration-200"
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
      >
        {levels.map((level, levelIdx) => (
          <React.Fragment key={level.label}>
            {/* Connector line between levels */}
            {levelIdx > 0 && (
              <div className="w-0.5 h-7 bg-border/15 mx-auto" />
            )}

            {/* Level label */}
            <div className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-semibold mb-2">
              {level.label}
            </div>

            {/* Level nodes */}
            <div className="flex gap-4 justify-center flex-wrap relative">
              {/* Horizontal connector */}
              {level.members.length > 1 && levelIdx > 0 && (
                <div
                  className="absolute top-0 h-0.5 bg-border/10"
                  style={{
                    left: `${100 / (level.members.length * 2)}%`,
                    right: `${100 / (level.members.length * 2)}%`,
                    top: '-14px',
                  }}
                />
              )}

              {level.members.map((user) => (
                <OrgNode key={user.id} usuario={user} isRoot={levelIdx === 0} onClick={() => onView(user)} />
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </GlassPanel>
  );
}

function OrgNode({
  usuario,
  isRoot,
  onClick,
}: {
  usuario: Usuario;
  isRoot: boolean;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'flex flex-col items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer min-w-40',
        'bg-muted/4 border-border/15 hover:border-border/30 hover:-translate-y-0.5',
        isRoot && 'bg-primary/6 border-primary/20 min-w-50',
      )}
    >
      <Avatar className={cn('border-2 border-background', isRoot ? 'size-12' : 'size-10')}>
        <AvatarImage src={getAvatarUrl(usuario.avatarUrl) || undefined} alt={usuario.nomeExibicao} />
        <AvatarFallback className={cn('font-semibold', isRoot ? 'text-base' : 'text-sm')}>
          {getInitials(usuario.nomeExibicao)}
        </AvatarFallback>
      </Avatar>
      <div className="text-sm font-semibold mt-2 text-center">{usuario.nomeExibicao}</div>
      <div className="text-[10px] text-muted-foreground/40 mt-0.5">{usuario.cargo?.nome ?? 'Sem cargo'}</div>
    </div>
  );
}

function groupByLevel(usuarios: Usuario[]): { label: string; members: Usuario[] }[] {
  const map = new Map<string, Usuario[]>();

  for (const u of usuarios) {
    const cargo = u.cargo?.nome ?? 'Sem cargo';
    const arr = map.get(cargo) ?? [];
    arr.push(u);
    map.set(cargo, arr);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => getCargoLevel(a) - getCargoLevel(b))
    .map(([cargo, members]) => ({ label: cargo, members }));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/list/usuarios-org-view.tsx
git commit -m "feat(usuarios): add UsuariosOrgView with flat-by-cargo hierarchy"
```

---

## Task 12: Unified Client (usuarios-client.tsx)

**Files:**
- Create: `src/app/(authenticated)/usuarios/components/usuarios-client.tsx`
- Update: `src/app/(authenticated)/usuarios/page.tsx`
- Update: `src/app/(authenticated)/usuarios/index.ts`

- [ ] **Step 1: Create unified client component**

```tsx
// src/app/(authenticated)/usuarios/components/usuarios-client.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';
import { InsightBanner } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import {
  useUsuarios,
  UsuarioCreateDialog,
  CargosManagementDialog,
} from '@/app/(authenticated)/usuarios';
import { useCargos } from '@/app/(authenticated)/cargos';
import { UserKpiStrip } from './list/user-kpi-strip';
import { UsuariosToolbar, type UsuariosViewMode } from './list/usuarios-toolbar';
import { UsuariosGridView } from './list/usuarios-grid-view';
import { UsuariosListView } from './list/usuarios-list-view';
import { calcularCompleteness } from './shared/completeness-utils';
import type { Usuario } from '../domain';

// Lazy-load organograma (heaviest view)
const UsuariosOrgView = React.lazy(() =>
  import('./list/usuarios-org-view').then((m) => ({ default: m.UsuariosOrgView })),
);

export function UsuariosClient() {
  const router = useRouter();

  // State
  const [viewMode, setViewMode] = React.useState<UsuariosViewMode>('grid');
  const [activeTab, setActiveTab] = React.useState('todos');
  const [search, setSearch] = React.useState('');
  const [cargoFiltro, setCargoFiltro] = React.useState('all');
  const [grouped, setGrouped] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [cargosOpen, setCargosOpen] = React.useState(false);

  const searchDebounced = useDebounce(search, 500);

  // Data
  const { usuarios, isLoading, refetch } = useUsuarios({
    busca: searchDebounced || undefined,
  });
  const { cargos } = useCargos();

  // Derived counts
  const counts = React.useMemo(() => ({
    total: usuarios.length,
    ativos: usuarios.filter((u) => u.ativo).length,
    inativos: usuarios.filter((u) => !u.ativo).length,
    comOab: usuarios.filter((u) => u.oab?.trim()).length,
  }), [usuarios]);

  // Filter by active tab + cargo
  const filteredUsuarios = React.useMemo(() => {
    let filtered = usuarios;

    if (activeTab === 'ativos') filtered = filtered.filter((u) => u.ativo);
    else if (activeTab === 'inativos') filtered = filtered.filter((u) => !u.ativo);
    else if (activeTab === 'com-oab') filtered = filtered.filter((u) => u.oab?.trim());

    if (cargoFiltro !== 'all') {
      const cargoId = parseInt(cargoFiltro, 10);
      filtered = filtered.filter((u) => u.cargoId === cargoId);
    }

    return filtered;
  }, [usuarios, activeTab, cargoFiltro]);

  // Incomplete profiles count
  const incompletosCount = React.useMemo(() =>
    usuarios.filter((u) => u.ativo && calcularCompleteness(u).score < 70).length,
  [usuarios]);

  // Cargo options for filter
  const cargosOptions = React.useMemo(() =>
    cargos.map((c) => ({ value: c.id.toString(), label: c.nome })),
  [cargos]);

  // Subtitle
  const subtitle = `${counts.total} membros · ${counts.ativos} ativos · ${cargos.length} cargos`;

  // Handlers
  const handleView = React.useCallback(
    (usuario: Usuario) => router.push(`/app/usuarios/${usuario.id}`),
    [router],
  );

  const handleCreateSuccess = React.useCallback(() => refetch(), [refetch]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Heading level="page">Usuários</Heading>
          <p className="text-sm text-muted-foreground/50 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" className="h-9" onClick={() => setCargosOpen(true)}>
            <Settings className="size-4" />
            Cargos
          </Button>
          <Button className="h-9" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      {!isLoading && <UserKpiStrip usuarios={usuarios} />}

      {/* Insight Banner */}
      {!isLoading && incompletosCount > 0 && (
        <InsightBanner type="warning">
          <strong>{incompletosCount} usuário{incompletosCount > 1 ? 's' : ''}</strong> com perfil
          incompleto — telefone, OAB ou endereço não preenchidos.
        </InsightBanner>
      )}

      {/* Toolbar */}
      <UsuariosToolbar
        counts={counts}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={(m) => setViewMode(m as UsuariosViewMode)}
        cargoFiltro={cargoFiltro}
        onCargoFiltroChange={setCargoFiltro}
        cargosOptions={cargosOptions}
      />

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {viewMode === 'grid' && (
            <UsuariosGridView
              usuarios={filteredUsuarios}
              grouped={grouped}
              onView={handleView}
            />
          )}
          {viewMode === 'lista' && (
            <UsuariosListView
              usuarios={filteredUsuarios}
              onView={handleView}
            />
          )}
          {viewMode === 'organograma' && (
            <React.Suspense
              fallback={
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" />
                  ))}
                </div>
              }
            >
              <UsuariosOrgView usuarios={filteredUsuarios} onView={handleView} />
            </React.Suspense>
          )}
        </>
      )}

      {/* Dialogs */}
      <CargosManagementDialog open={cargosOpen} onOpenChange={setCargosOpen} />
      {createOpen && (
        <UsuarioCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update page.tsx to use new client**

```tsx
// src/app/(authenticated)/usuarios/page.tsx
import { UsuariosClient } from './components/usuarios-client';

export default function UsuariosPage() {
  return <UsuariosClient />;
}
```

- [ ] **Step 3: Update barrel exports in index.ts**

Add the new exports to `src/app/(authenticated)/usuarios/index.ts`:

```typescript
// Replace the old UsuariosPageContent export:
// export { UsuariosPageContent } from "./components/usuarios-page-content";
// With:
export { UsuariosClient } from "./components/usuarios-client";
```

Also add new component exports:

```typescript
// New shared components
export { UserCompletenessRing } from "./components/shared/user-completeness-ring";
export { UserStatusDot, getStatusFromLastLogin } from "./components/shared/user-status-dot";
export { RoleBanner, getRoleBannerGradient } from "./components/shared/role-banner";
export { calcularCompleteness, getCompletenessColor } from "./components/shared/completeness-utils";
```

- [ ] **Step 4: Verify the app compiles**

Run: `npm run type-check`
Expected: No type errors in the usuarios module.

- [ ] **Step 5: Start dev server and test**

Run: `npm run dev`

Verify in browser at `/app/usuarios`:
1. Page title says "Usuários" (not "Equipe")
2. KPI strip shows 4 glass cards with animated numbers
3. Toolbar has TabPills, Search, ViewToggle with 3 options
4. Grid view shows Glass cards with banners and rings
5. Lista view shows DataTable
6. Organograma view loads lazily with hierarchy by cargo
7. Insight banner appears if there are incomplete profiles

- [ ] **Step 6: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/usuarios-client.tsx \
       src/app/(authenticated)/usuarios/page.tsx \
       src/app/(authenticated)/usuarios/index.ts
git commit -m "feat(usuarios): unified client with Grid/Lista/Organograma views and Glass Briefing"
```

---

## Task 13: Profile Sidebar Component

**Files:**
- Create: `src/app/(authenticated)/usuarios/components/detail/profile-sidebar.tsx`

- [ ] **Step 1: Create sticky sidebar**

```tsx
// src/app/(authenticated)/usuarios/components/detail/profile-sidebar.tsx
'use client';

import { useState } from 'react';
import { Mail, Phone, Building, Calendar, RefreshCw, Pencil, KeyRound, Power, Camera } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAvatarUrl, formatarOab, formatarData } from '../../utils';
import { RoleBanner } from '../shared/role-banner';
import { UserStatusDot, getStatusFromLastLogin } from '../shared/user-status-dot';
import { UserCompletenessRing } from '../shared/user-completeness-ring';
import { calcularCompleteness, getCompletenessColor } from '../shared/completeness-utils';
import type { Usuario } from '../../domain';

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface ProfileSidebarProps {
  usuario: Usuario;
  lastLoginAt?: string | null;
  onEditAvatar: () => void;
  onEditCover: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onDeactivate: () => void;
}

export function ProfileSidebar({
  usuario,
  lastLoginAt,
  onEditAvatar,
  onEditCover,
  onEdit,
  onResetPassword,
  onDeactivate,
}: ProfileSidebarProps) {
  const { items, score } = calcularCompleteness(usuario);
  const status = getStatusFromLastLogin(lastLoginAt ?? null);
  const completenessColor = getCompletenessColor(score);
  const cargoNome = usuario.cargo?.nome;
  const temOab = !!(usuario.oab?.trim() && usuario.ufOab);

  return (
    <GlassPanel depth={1} className="overflow-hidden sticky top-6 self-start p-0">
      {/* Cover */}
      <div className="relative">
        <RoleBanner cargoNome={cargoNome} height="h-[100px]" />
        <button
          onClick={onEditCover}
          className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-black/30 backdrop-blur-sm border border-white/10 text-[11px] text-white/70 hover:text-white/90 transition-colors"
        >
          <Camera className="size-3 inline mr-1" />
          Editar
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center -mt-11 px-5 relative z-2">
        <div
          className="relative cursor-pointer group"
          onClick={onEditAvatar}
        >
          <div className="relative">
            <UserCompletenessRing score={score} size={100} strokeWidth={2.5} />
            <Avatar className="size-22 border-4 border-background m-1.5">
              <AvatarImage src={getAvatarUrl(usuario.avatarUrl) || undefined} alt={usuario.nomeExibicao} />
              <AvatarFallback className="text-2xl font-semibold">
                {getInitials(usuario.nomeExibicao)}
              </AvatarFallback>
            </Avatar>
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-1.5 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="size-5 text-white" />
          </div>
          <div className="absolute bottom-1 right-1">
            <UserStatusDot status={usuario.ativo ? status : 'offline'} size="lg" />
          </div>
        </div>

        {/* Name & role */}
        <h2 className="text-lg font-bold mt-3 text-center">{usuario.nomeCompleto}</h2>
        <p className="text-xs text-muted-foreground/40 mt-0.5">{cargoNome || 'Sem cargo'}</p>

        {/* Badges */}
        <div className="flex gap-1.5 mt-2.5 flex-wrap justify-center">
          <Badge variant={usuario.ativo ? 'success' : 'outline'}>
            {usuario.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
          {usuario.isSuperAdmin && (
            <Badge variant="destructive" className="gap-1">Super Admin</Badge>
          )}
          {temOab && (
            <Badge variant="info">⚖ {formatarOab(usuario.oab, usuario.ufOab)}</Badge>
          )}
        </div>
      </div>

      {/* Contacts */}
      <div className="px-5 py-4 mt-4 border-t border-border/10 space-y-2.5">
        <ContactItem icon={Mail} value={usuario.emailCorporativo} />
        {usuario.telefone && <ContactItem icon={Phone} value={usuario.telefone} />}
        {usuario.ramal && <ContactItem icon={Building} value={`Ramal ${usuario.ramal}`} />}
        <ContactItem icon={Calendar} value={`Cadastro: ${formatarData(usuario.createdAt)}`} />
        {usuario.updatedAt && (
          <ContactItem icon={RefreshCw} value={`Atualizado: ${formatarData(usuario.updatedAt)}`} />
        )}
      </div>

      {/* Completeness */}
      <div className="px-5 py-3 border-t border-border/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 font-semibold">
            Perfil
          </span>
          <span className={cn(
            'text-xs font-bold',
            completenessColor === 'success' && 'text-success',
            completenessColor === 'warning' && 'text-warning',
            completenessColor === 'destructive' && 'text-destructive',
          )}>
            {score}%
          </span>
        </div>
        <div className="h-1 rounded-full bg-muted/30 overflow-hidden mb-2.5">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              completenessColor === 'success' && 'bg-success',
              completenessColor === 'warning' && 'bg-warning',
              completenessColor === 'destructive' && 'bg-destructive',
            )}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-[11px]">
              <span className={item.done ? 'text-success' : 'text-muted-foreground/40'}>
                {item.done ? '✓' : '○'}
              </span>
              <span className={item.done ? 'text-muted-foreground/40 line-through' : 'text-warning'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 py-4 border-t border-border/10 flex flex-col gap-1.5">
        <Button variant="outline" className="w-full justify-center gap-2 bg-primary/8 border-primary/20 text-primary hover:bg-primary/15" onClick={onEdit}>
          <Pencil className="size-3.5" />
          Editar Perfil
        </Button>
        <Button variant="outline" className="w-full justify-center gap-2" onClick={onResetPassword}>
          <KeyRound className="size-3.5" />
          Redefinir Senha
        </Button>
        {usuario.ativo && (
          <Button variant="outline" className="w-full justify-center gap-2 border-destructive/15 text-destructive hover:bg-destructive/8" onClick={onDeactivate}>
            <Power className="size-3.5" />
            Desativar Usuário
          </Button>
        )}
      </div>
    </GlassPanel>
  );
}

function ContactItem({ icon: Icon, value }: { icon: React.ElementType; value: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs">
      <Icon className="size-3.5 text-muted-foreground/35 shrink-0" />
      <span className="text-muted-foreground/55 truncate">{value}</span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/detail/profile-sidebar.tsx
git commit -m "feat(usuarios): add ProfileSidebar with cover, avatar ring, completeness, actions"
```

---

## Task 14: Activity Heatmap Component

**Files:**
- Create: `src/app/(authenticated)/usuarios/components/activities/activity-heatmap.tsx`

- [ ] **Step 1: Create SVG heatmap**

```tsx
// src/app/(authenticated)/usuarios/components/activities/activity-heatmap.tsx
'use client';

import * as React from 'react';
import { BarChart3 } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading } from '@/components/ui/typography';

interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
}

interface ActivityHeatmapProps {
  data: HeatmapDay[];
  weeks?: number; // default 26 (6 months)
}

const INTENSITY_CLASSES = [
  'fill-muted/8', // 0 actions
  'fill-primary/15', // low
  'fill-primary/30', // medium
  'fill-primary/50', // high
  'fill-primary/75', // max
];

function getIntensity(count: number, max: number): number {
  if (count === 0) return 0;
  if (max === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export function ActivityHeatmap({ data, weeks = 26 }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = React.useState<{ x: number; y: number; text: string } | null>(null);

  // Build grid: weeks x 7 days
  const today = new Date();
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const dataMap = new Map(data.map((d) => [d.date, d.count]));

  const grid: { date: string; count: number; intensity: number }[][] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const week: typeof grid[0] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - w * 7 - (6 - d));
      const dateStr = date.toISOString().split('T')[0];
      const count = dataMap.get(dateStr) ?? 0;
      week.push({ date: dateStr, count, intensity: getIntensity(count, maxCount) });
    }
    grid.push(week);
  }

  const cellSize = 12;
  const gap = 3;
  const svgWidth = grid.length * (cellSize + gap);
  const svgHeight = 7 * (cellSize + gap);

  if (data.length === 0) {
    return (
      <GlassPanel depth={1} className="p-5">
        <Heading level="widget" className="flex items-center gap-2 mb-3">
          <BarChart3 className="size-4" />
          Atividade
        </Heading>
        <p className="text-sm text-muted-foreground/40 text-center py-8">
          Sem atividade registrada nos últimos 6 meses.
        </p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel depth={1} className="p-5">
      <Heading level="widget" className="flex items-center gap-2 mb-3">
        <BarChart3 className="size-4" />
        Atividade (últimos {weeks > 26 ? 12 : 6} meses)
      </Heading>

      <div className="overflow-x-auto relative">
        <svg width={svgWidth} height={svgHeight} className="block">
          {grid.map((week, wi) =>
            week.map((day, di) => (
              <rect
                key={day.date}
                x={wi * (cellSize + gap)}
                y={di * (cellSize + gap)}
                width={cellSize}
                height={cellSize}
                rx={2}
                className={`${INTENSITY_CLASSES[day.intensity]} transition-all duration-150 cursor-pointer hover:stroke-primary/30 hover:stroke-1`}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 8,
                    text: `${day.date}: ${day.count} ação${day.count !== 1 ? 'ões' : ''}`,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            )),
          )}
        </svg>

        {tooltip && (
          <div
            className="fixed z-50 px-2 py-1 rounded-md bg-foreground text-background text-[10px] font-medium pointer-events-none -translate-x-1/2 -translate-y-full"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.text}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground/40">
        <span>Menos</span>
        {INTENSITY_CLASSES.map((cls, i) => (
          <svg key={i} width={cellSize} height={cellSize}>
            <rect width={cellSize} height={cellSize} rx={2} className={cls} />
          </svg>
        ))}
        <span>Mais</span>
      </div>
    </GlassPanel>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/activities/activity-heatmap.tsx
git commit -m "feat(usuarios): add ActivityHeatmap SVG component with tooltip"
```

---

## Task 15: UsuarioDetalhes Rewrite (Two-Column Layout)

**Files:**
- Rewrite: `src/app/(authenticated)/usuarios/[id]/usuario-detalhes.tsx`

- [ ] **Step 1: Rewrite with two-column layout**

This is the largest rewrite. The new component uses `ProfileSidebar` on the left and tabbed content on the right. It preserves all existing functionality (avatar edit, password reset, permissions, auth logs, activities) while adding the heatmap and Glass styling.

The component follows the same structure as the approved mockup (Section 4): sidebar with cover, avatar, contacts, completeness, actions + content with breadcrumb, TabPills, and tab content.

Key changes from current implementation:
- Replace `Card`-based header with `ProfileSidebar` component
- Replace `Tabs`/`TabsList`/`TabsTrigger` with `TabPills`
- Add `ActivityHeatmap` to Visão Geral tab
- Wrap data sections in `GlassPanel depth={1}`
- Add breadcrumb navigation
- Use `grid grid-cols-1 lg:grid-cols-[300px_1fr]` layout

The full implementation follows the patterns from the `ProfileSidebar` (Task 13) and reuses existing hooks (`useUsuario`, `useUsuarioPermissoes`) and dialog components (`AvatarEditDialog`, `UsuarioEditDialog`, `RedefinirSenhaDialog`, `PermissoesMatriz`).

Due to the size of this component (~400 lines), the implementation should read the current `usuario-detalhes.tsx` file and restructure it into the two-column layout while preserving all business logic (super admin toggle, permission saving, dialog management).

- [ ] **Step 2: Run type-check and dev server**

Run: `npm run type-check`
Run: `npm run dev`

Verify at `/app/usuarios/1` (or any valid ID):
1. Two-column layout renders (sidebar left, content right)
2. Sidebar shows cover, avatar with ring, contacts, completeness checklist
3. TabPills work for switching tabs
4. All existing features still work (edit, password, permissions, auth logs)
5. On mobile: layout stacks vertically

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/usuarios/[id]/usuario-detalhes.tsx
git commit -m "refactor(usuarios): rewrite profile page with two-column Glass Briefing layout"
```

---

## Task 16: AtividadesCards Glass Update

**Files:**
- Update: `src/app/(authenticated)/usuarios/components/activities/atividades-cards.tsx`

- [ ] **Step 1: Replace Card with GlassPanel depth=2**

Update `StatCard` to use `GlassPanel depth={2}` instead of plain `Card`. Replace `CardHeader`/`CardContent` with simple div structure. Add `IconContainer` for the icon. The KPI values should use `AnimatedNumber` for count-up animation. Add "Ver todos →" link below each value.

Key changes:
- `Card` → `GlassPanel depth={2}`
- Icon wrapper → `IconContainer size="md"`
- Value → `AnimatedNumber`
- Add link text "Ver todos →" with `text-primary text-[10px]`

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/activities/atividades-cards.tsx
git commit -m "refactor(usuarios): migrate AtividadesCards to Glass Briefing with AnimatedNumber"
```

---

## Task 17: AuthLogsTimeline Glass Update

**Files:**
- Update: `src/app/(authenticated)/usuarios/components/logs/auth-logs-timeline.tsx`

- [ ] **Step 1: Migrate to Glass styling**

Update the component:
- Wrap outer container in `GlassPanel depth={1}` instead of `Card`
- Replace `CardHeader`/`CardTitle` with `Heading level="widget"`
- Timeline event cards: use `bg-muted/4 border-border/15 rounded-xl` instead of `bg-card border`
- Timeline dots: use `IconContainer`-style circles with event-type colors
- Keep all existing logic and data fetching

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/logs/auth-logs-timeline.tsx
git commit -m "refactor(usuarios): migrate AuthLogsTimeline to Glass Briefing"
```

---

## Task 18: Permission Toggle & Role Presets

**Files:**
- Create: `src/app/(authenticated)/usuarios/components/permissions/permission-toggle.tsx`
- Create: `src/app/(authenticated)/usuarios/components/permissions/role-preset-select.tsx`

- [ ] **Step 1: Create PermissionToggle**

```tsx
// src/app/(authenticated)/usuarios/components/permissions/permission-toggle.tsx
'use client';

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface PermissionToggleProps {
  operacao: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  changed?: boolean; // Shows yellow diff dot when true
  onToggle: () => void;
}

export function PermissionToggle({
  operacao,
  label,
  checked,
  disabled,
  changed,
  onToggle,
}: PermissionToggleProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors',
        'hover:bg-muted/4',
        disabled && 'opacity-50 cursor-not-allowed',
        'relative',
      )}
    >
      <Switch
        checked={checked}
        onCheckedChange={() => !disabled && onToggle()}
        disabled={disabled}
        aria-label={`Permitir ${label}`}
      />
      <span className={cn('text-sm', !checked && 'text-muted-foreground/40')}>
        {label}
      </span>
      {changed && (
        <span className="absolute top-1 right-1 size-1.5 rounded-full bg-warning" />
      )}
    </label>
  );
}
```

- [ ] **Step 2: Create RolePresetSelect**

```tsx
// src/app/(authenticated)/usuarios/components/permissions/role-preset-select.tsx
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RolePresetSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Presets pré-definidos de permissões por cargo.
 * Cada preset define quais recursos/operações são permitidos.
 */
export const ROLE_PRESETS: Record<string, { label: string; description: string }> = {
  none: { label: '— Selecionar preset —', description: '' },
  advogado: { label: 'Advogado (padrão)', description: 'Acesso completo a processos, audiências e expedientes' },
  estagiario: { label: 'Estagiário (restrito)', description: 'Visualização e criação, sem deletar' },
  secretaria: { label: 'Secretária (operacional)', description: 'Gestão de agenda, partes e expedientes' },
  administrador: { label: 'Administrador (full)', description: 'Acesso total a todos os módulos' },
};

export function RolePresetSelect({ value, onValueChange, disabled }: RolePresetSelectProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] text-muted-foreground/40 shrink-0">Template de cargo:</span>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="h-8 w-56 text-xs bg-transparent">
          <SelectValue placeholder="Selecionar preset..." />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ROLE_PRESETS).map(([key, preset]) => (
            <SelectItem key={key} value={key}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/permissions/permission-toggle.tsx \
       src/app/(authenticated)/usuarios/components/permissions/role-preset-select.tsx
git commit -m "feat(usuarios): add PermissionToggle and RolePresetSelect components"
```

---

## Task 19: PermissoesMatriz Rewrite

**Files:**
- Rewrite: `src/app/(authenticated)/usuarios/components/permissions/permissoes-matriz.tsx`

- [ ] **Step 1: Rewrite with toggle switches, presets, and diff indicators**

Key changes from current implementation:
- Replace `Accordion` with flat grid layout using `GlassPanel depth={1}` per module group
- Replace `Checkbox` with `PermissionToggle` (uses `Switch` component)
- Add `RolePresetSelect` at the top
- Show diff indicators (yellow dot) on changed permissions using existing `hasChanges` state
- Count badges per group: green (full), blue (partial), gray (none)
- Replace `Card` wrapper with `GlassPanel depth={1}`
- Keep all existing business logic (`togglePermissao`, `save`, `resetar`)

Track which specific permissions changed by comparing current state against initial state for diff dots.

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/permissions/permissoes-matriz.tsx
git commit -m "refactor(usuarios): rewrite PermissoesMatriz with toggles, presets, diff indicators"
```

---

## Task 20: Dialog Updates

**Files:**
- Update: `src/app/(authenticated)/usuarios/components/forms/usuario-create-dialog.tsx`
- Update: `src/app/(authenticated)/usuarios/components/forms/usuario-edit-dialog.tsx`
- Update: `src/app/(authenticated)/usuarios/components/cargos/cargos-management-dialog.tsx`

- [ ] **Step 1: Update UsuarioCreateDialog — add wizard steps**

Add a step-based wizard with 3 steps:
1. Dados Pessoais (nome, CPF, RG, nascimento, gênero, senha)
2. Contato & Profissional (emails, telefone, ramal, cargo, OAB)
3. Endereço (CEP com auto-preenchimento, logradouro, número, etc.)

Add a step indicator at the top:
```tsx
<div className="flex items-center gap-2 mb-6">
  {['Dados Pessoais', 'Contato', 'Endereço'].map((label, i) => (
    <div key={label} className="flex items-center gap-2">
      <div className={cn(
        'size-7 rounded-full flex items-center justify-center text-xs font-semibold',
        i < step ? 'bg-success/15 text-success' :
        i === step ? 'bg-primary/15 text-primary' :
        'bg-muted/8 text-muted-foreground/40'
      )}>
        {i < step ? '✓' : i + 1}
      </div>
      <span className={cn('text-xs', i === step ? 'text-foreground' : 'text-muted-foreground/40')}>
        {label}
      </span>
      {i < 2 && <div className="w-8 h-px bg-border/20" />}
    </div>
  ))}
</div>
```

Keep existing form fields, just distribute them across steps. Add "Anterior" / "Próximo" / "Criar" buttons.

Migrate CEP auto-preenchimento from `UsuarioEditDialog` (already has `buscarEnderecoPorCep`).

- [ ] **Step 2: Update UsuarioEditDialog — glass sections**

- Replace all `border-t pt-4` separators with `GlassPanel depth={1}` containers
- Replace `<select>` nativo (gênero) with `Select` from shadcn/ui
- Replace the deactivation `Alert` with a glass-styled destructive panel
- Keep all existing logic (CEP lookup, avatar edit, form submission)

- [ ] **Step 3: Update CargosManagementDialog**

- Add user count badge per cargo: `{cargoUserCount} membros`
- Add color preview bar next to each cargo name in the list
- Keep existing CRUD logic

- [ ] **Step 4: Commit**

```bash
git add src/app/(authenticated)/usuarios/components/forms/usuario-create-dialog.tsx \
       src/app/(authenticated)/usuarios/components/forms/usuario-edit-dialog.tsx \
       src/app/(authenticated)/usuarios/components/cargos/cargos-management-dialog.tsx
git commit -m "refactor(usuarios): update dialogs with wizard steps, glass sections, cargo colors"
```

---

## Task 21: Final Cleanup & Exports

**Files:**
- Update: `src/app/(authenticated)/usuarios/index.ts`
- Delete or deprecate: `src/app/(authenticated)/usuarios/components/usuarios-page-content.tsx`

- [ ] **Step 1: Update barrel exports**

Update `index.ts` to export all new components and remove old `UsuariosPageContent`:

```typescript
// Remove:
// export { UsuariosPageContent } from "./components/usuarios-page-content";

// Add:
export { UsuariosClient } from "./components/usuarios-client";
export { UserCompletenessRing } from "./components/shared/user-completeness-ring";
export { UserStatusDot, getStatusFromLastLogin } from "./components/shared/user-status-dot";
export { RoleBanner, getRoleBannerGradient } from "./components/shared/role-banner";
export { calcularCompleteness, getCompletenessColor, getCompletenessColorClass } from "./components/shared/completeness-utils";
export { ActivityHeatmap } from "./components/activities/activity-heatmap";
export { ProfileSidebar } from "./components/detail/profile-sidebar";
export { PermissionToggle } from "./components/permissions/permission-toggle";
export { RolePresetSelect } from "./components/permissions/role-preset-select";
```

- [ ] **Step 2: Delete old page content file**

```bash
rm src/app/(authenticated)/usuarios/components/usuarios-page-content.tsx
```

- [ ] **Step 3: Run full verification**

```bash
npm run type-check
npm run build:ci
```

Expected: No errors.

- [ ] **Step 4: Visual verification in browser**

Run `npm run dev` and verify:

**Listing page (`/app/usuarios`):**
- [ ] Title says "Usuários"
- [ ] KPI strip with 4 glass cards and animated numbers
- [ ] Insight banner appears if incomplete profiles exist
- [ ] TabPills filter correctly (Todos/Ativos/Inativos/Com OAB)
- [ ] Search filters in real-time
- [ ] Grid view shows Glass cards with banners, rings, stats
- [ ] Lista view shows DataTable with avatars, badges, completeness bars
- [ ] Organograma loads lazily with hierarchy by cargo
- [ ] Empty states render correctly
- [ ] "Novo Usuário" dialog opens with wizard steps
- [ ] "Cargos" dialog opens with management interface

**Profile page (`/app/usuarios/[id]`):**
- [ ] Two-column layout (sidebar + content)
- [ ] Sidebar: cover, avatar with ring, status dot, badges, contacts, completeness checklist, actions
- [ ] TabPills switch between tabs
- [ ] Visão Geral: KPI cards + activity heatmap
- [ ] Dados: glass panels with field groups
- [ ] Atividades: glass KPI cards + recent activity
- [ ] Permissões: toggle switches + role presets + diff indicators
- [ ] Segurança: glass auth timeline + password reset
- [ ] All dialogs work (edit, avatar, password, permissions save)
- [ ] Mobile: layout stacks vertically

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(usuarios): complete Glass Briefing redesign with all views and features"
```
