import { WebsiteShell } from "@/app/website";
import Link from "next/link";
import { ArrowRight, Bookmark, ExternalLink } from "lucide-react";

export default function InsightsPage() {
  return (
    <WebsiteShell>
      <div className="pt-32">

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto mt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-end">
          <div className="md:col-span-8 relative z-10">
            <span className="text-primary font-bold tracking-widest text-sm uppercase mb-6 block drop-shadow-[0_0_10px_rgb(var(--color-primary)/0.5)]">
              Inteligência Editorial
            </span>
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-8 text-on-surface">
              Insights e Tendências do <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary-dim drop-shadow-[0_0_15px_rgb(var(--color-primary)/0.4)]">Direito do Amanhã.</span>
            </h1>
            <p className="font-body text-xl text-on-surface-variant max-w-2xl leading-relaxed">
              Navegando na interseção entre tecnologia disruptiva e segurança jurídica para as equipes de alta performance da próxima década.
            </p>
          </div>
          <div className="md:col-span-4 flex justify-end">
            <div className="w-full h-1 bg-linear-to-r from-transparent via-primary/30 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="max-w-7xl mx-auto px-6 mb-16">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-on-surface-variant font-medium mr-4">Filtrar por:</span>
          <button className="bg-primary text-on-primary-fixed px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:bg-primary-container shadow-[0_0_15px_rgb(var(--color-primary)/0.2)]">
            Todos os Recursos
          </button>
          <button className="bg-surface-container-highest text-primary px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-white/10 transition-all border border-white/5">
            Novas Leis
          </button>
          <button className="bg-surface-container-highest text-primary px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-white/10 transition-all border border-white/5">
            Tecnologia no Judiciário
          </button>
          <button className="bg-surface-container-highest text-primary px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-white/10 transition-all border border-white/5">
            Direitos do Trabalhador
          </button>
        </div>
      </section>

      {/* Featured Bento Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Featured Card */}
          <div className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-surface-container border border-white/5 aspect-16/10 md:aspect-auto flex flex-col justify-end shadow-xl cursor-pointer">
            <img 
              alt="Edifício moderno de justiça com arquitetura em vidro refletindo luzes de neon violeta" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-40 mix-blend-luminosity hover:mix-blend-normal hover:opacity-50" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBi1N4W6BJZkDnOGCAAkX6SFUZOz7vKkNNIDLj9NgcMRmOqk5A0wWVAIalPPY_ZTUZzPQX-DAg9SH8yxGgLXXY8mR7aAsj61d0SNJr-FH7lx5qX6ciCKQzR-1Ff1SbvlRTWMnWoDPuIbxZLOUbdEx_EhynTtyTfT7goPZoVXJhW7HBDGJNX7qSa7Dv3TW9pLcuyNfZjcV43QC-IK2sCqGg1Qx5_6GoKN-xYdughyWx4Of7Jvl_UrxQi8710V_k77Pig4L2a0XSCu-Um"
            />
            <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/80 to-transparent"></div>
            <div className="relative z-10 p-8 md:p-12 w-full mt-auto">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                  Relatório de Destaque
                </span>
                <span className="text-on-surface-variant text-sm font-medium">Leitura de 12 Min</span>
              </div>
              <h2 className="font-headline text-3xl md:text-5xl font-extrabold text-on-surface mb-4 group-hover:text-primary transition-colors leading-[1.1]">
                O Impacto da IA Generativa em Processos Trabalhistas
              </h2>
              <p className="text-on-surface mb-8 line-clamp-2 max-w-xl text-lg leading-relaxed">
                Uma análise profunda sobre como algoritmos estão moldando novas jurisprudências e o que isso significa para o futuro das relações de trabalho virtuais.
              </p>
              <Link href="/insights/tendencias" className="flex items-center gap-3 text-on-surface font-bold group/btn hover:text-primary transition-colors text-lg">
                Ler Artigo Completo
                <ArrowRight className="group-hover/btn:translate-x-2 transition-transform w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Secondary Featured */}
          <div className="flex flex-col gap-6">
            {/* Card 2 */}
            <Link href="/insights/tendencias" className="bg-surface-container border border-white/5 p-8 rounded-3xl group hover:border-primary/30 transition-all flex flex-col h-full shadow-lg hover:shadow-[0_0_20px_rgb(var(--color-primary)/0.05)]">
              <span className="text-primary font-bold text-xs uppercase mb-4 block tracking-wider">Tecnologia</span>
              <h3 className="font-headline text-2xl font-bold text-on-surface mb-4 group-hover:text-primary transition-colors leading-tight">
                Blockchain e a Prova Digital: O Fim da Contestação?
              </h3>
              <p className="text-on-surface-variant text-sm mb-6 leading-relaxed grow">
                Como redes descentralizadas estão garantindo a imutabilidade de registros laborais e as recentes decisões do TST sobre o tema.
              </p>
              <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium mt-auto">
                <span>Maio 24, 2024</span>
                <Bookmark className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>

            {/* Card 3 */}
            <Link href="/insights/tendencias" className="bg-surface-container border border-white/5 p-8 rounded-3xl group hover:border-primary/30 transition-all flex flex-col h-full shadow-lg hover:shadow-[0_0_20px_rgb(var(--color-primary)/0.05)]">
              <span className="text-primary font-bold text-xs uppercase mb-4 block tracking-wider">Novas Leis</span>
              <h3 className="font-headline text-2xl font-bold text-on-surface mb-4 group-hover:text-primary transition-colors leading-tight">
                A Regulamentação do Trabalho Híbrido Transfronteiriço
              </h3>
              <p className="text-on-surface-variant text-sm mb-6 leading-relaxed grow">
                Desafios jurídicos de contratar talentos globais sob diferentes jurisdições fiscais e como proteger contratos internacionais.
              </p>
              <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium mt-auto">
                <span>Maio 22, 2024</span>
                <Bookmark className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial List Section */}
      <section className="bg-surface-container-low py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div>
              <span className="text-primary font-bold tracking-widest text-xs uppercase mb-3 block">Análises Profundas</span>
              <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-on-surface">Arquivos da Zattar</h2>
            </div>
            <Link href="/insights/tendencias" className="text-on-surface-variant hover:text-on-surface transition-colors border-b border-on-surface-variant/30 hover:border-white pb-1 flex items-center gap-2 font-medium">
              Ver Todos os Arquivos
              <ExternalLink className="w-4 h-4 border border-x-indigo-50" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            {/* List Item 1 */}
            <Link href="/insights/tendencias" className="flex flex-col sm:flex-row gap-6 group">
              <div className="shrink-0 w-full sm:w-40 h-40 rounded-2xl bg-surface-container-highest overflow-hidden relative">
                <img 
                  className="w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                  alt="Conexões de rede digital abstrata com nós brilhantes" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuADkWitd8HXPESHxyw38f_QsvmUyy_EmmNiS9gM18pCliL4G3OMjlUzmWlg-PYdqodiaXi6XXQ4u5ymQtAWS7GRqFx2AEw730hPXeLdUzkJrpS4GJ5jjT8NmMv2D2mdrA150_vVaIwLafcDWNDW7DjNwKuJzRVc0mpUr9SCkP7v61Hf90doe08Azd4UreDE_I_ChsQQMfRtnpYe1K53XTqj8txMDUdLEqlZubnI-A_58-KL4bcyrFuPFIr9ITUS17J0LaDp3mR-TjP9"
                />
                <div className="absolute inset-0 bg-linear-to-tr from-primary/10 to-transparent"></div>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-primary text-xs font-bold uppercase mb-2 block tracking-wider">Policy Review</span>
                <h4 className="font-headline text-xl lg:text-2xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors leading-tight">
                  Privacidade de Dados no Ambiente Corporativo
                </h4>
                <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2">
                  O monitoramento de produtividade e os limites éticos e legais da LGPD em regime de Home Office.
                </p>
              </div>
            </Link>

            {/* List Item 2 */}
            <Link href="/insights/tendencias" className="flex flex-col sm:flex-row gap-6 group">
              <div className="shrink-0 w-full sm:w-40 h-40 rounded-2xl bg-surface-container-highest overflow-hidden relative">
                <img 
                  className="w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                  alt="Aperto de mão entre humano e robô" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnD2wNM1Zn-H9bkXxPcipEDE_LELDCV2ruvQwee7UvbL2v4cJ7xioM7PMS2JUeFAxFg1mBdkqJEnfHD9N888pbBQJHfAkFSygfy3U7RAgRsYmX3v3DJsQXERH-IYWataPPDJHBV4u5NAJJcdCYLQEP2An7m-ZVMBXgmMBRQ3vMRaHUb9VzyX5Ij9ZCX-pSdUnO9EaM0VEj6FOmcKeuwzhK0s-eEG8r1tUD0rhA5m1rrG96zbEEuWmqmKqKvoy7IYSN1UMnQ_zjqoiI"
                />
                <div className="absolute inset-0 bg-linear-to-tr from-primary/10 to-transparent"></div>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-primary text-xs font-bold uppercase mb-2 block tracking-wider">Contract Law</span>
                <h4 className="font-headline text-xl lg:text-2xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors leading-tight">
                  Smart Contracts: Automação de Acordos
                </h4>
                <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2">
                  Como o código autoexecutável está eliminando a necessidade de intermediários em Acordos de Confidencialidade (NDAs).
                </p>
              </div>
            </Link>

            {/* List Item 3 */}
            <Link href="/insights/tendencias" className="flex flex-col sm:flex-row gap-6 group">
              <div className="shrink-0 w-full sm:w-40 h-40 rounded-2xl bg-surface-container-highest overflow-hidden relative">
                <img 
                  className="w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                  alt="Placa de circuito digital brilhando com luz violeta e azul" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmk2IhILvRxlFBR8tDaXUyBLPI3L1Cq9OYxJvgh_2KG7sqzL7X0bB6y-Ti0PRhTOkX9NnNZb4jcT81GAdpDT327pbTbIi28cTeVgiPmPEdxj0xIh1yVE54tyiSl8eNai2pIhPLUd7I87pxL3GCVDkBzhmv6H1sZuSeZB8Wsmnyl1Tdk-BoXC_tyxDVuXfXpFKCpbZM_R1ye5hOp-wvQYWO77y4FjvhFJSp4nZu1aj8Nuo2dDV8s6Jnu5iwCT0QwiuPuqlj5qeW-SAJ"
                />
                <div className="absolute inset-0 bg-linear-to-tr from-primary/10 to-transparent"></div>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-primary text-xs font-bold uppercase mb-2 block tracking-wider">Cybersecurity</span>
                <h4 className="font-headline text-xl lg:text-2xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors leading-tight">
                  Responsabilidade Civil em Vazamentos de Dados
                </h4>
                <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2">
                  O novo entendimento disciplinar do TST sobre danos morais em incidentes graves de segurança cibernética.
                </p>
              </div>
            </Link>

            {/* List Item 4 */}
            <Link href="/insights/tendencias" className="flex flex-col sm:flex-row gap-6 group">
              <div className="shrink-0 w-full sm:w-40 h-40 rounded-2xl bg-surface-container-highest overflow-hidden relative">
                <img 
                  className="w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                  alt="Representação 3D abstrata de formas cristalinas geométricas flutuantes com textura metálica" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpVWguo-1rD-0bKNeqa8IfArC9YwNhHDqKwjuevC-pAk9RD5eyfgCygyAgs6E4wga0UybkSEakLy84alBA1GLnZrxhnZnFK8HYcJNPajpmqA3mJKpZmrcFBto4IZ7ArnZDWyDSVv47rVQ4MgK4GjO0QQpJx8IU0AAoPN1FICCIamWt4_Bv-L3tesscLzIKsj5e5Po0lAsz90ziwPp0MSdYJAseAdzrDeAQOD01LPImiKx-5D2kg5K4KlJuNY20WR9Fs6EaiuTsHZgs"
                />
                <div className="absolute inset-0 bg-linear-to-tr from-primary/10 to-transparent"></div>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-primary text-xs font-bold uppercase mb-2 block tracking-wider">Investimentos</span>
                <h4 className="font-headline text-xl lg:text-2xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors leading-tight">
                  O Jurídico como Centro de Inteligência
                </h4>
                <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2">
                  Transformando o compliance legal e passivos trabalhistas em diferencial competitivo para captação de VC.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 px-6 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto rounded-[2.5rem] bg-surface-container overflow-hidden border border-white/10 relative shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 blur-[100px] rounded-full"></div>
          
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 p-12 md:p-20 items-center">
            <div>
              <h2 className="font-headline text-4xl md:text-5xl font-extrabold mb-6 text-on-surface tracking-tight leading-tight">
                Fique por dentro das <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary-dim">atualizações jurídicas.</span>
              </h2>
              <p className="text-on-surface-variant text-lg leading-relaxed max-w-lg">
                Junte-se a 15.000+ profissionais que recebem nossa curadoria semanal sobre direito material, tecnologia e o futuro do trabalho.
              </p>
            </div>
            
            <div className="space-y-4 max-w-xl lg:ml-auto w-full">
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  className="grow bg-surface-container-high border border-white/5 focus:border-primary/50 rounded-xl px-6 py-5 text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary/50 outline-none transition-all shadow-inner" 
                  placeholder="Seu melhor e-mail" 
                  type="email"
                />
                <button className="bg-primary text-on-primary-fixed font-bold font-headline text-lg px-8 py-5 rounded-xl hover:bg-primary-container transition-all active:scale-95 shadow-lg shadow-primary/20 whitespace-nowrap">
                  Inscrever-se
                </button>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed pl-2 mt-4">
                Ao se inscrever, você concorda com nossa <Link href="/politica-de-privacidade" className="underline hover:text-primary transition-colors">Política de Privacidade</Link>. Sem spam, garantimos.
              </p>
            </div>
          </div>
        </div>
      </section>

      </div>
    </WebsiteShell>
  );
}
