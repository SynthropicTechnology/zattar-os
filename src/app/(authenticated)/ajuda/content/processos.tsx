'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  DocSteps,
  type FieldDef,
  type ActionDef,
  type StepDef,
} from '../components/doc-components';
import {
  Plus,
  Pencil,
  Eye,
  Search,
  Download,
  RefreshCw,
  GitBranch,
  Filter,
  History,
} from 'lucide-react';

const fields: FieldDef[] = [
  {
    campo: 'Número do Processo',
    tipo: 'Texto',
    obrigatorio: true,
    descricao: 'Número único no formato CNJ (NNNNNNN-NN.NNNN.N.NN.NNNN). O sistema valida o formato ao salvar.',
  },
  {
    campo: 'Tribunal',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Tribunal onde o processo tramita (ex: TJSP, TRT2, STJ, STF).',
  },
  {
    campo: 'Grau',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Instância do processo: 1º Grau, 2º Grau ou Superior.',
  },
  {
    campo: 'Vara / Turma',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Identificação da vara, câmara ou turma responsável pelo processo.',
  },
  {
    campo: 'Comarca',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Comarca onde o processo está sendo julgado.',
  },
  {
    campo: 'Classe Judicial',
    tipo: 'Texto',
    obrigatorio: false,
    descricao: 'Classificação do tipo de ação (ex: Ação de Indenização, Reclamação Trabalhista, Mandado de Segurança).',
  },
  {
    campo: 'Área do Direito',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Área jurídica do processo: Cível, Trabalhista, Criminal, Tributário, Administrativo, etc.',
  },
  {
    campo: 'Status',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Situação atual: Em Andamento, Arquivado, Suspenso, Encerrado, Baixado.',
  },
  {
    campo: 'Cliente (Parte Autora)',
    tipo: 'Seleção',
    obrigatorio: true,
    descricao: 'Cliente do escritório que figura como parte no processo.',
  },
  {
    campo: 'Parte Contrária',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Parte adversa no processo. Vincula ao cadastro de Partes Contrárias.',
  },
  {
    campo: 'Advogado Responsável',
    tipo: 'Seleção',
    obrigatorio: false,
    descricao: 'Advogado do escritório responsável pelo acompanhamento do processo.',
  },
  {
    campo: 'Valor da Causa',
    tipo: 'Monetário',
    obrigatorio: false,
    descricao: 'Valor atribuído à causa no momento do ajuizamento.',
  },
  {
    campo: 'Data de Distribuição',
    tipo: 'Data',
    obrigatorio: false,
    descricao: 'Data em que o processo foi distribuído ao juízo.',
  },
  {
    campo: 'Observações',
    tipo: 'Texto longo',
    obrigatorio: false,
    descricao: 'Anotações internas sobre o processo, estratégias ou informações relevantes.',
  },
];

const actions: ActionDef[] = [
  {
    icon: Plus,
    nome: 'Cadastrar Processo',
    descricao: 'Abre o formulário para incluir um processo manualmente.',
  },
  {
    icon: RefreshCw,
    nome: 'Capturar do PJe',
    descricao: 'Importa automaticamente os dados e movimentações do processo diretamente do sistema PJe usando o número CNJ.',
  },
  {
    icon: Pencil,
    nome: 'Editar',
    descricao: 'Altera dados cadastrais do processo como status, responsável ou observações.',
  },
  {
    icon: Eye,
    nome: 'Visualizar Detalhes',
    descricao: 'Abre a ficha completa com abas de movimentações, audiências, expedientes, perícias e partes.',
  },
  {
    icon: History,
    nome: 'Timeline de Movimentações',
    descricao: 'Exibe todas as movimentações processuais em ordem cronológica, incluindo as capturadas automaticamente.',
  },
  {
    icon: GitBranch,
    nome: 'Vincular Processo Conexo',
    descricao: 'Relaciona este processo a outro processo no sistema (recurso, incidente, processo conexo).',
  },
  {
    icon: Filter,
    nome: 'Filtrar',
    descricao: 'Filtra a lista por tribunal, status, área do direito, advogado responsável ou período.',
  },
  {
    icon: Search,
    nome: 'Buscar',
    descricao: 'Localiza processos pelo número CNJ, nome do cliente ou parte contrária.',
  },
  {
    icon: Download,
    nome: 'Exportar',
    descricao: 'Exporta a lista de processos em CSV ou XLSX.',
  },
];

const captureSteps: StepDef[] = [
  {
    titulo: 'Acessar o módulo de Captura',
    descricao: 'Navegue até Captura > Agendamentos ou use o botão "Capturar do PJe" na tela de Processos.',
  },
  {
    titulo: 'Informar o número do processo',
    descricao: 'Digite o número CNJ completo do processo que deseja importar.',
  },
  {
    titulo: 'Selecionar credenciais',
    descricao: 'Escolha o advogado e as credenciais de acesso ao tribunal correspondente (configuradas em Captura > Credenciais).',
  },
  {
    titulo: 'Aguardar a captura',
    descricao: 'O sistema acessa o PJe automaticamente e importa os dados do processo, partes e movimentações.',
  },
  {
    titulo: 'Revisar e complementar',
    descricao: 'Após a importação, revise os dados, vincule ao cliente correto e complemente informações que não estejam disponíveis no PJe.',
  },
];

export default function ProcessosDoc() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Processos</h1>
        <p className="text-muted-foreground text-lg">
          Gestão completa dos processos judiciais do escritório com captura automática do PJe.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          O módulo de Processos é o núcleo do Synthropic. Aqui são gerenciados todos os processos
          judiciais do escritório, desde o cadastro inicial até o acompanhamento de movimentações,
          audiências, expedientes e perícias vinculadas.
        </p>
        <p className="text-muted-foreground">
          O sistema oferece tanto o cadastro manual quanto a captura automática de dados diretamente
          do PJe, eliminando a necessidade de atualização manual das movimentações processuais.
        </p>
        <DocTip>
          Use a captura automática do PJe sempre que possível. Além de economizar tempo, ela garante
          que as movimentações sejam registradas com fidelidade ao diário oficial, reduzindo o risco
          de perda de prazos.
        </DocTip>
      </DocSection>

      <DocSection title="Campos do Processo">
        <DocFieldTable fields={fields} />
      </DocSection>

      <DocSection title="Ações Disponíveis">
        <DocActionList actions={actions} />
      </DocSection>

      <DocSection title="Captura Automática do PJe">
        <DocSteps steps={captureSteps} />
        <DocTip>
          Para que a captura funcione, é necessário cadastrar previamente as credenciais de acesso ao
          tribunal no módulo Captura &gt; Advogados, Credenciais e Tribunais.
        </DocTip>
      </DocSection>

      <DocSection title="Filtros e Busca">
        <p className="text-muted-foreground">
          A lista de processos pode ser filtrada e ordenada por múltiplos critérios simultaneamente:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm mt-2">
          <li>Tribunal (TJSP, TRT, STJ, STF, TRF, etc.)</li>
          <li>Status do processo (Em Andamento, Arquivado, Encerrado)</li>
          <li>Área do direito (Cível, Trabalhista, Criminal, etc.)</li>
          <li>Advogado responsável</li>
          <li>Período de distribuição</li>
          <li>Cliente vinculado</li>
        </ul>
      </DocSection>
    </div>
  );
}
