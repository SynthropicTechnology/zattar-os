import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const faqItems = [
  {
    category: 'Geral',
    questions: [
      {
        question: 'Como faço para alterar minha senha?',
        answer: 'Acesse seu perfil clicando no seu nome no menu superior direito, depois vá em "Conta" e clique em "Alterar Senha". Você precisará informar sua senha atual e a nova senha duas vezes para confirmação.',
      },
      {
        question: 'O sistema funciona em dispositivos móveis?',
        answer: 'Sim, o Synthropic é responsivo e funciona em tablets e smartphones. No entanto, para melhor experiência, recomendamos o uso em desktop ou notebook.',
      },
      {
        question: 'Como altero o tema para modo escuro?',
        answer: 'Clique no seu nome no menu e ative/desative a opção "Tema escuro". A preferência é salva automaticamente.',
      },
    ],
  },
  {
    category: 'Processos',
    questions: [
      {
        question: 'Como encontro um processo específico?',
        answer: 'Use a barra de busca no topo da página de Acervo. Você pode buscar por número do processo, nome do cliente, CPF/CNPJ ou parte contrária. Também pode usar os filtros por TRT, grau e responsável.',
      },
      {
        question: 'Como atribuo um responsável a um processo?',
        answer: 'Abra o processo desejado e no campo "Responsável", selecione o advogado da lista. A alteração é salva automaticamente.',
      },
      {
        question: 'Os processos são atualizados automaticamente?',
        answer: 'Sim, através da funcionalidade de Captura PJE. O sistema sincroniza periodicamente com os tribunais para manter os dados atualizados.',
      },
    ],
  },
  {
    category: 'Audiências',
    questions: [
      {
        question: 'Como adiciono a URL de uma audiência virtual?',
        answer: 'Na lista de audiências, clique no ícone de edição ao lado da audiência desejada. Cole a URL do Zoom, Teams ou outra plataforma no campo correspondente e salve.',
      },
      {
        question: 'Recebo notificações de audiências?',
        answer: 'Sim, você pode configurar notificações no seu perfil. O sistema envia lembretes antes das audiências agendadas.',
      },
    ],
  },
  {
    category: 'Expedientes',
    questions: [
      {
        question: 'Qual a diferença entre expediente manual e pendente de manifestação?',
        answer: 'Expedientes manuais são criados por você para controle interno. Pendentes de manifestação são capturados automaticamente do PJE e representam intimações que requerem ação.',
      },
      {
        question: 'Como baixo um expediente?',
        answer: 'Clique no botão "Baixar" do expediente e informe o número do protocolo (se houve peticionamento) ou uma justificativa (se não houve). O expediente será marcado como concluído.',
      },
      {
        question: 'Posso reverter a baixa de um expediente?',
        answer: 'Sim, clique em "Reverter Baixa" no expediente. Ele voltará ao status pendente.',
      },
    ],
  },
  {
    category: 'Captura',
    questions: [
      {
        question: 'Como configuro as credenciais do PJE?',
        answer: 'Acesse Configurações → Credenciais PJE. Selecione o advogado, informe o login e senha do PJE. Se o tribunal exigir 2FA, configure também o código OTP.',
      },
      {
        question: 'A captura falhou. O que fazer?',
        answer: 'Verifique se as credenciais estão corretas e se a senha não expirou. Consulte o histórico de capturas para ver a mensagem de erro específica. Se o problema persistir, contate o suporte.',
      },
      {
        question: 'Posso agendar capturas automáticas?',
        answer: 'Sim, na seção de Captura você pode configurar agendamentos para executar capturas em horários específicos.',
      },
    ],
  },
  {
    category: 'Permissões',
    questions: [
      {
        question: 'Não consigo acessar uma funcionalidade. Por quê?',
        answer: 'Provavelmente você não tem permissão para acessar essa funcionalidade. Contate o administrador do sistema para verificar suas permissões.',
      },
      {
        question: 'Como sei quais permissões eu tenho?',
        answer: 'Suas permissões são definidas pelo seu cargo. Contate o administrador para saber quais funcionalidades estão disponíveis para você.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Perguntas Frequentes</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Encontre respostas para as dúvidas mais comuns sobre o Synthropic.
        </p>
      </div>

      {/* FAQ by Category */}
      {faqItems.map((category) => (
        <Card key={category.category}>
          <CardHeader>
            <CardTitle>{category.category}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {category.questions.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Não encontrou o que procurava?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Se sua dúvida não foi respondida aqui, entre em contato com o suporte técnico
            ou consulte a documentação completa das funcionalidades.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
