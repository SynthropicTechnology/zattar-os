'use client';

import {
  DocSection,
  DocFieldTable,
  DocActionList,
  DocTip,
  DocSteps,
} from '../../components/doc-components';
import {
  Calendar,
  Clock,
  Link2,
  Filter,
  Bell,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

export default function AgendaDoc() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading mb-2">Agenda</h1>
        <p className="text-muted-foreground text-lg">
          Visualize e gerencie todos os seus compromissos, audiências, expedientes e prazos em um calendário centralizado.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          A Agenda do Synthropic é o ponto central de organização do seu escritório. Ela consolida automaticamente
          eventos vindos dos módulos de Audiências e Expedientes, além de permitir a criação manual de
          compromissos e lembretes. Utilize as diferentes visualizações para ter a perspectiva ideal do seu
          calendário — seja o dia de hoje, a semana corrente ou o mês completo.
        </p>
        <DocTip>
          Eventos gerados automaticamente pelo sistema (audiências confirmadas e prazos de expedientes)
          aparecem na Agenda com marcação de cor diferenciada, facilitando a distinção de compromissos manuais.
        </DocTip>
      </DocSection>

      <DocSection title="Visualizações Disponíveis">
        <DocActionList
          actions={[
            {
              icon: Calendar,
              nome: 'Mês',
              descricao:
                'Exibe o mês inteiro com todos os eventos distribuídos por dia. Ideal para uma visão macro da agenda.',
            },
            {
              icon: Calendar,
              nome: 'Semana',
              descricao:
                'Mostra os sete dias da semana com horários detalhados. Permite identificar conflitos de agenda com facilidade.',
            },
            {
              icon: Clock,
              nome: 'Dia',
              descricao:
                'Exibe um único dia dividido em faixas de horário. Use para planejar o dia hora a hora.',
            },
            {
              icon: ChevronRight,
              nome: 'Agenda (Lista)',
              descricao:
                'Apresenta os próximos eventos em formato de lista cronológica. Útil para consulta rápida dos compromissos futuros.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Criando um Evento">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse a Agenda',
              descricao:
                'No menu lateral, navegue até Planner > Agenda.',
            },
            {
              titulo: 'Clique em "Novo Evento"',
              descricao:
                'Utilize o botão no canto superior direito ou clique diretamente sobre uma data/horário no calendário para abrir o formulário de criação.',
            },
            {
              titulo: 'Preencha os dados do evento',
              descricao:
                'Informe título, data, horário de início e fim, tipo do evento e demais campos opcionais como descrição e participantes.',
            },
            {
              titulo: 'Salve o evento',
              descricao:
                'Clique em "Salvar". O evento aparecerá imediatamente no calendário na data e horário configurados.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Campos do Formulário de Evento">
        <DocFieldTable
          fields={[
            {
              campo: 'Título',
              tipo: 'Texto',
              obrigatorio: true,
              descricao: 'Nome do evento ou compromisso.',
            },
            {
              campo: 'Tipo',
              tipo: 'Seleção',
              obrigatorio: true,
              descricao:
                'Classificação do evento: Audiência, Reunião, Prazo, Lembrete ou Outro.',
            },
            {
              campo: 'Data de Início',
              tipo: 'Data/Hora',
              obrigatorio: true,
              descricao: 'Data e horário de início do evento.',
            },
            {
              campo: 'Data de Término',
              tipo: 'Data/Hora',
              obrigatorio: false,
              descricao:
                'Data e horário de encerramento. Se não informado, o evento é tratado como ponto único no tempo.',
            },
            {
              campo: 'Dia Inteiro',
              tipo: 'Booleano',
              obrigatorio: false,
              descricao:
                'Marque esta opção para criar um evento que ocupa o dia inteiro, sem horário específico.',
            },
            {
              campo: 'Descrição',
              tipo: 'Texto Longo',
              obrigatorio: false,
              descricao: 'Detalhes adicionais, anotações ou pauta do evento.',
            },
            {
              campo: 'Participantes',
              tipo: 'Seleção Múltipla',
              obrigatorio: false,
              descricao:
                'Membros da equipe que participarão do evento. Eles verão o evento em suas próprias agendas.',
            },
            {
              campo: 'Processo Vinculado',
              tipo: 'Busca',
              obrigatorio: false,
              descricao:
                'Vincula o evento a um processo. Quando preenchido, o evento aparece também na linha do tempo do processo.',
            },
            {
              campo: 'Lembrete',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao:
                'Envia uma notificação antes do evento: 15 minutos, 1 hora, 1 dia ou 1 semana antes.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Integração com Audiências e Expedientes">
        <p className="text-muted-foreground mb-4">
          A Agenda é sincronizada automaticamente com os módulos de Audiências e Expedientes do sistema.
          Não é necessário nenhuma ação manual para que esses eventos apareçam no calendário.
        </p>
        <DocActionList
          actions={[
            {
              icon: Link2,
              nome: 'Audiências',
              descricao:
                'Toda audiência cadastrada no módulo de Audiências é exibida automaticamente na Agenda na data e horário informados. Ao clicar no evento, você é direcionado diretamente para os detalhes da audiência.',
            },
            {
              icon: Link2,
              nome: 'Expedientes (Prazos)',
              descricao:
                'Os prazos processuais registrados no módulo de Expedientes são convertidos em eventos de prazo na Agenda. O sistema destaca visualmente os prazos próximos do vencimento.',
            },
            {
              icon: RefreshCw,
              nome: 'Atualização em Tempo Real',
              descricao:
                'Qualquer alteração feita nos módulos de Audiências ou Expedientes reflete instantaneamente na Agenda, mantendo as informações sempre atualizadas.',
            },
          ]}
        />
        <DocTip>
          Para editar uma audiência ou expediente exibido na Agenda, clique no evento e depois em &quot;Ver Detalhes&quot;.
          Edições realizadas diretamente no calendário não estão disponíveis para eventos gerados automaticamente.
        </DocTip>
      </DocSection>

      <DocSection title="Filtros e Personalização">
        <DocActionList
          actions={[
            {
              icon: Filter,
              nome: 'Filtrar por Tipo',
              descricao:
                'Exiba ou oculte categorias de eventos (Audiências, Expedientes, Reuniões, Prazos) usando os filtros de tipo disponíveis na barra superior.',
            },
            {
              icon: Filter,
              nome: 'Filtrar por Membro da Equipe',
              descricao:
                'Visualize a agenda de um colega específico ou de toda a equipe simultaneamente.',
            },
            {
              icon: Bell,
              nome: 'Lembretes por Notificação',
              descricao:
                'Configure lembretes individuais para cada evento. As notificações são enviadas pelo sistema de acordo com o antecedência escolhida.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Editando e Excluindo Eventos">
        <p className="text-muted-foreground mb-4">
          Para editar um evento manual, clique sobre ele no calendário e selecione &quot;Editar&quot;. Para excluir,
          clique sobre o evento e depois em &quot;Excluir&quot;. Eventos sincronizados automaticamente
          (audiências e expedientes) devem ser editados nos seus respectivos módulos.
        </p>
        <DocTip>
          Eventos criados manualmente podem ser arrastados para outra data diretamente no calendário,
          nas visualizações de Semana e Dia.
        </DocTip>
      </DocSection>
    </div>
  );
}
