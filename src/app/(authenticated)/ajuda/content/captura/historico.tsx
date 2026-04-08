'use client';

import {
  DocSection,
  DocActionList,
  DocTip,
  DocFieldTable,
} from '../../components/doc-components';
import {
  Eye,
  Download,
  RefreshCw,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function CapturaHistorico() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Histórico de Capturas</h1>
        <p className="text-muted-foreground mt-2">
          Visualize todas as capturas realizadas, incluindo o status de cada execução, os
          resultados obtidos e o detalhamento de cada captura individual.
        </p>
      </div>

      <DocSection title="Listagem de Capturas">
        <p className="text-muted-foreground">
          A tela de histórico apresenta todas as capturas realizadas em ordem cronológica
          decrescente. Para cada entrada são exibidos:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Data e hora de início e término da captura</li>
          <li>Advogado / credencial utilizada</li>
          <li>Tribunal capturado (TRT, TJ, etc.)</li>
          <li>Quantidade de processos verificados</li>
          <li>Quantidade de novas movimentações encontradas</li>
          <li>Status da execução</li>
        </ul>
      </DocSection>

      <DocSection title="Status de Execução">
        <DocActionList
          actions={[
            {
              icon: CheckCircle,
              nome: 'Concluída',
              descricao:
                'A captura foi executada com sucesso e todos os processos foram verificados.',
            },
            {
              icon: XCircle,
              nome: 'Erro',
              descricao:
                'A captura encontrou um erro durante a execução (credencial inválida, tribunal indisponível, etc.).',
            },
            {
              icon: Clock,
              nome: 'Em Andamento',
              descricao: 'A captura está sendo executada no momento.',
            },
            {
              icon: AlertTriangle,
              nome: 'Parcial',
              descricao:
                'A captura foi concluída mas com falhas em alguns processos específicos. Veja o detalhamento para identificar quais.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Detalhes de uma Captura">
        <p className="text-muted-foreground mb-4">
          Ao clicar em uma entrada do histórico, o sistema abre o detalhamento completo da
          captura, exibindo:
        </p>
        <DocFieldTable
          fields={[
            {
              campo: 'Data / Hora',
              tipo: 'Data/Hora',
              obrigatorio: false,
              descricao: 'Início e término exatos da execução.',
            },
            {
              campo: 'Duração',
              tipo: 'Tempo',
              obrigatorio: false,
              descricao: 'Tempo total de execução da captura.',
            },
            {
              campo: 'Advogado',
              tipo: 'Texto',
              obrigatorio: false,
              descricao: 'Credencial utilizada para acesso ao tribunal.',
            },
            {
              campo: 'Tribunal',
              tipo: 'Texto',
              obrigatorio: false,
              descricao: 'Nome e sigla do tribunal capturado.',
            },
            {
              campo: 'Processos Verificados',
              tipo: 'Número',
              obrigatorio: false,
              descricao: 'Total de processos consultados nesta execução.',
            },
            {
              campo: 'Novidades Encontradas',
              tipo: 'Número',
              obrigatorio: false,
              descricao: 'Quantidade de novas movimentações, despachos ou documentos capturados.',
            },
            {
              campo: 'Processos com Erro',
              tipo: 'Número',
              obrigatorio: false,
              descricao: 'Processos em que ocorreu falha durante a consulta.',
            },
            {
              campo: 'Log de Erros',
              tipo: 'Texto',
              obrigatorio: false,
              descricao: 'Mensagem de erro detalhada para diagnóstico técnico.',
            },
          ]}
        />
        <DocTip>
          Processos com erro de captura são listados individualmente no detalhamento. Verifique se
          o número do processo continua ativo no tribunal antes de reprocessar.
        </DocTip>
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList
          actions={[
            {
              icon: Eye,
              nome: 'Ver Detalhes',
              descricao: 'Abre o detalhamento completo de uma captura específica.',
            },
            {
              icon: RefreshCw,
              nome: 'Reexecutar Captura',
              descricao:
                'Dispara uma nova captura imediata com os mesmos parâmetros de uma captura anterior.',
            },
            {
              icon: Filter,
              nome: 'Filtrar',
              descricao:
                'Filtra o histórico por período, advogado, tribunal ou status de execução.',
            },
            {
              icon: Download,
              nome: 'Exportar',
              descricao: 'Exporta o histórico de capturas em formato XLSX ou PDF.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Movimentações Capturadas">
        <p className="text-muted-foreground">
          Dentro do detalhamento de uma captura bem-sucedida, a aba &quot;Movimentações&quot; lista todas
          as novidades encontradas nessa execução, com o número do processo, a data do ato no
          tribunal, o conteúdo da movimentação e o link direto para o processo no Synthropic. Clique
          em qualquer movimentação para navegar ao processo correspondente.
        </p>
      </DocSection>
    </div>
  );
}
