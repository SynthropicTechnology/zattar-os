'use client';

import {
  DocSection,
  DocActionList,
  DocTip,
  DocFieldTable,
  DocSteps,
} from '../../components/doc-components';
import {
  Bell,
  BellOff,
  CheckCheck,
  Calendar,
  FileText,
  Clock,
  Mail,
  Smartphone,
  Settings,
  Filter,
} from 'lucide-react';

export default function Notificacoes() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Notificações</h1>
        <p className="text-muted-foreground mt-2">
          O sistema de notificações do Synthropic mantém você informado sobre eventos importantes
          como audiências, expedientes, prazos e atividades da equipe em tempo real.
        </p>
      </div>

      <DocSection title="Central de Notificações">
        <p className="text-muted-foreground mb-4">
          Acesse todas as suas notificações clicando no ícone de sino na barra superior do
          sistema. A central exibe notificações não lidas em destaque e permite navegar ao
          conteúdo relacionado com um único clique.
        </p>
        <DocActionList
          actions={[
            {
              icon: Bell,
              nome: 'Ver Notificações',
              descricao:
                'Abre o painel de notificações com todos os alertas recentes, ordenados por data.',
            },
            {
              icon: CheckCheck,
              nome: 'Marcar Todas como Lidas',
              descricao: 'Remove o badge de não lido de todas as notificações de uma vez.',
            },
            {
              icon: Filter,
              nome: 'Filtrar por Tipo',
              descricao:
                'Exibe apenas notificações de um tipo específico (audiências, prazos, etc.).',
            },
            {
              icon: BellOff,
              nome: 'Silenciar Temporariamente',
              descricao: 'Suspende as notificações por 1h, 4h ou 24h sem alterar as preferências.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Tipos de Notificação">
        <DocActionList
          actions={[
            {
              icon: Calendar,
              nome: 'Audiências',
              descricao:
                'Alertas sobre audiências agendadas: lembrete com 24h e 1h de antecedência, e confirmação de realização.',
            },
            {
              icon: FileText,
              nome: 'Expedientes',
              descricao:
                'Notificações de novos expedientes capturados nos processos monitorados, como despachos e decisões.',
            },
            {
              icon: Clock,
              nome: 'Prazos Processuais',
              descricao:
                'Alertas de prazos se aproximando: 7 dias, 3 dias, 1 dia e no dia do vencimento.',
            },
            {
              icon: Bell,
              nome: 'Movimentações',
              descricao:
                'Notificações de novas movimentações capturadas em processos acompanhados.',
            },
            {
              icon: FileText,
              nome: 'Documentos',
              descricao:
                'Avisos quando um documento é assinado, rejeitado ou quando sua assinatura é solicitada.',
            },
            {
              icon: Calendar,
              nome: 'Tarefas e Planner',
              descricao:
                'Lembretes de tarefas atribuídas a você ou com prazo próximo no Planner.',
            },
            {
              icon: Bell,
              nome: 'Financeiro',
              descricao:
                'Alertas de contas a pagar/receber vencendo ou vencidas, e folhas de pagamento geradas.',
            },
            {
              icon: Bell,
              nome: 'Captura',
              descricao:
                'Avisos sobre capturas concluídas, erros de autenticação e credenciais inválidas.',
            },
            {
              icon: Bell,
              nome: 'Sistema',
              descricao:
                'Notificações administrativas: novos usuários, alterações de permissão e atualizações do sistema.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Preferências de Notificação">
        <p className="text-muted-foreground mb-4">
          Configure quais notificações você deseja receber e por quais canais:
        </p>
        <DocFieldTable
          fields={[
            {
              campo: 'Tipo de Notificação',
              tipo: 'Seleção',
              obrigatorio: false,
              descricao: 'Categoria de evento (audiências, prazos, movimentações, etc.).',
            },
            {
              campo: 'No Sistema',
              tipo: 'Booleano',
              obrigatorio: false,
              descricao: 'Exibe a notificação na central de notificações do Synthropic.',
            },
            {
              campo: 'Por E-mail',
              tipo: 'Booleano',
              obrigatorio: false,
              descricao: 'Envia um e-mail para o endereço cadastrado no perfil.',
            },
            {
              campo: 'Push (Navegador)',
              tipo: 'Booleano',
              obrigatorio: false,
              descricao: 'Envia notificação push para o navegador, mesmo quando o Synthropic não está aberto.',
            },
            {
              campo: 'Antecedência (Prazos)',
              tipo: 'Seleção múltipla',
              obrigatorio: false,
              descricao: 'Com quantos dias de antecedência notificar sobre prazos: 7d, 3d, 1d, no dia.',
            },
            {
              campo: 'Horário Silencioso',
              tipo: 'Intervalo de hora',
              obrigatorio: false,
              descricao: 'Intervalo no qual notificações push e e-mail ficam suspensas (ex: 22h às 7h).',
            },
            {
              campo: 'Agrupar Notificações',
              tipo: 'Booleano',
              obrigatorio: false,
              descricao: 'Agrupa múltiplas notificações do mesmo tipo em um único resumo.',
            },
          ]}
        />
        <DocTip>
          Configure o &quot;Horário Silencioso&quot; para não ser incomodado com notificações de e-mail
          durante à noite e nos fins de semana.
        </DocTip>
      </DocSection>

      <DocSection title="Habilitando Notificações Push">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse Configurações > Notificações',
              descricao: 'Navegue até a tela de preferências de notificações.',
            },
            {
              titulo: 'Ative "Notificações Push"',
              descricao: 'Clique no toggle para habilitar as notificações push no navegador.',
            },
            {
              titulo: 'Autorize no navegador',
              descricao:
                'O navegador exibirá uma solicitação de permissão. Clique em "Permitir".',
            },
            {
              titulo: 'Teste a configuração',
              descricao:
                'Clique em "Enviar notificação de teste" para confirmar que está funcionando.',
            },
          ]}
        />
        <DocTip>
          As notificações push funcionam mesmo com o Synthropic minimizado ou em outra aba, desde
          que o navegador esteja aberto. Não funcionam quando o navegador está completamente
          fechado.
        </DocTip>
      </DocSection>

      <DocSection title="Marcando como Lida">
        <DocActionList
          actions={[
            {
              icon: CheckCheck,
              nome: 'Marcar como Lida',
              descricao: 'Clique em uma notificação específica ou no ícone de check para marcá-la como lida.',
            },
            {
              icon: CheckCheck,
              nome: 'Marcar Todas como Lidas',
              descricao: 'Botão no topo da central de notificações que marca todas de uma vez.',
            },
            {
              icon: Mail,
              nome: 'Navegar ao Conteúdo',
              descricao:
                'Clique no corpo da notificação para navegar diretamente ao processo, prazo ou evento relacionado.',
            },
            {
              icon: Smartphone,
              nome: 'Notificações no Mobile',
              descricao:
                'Ao acessar o Synthropic pelo celular, as notificações são exibidas em formato responsivo na central.',
            },
            {
              icon: Settings,
              nome: 'Preferências Rápidas',
              descricao:
                'Acesse as preferências diretamente da central de notificações pelo ícone de engrenagem.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Histórico de Notificações">
        <p className="text-muted-foreground">
          O sistema mantém o histórico de todas as notificações dos últimos 90 dias. Use o
          filtro de período na central de notificações para consultar alertas anteriores. Notificações
          mais antigas que 90 dias são removidas automaticamente. Para manter um registro permanente
          de eventos importantes, utilize as anotações e comentários nos processos.
        </p>
      </DocSection>
    </div>
  );
}
