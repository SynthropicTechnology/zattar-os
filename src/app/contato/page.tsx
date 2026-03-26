import { WebsiteShell } from "@/features/website";
import { MapPin, Mail, Smartphone, Send, Share2, Globe, Network, Radar } from "lucide-react";

export default function ContatoPage() {
  return (
    <WebsiteShell>
      
      <div className="pt-32 pb-24 overflow-hidden">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-8 mb-24 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8">
              <span className="inline-block text-primary font-bold text-sm tracking-widest uppercase mb-4 font-label">
                Contato
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold font-headline leading-tight tracking-tighter mb-6 shadow-[0_0_15px_rgba(204,151,255,0.4)] hover:shadow-none transition-shadow">
                Conecte-se com o <br/>
                <span className="bg-linear-to-r from-primary to-primary-dim bg-clip-text text-transparent">
                  futuro da advocacia.
                </span>
              </h1>
            </div>
            <div className="lg:col-span-4 lg:pb-4">
              <p className="text-on-surface-variant text-lg font-body leading-relaxed">
                Estamos prontos para escalar suas operações jurídicas com inteligência de alta velocidade e precisão técnica.
              </p>
            </div>
          </div>
        </section>

        {/* Bento Contact Layout */}
        <section className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form Card */}
            <div className="lg:col-span-2 bg-surface-container rounded-3xl p-10 bg-surface-variant/60 backdrop-blur-[20px] border border-white/5 shadow-2xl">
              <h3 className="text-2xl font-bold font-headline mb-8 flex items-center gap-3">
                <Send className="text-primary w-6 h-6" />
                Enviar Mensagem
              </h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Nome</label>
                    <input className="w-full bg-surface-container-high border-none rounded-lg p-4 text-on-surface focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline outline-none" placeholder="Seu nome completo" type="text" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">E-mail</label>
                    <input className="w-full bg-surface-container-high border-none rounded-lg p-4 text-on-surface focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline outline-none" placeholder="seu@email.com" type="email" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Assunto</label>
                  <input className="w-full bg-surface-container-high border-none rounded-lg p-4 text-on-surface focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline outline-none" placeholder="Como podemos ajudar?" type="text" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Mensagem</label>
                  <textarea className="w-full bg-surface-container-high border-none rounded-lg p-4 text-on-surface focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline outline-none resize-none" placeholder="Descreva seu desafio jurídico..." rows={4}></textarea>
                </div>
                <button type="button" className="w-full py-5 bg-primary text-on-primary-fixed font-bold rounded-xl text-lg hover:bg-primary-container transition-all shadow-lg shadow-primary/10 active:scale-[0.98]">
                  Enviar Solicitação
                </button>
              </form>
            </div>

            {/* Info Stack */}
            <div className="space-y-8">
              {/* Contact Info Card */}
              <div className="bg-surface-container rounded-3xl p-8 space-y-8 bg-surface-variant/60 backdrop-blur-[20px] border border-white/5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-6">Informações</h4>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Sede Tecnológica</p>
                        <p className="text-on-surface-variant text-sm">Av. Paulista, 2000 - 18º Andar<br/>São Paulo, SP</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Email Digital</p>
                        <p className="text-on-surface-variant text-sm">contato@zattaradvogados.com.br</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">WhatsApp Business</p>
                        <p className="text-on-surface-variant text-sm">+55 (11) 99876-5432</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Conectar</h4>
                  <div className="flex gap-4">
                    <a className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white/5 transition-all" href="#">
                      <Share2 className="w-5 h-5" />
                    </a>
                    <a className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white/5 transition-all" href="#">
                      <Globe className="w-5 h-5" />
                    </a>
                    <a className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white/5 transition-all" href="#">
                      <Network className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Tech Status Badge */}
              <div className="bg-surface-container rounded-3xl p-6 bg-surface-variant/60 backdrop-blur-[20px] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-primary rounded-full blur-sm opacity-50"></div>
                  </div>
                  <span className="text-sm font-semibold tracking-tight text-white">Status do Sistema: Online</span>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">API V4.2</span>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="mt-12 w-full h-[500px] relative rounded-3xl overflow-hidden group">
            <div className="absolute inset-0 bg-surface/40 z-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-20"></div>
            {/* Visual placeholder for the map with tech aesthetic */}
            <div className="w-full h-full bg-surface-container-lowest flex items-center justify-center overflow-hidden relative">
              <img 
                alt="Dark stylized aerial view of a futuristic city grid with purple light trails" 
                className="w-full h-full object-cover grayscale brightness-50 opacity-60" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjMfjS4axg0yZrWh1-l3sUu2_Sjmla91onpPGRq8P44YSgQXsYfAuJ1dISQ082EFW6A9b_y-3tuBNXnyBYMKhtqTqwUthXs2OUtQVO4jFsXHOWOlxBfmx6mNDkOlFyg0SNpw0p9FD1LoB5JPXkiUuvBAP68jtCUzuXr-pHI5jTRw5w1JPK9oewPyp9CtuRYFpL1EBLP2qDpZv3y47j-D3tceoUSUsUv3spXz3B8vuhN8E4mqbZKB_qcDVPL-NxCQt83mQQcWtBd99n"
              />
              <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-16 h-16 bg-primary/20 backdrop-blur-md border border-primary/40 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(204,151,255,0.3)] animate-bounce">
                  <MapPin className="text-primary w-8 h-8 fill-primary/20" />
                </div>
                <div className="mt-4 px-4 py-2 bg-surface-container-highest/80 backdrop-blur-xl border border-white/10 rounded-lg text-sm font-bold text-white shadow-2xl">
                  Zattar Advogados HQ
                </div>
              </div>
            </div>
            {/* Map Overlay Elements */}
            <div className="absolute top-8 left-8 z-20 flex flex-col gap-2">
              <div className="bg-surface-variant/60 backdrop-blur-[20px] border border-white/5 p-3 rounded-xl flex items-center gap-3">
                <Radar className="text-primary w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white">Mapeando Área Ativa</span>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Ticker */}
        <section className="mt-32 border-y border-white/5 py-12">
          <div className="max-w-7xl mx-auto px-8 overflow-hidden">
            <div className="flex flex-wrap justify-center md:justify-between items-center gap-12 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <div className="text-xl font-bold font-headline tracking-tighter uppercase">TECH-LEGAL ALLIANCE</div>
              <div className="text-xl font-bold font-headline tracking-tighter uppercase">GLOBAL DATA COURT</div>
              <div className="text-xl font-bold font-headline tracking-tighter uppercase">PRIME EQUITY</div>
              <div className="text-xl font-bold font-headline tracking-tighter uppercase">VELOCITY PARTNERS</div>
              <div className="text-xl font-bold font-headline tracking-tighter uppercase">SECURE STACK</div>
            </div>
          </div>
        </section>
      </div>

    </WebsiteShell>
  );
}
