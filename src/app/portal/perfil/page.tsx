"use client";

import { PortalShell } from "@/features/portal/components/layout/portal-shell";
import { UserPen, ShieldCheck, Lock, BadgeCheck, MapPinHome, ShieldQuestion, UploadCloud, CheckCircle } from "lucide-react";

export default function PerfilPage() {
  return (
    <PortalShell>
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span className="text-primary font-bold tracking-widest text-xs uppercase mb-2 block font-label">Central do Usuário</span>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-white mb-4">Meu Perfil</h1>
              <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
                Gerencie sua identidade digital e documentos jurídicos com criptografia de ponta a ponta.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-[#1f1f1f]/80 backdrop-blur-sm px-5 py-2.5 rounded-full border border-primary/20 shadow-[0_0_15px_rgba(204,151,255,0.1)]">
                <BadgeCheck className="w-4 h-4 text-primary" />
                <span className="text-primary text-xs font-black uppercase tracking-widest">Status: Verificado</span>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-8 mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {/* Left Column: Personal Data Form */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
            <div className="bg-[#191919]/60 backdrop-blur-xl p-8 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-[80px] pointer-events-none"></div>
              
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <UserPen className="w-6 h-6 text-primary" />
                <h2 className="font-headline text-2xl font-black text-white">Dados Pessoais</h2>
              </div>
              
              <form className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input 
                      className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white hover:border-white/10 focus:border-primary/50 focus:bg-white/5 transition-all outline-none font-medium" 
                      type="text" 
                      defaultValue="Ricardo Santos Silva"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">CPF / Identificação</label>
                    <input 
                      className="w-full bg-black/20 border border-transparent rounded-xl p-4 text-zinc-500 cursor-not-allowed font-mono font-medium" 
                      disabled 
                      type="text" 
                      defaultValue="XXX.XXX.XXX-XX"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Email Profissional</label>
                  <input 
                    className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white hover:border-white/10 focus:border-primary/50 focus:bg-white/5 transition-all outline-none font-medium" 
                    type="email" 
                    defaultValue="ricardo.silva@magistrate.ai"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Telefone</label>
                    <input 
                      className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white hover:border-white/10 focus:border-primary/50 focus:bg-white/5 transition-all outline-none font-medium" 
                      type="tel" 
                      defaultValue="+55 11 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Cargo / Especialidade</label>
                    <div className="relative">
                      <select className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white hover:border-white/10 focus:border-primary/50 focus:bg-white/5 transition-all outline-none font-medium appearance-none">
                        <option>Advogado Sênior</option>
                        <option>Consultor Jurídico</option>
                        <option>Paralegal</option>
                        <option>Cliente</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 flex flex-col sm:flex-row justify-end gap-4 border-t border-white/5">
                  <button className="px-8 py-3.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-bold text-sm" type="button">
                    Descartar
                  </button>
                  <button className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold hover:shadow-[0_0_20px_rgba(204,151,255,0.4)] transition-all active:scale-95 text-sm" type="submit">
                    Atualizar Cadastro
                  </button>
                </div>
              </form>
            </div>
            
            {/* Security Settings Block */}
            <div className="bg-[#191919]/60 backdrop-blur-xl border border-white/5 p-8 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white mb-1">Autenticação de Dois Fatores</h3>
                  <p className="text-sm text-zinc-400">Proteja sua conta com uma camada adicional de segurança.</p>
                </div>
              </div>
              <button className="bg-white/5 hover:bg-white/10 border border-white/5 px-6 py-2.5 rounded-xl tracking-wide font-bold transition-all text-sm whitespace-nowrap hidden sm:block">
                Configurar
              </button>
            </div>
          </div>

          {/* Right Column: Digital Vault & Document Upload */}
          <div className="col-span-12 lg:col-span-5 space-y-8">
            {/* Digital Vault */}
            <div className="bg-gradient-to-br from-[#191919] to-black/60 p-8 rounded-2xl border border-white/5 relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full -translate-y-24 translate-x-24 blur-[60px] group-hover:bg-primary/20 transition-colors pointer-events-none"></div>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <Lock className="w-6 h-6 text-primary" />
                <h2 className="font-headline text-2xl font-black text-white">Cofre Digital</h2>
              </div>
              <p className="text-sm text-zinc-400 mb-8 leading-relaxed relative z-10">
                Seus documentos são criptografados com padrão militar (AES-256). Somente você e seus consultores autorizados possuem as chaves de acesso.
              </p>
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between p-5 bg-black/40 rounded-xl border border-white/5 group/item hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <BadgeCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-bold text-zinc-300 group-hover/item:text-white transition-colors">Documento de Identidade</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full tracking-widest border border-emerald-500/20">VALIDADO</span>
                </div>
                
                <div className="flex items-center justify-between p-5 bg-black/40 rounded-xl border border-white/5 group/item hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <MapPinHome className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-bold text-zinc-300 group-hover/item:text-white transition-colors">Comprovante de Residência</span>
                  </div>
                  <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full tracking-widest border border-amber-500/20">PENDENTE</span>
                </div>
                
                <div className="flex items-center justify-between p-5 bg-black/40 rounded-xl border border-white/5 group/item hover:border-white/20 transition-all opacity-60 hover:opacity-100 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <ShieldQuestion className="w-5 h-5 text-zinc-500 group-hover/item:text-primary transition-colors" />
                    <span className="text-sm font-bold text-zinc-500 group-hover/item:text-white transition-colors">Outros Documentos</span>
                  </div>
                  <span className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">UPLOAD</span>
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="bg-[#191919]/40 backdrop-blur-md p-8 rounded-2xl border-dashed border-2 border-primary/30 flex flex-col items-center justify-center text-center py-12 hover:bg-[#191919]/60 hover:border-primary/50 transition-all cursor-pointer group">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                <UploadCloud className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-headline text-xl font-bold mb-2 text-white">Upload Seguro de Documentos</h3>
              <p className="text-sm text-zinc-400 mb-8 max-w-[280px]">Arraste seus arquivos PDF, JPG ou PNG para o cofre seguro.</p>
              <button className="bg-white/10 text-white border border-white/10 px-8 py-3 rounded-xl font-bold group-hover:bg-primary group-hover:border-primary transition-colors text-sm">
                Selecionar Arquivos
              </button>
              <p className="text-[10px] text-zinc-600 mt-6 uppercase tracking-widest font-black flex items-center justify-center gap-2">
                <Lock className="w-3 h-3" />
                Limite de 50MB • Criptografia Ativa
              </p>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
