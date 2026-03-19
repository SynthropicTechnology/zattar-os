'use client';

/**
 * Componente de celula para exibir processos relacionados a uma entidade
 * Usado nas tabelas de clientes, terceiros e representantes
 */

import * as React from 'react';
import Link from 'next/link';
import { CalendarDays, Scale, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import type { ProcessoRelacionado } from '../../types';
import { CopyButton } from './copy-button';
import { formatarData } from '../../utils/format';

interface ProcessosRelacionadosCellProps {
  processos: ProcessoRelacionado[];
  maxExibidos?: number;
}

/**
 * Formata o numero do processo para exibicao
 * Mantem o numero completo para melhor legibilidade
 */
function formatarNumeroProcesso(numero: string): string {
  if (!numero) return '';
  return numero;
}

export function ProcessosRelacionadosCell({
  processos,
  maxExibidos = 2,
}: ProcessosRelacionadosCellProps) {
  if (!processos || processos.length === 0) {
    return (
      <div className="min-h-10 flex items-center justify-center text-muted-foreground text-sm">
        -
      </div>
    );
  }

  // Mostrar apenas os primeiros N processos diretamente
  const processosExibidos = processos.slice(0, maxExibidos);
  const processosRestantes = processos.slice(maxExibidos);

  return (
    <div className="min-h-10 flex flex-col gap-1 py-1 min-w-0">
      {processosExibidos.map((processo) => (
        <ProcessoItem key={processo.processo_id} processo={processo} />
      ))}

      {processosRestantes.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              +{processosRestantes.length} mais
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2" align="start">
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Todos os processos ({processos.length})
              </p>
              {processos.map((processo) => (
                <ProcessoItem key={processo.processo_id} processo={processo} />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

/**
 * Formata o grau do processo para exibição
 */
function formatarGrau(grau: string | null | undefined): string {
  if (!grau) return '-';
  const grauMap: Record<string, string> = {
    primeiro_grau: '1º Grau',
    segundo_grau: '2º Grau',
    tribunal_superior: 'TST',
  };
  return grauMap[grau] || grau;
}

/**
 * Item individual de processo com HoverCard rico
 */
function ProcessoItem({ processo }: { processo: ProcessoRelacionado }) {
  const numeroFormatado = formatarNumeroProcesso(processo.numero_processo);

  // Determina a parte contrária baseado no polo do cliente
  // Se o cliente está no polo ATIVO, a parte contrária é do polo passivo (nome_parte_re)
  // Se o cliente está no polo PASSIVO, a parte contrária é do polo ativo (nome_parte_autora)
  const parteContraria =
    processo.polo === 'ATIVO'
      ? processo.nome_parte_re
      : processo.nome_parte_autora;

  return (
    <div className="flex items-start gap-1 min-w-0 max-w-full">
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <Link
            href={`/app/processos/${processo.processo_id}`}
            className="inline-flex items-center text-xs min-h-6 px-2 py-0.5 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-w-0"
          >
            <span className="break-all">{numeroFormatado}</span>
          </Link>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-80 p-3">
          <div className="space-y-3">
            {/* Header: Grau e Status */}
            <div className="flex items-center justify-between gap-2">
              <SemanticBadge category="grau" value={processo.grau} className="text-xs">
                {formatarGrau(processo.grau)}
              </SemanticBadge>
              {processo.codigo_status_processo && (
                <SemanticBadge category="status" value={processo.codigo_status_processo} className="text-xs">
                  {processo.codigo_status_processo}
                </SemanticBadge>
              )}
            </div>

            {/* Parte Contrária */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>Parte contrária</span>
              </div>
              <p className="text-sm font-medium truncate" title={parteContraria || undefined}>
                {parteContraria || '-'}
              </p>
            </div>

            {/* Classe Judicial */}
            {processo.classe_judicial && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Scale className="h-3 w-3" />
                  <span>Classe</span>
                </div>
                <p className="text-sm truncate" title={processo.classe_judicial}>
                  {processo.classe_judicial}
                </p>
              </div>
            )}

            {/* Próxima Audiência */}
            {processo.data_proxima_audiencia && (
              <div className="flex items-center gap-1.5 pt-1 border-t text-xs">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Próxima audiência:</span>
                <span className="font-medium">{formatarData(processo.data_proxima_audiencia)}</span>
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
      <CopyButton text={processo.numero_processo} label="Copiar número do processo" />
    </div>
  );
}
