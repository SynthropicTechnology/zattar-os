'use client';

import {
  DocSection,
  DocActionList,
  DocTip,
  type ActionDef,
} from '../components/doc-components';
import {
  Gavel,
  FileText,
  Mail,
  DollarSign,
  BarChart2,
  Scale,
  RefreshCw,
  MousePointerClick,
} from 'lucide-react';

const subDashboards: ActionDef[] = [
  {
    icon: Gavel,
    nome: 'Audiências',
    descricao:
      'Exibe os próximos compromissos de audiência, distribuição por tipo e status das pautas agendadas.',
  },
  {
    icon: FileText,
    nome: 'Contratos',
    descricao:
      'Mostra o total de contratos ativos, valores acumulados, parcelas em aberto e contratos próximos do vencimento.',
  },
  {
    icon: Mail,
    nome: 'Expedientes',
    descricao:
      'Apresenta intimações e comunicações pendentes de leitura, prazos a vencer e publicações recentes.',
  },
  {
    icon: DollarSign,
    nome: 'Financeiro',
    descricao:
      'Resumo de receitas e despesas do período, inadimplência, previsão de caixa e comparativos mensais.',
  },
  {
    icon: BarChart2,
    nome: 'Geral',
    descricao:
      'Visão consolidada do escritório: processos ativos, tarefas abertas, metas e indicadores globais.',
  },
  {
    icon: Scale,
    nome: 'Processos',
    descricao:
      'Distribuição dos processos por status, tribunal, área jurídica e movimentações recentes.',
  },
];

const navigationActions: ActionDef[] = [
  {
    icon: MousePointerClick,
    nome: 'Alternar sub-dashboard',
    descricao:
      'Clique nas abas na parte superior da tela para navegar entre os diferentes painéis temáticos.',
  },
  {
    icon: RefreshCw,
    nome: 'Atualizar dados',
    descricao:
      'Use o botão de atualização no canto superior direito de cada widget para recarregar os dados em tempo real.',
  },
];

export default function DashboardDoc() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Painel central do Synthropic com visão consolidada das principais métricas do escritório.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          O Dashboard é a tela inicial do Synthropic após o login. Ele reúne indicadores-chave de desempenho
          (KPIs) em widgets interativos, permitindo que advogados e gestores acompanhem a saúde do escritório
          sem precisar navegar por cada módulo individualmente.
        </p>
        <p className="text-muted-foreground">
          Os dados são atualizados automaticamente e os widgets podem ser consultados por diferentes períodos,
          como dia atual, semana ou mês.
        </p>
        <DocTip>
          O Dashboard exibe apenas os dados aos quais o seu perfil de acesso tem permissão. Caso algum widget
          apareça vazio, verifique com o administrador do sistema as suas permissões.
        </DocTip>
      </DocSection>

      <DocSection title="Sub-dashboards Disponíveis">
        <p className="text-muted-foreground mb-4">
          O painel principal é dividido em seis sub-dashboards temáticos, cada um focado em uma área
          específica do escritório:
        </p>
        <DocActionList actions={subDashboards} />
      </DocSection>

      <DocSection title="Navegação entre Dashboards">
        <DocActionList actions={navigationActions} />
        <DocTip>
          Cada sub-dashboard possui seus próprios filtros de período. Alterar o período em um painel
          não afeta os demais, permitindo comparações simultâneas entre diferentes recortes de tempo.
        </DocTip>
      </DocSection>

      <DocSection title="Widgets e Métricas">
        <p className="text-muted-foreground">
          Os widgets exibem informações de forma resumida. Muitos deles são clicáveis: ao clicar em um
          número ou gráfico, o sistema navega diretamente para a lista filtrada correspondente —
          por exemplo, clicar em &quot;Processos com prazo hoje&quot; abre a tela de Processos já filtrada
          pelos registros do dia.
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm mt-2">
          <li>Gráficos de barras e linhas para evolução temporal</li>
          <li>Cards de contagem com indicadores de variação percentual</li>
          <li>Listas resumidas dos registros mais recentes ou urgentes</li>
          <li>Indicadores coloridos de status (verde, amarelo, vermelho)</li>
        </ul>
      </DocSection>
    </div>
  );
}
