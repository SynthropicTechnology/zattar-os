'use client';

import {
  DocSection,
  DocActionList,
  DocTip,
  DocSteps,
} from '../components/doc-components';
import {
  MessageSquare,
  History,
  Sparkles,
  BookOpen,
  Paperclip,
  Trash2,
} from 'lucide-react';

export default function ChatDoc() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading mb-2">Chat</h1>
        <p className="text-muted-foreground text-lg">
          Converse com a inteligência artificial do Synthropic para tirar dúvidas jurídicas, analisar documentos e obter suporte nas suas atividades diárias.
        </p>
      </div>

      <DocSection title="Visão Geral">
        <p className="text-muted-foreground">
          O Chat é uma interface de conversação com IA especializada no contexto jurídico brasileiro.
          Você pode fazer perguntas sobre legislação, pedir análises de documentos, solicitar minutas
          de textos, tirar dúvidas processuais e muito mais. Todas as conversas ficam salvas no histórico
          para consulta futura.
        </p>
        <DocTip>
          O Chat tem acesso ao contexto do seu escritório. Você pode referenciar processos, clientes
          e documentos cadastrados no sistema para obter respostas mais precisas e personalizadas.
        </DocTip>
      </DocSection>

      <DocSection title="Iniciando uma Conversa">
        <DocSteps
          steps={[
            {
              titulo: 'Acesse o Chat',
              descricao: 'No menu lateral, clique em "Chat".',
            },
            {
              titulo: 'Inicie uma nova conversa',
              descricao:
                'Clique em "Nova Conversa" para abrir uma sessão em branco. Cada conversa é independente e mantém seu próprio contexto.',
            },
            {
              titulo: 'Digite sua mensagem',
              descricao:
                'Use o campo de texto na parte inferior da tela. Pressione Enter ou clique no botão de enviar.',
            },
            {
              titulo: 'Aguarde a resposta',
              descricao:
                'A IA processa sua mensagem e responde em segundos. Você pode continuar a conversa com perguntas de acompanhamento.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Exemplos de Uso">
        <DocActionList
          actions={[
            {
              icon: BookOpen,
              nome: 'Dúvidas Jurídicas',
              descricao:
                'Faça perguntas sobre legislação, prazos processuais, jurisprudência dominante, procedimentos e requisitos legais. Ex: "Qual o prazo para contestação em processo trabalhista?" ou "Quais os requisitos para a tutela de urgência no CPC?".',
            },
            {
              icon: Sparkles,
              nome: 'Análise de Documentos',
              descricao:
                'Envie um documento (contrato, petição, decisão judicial) e peça para a IA analisá-lo, identificar riscos, resumir o conteúdo ou apontar pontos de atenção.',
            },
            {
              icon: MessageSquare,
              nome: 'Redação e Minutas',
              descricao:
                'Solicite à IA que elabore minutas de documentos, e-mails jurídicos, notificações extrajudiciais ou qualquer outro texto que você precise como ponto de partida.',
            },
            {
              icon: MessageSquare,
              nome: 'Estratégia Processual',
              descricao:
                'Descreva uma situação processual e peça sugestões de estratégia, argumentos jurídicos relevantes ou precedentes aplicáveis ao caso.',
            },
            {
              icon: MessageSquare,
              nome: 'Consultas sobre o Sistema',
              descricao:
                'Tire dúvidas sobre como usar funcionalidades do Synthropic. Ex: "Como cadastrar um novo cliente?" ou "Como exportar um relatório financeiro?".',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Enviando Arquivos">
        <p className="text-muted-foreground mb-4">
          Você pode enviar documentos para que a IA os analise como parte da conversa.
        </p>
        <DocActionList
          actions={[
            {
              icon: Paperclip,
              nome: 'Anexar Arquivo',
              descricao:
                'Clique no ícone de clipe na barra de mensagens ou arraste e solte um arquivo na janela do chat. Formatos suportados: PDF, DOCX, TXT e imagens (PNG, JPG).',
            },
            {
              icon: Paperclip,
              nome: 'Vincular Documento do Sistema',
              descricao:
                'Em vez de fazer upload, você pode vincular um documento já existente no módulo de Documentos do Synthropic usando o ícone de busca.',
            },
          ]}
        />
        <DocTip>
          Para melhores resultados ao analisar contratos longos, indique à IA qual cláusula ou aspecto
          específico você quer que ela analise. Ex: &quot;Analise as cláusulas de rescisão deste contrato
          e identifique riscos para o cliente.&quot;
        </DocTip>
      </DocSection>

      <DocSection title="Histórico de Conversas">
        <p className="text-muted-foreground mb-4">
          Todas as conversas são salvas automaticamente e ficam acessíveis no painel de histórico
          à esquerda da tela de Chat.
        </p>
        <DocActionList
          actions={[
            {
              icon: History,
              nome: 'Acessar Histórico',
              descricao:
                'O painel lateral esquerdo lista todas as conversas anteriores em ordem cronológica (mais recentes primeiro). Clique em qualquer conversa para reabri-la.',
            },
            {
              icon: MessageSquare,
              nome: 'Continuar Conversa',
              descricao:
                'Ao reabrir uma conversa do histórico, você pode continuar de onde parou. A IA mantém o contexto de toda a conversa anterior.',
            },
            {
              icon: Trash2,
              nome: 'Excluir Conversa',
              descricao:
                'Clique no ícone de lixeira ao lado de uma conversa no histórico para excluí-la permanentemente.',
            },
          ]}
        />
        <DocTip>
          Renomeie as conversas clicando no título no topo do chat para organizá-las por tema ou caso.
          Isso facilita encontrá-las no histórico posteriormente.
        </DocTip>
      </DocSection>

      <DocSection title="Boas Práticas">
        <DocActionList
          actions={[
            {
              icon: MessageSquare,
              nome: 'Seja específico',
              descricao:
                'Quanto mais contexto e detalhes você fornecer na pergunta, mais precisa e útil será a resposta da IA.',
            },
            {
              icon: MessageSquare,
              nome: 'Use conversas separadas por tema',
              descricao:
                'Evite misturar assuntos muito distintos em uma mesma conversa. Crie novas conversas para tópicos diferentes para manter o contexto claro.',
            },
            {
              icon: MessageSquare,
              nome: 'Revise antes de usar',
              descricao:
                'As respostas da IA são pontos de partida. Sempre revise textos jurídicos gerados antes de utilizá-los em documentos oficiais.',
            },
          ]}
        />
      </DocSection>
    </div>
  );
}
