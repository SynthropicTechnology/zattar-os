/**
 * ParteBadge - Componente padronizado para renderização de partes processuais
 *
 * @module parte-badge
 * @category UI Components
 *
 * @ai-context PADRÃO OBRIGATÓRIO para renderização de partes processuais
 *
 * Este componente é o PADRÃO OFICIAL do sistema para exibir nomes de partes processuais
 * em listas de processos, audiências, expedientes e perícias.
 *
 * **IMPORTANTE**: Sempre que for exibir nomes de partes processuais (Autor/Réu, Reclamante/Reclamado),
 * você DEVE usar este componente ao invés de criar badges manuais ou usar AppBadge diretamente.
 *
 * ## Uso Obrigatório
 *
 * Este componente DEVE ser usado em:
 * - Tabelas de processos
 * - Tabelas de audiências
 * - Tabelas de expedientes
 * - Tabelas de perícias
 * - Qualquer visualização que mostre partes de um processo
 *
 * ## Características
 *
 * - Exibe um indicador circular colorido (avatar-icon) ao lado do nome
 * - Polo ATIVO (Reclamante/Autor) = azul (sky-600)
 * - Polo PASSIVO (Reclamado/Réu) = vermelho (red-600)
 * - Layout limpo: círculo pequeno + texto em cor normal
 * - Suporta trunc do texto para nomes longos
 * - Tooltip automático com o nome completo quando truncado
 *
 * ## Exemplos de Uso
 *
 * ```tsx
 * // Polo Ativo (Reclamante/Autor)
 * <ParteBadge polo="ATIVO">
 *   {processo.nomeParteAutora || '-'}
 * </ParteBadge>
 *
 * // Polo Passivo (Reclamado/Réu)
 * <ParteBadge polo="PASSIVO">
 *   {processo.nomeParteRe || '-'}
 * </ParteBadge>
 *
 * // Com truncamento e tooltip
 * <ParteBadge polo="ATIVO" truncate maxWidth="200px">
 *   {processo.nomeParteAutora || '-'}
 * </ParteBadge>
 * ```
 *
 * ## Regras de Implementação
 *
 * ✅ **FAÇA**:
 * ```tsx
 * // Use ParteBadge com polo especificado
 * <ParteBadge polo="ATIVO">{nomeAutor}</ParteBadge>
 * <ParteBadge polo="PASSIVO">{nomeReu}</ParteBadge>
 * ```
 *
 * @example
 * // Em uma coluna de tabela de processos:
 * <div className="flex flex-col gap-1">
 *   <ParteBadge polo="ATIVO">
 *     {processo.nomeParteAutora || '-'}
 *   </ParteBadge>
 *   <ParteBadge polo="PASSIVO">
 *     {processo.nomeParteRe || '-'}
 *   </ParteBadge>
 * </div>
 */

import * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Polo processual válido para partes
 */
export type PoloProcessual = 'ATIVO' | 'PASSIVO' | 'AUTOR' | 'REU' | 'RECLAMANTE' | 'RECLAMADO';

export interface ParteBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Polo processual da parte
   * - ATIVO, AUTOR, RECLAMANTE = azul (info)
   * - PASSIVO, REU, RECLAMADO = vermelho (destructive)
   */
  polo: PoloProcessual;

  /**
   * Nome da parte a ser exibido
   */
  children: React.ReactNode;

  /**
   * Se true, trunca o texto e mostra tooltip com nome completo
   * @default false
   */
  truncate?: boolean;

  /**
   * Largura máxima do badge quando truncate=true
   * @default "200px"
   */
  maxWidth?: string;

  /**
   * Classes CSS adicionais
   */
  className?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

const POLO_ATIVO_VALUES: ReadonlySet<string> = new Set(['ATIVO', 'AUTOR', 'RECLAMANTE', 'REQUERENTE']);

function isPoloAtivo(polo: string): boolean {
  return POLO_ATIVO_VALUES.has(polo);
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ParteBadge - Componente padronizado para nomes de partes processuais
 *
 * Exibe um indicador circular colorido (avatar-icon) seguido do nome da parte.
 * Azul = polo ativo (autor/reclamante), Vermelho = polo passivo (réu/reclamado).
 *
 * @ai-context Use SEMPRE este componente para renderizar partes processuais.
 * Não use AppBadge, Badge ou elementos HTML com cores hardcoded.
 */
export function ParteBadge({
  polo,
  children,
  truncate = false,
  maxWidth = '200px',
  className,
  ...props
}: ParteBadgeProps) {
  const content = children?.toString() || '';
  const shouldShowTooltip = truncate && content && content !== '-';
  const ativo = isPoloAtivo(polo);

  const badgeContent = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        truncate && 'max-w-full',
        className
      )}
      style={truncate ? { maxWidth } : undefined}
      {...props}
    >
      <span
        className={cn(
          'shrink-0 rounded-full size-3.5',
          ativo
            ? 'bg-info dark:bg-info'
            : 'bg-destructive dark:bg-destructive'
        )}
        aria-label={ativo ? 'Polo ativo' : 'Polo passivo'}
        role="img"
      />
      <span
        className={cn(
          'text-foreground',
          truncate && 'overflow-hidden text-ellipsis whitespace-nowrap'
        )}
      >
        {children}
      </span>
    </span>
  );

  if (shouldShowTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badgeContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{content}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeContent;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * ParteAutorBadge - Badge pré-configurado para Autor/Reclamante (polo ativo)
 *
 * @example
 * <ParteAutorBadge>{processo.nomeParteAutora}</ParteAutorBadge>
 */
export function ParteAutorBadge(props: Omit<ParteBadgeProps, 'polo'>) {
  return <ParteBadge polo="ATIVO" {...props} />;
}

/**
 * ParteReuBadge - Badge pré-configurado para Réu/Reclamado (polo passivo)
 *
 * @example
 * <ParteReuBadge>{processo.nomeParteRe}</ParteReuBadge>
 */
export function ParteReuBadge(props: Omit<ParteBadgeProps, 'polo'>) {
  return <ParteBadge polo="PASSIVO" {...props} />;
}
