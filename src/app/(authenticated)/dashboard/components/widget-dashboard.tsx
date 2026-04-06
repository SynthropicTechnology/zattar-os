'use client';

import React, { useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';
import { usePermissoes } from '@/providers/user-provider';
import { DashboardProvider } from '../hooks/use-dashboard';
import { useWidgetLayout } from '../hooks/use-widget-layout';
import { GlassPanel } from '@/components/shared/glass-panel';
import { WidgetPicker, type WidgetDefinition } from './widget-picker';
import { Button } from '@/components/ui/button';

// ─── Registry import (gerado por agent paralelo) ────────────────────────────
// Se o arquivo ainda não existir no momento do build, o dashboard renderiza
// um estado vazio sem quebrar a aplicação.
let WIDGET_REGISTRY: WidgetDefinition[] = [];
let DEFAULT_LAYOUT: string[] = [];
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('../registry/widget-registry') as {
    WIDGET_REGISTRY?: WidgetDefinition[];
    DEFAULT_LAYOUT?: string[];
  };
  WIDGET_REGISTRY = mod.WIDGET_REGISTRY ?? [];
  DEFAULT_LAYOUT = mod.DEFAULT_LAYOUT ?? [];
} catch {
  // Registry ainda nao existe — dashboard exibe estado vazio
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSaudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getColSpanClass(size: WidgetDefinition['size']): string {
  switch (size) {
    case 'xs':
      return 'lg:col-span-1';
    case 'half':
      return 'lg:col-span-3';
    case 'md':
    case 'lg':
      return 'md:col-span-2 lg:col-span-4';
    case 'full':
      return 'md:col-span-2 lg:col-span-6';
    default: // sm
      return 'lg:col-span-2 min-h-[15rem]';
  }
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface WidgetDashboardProps {
  currentUserId: number;
  currentUserName: string;
  initialData?: import('../domain').DashboardData | null;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function WidgetDashboard({ currentUserId, currentUserName, initialData }: WidgetDashboardProps) {
  const { temPermissao } = usePermissoes();
  const {
    enabledWidgets,
    hasCustomized,
    toggleWidget,
    setWidgets,
    resetToDefaults,
  } = useWidgetLayout(currentUserId);

  // Filtrar registry pelas permissoes do usuario
  const availableWidgets = useMemo<WidgetDefinition[]>(
    () =>
      WIDGET_REGISTRY.filter(
        (w) =>
          w.permission === null ||
          temPermissao(w.permission.recurso, w.permission.operacao)
      ),
    [temPermissao]
  );

  // Determinar quais widgets renderizar e em qual ORDEM.
  // - Sem customização: usar DEFAULT_LAYOUT (ordenado para grid perfeito)
  // - Com customização: usar enabledWidgets, mas ORDENAR de acordo com o WIDGET_REGISTRY original
  //   para manter o agrupamento conceitual (todos os financeiros juntos, processos juntos, etc.)
  // Em ambos os casos, filtrar por availableWidgets (permissão).
  const visibleWidgets = useMemo<WidgetDefinition[]>(() => {
    const availableIds = new Set(availableWidgets.map((w) => w.id));
    const widgetMap = new Map(availableWidgets.map((w) => [w.id, w]));

    const orderedIds = hasCustomized ? enabledWidgets : DEFAULT_LAYOUT;

    const filtered = orderedIds
      .filter((id) => availableIds.has(id))
      .map((id) => widgetMap.get(id)!)
      .filter(Boolean);

    // Se personalizado, ordenar usando o índice original no WIDGET_REGISTRY
    // Isso garante o agrupamento conceitual solicitado (todos os módulos juntos)
    if (hasCustomized) {
      return filtered.sort(
        (a, b) =>
          WIDGET_REGISTRY.findIndex((w) => w.id === a.id) -
          WIDGET_REGISTRY.findIndex((w) => w.id === b.id)
      );
    }

    return filtered;
  }, [availableWidgets, enabledWidgets, hasCustomized]);

  // IDs efetivos para o picker (considera defaults quando não personalizado)
  const effectiveEnabledIds = useMemo<string[]>(() => {
    if (!hasCustomized) {
      return DEFAULT_LAYOUT.filter((id) =>
        availableWidgets.some((w) => w.id === id)
      );
    }
    return enabledWidgets;
  }, [availableWidgets, enabledWidgets, hasCustomized]);

  const saudacao = getSaudacao();
  const primeiroNome = currentUserName.split(' ')[0] ?? currentUserName;

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).replace(/^\w/, (c) => c.toUpperCase());

  return (
    <DashboardProvider initialData={initialData}>
    <div className="space-y-5 pb-8">
      {/* ── Cabecalho ───────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-page-title">
            {saudacao}, {primeiroNome}.
          </h1>
          <p className="text-sm text-muted-foreground/60 mt-0.5">
            {hoje} &mdash;{' '}
            {visibleWidgets.length === 0
              ? 'nenhum widget ativo'
              : `${visibleWidgets.length} widget${visibleWidgets.length !== 1 ? 's' : ''} ativo${visibleWidgets.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <WidgetPicker
          availableWidgets={availableWidgets}
          enabledWidgets={effectiveEnabledIds}
          onToggle={(id) => {
            // Na primeira interação, inicializar a partir do DEFAULT_LAYOUT
            // para não partir de uma lista vazia ao desativar o primeiro widget.
            if (!hasCustomized) {
              const defaultIds = DEFAULT_LAYOUT.filter((wId) =>
                availableWidgets.some((w) => w.id === wId)
              );
              const next = defaultIds.includes(id)
                ? defaultIds.filter((d) => d !== id)
                : [...defaultIds, id];
              setWidgets(next);
              return;
            }
            toggleWidget(id);
          }}
          onResetDefaults={resetToDefaults}
        />
      </div>

      {/* ── Grid de widgets ─────────────────────────────────────── */}
      {visibleWidgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 auto-rows-auto">
          {visibleWidgets.map((widget) => {
            const WidgetComponent = widget.component;
            return (
              <div
                key={widget.id}
                className={getColSpanClass(widget.size)}
              >
                <WidgetComponent />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState onOpenPicker={undefined} />
      )}
    </div>
    </DashboardProvider>
  );
}

// ─── Estado vazio ─────────────────────────────────────────────────────────────

function EmptyState({ onOpenPicker }: { onOpenPicker?: () => void }) {
  return (
    <GlassPanel depth={1} className="p-12">
      <div className="flex flex-col items-center justify-center text-center gap-4">
        <div className="size-14 rounded-2xl border border-border/20 bg-white/3 flex items-center justify-center">
          <LayoutGrid className="size-6 text-muted-foreground/55" />
        </div>
        <div>
          <p className="font-heading text-base font-semibold text-foreground/70">
            Nenhum widget selecionado
          </p>
          <p className="text-sm text-muted-foreground/50 mt-1 max-w-xs">
            Clique em{' '}
            <span className="font-medium text-foreground/60">Personalizar</span>{' '}
            para escolher quais informacoes exibir no seu painel.
          </p>
        </div>
        {onOpenPicker && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPicker}
            className="gap-2 border-border/30 bg-transparent hover:bg-white/5"
          >
            <LayoutGrid className="size-3.5" />
            Personalizar
          </Button>
        )}
      </div>
    </GlassPanel>
  );
}
