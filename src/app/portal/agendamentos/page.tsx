"use client";

import { PortalShell } from "@/features/portal/components/layout/portal-shell";
import { PlusCircle, CalendarPlus, Clock as Schedule, Video, MoreVertical as MoreVert, Edit, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

export default function AgendamentosPage() {
  return (
    <PortalShell>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <span className="text-primary font-label text-sm font-bold uppercase tracking-widest mb-2 block">Agenda Magistrada</span>
            <h2 className="text-5xl font-black font-headline tracking-tighter text-white">Agendamentos</h2>
          </div>
          <button className="bg-gradient-to-r from-primary to-purple-600 text-white font-bold py-4 px-8 rounded-xl flex items-center gap-3 hover:shadow-[0_0_20px_rgba(204,151,255,0.4)] transition-all hover:scale-[1.02] active:scale-95">
            <CalendarPlus className="w-5 h-5" />
            Agendar Nova Consulta
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Calendar View Area (Editorial Style) */}
          <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <section>
              <h3 className="text-xl font-headline font-bold mb-6 flex items-center gap-3 text-white">
                <span className="w-2 h-8 bg-primary rounded-full shadow-[0_0_10px_rgba(204,151,255,0.5)]"></span>
                Próximas Consultas
              </h3>
              <div className="grid grid-cols-1 gap-5">
                {/* Meeting Card 1 */}
                <div className="group bg-[#191919]/60 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-white/5 hover:border-primary/30 transition-all duration-300 relative overflow-hidden shadow-lg hover:shadow-primary/5">
                  <div className="absolute top-0 right-0 p-5">
                    <span className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-primary/30">Hoje</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="flex flex-col items-center justify-center bg-black/40 rounded-xl p-4 min-w-[90px] border border-white/5 group-hover:bg-primary/5 transition-colors">
                      <span className="text-3xl font-black font-headline text-primary">24</span>
                      <span className="text-xs uppercase font-bold text-zinc-500 tracking-widest mt-1">MAI</span>
                    </div>
                    <div className="flex-1 w-full">
                      <h4 className="text-2xl font-bold font-headline mb-2 text-white group-hover:text-primary transition-colors tracking-tight">Revisão de Fusão Estratégica</h4>
                      <p className="text-zinc-400 text-sm mb-5">Especialista: <span className="text-white font-medium">Dra. Beatriz Fontana</span></p>
                      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 sm:gap-6 bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
                          <Schedule className="w-4 h-4 text-zinc-500" />
                          14:30 - 15:30 (GMT-3)
                        </div>
                        <div className="hidden sm:block w-px h-4 bg-white/10"></div>
                        <a className="flex items-center gap-2 text-sm text-primary font-bold hover:text-white transition-colors" href="#">
                          <Video className="w-5 h-5" />
                          Entrar na Chamada
                        </a>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 absolute sm:relative top-6 right-6 sm:top-0 sm:right-0">
                      <button className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors border border-transparent hover:border-white/10">
                        <MoreVert className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Meeting Card 2 */}
                <div className="group bg-[#191919]/60 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 shadow-lg">
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="flex flex-col items-center justify-center bg-black/40 rounded-xl p-4 min-w-[90px] border border-white/5">
                      <span className="text-3xl font-black font-headline text-white">28</span>
                      <span className="text-xs uppercase font-bold text-zinc-500 tracking-widest mt-1">MAI</span>
                    </div>
                    <div className="flex-1 w-full">
                      <h4 className="text-xl md:text-2xl font-bold font-headline mb-2 text-zinc-300 group-hover:text-white transition-colors tracking-tight">Consultoria de Propriedade Intelectual</h4>
                      <p className="text-zinc-500 text-sm mb-5">Especialista: <span className="text-zinc-300 font-medium">Dr. Ricardo Menezes</span></p>
                      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 sm:gap-6">
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                          <Schedule className="w-4 h-4" />
                          10:00 - 11:30 (GMT-3)
                        </div>
                        <div className="hidden sm:block w-px h-4 bg-white/10"></div>
                        <span className="flex items-center gap-2 text-sm text-zinc-600 font-medium">
                          <CalendarPlus className="w-4 h-4" />
                          Link disponível em 3 dias
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 absolute sm:relative top-6 right-6 sm:top-0 sm:right-0">
                      <button className="flex items-center justify-center p-2 rounded-lg bg-[#1a1a1a] hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition-colors" title="Entrar na Chamada">
                        <Video className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="pt-4">
              <h3 className="text-xl font-headline font-bold mb-6 flex items-center gap-3 text-white">
                <span className="w-2 h-8 bg-zinc-700 rounded-full"></span>
                Histórico de Consultas
              </h3>
              <div className="space-y-4">
                {/* Past Item 1 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl hover:bg-white/5 transition-colors border border-white/5 bg-black/20 group">
                  <div className="flex items-start gap-4 mb-4 sm:mb-0">
                    <CheckCircle className="w-5 h-5 text-zinc-600 mt-0.5 group-hover:text-emerald-500 transition-colors" />
                    <div>
                      <p className="font-bold text-sm text-zinc-300 group-hover:text-white transition-colors">Auditoria Trabalhista Preventiva</p>
                      <p className="text-xs text-zinc-500 mt-1">12 de Maio • Dr. Carlos Eduardo</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-zinc-400 group-hover:text-primary transition-colors hover:underline px-4 py-2 sm:p-0 bg-white/5 sm:bg-transparent rounded-lg sm:rounded-none mx-9 sm:mx-0">Ver Resumo</button>
                </div>

                {/* Past Item 2 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl hover:bg-white/5 transition-colors border border-white/5 bg-black/20 group">
                  <div className="flex items-start gap-4 mb-4 sm:mb-0">
                    <CheckCircle className="w-5 h-5 text-zinc-600 mt-0.5 group-hover:text-emerald-500 transition-colors" />
                    <div>
                      <p className="font-bold text-sm text-zinc-300 group-hover:text-white transition-colors">Análise de Termos de Uso (SaaS)</p>
                      <p className="text-xs text-zinc-500 mt-1">05 de Maio • Dra. Beatriz Fontana</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-zinc-400 group-hover:text-primary transition-colors hover:underline px-4 py-2 sm:p-0 bg-white/5 sm:bg-transparent rounded-lg sm:rounded-none mx-9 sm:mx-0">Ver Resumo</button>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Content (Stats & Calendar Widget) */}
          <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            {/* Quick Stats Bento */}
            <div className="bg-[#191919]/60 backdrop-blur-xl p-8 rounded-2xl border border-white/5 shadow-lg">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6 font-label">Visão Geral</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 p-5 rounded-xl border border-white/5">
                  <p className="text-primary text-3xl font-black font-headline mb-1">12</p>
                  <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Realizadas</p>
                </div>
                <div className="bg-black/40 p-5 rounded-xl border border-white/5">
                  <p className="text-white text-3xl font-black font-headline mb-1">02</p>
                  <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Pendentes</p>
                </div>
              </div>
            </div>

            {/* Mini Calendar Widget */}
            <div className="bg-[#191919]/60 backdrop-blur-xl p-8 rounded-2xl border border-white/5 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold font-headline text-white">Maio 2024</h4>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-zinc-600 mb-4 tracking-widest">
                <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium">
                <span className="py-2 text-zinc-700">28</span>
                <span className="py-2 text-zinc-700">29</span>
                <span className="py-2 text-zinc-700">30</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">1</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">2</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">3</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">4</span>
                
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">5</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">6</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">7</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">8</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">9</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">10</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">11</span>
                
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">12</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">13</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">14</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">15</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">16</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">17</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">18</span>
                
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">19</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">20</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">21</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">22</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">23</span>
                <span className="py-2 font-black border border-primary/50 bg-primary/20 text-primary rounded-lg shadow-[0_0_10px_rgba(204,151,255,0.3)] cursor-pointer">24</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">25</span>
                
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">26</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">27</span>
                <span className="py-2 hover:bg-white/10 relative rounded-lg cursor-pointer text-white font-bold transition-colors">
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>
                  28
                </span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">29</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">30</span>
                <span className="py-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors">31</span>
                <span className="py-2 text-zinc-700">1</span>
              </div>
            </div>

            {/* Specialist Highlight */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] group border border-white/10 shadow-lg">
              <img 
                alt="Dra. Beatriz Fontana" 
                className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwCJ8fjhNp-je0E7eklCEF8-j1RtvYYGKrPZ1SA0W5dmDqeI-E48v7z13_WiYg4XDl1EWqPaMeSAkwU-CGxuq8qBqsVERjjuxUJI99CB-ZrF9xO8acuvWRZzUZkZ2aRHPSitluLD8n3unkjSuetORagbAtqXTk-0WeynOQGBG8Vkswh1YXnaByjU7CpkhCZqxc_mzdYOpR181xBdTrN_Wa7cXmREHKLFrYfzkkaASoov7T6XiPI_EDRzXNJB1GOzecK1p6ilYR70-N"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 w-full">
                <span className="bg-primary text-black text-[10px] font-black px-3 py-1.5 rounded-full mb-3 inline-block uppercase tracking-widest shadow-[0_0_10px_rgba(204,151,255,0.4)]">Destaque</span>
                <h5 className="text-2xl font-black font-headline leading-none text-white mb-2">Dra. Beatriz Fontana</h5>
                <p className="text-sm text-zinc-400 mb-4 font-medium">Especialista em Direito Digital &amp; Tech M&amp;A</p>
                <div className="h-px w-full bg-white/10 mb-4"></div>
                <button className="text-xs font-bold text-white hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-2 group-hover:gap-3">
                  Ver Perfil
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
