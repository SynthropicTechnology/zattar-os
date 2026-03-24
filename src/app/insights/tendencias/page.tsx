import { Header } from "@/features/website/components/layout/header";
import { Footer } from "@/features/website/components/layout/footer";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";

export default function InsightsTendenciasPage() {
  return (
    <main className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary/30 overflow-x-hidden pt-28">
      <Header />

      <div className="pt-16 pb-24 px-6 md:px-12 max-w-7xl mx-auto mt-6">
        {/* Hero Featured Section */}
        <section className="relative mb-24 rounded-[2.5rem] overflow-hidden group shadow-2xl">
          <div className="aspect-[16/7] md:aspect-[21/9] w-full bg-surface-container overflow-hidden">
            <img 
              alt="Tribunal futurista com interfaces holográficas" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 mix-blend-luminosity hover:mix-blend-normal" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkY_PQMsB6J3Thp9DKMB-sB1YnekGjAyLokayJ0RMPTGllsxihfQguYGzGGFBr3a6C361MVtXzWZZnZ8FxCrUrTjk190U_UrxEbnRMhyk4lD1pYCd2kGQHg6BqBhqnhsQ9nK-r5OTtaxjpUxE6Py_hvgSiMeaJVYdcLFZ-eg0mL40vdgSGagQboSA1nEPkBKZWBn3AgprfPHqDTniX6QT_ohz_a_hmgUi1DPPGln8Sunl4TtwMqvbh8bEEUuKd7wkK07C7DTl6cK_T"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent flex flex-col justify-end p-8 md:p-16">
            <span className="text-primary font-label text-sm uppercase tracking-[0.2em] mb-4 flex items-center gap-2 drop-shadow-md">
              <span className="w-8 h-px bg-primary shadow-[0_0_10px_rgba(204,151,255,0.8)]"></span> Artigo em Destaque
            </span>
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tighter mb-6 leading-tight text-white drop-shadow-lg">
                A Ascensão da IA Generativa na <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dim drop-shadow-[0_0_15px_rgba(204,151,255,0.4)]">
                  Análise Jurisprudencial
                </span>
              </h1>
              <p className="text-zinc-300 text-lg md:text-xl mb-8 font-light max-w-2xl leading-relaxed drop-shadow-md">
                Como algoritmos de processamento de linguagem natural estão transformando décadas de precedentes em insights estratégicos instantâneos para grandes firmas.
              </p>
              <button className="group/btn flex items-center gap-4 text-primary font-bold hover:gap-6 transition-all duration-300">
                LER ARTIGO COMPLETO
                <span className="bg-primary/10 p-2 rounded-full group-hover/btn:bg-primary/20 border border-primary/20 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
          <div className="flex gap-3 overflow-x-auto pb-4 w-full md:w-auto scrollbar-hide">
            <Link href="/insights" className="px-6 py-2.5 rounded-full bg-surface-container-highest text-on-surface-variant hover:text-white transition-colors font-semibold text-sm whitespace-nowrap border border-white/5 hover:bg-white/10">
              Todos
            </Link>
            <button className="px-6 py-2.5 rounded-full bg-primary text-on-primary-fixed font-bold text-sm whitespace-nowrap shadow-[0_0_15px_rgba(204,151,255,0.3)]">
              Tendências
            </button>
            <button className="px-6 py-2.5 rounded-full bg-surface-container-highest text-on-surface-variant hover:text-white transition-colors font-semibold text-sm whitespace-nowrap border border-white/5 hover:bg-white/10">
              Estudos de Caso
            </button>
            <button className="px-6 py-2.5 rounded-full bg-surface-container-highest text-on-surface-variant hover:text-white transition-colors font-semibold text-sm whitespace-nowrap border border-white/5 hover:bg-white/10">
              Notícias
            </button>
          </div>
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors w-5 h-5" />
            <input 
              className="w-full bg-surface-container-high border border-white/5 focus:border-primary/50 flex-grow rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-outline focus:ring-1 focus:ring-primary/50 transition-all outline-none shadow-inner" 
              placeholder="Pesquisar insights..." 
              type="text"
            />
          </div>
        </div>

        {/* Bento Grid Articles */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Big Card 1 */}
          <article className="md:col-span-8 group bg-surface-container rounded-[2rem] overflow-hidden border border-white/5 hover:border-primary/30 transition-all duration-500 shadow-lg hover:shadow-[0_0_30px_rgba(204,151,255,0.1)] flex flex-col md:flex-row h-full">
            <div className="md:w-1/2 overflow-hidden bg-surface-container-highest">
              <img 
                alt="Direito Digital" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 mix-blend-luminosity hover:mix-blend-normal" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZ2GrBpII1Y_7SSCYZKDNiZT5wCwg4HHsoX03-pXoH_A-pRcN2UggZBOEwgQXd3MklpFtSPNn8ZYZ1MLAx5Flt1uFE68ofI8s9vi2EPbllUr-DexZ8vxW0DHZHXA2NwMKbIzjvy9fLfsQ6mvkijbbeEy5es8XPvXgh8kaXGAkhD2yZIFFUbFTnN0DOGWgC5-BqHAyE01xqIjQHSvKW6teLypwO69sm-SQIIOQAO06lHxNXE0BDRA2DSKWgcwZlrsKw8IXtfDZsBSYF"
              />
            </div>
            <div className="md:w-1/2 p-8 lg:p-10 flex flex-col justify-between">
              <div>
                <span className="bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-6 inline-block uppercase tracking-wider">Direito Digital</span>
                <h3 className="text-2xl font-headline font-bold text-white mb-4 group-hover:text-primary transition-colors leading-tight">
                  Privacidade de Dados em Ambientes de Metaverso Corporativo
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-6 line-clamp-3">
                  Analisamos os novos desafios jurídicos impostos pela LGPD em ambientes virtuais de trabalho e a responsabilidade civil no processamento de dados biométricos.
                </p>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-outline font-label uppercase tracking-widest font-bold">5 min de leitura</span>
                <Link href="#" className="text-primary text-sm font-bold flex items-center gap-2 group/btn">
                  Ler Mais <ArrowRight className="group-hover/btn:translate-x-1 transition-transform w-4 h-4" />
                </Link>
              </div>
            </div>
          </article>

          {/* Small Card 1 */}
          <article className="md:col-span-4 group bg-surface-container rounded-[2rem] p-8 border border-white/5 hover:border-primary/30 transition-all duration-500 shadow-lg hover:shadow-[0_0_30px_rgba(204,151,255,0.1)] flex flex-col justify-between">
            <div>
              <span className="bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-6 inline-block uppercase tracking-wider">IA Jurídica</span>
              <h3 className="text-xl font-headline font-bold text-white mb-4 group-hover:text-primary transition-colors leading-tight">
                O Impacto do GPT-4 na Redação de Petições Iniciais
              </h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                Um estudo comparativo minucioso sobre a eficácia de minutas geradas por IA vs. profissionais seniores.
              </p>
            </div>
            <div className="flex justify-between items-center mt-auto">
              <span className="text-xs text-outline font-label uppercase tracking-widest font-bold">3 min de leitura</span>
              <Link href="#" className="text-primary text-sm font-bold flex items-center gap-2 group/btn">
                Ler Mais <ArrowRight className="group-hover/btn:translate-x-1 transition-transform w-4 h-4" />
              </Link>
            </div>
          </article>

          {/* Small Card 2 */}
          <article className="md:col-span-4 group bg-surface-container rounded-[2rem] p-8 border border-white/5 hover:border-primary/30 transition-all duration-500 shadow-lg hover:shadow-[0_0_30px_rgba(204,151,255,0.1)] flex flex-col justify-between">
            <div>
              <span className="bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-6 inline-block uppercase tracking-wider">Trabalhista</span>
              <h3 className="text-xl font-headline font-bold text-white mb-4 group-hover:text-primary transition-colors leading-tight">
                Novas Decisões sobre o Vínculo Empregatício em Apps
              </h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                O cenário atual do STF e as profundas implicações para a economia sob demanda (gig economy) no Brasil.
              </p>
            </div>
            <div className="flex justify-between items-center mt-auto">
              <span className="text-xs text-outline font-label uppercase tracking-widest font-bold">8 min de leitura</span>
              <Link href="#" className="text-primary text-sm font-bold flex items-center gap-2 group/btn">
                Ler Mais <ArrowRight className="group-hover/btn:translate-x-1 transition-transform w-4 h-4" />
              </Link>
            </div>
          </article>

          {/* Big Card 2 */}
          <article className="md:col-span-8 group bg-surface-container rounded-[2rem] overflow-hidden border border-white/5 hover:border-primary/30 transition-all duration-500 shadow-lg hover:shadow-[0_0_30px_rgba(204,151,255,0.1)] flex flex-col md:flex-row h-full">
            <div className="md:w-1/2 p-8 lg:p-10 flex flex-col justify-between order-2 md:order-1">
              <div>
                <span className="bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-6 inline-block uppercase tracking-wider">Case Study</span>
                <h3 className="text-2xl font-headline font-bold text-white mb-4 group-hover:text-primary transition-colors leading-tight">
                  Como a Zattar Engine Reduziu Custos Jurídicos em 40%
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-6 line-clamp-3">
                  Acompanhe a implementação passo a passo de sistemas de triagem automatizada de processos em uma das maiores empresas de tecnologia corporativa da América Latina.
                </p>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-outline font-label uppercase tracking-widest font-bold">12 min de leitura</span>
                <Link href="#" className="text-primary text-sm font-bold flex items-center gap-2 group/btn">
                  Ler Mais <ArrowRight className="group-hover/btn:translate-x-1 transition-transform w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 overflow-hidden bg-surface-container-high relative order-1 md:order-2">
              <img 
                alt="Ambiente corporativo de tecnologia minimalista" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 mix-blend-luminosity hover:mix-blend-normal" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrIwMBl25Vlc-4988HRdLbAprDUodEg4ZF-5C1iPaXF_8-wnUuiKEzfu0CojZd3JLRObEzcAcgzgEle29Hrx8Y9rUDRXVmAhFmDvUK_Nf1znEXrYC86ZLHGykHR5iWh5aLrPhN6VP6yGp8Yub2A1YwGZQcmlLaa65lLecGVyIeb0DFbKvr06MK8HaVHmHkBBdBtNkZd_7Wae-CM_IUBqCf-y-99eyYpgsDuKwRY7ntkJfkA8Kmj-tDffCRVXIFeQDsZFIcNquMcMlW"
              />
            </div>
          </article>
        </div>

        {/* Newsletter Section */}
        <section className="mt-32 bg-gradient-to-br from-surface-container-high to-surface-container p-12 md:p-16 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-dim/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="max-w-xl relative z-10">
            <h2 className="text-3xl md:text-5xl font-headline font-extrabold mb-6 tracking-tight text-white leading-tight">
              Assine nossa <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dim">Curadoria Jurídica</span>
            </h2>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              Receba quinzenalmente as análises mais profundas sobre tecnologia, leis trabalhistas materiais e o futuro da jurisprudência digital diretamente no seu e-mail.
            </p>
          </div>
          <div className="flex flex-col gap-4 w-full md:w-auto relative z-10">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <input 
                className="bg-surface border border-white/5 focus:border-primary/50 text-white rounded-xl px-6 py-5 focus:ring-1 focus:ring-primary/50 w-full sm:w-72 outline-none transition-all shadow-inner" 
                placeholder="seu@email.com" 
                type="email"
              />
              <button className="bg-primary text-on-primary-fixed font-bold font-headline text-lg px-8 py-5 rounded-xl hover:bg-primary-container transition-all whitespace-nowrap active:scale-95 shadow-lg shadow-primary/20">
                Assinar Agora
              </button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
