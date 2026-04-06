/**
 * GlassPanel — Container com efeito de vidro para hierarquia visual.
 * ============================================================================
 * Componente fundamental do Design System Zattar que implementa o sistema
 * de profundidade Glass (depth 1-3) para criar hierarquia visual em cards,
 * widgets e painéis.
 *
 * Os estilos de glass (glass-widget, glass-kpi) são definidos em globals.css
 * com variantes automáticas para light/dark mode.
 *
 * Tokens correspondentes: GLASS_DEPTH, GLASS_BASE em @/lib/design-system
 *
 * USO:
 *   <GlassPanel depth={1} className="p-5">Conteúdo</GlassPanel>
 *   <WidgetContainer title="Métricas" icon={BarChart3}>Conteúdo</WidgetContainer>
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Heading } from '@/components/ui/typography';

// ─── Glass Panel ────────────────────────────────────────────────────────

export interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Nível de profundidade visual:
   * - 1: glass-widget — container padrão, mais transparente (widgets, cards)
   * - 2: glass-kpi — mais opaco, melhor legibilidade (métricas, KPIs)
   * - 3: primary tint — destaque máximo com backdrop-blur (chamadas à ação)
   */
  depth?: 1 | 2 | 3;
}

const DEPTH_STYLES = {
  1: 'glass-widget bg-transparent border-border/20',
  2: 'glass-kpi bg-transparent border-border/30',
  3: 'bg-primary/[0.04] backdrop-blur-xl border-primary/10',
} as const;

export function GlassPanel({
  children,
  className,
  depth = 1,
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-300 flex flex-col',
        DEPTH_STYLES[depth],
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── Widget Container (GlassPanel + header padrão) ──────────────────────

export interface WidgetContainerProps {
  title: string;
  icon?: LucideIcon;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  depth?: 1 | 2 | 3;
}

export function WidgetContainer({
  title,
  icon: Icon,
  subtitle,
  action,
  children,
  className,
  depth = 1,
}: WidgetContainerProps) {
  return (
    <GlassPanel depth={depth} className={cn('p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-4 text-muted-foreground/50" />}
          <div>
            <Heading level="widget">{title}</Heading>
            {subtitle && <p className="text-widget-sub">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </GlassPanel>
  );
}
