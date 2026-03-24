import { Header } from "@/features/website/components/layout/header";
import { Footer } from "@/features/website/components/layout/footer";
import { Search, ArrowUpRight, Gavel, ArrowRight, Headset } from "lucide-react";

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-background dark selection:bg-primary/30 text-on-surface font-body overflow-x-hidden pt-28">
      <Header />

      {/* Header / Search Area */}
      <header className="pt-16 pb-12 px-8 max-w-6xl mx-auto mt-6">
        <div className="space-y-4">
          <span className="text-primary font-label text-xs font-bold uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Central de Ajuda
          </span>
          <h2 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tighter text-white">
            Como podemos <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-dim">ajudar hoje?</span>
          </h2>
          <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
            Encontre respostas rápidas para suas dúvidas jurídicas ou navegue pelas categorias para entender seus direitos com clareza.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mt-12 relative group max-w-4xl">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="text-on-surface-variant group-focus-within:text-primary transition-colors w-6 h-6" />
          </div>
          <input
            className="w-full bg-surface-container-high border-none rounded-2xl py-6 pl-16 pr-6 text-on-surface placeholder:text-on-surface-variant/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] outline-none"
            placeholder="Pesquisar por 'Rescisão', 'Pagamentos' ou 'Documentos'..."
            type="text"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3 mt-8">
          <button className="px-6 py-2.5 bg-surface-container-highest text-primary font-medium rounded-full hover:bg-primary hover:text-on-primary-fixed transition-all text-sm border border-primary/20 hover:shadow-[0_0_15px_rgba(204,151,255,0.4)]">
            Direito Trabalhista
          </button>
          <button className="px-6 py-2.5 bg-surface-container-low text-on-surface-variant font-medium rounded-full hover:bg-surface-container-highest transition-all text-sm border border-white/5">
            Uso da Plataforma
          </button>
          <button className="px-6 py-2.5 bg-surface-container-low text-on-surface-variant font-medium rounded-full hover:bg-surface-container-highest transition-all text-sm border border-white/5">
            Segurança e Dados
          </button>
          <button className="px-6 py-2.5 bg-surface-container-low text-on-surface-variant font-medium rounded-full hover:bg-surface-container-highest transition-all text-sm border border-white/5">
            Honorários & Custos
          </button>
        </div>
      </header>

      {/* FAQ Content Sections (Asymmetric Layout) */}
      <section className="px-8 pb-32 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Questions Column */}
        <div className="md:col-span-8 space-y-6">
          
          {/* FAQ Card 1 */}
          <div className="bg-surface-variant/60 backdrop-blur-[20px] p-8 rounded-3xl border border-white/5 hover:shadow-[0_0_20px_rgba(204,151,255,0.15)] transition-all cursor-pointer group">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-primary font-bold text-[10px] uppercase tracking-widest">Rescisão</span>
                <h3 className="text-xl font-headline font-bold text-white group-hover:text-primary transition-colors">
                  Como calcular minha rescisão?
                </h3>
              </div>
              <ArrowUpRight className="text-primary-dim group-hover:rotate-45 transition-transform w-6 h-6 shrink-0" />
            </div>
            <div className="mt-6 text-on-surface-variant leading-relaxed text-sm">
              O cálculo da rescisão depende do motivo do desligamento. No caso de demissão sem justa causa, você tem direito ao saldo de salário, aviso prévio, férias proporcionais + 1/3, 13º proporcional e multa de 40% do FGTS. Você pode utilizar nossa calculadora na área do cliente.
            </div>
          </div>

          {/* FAQ Card 2 */}
          <div className="bg-surface-variant/60 backdrop-blur-[20px] p-8 rounded-3xl border border-white/5 hover:shadow-[0_0_20px_rgba(204,151,255,0.15)] transition-all cursor-pointer group">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-primary font-bold text-[10px] uppercase tracking-widest">Direitos</span>
                <h3 className="text-xl font-headline font-bold text-white group-hover:text-primary transition-colors">
                  O que é rescisão indireta?
                </h3>
              </div>
              <ArrowUpRight className="text-primary-dim group-hover:rotate-45 transition-transform w-6 h-6 shrink-0" />
            </div>
            <div className="mt-6 text-on-surface-variant leading-relaxed text-sm">
              Conhecida como a &quot;justa causa do empregador&quot;, ocorre quando a empresa comete faltas graves, como atraso recorrente de salários ou falta de depósitos de FGTS. Nesses casos, o trabalhador pode sair e receber todas as verbas como se tivesse sido demitido sem justa causa.
            </div>
          </div>

          {/* FAQ Card 3 */}
          <div className="bg-surface-variant/60 backdrop-blur-[20px] p-8 rounded-3xl border border-white/5 hover:shadow-[0_0_20px_rgba(204,151,255,0.15)] transition-all cursor-pointer group">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-primary font-bold text-[10px] uppercase tracking-widest">Processual</span>
                <h3 className="text-xl font-headline font-bold text-white group-hover:text-primary transition-colors">
                  Quais documentos preciso para um processo?
                </h3>
              </div>
              <ArrowUpRight className="text-primary-dim group-hover:rotate-45 transition-transform w-6 h-6 shrink-0" />
            </div>
            <div className="mt-6 text-on-surface-variant leading-relaxed text-sm">
              Essencialmente: CTPS (Carteira de Trabalho), holerites, extrato do FGTS, TRCT (Termo de Rescisão) e provas específicas do seu caso (mensagens de WhatsApp, e-mails ou fotos). Você pode subir todos esses arquivos de forma segura no cofre digital do Portal Zattar.
            </div>
          </div>

          {/* FAQ Card 4 */}
          <div className="bg-surface-variant/60 backdrop-blur-[20px] p-8 rounded-3xl border border-white/5 hover:shadow-[0_0_20px_rgba(204,151,255,0.15)] transition-all cursor-pointer group">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-primary font-bold text-[10px] uppercase tracking-widest">Segurança</span>
                <h3 className="text-xl font-headline font-bold text-white group-hover:text-primary transition-colors">
                  Meus dados estão seguros na plataforma?
                </h3>
              </div>
              <ArrowUpRight className="text-primary-dim group-hover:rotate-45 transition-transform w-6 h-6 shrink-0" />
            </div>
            <div className="mt-6 text-on-surface-variant leading-relaxed text-sm">
              Absolutamente. Utilizamos criptografia de ponta a ponta e estamos em total conformidade com a LGPD. Seus documentos são processados e armazenados em infraestrutura segura, restrita a você e aos sócios do caso.
            </div>
          </div>

        </div>

        {/* Sidebar/Featured Column */}
        <div className="md:col-span-4 space-y-8">
          {/* Tech Feature Card */}
          <div className="bg-gradient-to-br from-primary/20 to-transparent p-8 rounded-3xl border border-primary/20 overflow-hidden relative shadow-lg">
            <div className="relative z-10">
              <h4 className="text-xl font-headline font-bold text-white mb-4">Análise em Tempo Real</h4>
              <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                Acesse nossa plataforma para visualizar o status do seu processo em tempo real, com explicações geradas para leigos.
              </p>
              <button className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-tighter hover:gap-4 transition-all">
                Acessar Portal <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-10">
              <Gavel className="w-48 h-48 text-primary" />
            </div>
          </div>

          {/* Popular Topics List */}
          <div className="bg-surface-container p-8 rounded-3xl border border-white/5 shadow-xl">
            <h4 className="text-lg font-headline font-bold text-white mb-6">Tópicos Populares</h4>
            <ul className="space-y-5">
              <li className="flex items-center gap-3 text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer group">
                <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
                Horas Extras e Adicionais
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer group">
                <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
                Assédio Moral no Trabalho
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer group">
                <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
                Estabilidade Gestante
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer group">
                <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
                Férias e Descanso Semanal
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-surface-container-low py-32 px-8 border-t border-white/5 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center justify-center p-5 bg-primary/10 rounded-full mb-4 border border-primary/20 shadow-[0_0_30px_rgba(204,151,255,0.15)]">
            <Headset className="text-primary w-8 h-8" />
          </div>
          <h2 className="text-4xl md:text-5xl font-headline font-black tracking-tighter text-white">
            Ainda tem dúvidas?
          </h2>
          <p className="text-on-surface-variant text-lg">
            Se você não encontrou o que procurava, nossos especialistas jurídicos estão prontos para analisar o seu caso em detalhes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <button className="bg-primary text-on-primary-fixed font-bold px-10 py-4 rounded-xl hover:bg-primary-container transition-all active:scale-95 shadow-lg shadow-primary/20 text-lg">
              Falar com um especialista
            </button>
            <button className="bg-transparent border border-outline-variant hover:bg-white/5 text-on-surface font-bold px-10 py-4 rounded-xl transition-all text-lg border-opacity-50 hover:border-white/20">
              Acessar Portal do Cliente
            </button>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent pointer-events-none opacity-50"></div>
      </section>

      <Footer />
    </main>
  );
}
