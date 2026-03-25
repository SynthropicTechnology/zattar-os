'use client';

/**
 * CopilotGlobalActions
 *
 * Componente que registra ações globais e estado legível do CopilotKit.
 * Deve ser usado dentro do CopilotKit provider.
 *
 * Registra:
 * - Ações de navegação entre módulos
 * - Ações de visualização (tabela/cards, sidebar, refresh)
 * - Contexto de rota atual (useCopilotReadable)
 */

import { useNavegacaoActions } from '../actions/navegacao.actions';
import { useVisualizacaoActions } from '../actions/visualizacao.actions';
import { useCopilotRouteContext } from '../hooks/use-copilot-route-context';
import { useCopilotDomainContext } from '../hooks/use-copilot-domain-context';
import { useCopilotRenderActions } from './copilot-render-actions';

interface CopilotGlobalActionsProps {
  /** Função para toggle da sidebar (opcional) */
  onToggleSidebar?: () => void;
}

export function CopilotGlobalActions({ onToggleSidebar }: CopilotGlobalActionsProps) {
  // Registra contexto de rota atual como readable state
  useCopilotRouteContext();

  // Registra ações de navegação (sempre disponíveis)
  useNavegacaoActions();

  // Registra ações de visualização globais
  useVisualizacaoActions({
    onToggleSidebar,
  });

  // Registra instruções de domínio + sugestões contextuais por módulo
  useCopilotDomainContext();

  // Registra ações com Generative UI (render inline no chat)
  useCopilotRenderActions();

  // Componente não renderiza nada visualmente
  return null;
}
