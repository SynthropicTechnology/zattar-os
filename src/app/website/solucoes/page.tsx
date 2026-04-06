import { WebsiteShell } from "@/app/website";
import Link from "next/link";
import {
  ArrowRight,
  FileSearch,
  Terminal,
  LineChart,
  ChevronRight,
  Zap,
  ShieldCheck,
  Cpu,
  Lock,
  Network,
  Sparkles
} from "lucide-react";

export default function SolucoesPage() {
  return (
    <WebsiteShell>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden mt-6">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-background to-background"></div>
          <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-primary-dim/10 rounded-full blur-[100px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10 w-full">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-6 flex items-center gap-2">
              <span className="w-8 h-px bg-primary"></span> Infraestrutura Jurídica Next-Gen
            </span>
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] text-on-surface mb-8">
              Soluções Jurídicas Digitais. <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary-dim drop-shadow-[0_0_15px_rgb(var(--color-primary)/0.4)]">
                Inteligência que protege seu direito.
              </span>
            </h1>
            <p className="text-on-surface-variant text-lg md:text-xl max-w-xl leading-relaxed mb-10">
              Aceleramos a entrega de justiça através de processamento de linguagem natural e análise preditiva. Onde a lei encontra a precisão algorítmica.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contato" className="bg-primary text-on-primary-fixed px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-container transition-all duration-300 active:scale-95 flex items-center gap-2 shadow-lg shadow-primary/20">
                Falar com Especialista
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/contato" className="border border-outline-variant/30 text-on-surface px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/5 transition-all duration-300">
                Ver Demonstração
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 hidden lg:block relative">
            <div className="aspect-square rounded-3xl overflow-hidden bg-surface-variant/60 backdrop-blur-[20px] border border-white/10 relative shadow-2xl">
              <img 
                alt="Conceito futurista de justiça" 
                className="w-full h-full object-cover mix-blend-luminosity opacity-40 hover:opacity-60 transition-opacity duration-700" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvwVrtowJCM1qIqsAVHKMd5BIRCsEY-DAoIGyG0nog8sXrKVPlSnvUwgbS7QKgeI8mC88W0nwnVU_I8r5hgW5aETK3EK0PKddCZUbULimRniA-mdQG_g7t5UPNiYM2q7ZETmtHsQLw0tonkarUxC7E_TOQM-8HyHT_R8_gEF9N8LCH1kJEbgL44cPnqEFcc2tdCorF7uiXU5qbr8-YoX-iM8vTj7X672OlSiFWFMWPxHxsD_c3j6Tp10BXnE9ZylGvZ2hpVX3Ijbsn"
              />
              <div className="absolute inset-0 bg-linear-to-tr from-primary/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Solutions - Bento Grid */}
      <section className="py-24 bg-background relative z-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16">
            <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-4 block">Ecossistema</span>
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-on-surface tracking-tight">Soluções Principais</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Solution 1: Large Column */}
            <div className="md:col-span-2 group">
              <div className="h-full bg-surface-container rounded-3xl p-10 border border-white/5 hover:border-primary/30 hover:shadow-[0_0_30px_rgb(var(--color-primary)/0.1)] transition-all duration-500 flex flex-col justify-between overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8">
                  <Terminal className="text-primary w-24 h-24 opacity-10 group-hover:opacity-30 transition-opacity duration-500" />
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 border border-primary/20">
                    <FileSearch className="w-7 h-7" />
                  </div>
                  <h3 className="text-3xl font-headline font-bold text-on-surface mb-4">Auditoria Automatizada</h3>
                  <p className="text-on-surface-variant text-lg max-w-xl leading-relaxed">
                    Identificação instantânea de riscos contratuais e conformidade regulatória. Nossa engine analisa milhares de páginas em segundos, detectando anomalias que escapam ao olho humano.
                  </p>
                </div>
                <div className="mt-12 flex flex-wrap gap-4 relative z-10">
                  <span className="px-4 py-2 rounded-full bg-surface-container-highest text-primary text-xs font-bold uppercase tracking-wider border border-white/5">Processamento de Linguagem Natural</span>
                  <span className="px-4 py-2 rounded-full bg-surface-container-highest text-primary text-xs font-bold uppercase tracking-wider border border-white/5">Risk Score 99.9%</span>
                </div>
              </div>
            </div>
            
            {/* Solution 2: Square */}
            <div className="group">
              <div className="h-full bg-surface-container rounded-3xl p-8 border border-white/5 hover:border-primary/30 hover:shadow-[0_0_30px_rgb(var(--color-primary)/0.1)] transition-all duration-500 flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 border border-primary/20">
                  <LineChart className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-headline font-bold text-on-surface mb-4">Análise Preditiva de Riscos</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Modelagem estatística baseada em jurisprudência histórica para prever desfechos processuais com precisão cirúrgica.
                </p>
                <div className="mt-auto pt-8">
                  <Link className="text-primary font-bold flex items-center gap-2 group-hover:gap-4 transition-all" href="/contato">
                    Explorar Motor <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Solution 3: Square */}
            <div className="group">
              <div className="h-full bg-surface-container rounded-3xl p-8 border border-white/5 hover:border-primary/30 hover:shadow-[0_0_30px_rgb(var(--color-primary)/0.1)] transition-all duration-500 flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 border border-primary/20">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-headline font-bold text-on-surface mb-4">Protocolo Acelerado</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Automação de peticionamento e gestão de prazos. Redução de 70% no tempo de resposta operacional em processos de massa.
                </p>
                <div className="mt-auto pt-8">
                  <Link className="text-primary font-bold flex items-center gap-2 group-hover:gap-4 transition-all" href="/contato">
                    Ver Protocolo <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Solution 4: Long Row */}
            <div className="md:col-span-2 group">
              <div className="h-full bg-surface-container rounded-3xl p-8 border border-white/5 hover:border-primary/30 hover:shadow-[0_0_30px_rgb(var(--color-primary)/0.1)] transition-all duration-500 flex items-center gap-12">
                <div className="hidden md:block w-48 h-48 shrink-0">
                  <div className="w-full h-full rounded-2xl bg-linear-to-br from-primary-dim to-surface-container-highest p-0.5">
                    <div className="w-full h-full bg-surface-container rounded-2xl flex items-center justify-center">
                      <ShieldCheck className="w-20 h-20 text-primary opacity-80" />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-headline font-bold text-on-surface mb-3">Escudo Digital Compliance</h3>
                  <p className="text-on-surface-variant leading-relaxed mb-6">
                    Monitoramento em tempo real de alterações legislativas que impactam seu setor. Alertas proativos e geração automática de aditivos contratuais para manter sua operação segura.
                  </p>
                  <a href="/contato" className="text-on-primary-fixed font-semibold underline decoration-on-primary-fixed/50 underline-offset-8 hover:text-primary hover:decoration-primary transition-colors">
                    Ler documento técnico
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack: Magistrate Engine */}
      <section className="py-32 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-surface-container-low opacity-50"></div>
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2">
              <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-6 block">A Infraestrutura</span>
              <h2 className="font-headline text-4xl md:text-6xl font-extrabold text-on-surface tracking-tighter mb-8 leading-[1.1]">
                Zattar Engine: <br />
                <span className="text-on-surface-variant">O Núcleo Neural.</span>
              </h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="shrink-0 w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-primary shadow-inner shadow-primary/10">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-on-surface mb-2">Processamento de Alta Velocidade</h4>
                    <p className="text-on-surface-variant leading-relaxed">Arquitetura distribuída capaz de processar petições complexas em milissegundos.</p>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className="shrink-0 w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-primary shadow-inner shadow-primary/10">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-on-surface mb-2">Zero-Trust Security</h4>
                    <p className="text-on-surface-variant leading-relaxed">Criptografia de ponta a ponta e anonimização de dados sensíveis para total sigilo jurídico.</p>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className="shrink-0 w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-primary shadow-inner shadow-primary/10">
                    <Network className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-on-surface mb-2">Integração Universal</h4>
                    <p className="text-on-surface-variant leading-relaxed">Conectividade nativa com os principais sistemas de tribunais e ERPs corporativos.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 relative">
              <div className="relative w-full aspect-square flex items-center justify-center">
                {/* Tech Visual Representation */}
                <div className="absolute inset-0 rounded-full border border-primary/20 animate-[spin_10s_linear_infinite] border-dashed"></div>
                <div className="absolute inset-12 rounded-full border border-primary/10"></div>
                <div className="absolute inset-24 rounded-full border border-primary/5"></div>
                
                <div className="w-64 h-64 bg-surface-variant/60 backdrop-blur-[20px] rounded-full border border-primary/20 flex flex-col items-center justify-center relative shadow-[0_0_80px_rgb(var(--color-primary)/0.15)] group hover:scale-105 transition-transform duration-700">
                  <Sparkles className="w-24 h-24 text-primary opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_15px_rgb(var(--color-primary)/0.8)]" />
                  {/* Floating Data Points */}
                  <div className="absolute -top-4 right-0 bg-surface-container-highest px-4 py-2 rounded-lg border border-primary/30 text-xs font-mono text-on-surface shadow-xl">LATÊNCIA: 12ms</div>
                  <div className="absolute -bottom-8 left-0 bg-surface-container-highest px-4 py-2 rounded-lg border border-primary/30 text-xs font-mono text-on-surface shadow-xl">UPTIME: 99.99%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-8">
          <div className="bg-linear-to-br from-primary/10 via-surface-container-high to-surface-container rounded-4xl p-12 md:p-20 text-center border border-primary/20 relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary to-transparent"></div>
            <div className="relative z-10 w-full flex flex-col items-center">
              <h2 className="font-headline text-4xl md:text-6xl font-extrabold text-on-surface mb-8 tracking-tight leading-tight">
                Pronto para a nova era jurídica?
              </h2>
              <p className="text-on-surface-variant text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                Transforme seu departamento jurídico em um centro de inteligência e alta performance com a tecnologia da Zattar Engine.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6 w-full max-w-lg mx-auto">
                <Link href="/contato" className="bg-primary text-on-primary-fixed px-10 py-5 rounded-xl font-bold text-lg hover:bg-primary-container transition-all active:scale-95 shadow-lg shadow-primary/20 w-full sm:w-auto text-center">
                  Falar com Especialista
                </Link>
                <Link href="/contato" className="bg-transparent text-on-surface px-10 py-5 rounded-xl font-bold text-lg border border-outline-variant/50 hover:bg-white/5 hover:border-white/20 transition-all w-full sm:w-auto text-center">
                  Agendar Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </WebsiteShell>
  );
}
