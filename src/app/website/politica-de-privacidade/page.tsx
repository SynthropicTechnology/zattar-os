import { WebsiteShell } from "@/app/website";
import { Shield, Lock, Eye, Database, UserCheck, Mail } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Zattar Advogados",
  description:
    "Conheça como a Zattar Advogados coleta, utiliza e protege seus dados pessoais em conformidade com a LGPD.",
};

const sections = [
  {
    icon: Database,
    title: "Dados que Coletamos",
    content: [
      "**Dados de identificação:** nome completo, CPF, e-mail e telefone, fornecidos voluntariamente no formulário de contato ou no Portal do Cliente.",
      "**Dados processuais:** documentos e informações relacionadas ao seu caso jurídico, compartilhados exclusivamente para prestação de serviços advocatícios.",
      "**Dados de navegação:** endereço IP, tipo de navegador e páginas visitadas, coletados automaticamente para fins de segurança e melhoria do serviço.",
    ],
  },
  {
    icon: Eye,
    title: "Como Usamos seus Dados",
    content: [
      "**Prestação de serviços:** processamento e análise das informações necessárias para condução de processos jurídicos trabalhistas.",
      "**Comunicações:** envio de atualizações sobre seu processo, respostas a solicitações e notificações relevantes ao seu caso.",
      "**Melhoria dos serviços:** análise agregada e anonimizada para aprimorar a plataforma e garantir a melhor experiência ao cliente.",
      "Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais.",
    ],
  },
  {
    icon: Lock,
    title: "Como Protegemos seus Dados",
    content: [
      "Utilizamos **criptografia de ponta a ponta** para todos os dados em trânsito e em repouso.",
      "O acesso aos dados é restrito a advogados e colaboradores diretamente envolvidos no seu caso, sob dever de sigilo profissional.",
      "Nossa infraestrutura está em conformidade com padrões de segurança da informação compatíveis com a LGPD (Lei nº 13.709/2018).",
      "Realizamos auditorias periódicas de segurança e testes de vulnerabilidade para garantir a integridade dos dados.",
    ],
  },
  {
    icon: UserCheck,
    title: "Seus Direitos (LGPD)",
    content: [
      "**Acesso:** solicitar a confirmação e acesso aos seus dados pessoais que tratamos.",
      "**Correção:** requerer a correção de dados incompletos, inexatos ou desatualizados.",
      "**Eliminação:** solicitar a exclusão dos dados tratados com base no seu consentimento.",
      "**Portabilidade:** receber seus dados em formato estruturado e interoperável.",
      "**Revogação do consentimento:** retirar seu consentimento a qualquer momento, sem prejuízo do tratamento já realizado.",
    ],
  },
  {
    icon: Shield,
    title: "Retenção de Dados",
    content: [
      "Dados processuais são mantidos pelo prazo mínimo exigido pela legislação trabalhista e pelo Conselho Federal da OAB.",
      "Dados de contato são mantidos enquanto houver relação ativa ou por até **5 anos** após o encerramento do caso.",
      "Dados de navegação são retidos por até **12 meses** para fins de segurança.",
      "Após os prazos legais, os dados são eliminados de forma segura e irreversível.",
    ],
  },
];

export default function PoliticaDePrivacidadePage() {
  return (
    <WebsiteShell>
      <div className="pt-32 pb-24">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 md:px-8 mb-16 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="text-primary font-bold text-xs uppercase tracking-widest">
              Privacidade &amp; Proteção de Dados
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tighter leading-tight mb-6 text-on-surface">
            Política de{" "}
            <span className="bg-linear-to-r from-primary to-primary-dim bg-clip-text text-transparent">
              Privacidade
            </span>
          </h1>
          <p className="text-on-surface-variant text-lg leading-relaxed max-w-2xl">
            A Zattar Advogados trata seus dados pessoais com rigor e
            transparência, em total conformidade com a Lei Geral de Proteção de
            Dados (LGPD — Lei nº 13.709/2018).
          </p>
          <p className="text-on-surface-variant/60 text-sm mt-4">
            Última atualização: janeiro de 2025 · OAB/MG 128.404
          </p>
        </section>

        {/* Divider */}
        <div className="max-w-4xl mx-auto px-6 md:px-8 mb-16">
          <div className="h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
        </div>

        {/* Sections */}
        <section className="max-w-4xl mx-auto px-6 md:px-8 space-y-8">
          {sections.map(({ icon: Icon, title, content }) => (
            <div
              key={title}
              className="bg-surface-container rounded-3xl p-8 md:p-10 border border-white/5"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-headline font-bold text-on-surface">
                  {title}
                </h2>
              </div>
              <ul className="space-y-3">
                {content.map((item, i) => (
                  <li
                    key={i}
                    className="text-on-surface-variant text-sm leading-relaxed flex gap-3"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0 mt-2" />
                    <span
                      dangerouslySetInnerHTML={{
                        __html: item.replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong class="text-on-surface font-semibold">$1</strong>'
                        ),
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Contact DPO */}
        <section className="max-w-4xl mx-auto px-6 md:px-8 mt-12">
          <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="grow">
              <h3 className="text-on-surface font-bold font-headline mb-1">
                Encarregado de Dados (DPO)
              </h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Para exercer seus direitos ou tirar dúvidas sobre o tratamento
                dos seus dados, entre em contato:
              </p>
            </div>
            <a
              href="mailto:contato@zattaradvogados.com"
              className="shrink-0 bg-primary text-on-primary-fixed px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all whitespace-nowrap"
            >
              contato@zattaradvogados.com
            </a>
          </div>
        </section>
      </div>
    </WebsiteShell>
  );
}
