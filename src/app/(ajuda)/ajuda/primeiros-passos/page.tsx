import Link from 'next/link';
import { Rocket, CheckCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const steps = [
  {
    number: 1,
    title: 'Acesse o Sistema',
    description: 'Faça login com suas credenciais fornecidas pelo administrador. Se for seu primeiro acesso, você receberá um email para definir sua senha.',
  },
  {
    number: 2,
    title: 'Conheça o Dashboard',
    description: 'O dashboard mostra uma visão geral do sistema com indicadores importantes: processos ativos, audiências próximas, expedientes pendentes e mais.',
  },
  {
    number: 3,
    title: 'Explore o Acervo',
    description: 'Acesse o menu Acervo para ver todos os processos. Use os filtros para encontrar processos específicos por TRT, responsável ou número.',
  },
  {
    number: 4,
    title: 'Verifique Audiências',
    description: 'Na seção Audiências, veja todas as audiências agendadas. Você pode filtrar por período e adicionar URLs de audiências virtuais.',
  },
  {
    number: 5,
    title: 'Acompanhe Expedientes',
    description: 'Os expedientes mostram tarefas pendentes e prazos. Fique atento aos indicadores de prazo vencido para evitar perder prazos importantes.',
  },
  {
    number: 6,
    title: 'Configure seu Perfil',
    description: 'Acesse seu perfil clicando no seu nome no menu. Atualize suas informações e preferências de notificação.',
  },
];

export default function PrimeirosPassosPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Rocket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Primeiros Passos</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Guia rápido para começar a usar o Synthropic. Siga os passos abaixo para se familiarizar com o sistema.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step) => (
          <Card key={step.number}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {step.number}
                </div>
                <CardTitle>{step.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pl-18">
              <CardDescription className="text-base">
                {step.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Próximos Passos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/ajuda/funcionalidades">
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Explorar Funcionalidades
                  <ArrowRight className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Conheça em detalhes todas as funcionalidades do sistema
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link href="/ajuda/faq">
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Perguntas Frequentes
                  <ArrowRight className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Encontre respostas para dúvidas comuns
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Dicas para Novos Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Use os atalhos de teclado para navegar mais rapidamente</li>
            <li>Configure notificações para não perder prazos importantes</li>
            <li>Salve filtros frequentes para acesso rápido</li>
            <li>Mantenha seus dados de perfil atualizados</li>
            <li>Em caso de dúvidas, consulte esta documentação ou contate o suporte</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
