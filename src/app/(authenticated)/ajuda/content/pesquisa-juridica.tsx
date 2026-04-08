'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  DocSteps,
} from '../components/doc-components';
import {
  Newspaper,
  BookOpen,
  Filter,
  Download,
  Bell,
  Globe,
  Sparkles,
} from 'lucide-react';

export default function PesquisaJuridicaDoc() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading mb-2">Pesquisa Jurídica</h1>
        <p className="text-muted-foreground text-lg">
          Ferramentas de pesquisa jurídica integradas ao sistema: Diário Oficial (Comunica CNJ) e Pangea para busca semântica em bases de dados jurídicas.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          O módulo de Pesquisa Jurídica reúne duas ferramentas complementares: o Diário Oficial via
          Comunica CNJ, para acompanhar publicações e comunicações processuais oficiais, e o Pangea,
          um motor de busca semântica que permite pesquisar jurisprudência, doutrina e legislação
          com linguagem natural.
        </p>
      </DocSection>

      <DocSection title="Diário Oficial — Comunica CNJ">
        <p className="text-muted-foreground mb-4">
          O Comunica CNJ é a plataforma oficial do Conselho Nacional de Justiça para comunicação
          eletrônica processual. Pelo Synthropic, você acessa e monitora as publicações e intimações
          diretamente vinculadas aos processos cadastrados no sistema.
        </p>

        <h3 className="font-semibold text-base mt-4 mb-3">O que é o Comunica CNJ</h3>
        <p className="text-muted-foreground mb-4">
          O Comunica CNJ centraliza as comunicações processuais eletrônicas dos tribunais aderentes,
          substituindo a publicação em Diário Oficial físico para atos de comunicação endereçados
          diretamente às partes e advogados cadastrados. Intimações, citações e demais comunicações
          são disponibilizadas nessa plataforma e têm prazo contado a partir do acesso (ou automaticamente
          após 10 dias da disponibilização).
        </p>

        <DocActionList
          actions={[
            {
              icon: Bell,
              nome: 'Monitoramento Automático',
              descricao:
                'O Synthropic verifica periodicamente o Comunica CNJ e exibe as novas comunicações recebidas, com alerta visual para itens não lidos.',
            },
            {
              icon: Newspaper,
              nome: 'Visualizar Comunicações',
              descricao:
                'Acesse a lista de todas as comunicações recebidas, com indicação do processo, tipo de ato, data de disponibilização e prazo.',
            },
            {
              icon: Filter,
              nome: 'Filtrar por Processo',
              descricao:
                'Filtre as comunicações pelo número do processo ou pelo advogado destinatário para encontrar rapidamente o que precisa.',
            },
            {
              icon: Download,
              nome: 'Baixar Documentos',
              descricao:
                'Faça download dos documentos anexados às comunicações diretamente pelo sistema.',
            },
          ]}
        />

        <DocSteps
          steps={[
            {
              titulo: 'Acesse a Pesquisa Jurídica',
              descricao: 'No menu lateral, clique em "Pesquisa Jurídica" e selecione a aba "Diário Oficial".',
            },
            {
              titulo: 'Visualize as comunicações',
              descricao:
                'As comunicações mais recentes aparecem no topo da lista. Comunicações não lidas são destacadas em negrito.',
            },
            {
              titulo: 'Abra uma comunicação',
              descricao:
                'Clique em uma linha para ver o conteúdo completo da comunicação, os documentos anexados e as informações do processo vinculado.',
            },
            {
              titulo: 'Gere um expediente',
              descricao:
                'A partir de uma comunicação relevante, clique em "Criar Expediente" para registrar o prazo automaticamente no módulo de Expedientes.',
            },
          ]}
        />
        <DocTip>
          Configure quais advogados e credenciais do escritório são monitorados no módulo Captura &gt;
          Advogados, Credenciais e Tribunais para que as comunicações corretas apareçam aqui.
        </DocTip>
      </DocSection>

      <DocSection title="Pangea — Busca Semântica Jurídica">
        <p className="text-muted-foreground mb-4">
          O Pangea é um motor de busca semântica que permite pesquisar em grandes bases de dados
          jurídicas utilizando linguagem natural. Diferente da busca por palavras-chave tradicional,
          a busca semântica compreende o significado da sua consulta e retorna resultados contextualmente
          relevantes.
        </p>

        <h3 className="font-semibold text-base mt-4 mb-3">Bases de Dados Disponíveis</h3>
        <DocActionList
          actions={[
            {
              icon: BookOpen,
              nome: 'Jurisprudência',
              descricao:
                'Decisões e acórdãos dos principais tribunais brasileiros (STF, STJ, TST, TRTs, TJs estaduais).',
            },
            {
              icon: BookOpen,
              nome: 'Legislação',
              descricao:
                'Leis federais, estaduais, decretos, portarias e demais atos normativos.',
            },
            {
              icon: BookOpen,
              nome: 'Súmulas e Enunciados',
              descricao:
                'Súmulas vinculantes, súmulas do STJ, TST e enunciados de tribunais.',
            },
          ]}
        />

        <h3 className="font-semibold text-base mt-6 mb-3">Como Pesquisar no Pangea</h3>
        <DocSteps
          steps={[
            {
              titulo: 'Acesse o Pangea',
              descricao: 'Na tela de Pesquisa Jurídica, selecione a aba "Pangea".',
            },
            {
              titulo: 'Digite sua consulta em linguagem natural',
              descricao:
                'Escreva sua pergunta ou tese jurídica como você a formularia normalmente. Ex: "Responsabilidade civil do empregador por acidente de trabalho" ou "Prazo prescricional para ação de cobrança de honorários advocatícios".',
            },
            {
              titulo: 'Selecione a base de dados',
              descricao:
                'Escolha se deseja pesquisar em jurisprudência, legislação, súmulas ou em todas as bases simultaneamente.',
            },
            {
              titulo: 'Analise os resultados',
              descricao:
                'Os resultados são ordenados por relevância semântica. Cada item exibe um trecho do conteúdo com destaque para os trechos mais relevantes para sua consulta.',
            },
            {
              titulo: 'Use o resultado no sistema',
              descricao:
                'Copie trechos para o editor de documentos ou peças jurídicas, ou salve o resultado como referência em uma nota.',
            },
          ]}
        />

        <DocFieldTable
          fields={[
            {
              campo: 'Consulta',
              tipo: 'Texto',
              obrigatorio: true,
              descricao:
                'Sua pergunta ou tese jurídica em linguagem natural. Quanto mais específica a consulta, mais precisos os resultados.',
            },
            {
              campo: 'Base de Dados',
              tipo: 'Seleção Múltipla',
              obrigatorio: false,
              descricao:
                'Selecione quais bases pesquisar: Jurisprudência, Legislação, Súmulas ou Todas.',
            },
            {
              campo: 'Tribunal',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao:
                'Restrinja a pesquisa de jurisprudência a um tribunal específico.',
            },
            {
              campo: 'Período',
              tipo: 'Intervalo de Datas',
              obrigatorio: false,
              descricao:
                'Filtre resultados por data de publicação para priorizar entendimentos mais recentes.',
            },
          ]}
        />

        <DocActionList
          actions={[
            {
              icon: Sparkles,
              nome: 'Resumo Inteligente',
              descricao:
                'Para cada resultado, clique em "Resumir com IA" para obter uma síntese do conteúdo sem precisar ler o documento completo.',
            },
            {
              icon: Globe,
              nome: 'Acessar Fonte Original',
              descricao:
                'Clique em "Ver Original" para acessar o documento na fonte oficial (site do tribunal ou portal legislativo).',
            },
            {
              icon: Download,
              nome: 'Exportar Resultados',
              descricao:
                'Exporte a lista de resultados de uma pesquisa em formato PDF para uso em relatórios ou dossiês.',
            },
          ]}
        />
        <DocTip>
          Pesquisas semânticas produzem melhores resultados quando a consulta é descritiva e contextualizada.
          Evite consultas muito curtas como &quot;acidente trabalho&quot; — prefira &quot;responsabilidade objetiva do empregador
          em acidente de trabalho com culpa exclusiva da vítima&quot;.
        </DocTip>
      </DocSection>
    </div>
  );
}
