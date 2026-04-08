'use client';

/**
 * CopilotKit Actions - Navegação (v2)
 *
 * Ações para navegação entre páginas do sistema.
 * Usa useFrontendTool com Zod schemas.
 */

import { useFrontendTool } from '@copilotkit/react-core/v2';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import type { ModuloSistema } from './types';

/**
 * Hook para registrar ações de navegação
 */
export function useNavegacaoActions() {
  const router = useRouter();

  // Mapeamento de módulos para rotas
  const rotasModulos: Record<ModuloSistema, string> = {
    dashboard: '/dashboard',
    processos: '/processos',
    audiencias: '/audiencias/semana',
    expedientes: '/app/expedientes',
    obrigacoes: '/obrigacoes/lista',
    contratos: '/contratos',
    assistentes: '/assistentes',
    clientes: '/partes/clientes',
    usuarios: '/usuarios',
    captura: '/captura/historico',
    financeiro: '/financeiro/plano-contas',
    rh: '/rh/salarios',
  };

  // Ação: Navegar para página
  useFrontendTool({
    name: 'navegarPara',
    description:
      'Navega para uma página específica do sistema Synthropic. Use para ir a módulos como processos, audiências, expedientes, dashboard, etc.',
    parameters: z.object({
      pagina: z.string().describe('Módulo/página de destino: dashboard, processos, audiencias, expedientes, obrigacoes, contratos, assistentes, clientes, usuarios, captura, financeiro, rh'),
      id: z.number().optional().describe('ID do registro específico para ver detalhes (opcional)'),
    }),
    handler: async ({ pagina, id }) => {
      const modulo = pagina.toLowerCase() as ModuloSistema;
      const rotaBase = rotasModulos[modulo];

      if (!rotaBase) {
        return `Página "${pagina}" não encontrada. Páginas disponíveis: ${Object.keys(rotasModulos).join(', ')}`;
      }

      if (id) {
        const rotaDetalhes = modulo === 'audiencias' || modulo === 'expedientes'
          ? `/${modulo.replace('-', '/')}/${id}`
          : `/${modulo}/${id}`;
        router.push(rotaDetalhes);
        return `Navegando para detalhes de ${modulo} #${id}`;
      }

      router.push(rotaBase);
      return `Navegando para ${modulo}`;
    },
  });

  // Ação: Mudar visualização de período
  useFrontendTool({
    name: 'mudarVisualizacaoPeriodo',
    description: 'Altera a visualização de audiências, expedientes ou acordos entre semana, mês, ano ou lista',
    parameters: z.object({
      modulo: z.string().describe('Módulo: audiencias, expedientes ou obrigacoes'),
      visualizacao: z.string().describe('Tipo de visualização: semana, mes, ano ou lista'),
    }),
    handler: async ({ modulo, visualizacao }) => {
      const modulosPermitidos = ['audiencias', 'expedientes', 'obrigacoes'];
      const visualizacoesPermitidas = ['semana', 'mes', 'ano', 'lista'];

      if (!modulosPermitidos.includes(modulo)) {
        return `Módulo "${modulo}" não suporta visualização por período. Use: ${modulosPermitidos.join(', ')}`;
      }

      if (!visualizacoesPermitidas.includes(visualizacao)) {
        return `Visualização "${visualizacao}" inválida. Use: ${visualizacoesPermitidas.join(', ')}`;
      }

      const rotaVisualizacao = modulo === 'expedientes'
        ? `/app/expedientes/${visualizacao}`
        : `/${modulo}/${visualizacao}`;

      router.push(rotaVisualizacao);
      return `Alterando visualização de ${modulo} para ${visualizacao}`;
    },
  });

  // Ação: Voltar para página anterior
  useFrontendTool({
    name: 'voltarPagina',
    description: 'Volta para a página anterior no histórico de navegação',
    parameters: z.object({}),
    handler: async () => {
      router.back();
      return 'Voltando para página anterior';
    },
  });

  // Ação: Ir para o Dashboard
  useFrontendTool({
    name: 'irParaDashboard',
    description: 'Navega diretamente para o dashboard principal',
    parameters: z.object({}),
    handler: async () => {
      router.push('/dashboard');
      return 'Navegando para o dashboard';
    },
  });
}
