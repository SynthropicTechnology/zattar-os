import { Header } from "@/features/website/components/layout/header";
import { Footer } from "@/features/website/components/layout/footer";
import Link from "next/link";
import { 
  Clock, 
  Banknote, 
  Umbrella, 
  Gavel, 
  Frown, 
  SlidersHorizontal, 
  ArrowRight 
} from "lucide-react";

export default function ServicosPage() {
  return (
    <main className="min-h-screen bg-background text-on-surface font-body selection:bg-primary/30 overflow-x-hidden pt-28">
      <Header />

      {/* Hero Section */}
      <section className="mb-24 relative overflow-hidden mt-6 px-6 max-w-7xl mx-auto">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(204,151,255,0.05)_0%,transparent_70%)] opacity-50 pointer-events-none"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7">
            <span className="inline-block text-primary font-headline font-bold text-sm tracking-widest uppercase mb-4">
              Justiça Tecnológica
            </span>
            <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tighter mb-8 leading-none">
              Serviços para o <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dim">Trabalhador</span>
            </h1>
            <p className="text-xl text-on-surface-variant font-body leading-relaxed max-w-xl">
              A tecnologia a serviço dos seus direitos. Utilizamos inteligência artificial para auditar contratos e garantir que cada centavo do seu esforço seja respeitado pela lei.
            </p>
          </div>
          <div className="lg:col-span-5 relative group">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full transition-opacity group-hover:opacity-40"></div>
            <img 
              alt="Escritório jurídico moderno cinematográfico com detalhes em neon roxo" 
              className="relative z-10 w-full aspect-square object-cover rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-srsLbRyGdeBqJMv0wuM89Ko1LJkJASmh3T1IcCC7j2CpMUWt-ENa8nuMl1eVWre6ts1ISmdnxP2wsTmBZAtUhqIevSFqNA6hkwSSQhk33fB8WJyMg9NUi9cP19eYom_DGIkuz6LTRQmPdxJgWNQsoX7yG9qSDEaPkfpmbHp24qVT3XjCk09jkvc7YIsTbVG6JmrE1GbaczJroUPbvufmV9kMYwcdg_7e1nO72rh7LOp8L7bmcJd_62Yi79ypykszkQ72hK54-hLJ"
            />
          </div>
        </div>
      </section>

      {/* Interactive Calculators Section (Preview) */}
      <section className="mb-32 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-primary font-headline font-bold text-xs tracking-[0.2em] uppercase">Autonomia Digital</span>
            <h2 className="text-4xl font-headline font-extrabold tracking-tight mt-2 text-white">Calculadoras Inteligentes</h2>
          </div>
          <p className="text-on-surface-variant max-w-sm">Resultados instantâneos baseados na Consolidação das Leis do Trabalho (CLT) vigente.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cálculo de Horas Extras */}
          <div className="bg-surface-container rounded-3xl p-8 border border-white/5 flex flex-col hover:border-primary/30 hover:shadow-[0_0_20px_rgba(204,151,255,0.1)] transition-all">
            <div className="mb-8">
              <Clock className="text-primary w-10 h-10 mb-5" />
              <h3 className="text-2xl font-headline font-bold text-white">Horas Extras</h3>
            </div>
            <div className="space-y-6 flex-grow">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Salário Bruto</label>
                <input className="w-full bg-surface-container-high border border-white/5 focus:border-primary/50 rounded-xl p-4 text-on-surface outline-none transition-colors" placeholder="R$ 0,00" type="text" disabled />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Horas no Mês</label>
                <input className="w-full bg-surface-container-high border border-white/5 focus:border-primary/50 rounded-xl p-4 text-on-surface outline-none transition-colors" placeholder="220h" type="text" disabled />
              </div>
            </div>
            <Link href="/portal/calculadoras" className="mt-10 w-full bg-primary text-on-primary-fixed py-4 rounded-xl font-bold font-headline shadow-[0_0_20px_rgba(204,151,255,0.2)] hover:shadow-[0_0_30px_rgba(204,151,255,0.4)] transition-all active:scale-95 text-center flex items-center justify-center">
              Acessar Calculadora
            </Link>
          </div>

          {/* Décimo Terceiro */}
          <div className="bg-surface-container rounded-3xl p-8 border border-white/5 flex flex-col hover:border-primary/30 hover:shadow-[0_0_20px_rgba(204,151,255,0.1)] transition-all">
            <div className="mb-8">
              <Banknote className="text-primary w-10 h-10 mb-5" />
              <h3 className="text-2xl font-headline font-bold text-white">13º Salário</h3>
            </div>
            <div className="space-y-6 flex-grow">
              <div className="flex gap-2 mb-4">
                <div className="h-1 flex-1 bg-primary rounded-full shadow-[0_0_8px_rgba(204,151,255,0.5)]"></div>
                <div className="h-1 flex-1 bg-surface-container-highest rounded-full"></div>
                <div className="h-1 flex-1 bg-surface-container-highest rounded-full"></div>
              </div>
              <p className="text-sm text-on-surface-variant">Selecione quantos meses você trabalhou este ano para uma estimativa precisa.</p>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-surface-container-high py-3 rounded-lg text-sm text-center text-on-surface-variant cursor-not-allowed border border-white/5">1</div>
                <div className="bg-surface-container-high py-3 rounded-lg text-sm text-center text-on-surface-variant cursor-not-allowed border border-white/5">2</div>
                <div className="bg-primary/20 text-primary border border-primary/40 py-3 rounded-lg text-sm text-center font-bold">3</div>
                <div className="bg-surface-container-high py-3 rounded-lg text-sm text-center text-on-surface-variant cursor-not-allowed border border-white/5">4</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Salário Base</label>
                <input className="w-full bg-surface-container-high border border-white/5 focus:border-primary/50 rounded-xl p-4 text-on-surface outline-none transition-colors" placeholder="R$ 0,00" type="text" disabled />
              </div>
            </div>
            <Link href="/portal/calculadoras" className="mt-10 w-full bg-surface-container-highest text-white py-4 rounded-xl font-bold font-headline border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all text-center flex items-center justify-center">
              Acessar Calculadora
            </Link>
          </div>

          {/* Cálculo de Férias */}
          <div className="bg-surface-container rounded-3xl p-8 border border-white/5 flex flex-col hover:border-primary/30 hover:shadow-[0_0_20px_rgba(204,151,255,0.1)] transition-all">
            <div className="mb-8">
              <Umbrella className="text-primary w-10 h-10 mb-5" />
              <h3 className="text-2xl font-headline font-bold text-white">Cálculo de Férias</h3>
            </div>
            <div className="space-y-6 flex-grow">
              <div className="bg-surface-container-high p-5 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-white">Dias de Gozo</span>
                  <span className="text-primary font-bold">20 Dias</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full w-[66%] bg-primary shadow-[0_0_10px_rgba(204,151,255,0.8)]"></div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-2xl border border-white/5">
                <div className="w-5 h-5 rounded border border-primary bg-primary/20 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-primary rounded-sm"></div>
                </div>
                <span className="text-sm text-on-surface-variant">Desejo vender 1/3 das férias</span>
              </div>
            </div>
            <Link href="/portal/calculadoras" className="mt-10 w-full bg-primary text-on-primary-fixed py-4 rounded-xl font-bold font-headline shadow-[0_0_20px_rgba(204,151,255,0.2)] hover:shadow-[0_0_30px_rgba(204,151,255,0.4)] transition-all active:scale-95 text-center flex items-center justify-center">
              Acessar Calculadora
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Service Blocks */}
      <section className="mb-32 px-6 max-w-7xl mx-auto">
        <div className="mb-16">
          <span className="text-primary font-headline font-bold text-xs tracking-[0.2em] uppercase">Especialidades</span>
          <h2 className="text-4xl font-headline font-extrabold tracking-tight mt-2 text-white">Nossas Soluções Jurídicas</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Rescisão Indireta */}
          <div className="group bg-surface-container-low p-8 rounded-3xl border border-white/5 hover:bg-surface-container hover:border-primary/20 transition-all duration-500 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] group-hover:bg-primary/10 transition-colors"></div>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner shadow-primary/10 relative z-10">
              <Gavel className="text-primary w-8 h-8" />
            </div>
            <h4 className="text-2xl font-headline font-bold mb-4 text-white relative z-10">Rescisão Indireta</h4>
            <p className="text-on-surface-variant mb-8 line-clamp-3 leading-relaxed relative z-10">Quando a empresa falha com você, a lei permite que você peça demissão com todos os seus direitos garantidos como se tivesse sido demitido sem justa causa.</p>
            <Link href="/expertise" className="inline-flex items-center gap-2 text-primary font-bold group-hover:gap-4 transition-all relative z-10">
              Saber mais <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Danos Morais */}
          <div className="group bg-surface-container-low p-8 rounded-3xl border border-white/5 hover:bg-surface-container hover:border-primary/20 transition-all duration-500 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] group-hover:bg-primary/10 transition-colors"></div>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner shadow-primary/10 relative z-10">
              <Frown className="text-primary w-8 h-8" />
            </div>
            <h4 className="text-2xl font-headline font-bold mb-4 text-white relative z-10">Danos Morais</h4>
            <p className="text-on-surface-variant mb-8 line-clamp-3 leading-relaxed relative z-10">Assédio, humilhação ou condições degradantes não devem ser tolerados. Nossa equipe busca sua reparação financeira e moral de forma incisiva e digna.</p>
            <Link href="/expertise" className="inline-flex items-center gap-2 text-primary font-bold group-hover:gap-4 transition-all relative z-10">
              Consultar <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Equiparação Salarial */}
          <div className="group bg-surface-container-low p-8 rounded-3xl border border-white/5 hover:bg-surface-container hover:border-primary/20 transition-all duration-500 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] group-hover:bg-primary/10 transition-colors"></div>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner shadow-primary/10 relative z-10">
              <SlidersHorizontal className="text-primary w-8 h-8" />
            </div>
            <h4 className="text-2xl font-headline font-bold mb-4 text-white relative z-10">Equiparação Salarial</h4>
            <p className="text-on-surface-variant mb-8 line-clamp-3 leading-relaxed relative z-10">Trabalho igual, salário igual. Auditamos discrepâncias salariais entre funções idênticas na mesma empresa para garantir seus direitos retroativos.</p>
            <Link href="/expertise" className="inline-flex items-center gap-2 text-primary font-bold group-hover:gap-4 transition-all relative z-10">
              Analisar Caso <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="mb-32 px-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-primary/10 to-surface-container/80 rounded-[2.5rem] p-12 md:p-24 text-center border border-primary/20 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(204,151,255,0.05)_0%,transparent_70%)] pointer-events-none"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-headline font-extrabold mb-8 text-white">Dúvidas sobre seus cálculos?</h2>
            <p className="text-xl text-on-surface-variant mb-12 leading-relaxed">Nossos especialistas estão prontos para revisar seu caso detalhadamente e garantir que nada seja deixado para trás no seu processo de rescisão.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contato" className="bg-primary text-on-primary-fixed px-10 py-5 rounded-2xl font-headline font-extrabold text-lg hover:bg-primary-container transition-all shadow-[0_10px_30px_rgba(204,151,255,0.2)] hover:shadow-[0_15px_40px_rgba(204,151,255,0.4)] active:scale-95 flex items-center justify-center">
                Consultar Especialista
              </Link>
              <Link href="/contato" className="bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 text-white px-10 py-5 rounded-2xl font-headline font-extrabold text-lg hover:bg-white/10 transition-all flex items-center justify-center">
                Falar no WhatsApp
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
