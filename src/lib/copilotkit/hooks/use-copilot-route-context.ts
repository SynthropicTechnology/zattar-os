'use client';

/**
 * Hook que expõe o contexto de rota atual para o CopilotKit.
 *
 * Permite que o Pedrinho saiba em qual módulo o usuário está,
 * podendo dar respostas mais contextualizadas e sugerir ações relevantes.
 */

import { useAgentContext } from '@copilotkit/react-core/v2';
import { usePathname } from 'next/navigation';

/**
 * Mapeamento de pathname para nome amigável do módulo
 */
const MODULE_LABELS: Record<string, string> = {
  '/app/dashboard': 'Dashboard',
  '/app/processos': 'Processos',
  '/app/audiencias': 'Audiências',
  '/app/expedientes': 'Expedientes',
  '/app/financeiro': 'Financeiro',
  '/app/contratos': 'Contratos',
  '/app/documentos': 'Documentos',
  '/app/tarefas': 'Tarefas',
  '/app/chat': 'Chat',
  '/app/partes': 'Partes / Clientes',
  '/app/rh': 'Recursos Humanos',
  '/app/usuarios': 'Usuários',
  '/app/pericias': 'Perícias',
  '/app/captura': 'Captura de Documentos',
  '/app/assistentes': 'Assistentes IA',
  '/app/obrigacoes': 'Obrigações',
  '/app/assinatura-digital': 'Assinatura Digital',
  '/app/mail': 'E-mail',
  '/app/calendar': 'Calendário',
  '/app/configuracoes': 'Configurações',
  '/app/admin': 'Administração',
  '/app/editor': 'Editor de Documentos',
  '/app/notas': 'Notas',
  '/app/notificacoes': 'Notificações',
  '/app/project-management': 'Gestão de Projetos',
  '/app/repasses': 'Repasses',
  '/app/pecas-juridicas': 'Peças Jurídicas',
};

function getModuleFromPath(pathname: string): { module: string; label: string; subpage?: string } {
  for (const [path, label] of Object.entries(MODULE_LABELS)) {
    if (pathname.startsWith(path)) {
      const remainder = pathname.slice(path.length);
      const subpage = remainder && remainder !== '/' ? remainder.replace(/^\//, '') : undefined;
      return {
        module: path.replace('/app/', ''),
        label,
        subpage,
      };
    }
  }

  return { module: 'desconhecido', label: 'Página desconhecida' };
}

/**
 * Registra o contexto de rota atual como readable state do CopilotKit.
 * Deve ser chamado dentro do provider CopilotKit.
 */
export function useCopilotRouteContext() {
  const pathname = usePathname();

  const routeInfo = getModuleFromPath(pathname || '/app/dashboard');

  useAgentContext({
    description: 'Contexto de navegação: módulo e página atual do usuário no sistema',
    value: {
      modulo_atual: routeInfo.label,
      caminho: pathname,
      ...(routeInfo.subpage && { subpagina: routeInfo.subpage }),
      timestamp: new Date().toISOString(),
    },
  });

  return routeInfo;
}
