"use client";

import React, { useEffect, useState } from "react";
import { CommandIcon, SearchIcon, LayoutDashboard, Users, FileText, Scale, Calendar, FolderOpen, Bell, Handshake, Wallet, Database, PenTool, FileEdit, MessageSquare, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useMounted } from "@/hooks/use-mounted";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

// Nav Principal - Funcionalidades core do escritório
const navPrincipal = [
  {
    title: "Dashboard",
    url: "/app/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Partes",
    url: "/app/partes",
    icon: Users,
  },
  {
    title: "Contratos",
    url: "/app/contratos",
    icon: FileText,
  },
  {
    title: "Processos",
    url: "/app/processos",
    icon: Scale,
  },
  {
    title: "Audiências",
    url: "/app/audiencias/semana",
    icon: Calendar,
  },
  {
    title: "Expedientes",
    url: "/app/expedientes",
    icon: FolderOpen,
  },
  {
    title: "Diário Oficial",
    url: "/app/comunica-cnj",
    icon: Bell,
  },
  {
    title: "Obrigações",
    url: "/app/acordos-condenacoes/lista",
    icon: Handshake,
  },
  {
    title: "Financeiro",
    url: "/app/financeiro",
    icon: Wallet,
    items: [
      { title: "Orçamentos", url: "/app/financeiro/orcamentos" },
      { title: "Contas a Pagar", url: "/app/financeiro/contas-pagar" },
      { title: "Contas a Receber", url: "/app/financeiro/contas-receber" },
      { title: "Plano de Contas", url: "/app/financeiro/plano-contas" },
      { title: "Salários", url: "/app/rh/salarios" },
      { title: "Folhas de Pagamento", url: "/app/rh/folhas-pagamento" },
    ],
  },
  {
    title: "Captura",
    url: "/app/captura",
    icon: Database,
  },
]

// Nav Serviços - Ferramentas e utilitários
const navServicos = [
  {
    title: "Jurisprudência",
    url: "/app/pangea",
    icon: SearchIcon,
  },
  {
    title: "Notas",
    url: "/app/notas",
    icon: FileEdit,
  },
  {
    title: "Assinatura Digital",
    url: "/app/assinatura-digital/assinatura",
    icon: PenTool,
    items: [
      { title: "Fluxo de Assinatura", url: "/app/assinatura-digital/assinatura" },
      { title: "Templates", url: "/app/assinatura-digital/templates" },
      { title: "Formulários", url: "/app/assinatura-digital/formularios" },
    ],
  },
  {
    title: "Documentos",
    url: "/app/documentos",
    icon: FileEdit,
  },
  {
    title: "Chat",
    url: "/app/chat",
    icon: MessageSquare,
  },
  {
    title: "Assistentes",
    url: "/app/assistentes",
    icon: Bot,
  },
]

export default function Search() {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const onSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  if (!mounted) {
    return (
      <div className="md:flex-1">
        <div className="relative hidden max-w-sm flex-1 md:block">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            className="h-9 w-full cursor-pointer rounded-md border pr-4 pl-10 text-sm shadow-xs"
            placeholder="Busca rápida..."
            type="search"
            readOnly
          />
          <div className="absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-0.5 rounded-sm bg-zinc-200 p-1 font-mono text-xs font-medium sm:flex dark:bg-neutral-700">
            <CommandIcon className="size-3" />
            <span>k</span>
          </div>
        </div>
        <div className="block md:hidden">
          <Button size="icon" variant="ghost">
            <SearchIcon />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="md:flex-1">
      <div className="relative hidden max-w-md flex-1 md:block">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          className="h-9 w-full cursor-pointer rounded-md border pr-4 pl-10 text-sm shadow-xs"
          placeholder="Busca rápida..."
          type="search"
          onFocus={() => setOpen(true)}
          readOnly
        />
        <div className="absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-0.5 rounded-sm bg-zinc-200 p-1 font-mono text-xs font-medium sm:flex dark:bg-neutral-700">
          <CommandIcon className="size-3" />
          <span>k</span>
        </div>
      </div>
      <div className="block md:hidden">
        <Button size="icon" variant="ghost" onClick={() => setOpen(true)}>
          <SearchIcon />
        </Button>
      </div>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Busca rápida"
        description="Pesquise por comandos ou navegue pelo sistema"
      >
        <CommandInput placeholder="Digite um comando ou pesquise..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          <CommandGroup heading="Principal">
            {navPrincipal.map((item) => (
              <React.Fragment key={item.url}>
                <CommandItem onSelect={() => onSelect(item.url)}>
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  <span>{item.title}</span>
                </CommandItem>
                {item.items?.map((subItem) => (
                  <CommandItem key={subItem.url} onSelect={() => onSelect(subItem.url)} className="pl-8">
                    <span>{subItem.title}</span>
                  </CommandItem>
                ))}
              </React.Fragment>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Serviços">
            {navServicos.map((item) => (
              <React.Fragment key={item.url}>
                <CommandItem onSelect={() => onSelect(item.url)}>
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  <span>{item.title}</span>
                </CommandItem>
                {item.items?.map((subItem) => (
                  <CommandItem key={subItem.url} onSelect={() => onSelect(subItem.url)} className="pl-8">
                    <span>{subItem.title}</span>
                  </CommandItem>
                ))}
              </React.Fragment>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
