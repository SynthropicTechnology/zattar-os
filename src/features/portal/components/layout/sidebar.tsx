"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Gavel, 
  Calendar, 
  CreditCard, 
  Settings, 
  Plus, 
  HelpCircle, 
  LogOut,
  Calculator
} from "lucide-react";

export function PortalSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
    { name: "Processos", href: "/portal/processos", icon: Gavel },
    { name: "Contratos", href: "/portal/contratos", icon: FileText },
    { name: "Agendamentos", href: "/portal/agendamentos", icon: Calendar },
    { name: "Calculadoras", href: "/portal/calculadoras", icon: Calculator },
    { name: "Financeiro", href: "/portal/financeiro", icon: CreditCard },
    { name: "Meu Perfil", href: "/portal/perfil", icon: Settings },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 border-r border-white/5 bg-[#0a0a0a] flex flex-col py-8 px-4 z-50 shadow-[20px_0_40px_rgba(0,0,0,0.6)] font-headline tracking-tight antialiased">
      <div className="mb-10 px-2">
        <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600 uppercase">
          Zattar Portal
        </h1>
        <p className="text-[10px] text-on-surface-variant tracking-[0.2em] uppercase mt-1">
          Tech-Legal Elite
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? "text-purple-400 font-bold border-r-2 border-purple-500 bg-purple-500/10" 
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5 font-medium"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-purple-400" : ""}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8 space-y-1">
        <button className="w-full bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white font-bold py-3 rounded-lg mb-6 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_4px_20px_rgba(168,85,247,0.3)]">
          <Plus className="w-5 h-5" />
          <span>Novo Pedido</span>
        </button>
        
        <Link 
          href="/portal/suporte" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-500 hover:text-zinc-200 transition-all duration-200 font-medium"
        >
          <HelpCircle className="w-5 h-5" />
          <span>Suporte</span>
        </Link>
        <Link 
          href="/portal" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-500 hover:text-zinc-200 transition-all duration-200 font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </Link>
      </div>
    </aside>
  );
}
