'use client';

/**
 * Hook de Especialização por Domínio
 *
 * Injeta automaticamente:
 * 1. Instruções adicionais de especialista baseadas no módulo atual
 * 2. Sugestões de ação contextuais (chips clicáveis no chat)
 *
 * Faz o Pedrinho se comportar como agente especializado em cada módulo
 * sem precisar de CoAgents/LangGraph — funciona 100% no v1.54.
 */

import { useCopilotAdditionalInstructions, useCopilotChatSuggestions } from '@copilotkit/react-core';
import { usePathname } from 'next/navigation';

// ─── Instruções de Domínio ──────────────────────────────────────────

const DOMAIN_INSTRUCTIONS: Record<string, string> = {
  processos: `## Modo Especialista: Processos Trabalhistas
Você está no módulo de Processos. Foque em:
- Análise processual: identificar prazos, riscos e oportunidades
- Explicar movimentações e decisões judiciais em linguagem acessível
- Sugerir próximos passos processuais com base na timeline
- Ao buscar processos, usar número CNJ formatado quando possível
- Priorizar informações de audiências próximas e expedientes pendentes
- Use as ferramentas MCP de processos, partes, audiências e expedientes para obter dados reais`,

  audiencias: `## Modo Especialista: Audiências
Você está no módulo de Audiências. Foque em:
- Preparação para audiências: verificar pautas, documentos necessários, partes envolvidas
- Alertar sobre conflitos de agenda entre audiências
- Diferenciar claramente audiências virtuais vs presenciais
- Ao listar audiências, sempre mostrar data/hora, tribunal e modalidade
- Destacar audiências que estão próximas (hoje, amanhã, esta semana)
- Use as ferramentas MCP de audiências para dados atualizados`,

  expedientes: `## Modo Especialista: Expedientes e Prazos
Você está no módulo de Expedientes. Foque em:
- Gestão de prazos: identificar vencidos e próximos do vencimento
- Priorizar expedientes por urgência (vencidos > vence hoje > próximos 7 dias)
- Auxiliar no processo de baixa de expedientes
- Alertar sobre expedientes sem responsável atribuído
- Use as ferramentas MCP de expedientes para dados atualizados`,

  financeiro: `## Modo Especialista: Gestão Financeira
Você está no módulo Financeiro. Foque em:
- Análise do DRE: interpretar receitas, despesas, margens e tendências
- Fluxo de caixa: identificar gaps de liquidez e projeções
- Lançamentos: auxiliar na classificação correta de contas
- Indicadores de saúde financeira: explicar significado e impacto
- Conciliação bancária: sugerir matches entre transações e lançamentos
- Valores SEMPRE formatados em BRL (R$) com separador de milhares
- Use as ferramentas MCP financeiras para dados em tempo real`,

  dashboard: `## Modo Especialista: Visão Geral
Você está no Dashboard. Foque em:
- Resumo executivo: processos ativos, audiências próximas, expedientes pendentes
- Alertas prioritários: prazos vencendo, tarefas atrasadas
- Análise de produtividade da equipe (para administradores)
- Métricas financeiras consolidadas
- Sugestões proativas baseadas nos dados visíveis`,

  tarefas: `## Modo Especialista: Gestão de Tarefas
Você está no módulo de Tarefas. Foque em:
- Priorização: ajudar a ordenar tarefas por urgência e importância
- Status: backlog → todo → in progress → done
- Identificar tarefas atrasadas e sugerir redistribuição
- Auxiliar na criação de tarefas com descrição clara e prazo realista
- Relacionar tarefas com processos, audiências ou expedientes quando relevante`,

  contratos: `## Modo Especialista: Gestão de Contratos
Você está no módulo de Contratos. Foque em:
- Análise de contratos: cláusulas-chave, riscos, vencimentos
- Acompanhar status: rascunho, ativo, em revisão, encerrado
- Alertar sobre contratos próximos do vencimento
- Auxiliar na classificação por tipo e segmento
- Use as ferramentas MCP de contratos para dados atualizados`,

  partes: `## Modo Especialista: Gestão de Partes e Clientes
Você está no módulo de Partes/Clientes. Foque em:
- Busca por CPF/CNPJ para localizar rapidamente
- Visão consolidada: processos vinculados, contratos, histórico
- Auxiliar no cadastro com validação de dados
- Diferenciar clientes, partes contrárias, representantes e terceiros`,

  chat: `## Modo Especialista: Comunicação
Você está no módulo de Chat. Foque em:
- Auxiliar na redação de mensagens profissionais
- Buscar histórico de conversas
- Integração com Chatwoot para atendimento ao cliente`,

  rh: `## Modo Especialista: Recursos Humanos
Você está no módulo de RH. Foque em:
- Gestão de colaboradores e cargos
- Acompanhamento de salários e benefícios
- Informações sobre a equipe do escritório`,

  pericias: `## Modo Especialista: Perícias
Você está no módulo de Perícias. Foque em:
- Acompanhamento de laudos periciais
- Prazos para contestação de laudos
- Gestão de peritos e nomeações`,

  documentos: `## Modo Especialista: Documentos
Você está no módulo de Documentos. Foque em:
- Busca de documentos por conteúdo (busca semântica disponível)
- Organização e classificação de documentos
- Auxiliar na redação de peças jurídicas
- Assinatura digital de documentos`,
};

// ─── Sugestões Contextuais ──────────────────────────────────────────

interface Suggestion {
  title: string;
  message: string;
}

const DOMAIN_SUGGESTIONS: Record<string, Suggestion[]> = {
  processos: [
    { title: 'Mostrar processos ativos', message: 'Me mostra os processos ativos' },
    { title: 'Processos sem responsável', message: 'Quais processos estão sem responsável atribuído?' },
    { title: 'Buscar por número', message: 'Buscar processo número ' },
  ],
  audiencias: [
    { title: 'Audiências de hoje', message: 'Me mostra as audiências de hoje' },
    { title: 'Próximas audiências', message: 'Quais são as próximas audiências da semana?' },
    { title: 'Audiências virtuais', message: 'Listar audiências virtuais marcadas' },
  ],
  expedientes: [
    { title: 'Expedientes vencidos', message: 'Quais expedientes estão vencidos?' },
    { title: 'Vencendo hoje', message: 'Tem expedientes vencendo hoje?' },
    { title: 'Sem responsável', message: 'Quais expedientes estão sem responsável?' },
  ],
  financeiro: [
    { title: 'Resumo DRE', message: 'Me mostra o resumo do DRE deste mês' },
    { title: 'Fluxo de caixa', message: 'Como está o fluxo de caixa?' },
    { title: 'Alertas financeiros', message: 'Tem algum alerta financeiro?' },
  ],
  dashboard: [
    { title: 'Resumo do dia', message: 'Me dá um resumo do dia: processos, audiências e tarefas pendentes' },
    { title: 'Tarefas atrasadas', message: 'Tenho tarefas atrasadas?' },
    { title: 'Indicadores financeiros', message: 'Como estão os indicadores financeiros do escritório?' },
  ],
  tarefas: [
    { title: 'Minhas tarefas', message: 'Me mostra minhas tarefas pendentes' },
    { title: 'Tarefas atrasadas', message: 'Quais tarefas estão atrasadas?' },
    { title: 'Criar tarefa', message: 'Quero criar uma nova tarefa' },
  ],
  contratos: [
    { title: 'Contratos ativos', message: 'Me mostra os contratos ativos' },
    { title: 'Vencendo em breve', message: 'Quais contratos vencem nos próximos 30 dias?' },
    { title: 'Buscar contrato', message: 'Buscar contrato do cliente ' },
  ],
  partes: [
    { title: 'Buscar cliente', message: 'Buscar cliente por CPF ' },
    { title: 'Listar clientes', message: 'Me mostra os clientes cadastrados' },
  ],
};

// Sugestões padrão quando módulo não tem sugestões específicas
const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { title: 'O que posso fazer?', message: 'Quais ferramentas você tem disponíveis neste módulo?' },
  { title: 'Resumo do dia', message: 'Me dá um resumo rápido do que tem pendente hoje' },
];

// ─── Hook Principal ─────────────────────────────────────────────────

/**
 * Extrai o identificador do módulo a partir do pathname.
 */
function getModuleKey(pathname: string): string {
  const match = pathname.match(/^\/app\/([^/]+)/);
  if (!match) return '';

  // Normalizar chaves compostas
  const raw = match[1];
  if (raw === 'acordos-condenacoes') return 'processos';
  if (raw === 'assinatura-digital') return 'documentos';
  if (raw === 'pecas-juridicas') return 'documentos';
  if (raw === 'captura') return 'documentos';
  if (raw === 'usuarios') return 'rh';
  return raw;
}

/**
 * Registra instruções de domínio e sugestões contextuais
 * baseadas no módulo atual da página.
 */
export function useCopilotDomainContext() {
  const pathname = usePathname();
  const moduleKey = getModuleKey(pathname || '');

  // Instruções de especialista para o módulo atual
  const instructions = DOMAIN_INSTRUCTIONS[moduleKey] || '';

  useCopilotAdditionalInstructions(
    {
      instructions,
      available: instructions ? 'enabled' : 'disabled',
    },
    [instructions]
  );

  // Sugestões contextuais para o módulo atual
  const suggestions = DOMAIN_SUGGESTIONS[moduleKey] || DEFAULT_SUGGESTIONS;

  useCopilotChatSuggestions(
    {
      suggestions: suggestions.map((s) => ({
        title: s.title,
        message: s.message,
      })),
    },
    [moduleKey]
  );
}
