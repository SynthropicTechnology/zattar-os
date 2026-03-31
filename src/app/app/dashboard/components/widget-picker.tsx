'use client';

import React, { useMemo } from 'react';
import {
  LayoutGrid,
  Scale,
  Calendar,
  FileText,
  Wallet,
  Users,
  CheckSquare,
  RotateCcw,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

// ─── Tipo local (espelhado do registry) ─────────────────────────────────────

export interface WidgetDefinition {
  id: string;
  title: string;
  description: string;
  module: string;
  size: 'sm' | 'md' | 'lg' | 'full';
  defaultEnabled: boolean;
  component: React.ComponentType;
  permission: { recurso: string; operacao: string } | null;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface WidgetPickerProps {
  availableWidgets: WidgetDefinition[];
  enabledWidgets: string[];
  onToggle: (widgetId: string) => void;
  onResetDefaults: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getModuleLabel(module: string): string {
  const labels: Record<string, string> = {
    processos: 'Processos',
    audiencias: 'Audiencias',
    expedientes: 'Expedientes',
    financeiro: 'Financeiro',
    rh: 'Pessoal',
    captura: 'Captura',
    geral: 'Geral',
  };
  return labels[module] ?? module;
}

function getModuleIcon(module: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    processos: <Scale className="size-3.5" />,
    audiencias: <Calendar className="size-3.5" />,
    expedientes: <FileText className="size-3.5" />,
    financeiro: <Wallet className="size-3.5" />,
    rh: <Users className="size-3.5" />,
    captura: <CheckSquare className="size-3.5" />,
    geral: <LayoutGrid className="size-3.5" />,
  };
  return icons[module] ?? <LayoutGrid className="size-3.5" />;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function WidgetPicker({
  availableWidgets,
  enabledWidgets,
  onToggle,
  onResetDefaults,
}: WidgetPickerProps) {
  // Agrupar widgets por módulo, mantendo ordem de inserção
  const groupedWidgets = useMemo(() => {
    const groups = new Map<string, WidgetDefinition[]>();
    for (const widget of availableWidgets) {
      const existing = groups.get(widget.module) ?? [];
      groups.set(widget.module, [...existing, widget]);
    }
    return groups;
  }, [availableWidgets]);

  const activeCount = enabledWidgets.length;
  const totalCount = availableWidgets.length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs font-medium border-border/30 bg-transparent hover:bg-white/5 backdrop-blur-sm"
          aria-label="Personalizar dashboard"
        >
          <LayoutGrid className="size-3.5" />
          Personalizar
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:w-96 flex flex-col gap-0 p-0 bg-background/95 backdrop-blur-xl border-l border-border/20"
      >
        <SheetHeader className="px-5 pt-6 pb-4 border-b border-border/10">
          <SheetTitle className="font-heading text-base font-semibold">
            Personalizar Dashboard
          </SheetTitle>
          <SheetDescription className="not-sr-only text-sm text-muted-foreground/60 mt-0.5">
            Escolha quais widgets exibir
          </SheetDescription>
        </SheetHeader>

        {/* Resumo + reset */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/10">
          <p className="text-xs text-muted-foreground/60">
            <span className="font-semibold text-foreground">{activeCount}</span>
            {' '}de{' '}
            <span className="font-semibold text-foreground">{totalCount}</span>
            {' '}widgets ativos
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetDefaults}
            className="gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground h-7 px-2"
            aria-label="Restaurar configuração padrão"
          >
            <RotateCcw className="size-3" />
            Restaurar padrão
          </Button>
        </div>

        {/* Lista de widgets agrupada por módulo */}
        <div className="flex-1 overflow-y-auto">
          {Array.from(groupedWidgets.entries()).map(([module, widgets]) => (
            <div key={module} className="border-b border-border/10 last:border-0">
              {/* Cabeçalho do grupo */}
              <div className="flex items-center gap-2 px-5 py-3 bg-muted/5">
                <span className="text-muted-foreground/50">
                  {getModuleIcon(module)}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  {getModuleLabel(module)}
                </span>
              </div>

              {/* Widgets do grupo */}
              <div className="divide-y divide-border/5">
                {widgets.map((widget) => {
                  const isEnabled = enabledWidgets.includes(widget.id);
                  return (
                    <label
                      key={widget.id}
                      htmlFor={`widget-toggle-${widget.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-white/3 transition-colors duration-150"
                    >
                      <Switch
                        id={`widget-toggle-${widget.id}`}
                        checked={isEnabled}
                        onCheckedChange={() => onToggle(widget.id)}
                        aria-label={`${isEnabled ? 'Desativar' : 'Ativar'} widget ${widget.title}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">
                          {widget.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground/50 mt-0.5 truncate">
                          {widget.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {availableWidgets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
              <LayoutGrid className="size-8 text-muted-foreground/45 mb-3" />
              <p className="text-sm text-muted-foreground/50">
                Nenhum widget disponivel para o seu perfil.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
