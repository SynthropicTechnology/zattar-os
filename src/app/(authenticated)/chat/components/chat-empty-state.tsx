"use client";

import { MessageSquare, UserPlus, Users, Search, FileText } from "lucide-react";
import { toast } from "sonner";
import { Heading } from "@/components/ui/typography";

const SUGGESTION_CARDS = [
  {
    icon: <UserPlus className="size-3.5" />,
    title: "Nova conversa",
    description: "Iniciar conversa direta com um colega",
    colorClass: "bg-primary/10 text-primary",
  },
  {
    icon: <Users className="size-3.5" />,
    title: "Criar grupo",
    description: "Reunir equipe em um canal de grupo",
    colorClass: "bg-info/10 text-info",
  },
  {
    icon: <Search className="size-3.5" />,
    title: "Buscar mensagens",
    description: "Encontrar conversas e arquivos anteriores",
    colorClass: "bg-success/10 text-success",
  },
  {
    icon: <FileText className="size-3.5" />,
    title: "Chat de processo",
    description: "Vincular conversa a um processo ativo",
    colorClass: "bg-warning/10 text-warning",
  },
] as const;

export function ChatEmptyState() {
  return (
    <div className="hidden md:flex h-full w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-6 max-w-[420px] w-full">
        {/* Icon + Copy */}
        <div className="flex flex-col items-center gap-3">
          <div className="size-16 rounded-[1.25rem] bg-primary/[0.08] flex items-center justify-center mb-2">
            <MessageSquare className="size-7 text-primary/50" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Heading level="section" className="text-foreground">
              Suas conversas
            </Heading>
            <p className="text-[0.8rem] text-muted-foreground/50 text-center text-balance leading-relaxed">
              Selecione uma conversa para começar ou inicie uma nova.
            </p>
          </div>
        </div>

        {/* Suggestion Cards — 2x2 grid per mock */}
        <div className="w-full grid grid-cols-2 gap-2.5">
          {SUGGESTION_CARDS.map(({ icon, title, description, colorClass }) => (
            <button
              key={title}
              className="flex items-start gap-2.5 p-3.5 rounded-[0.875rem] bg-foreground/[0.03] border border-foreground/[0.06] text-left hover:bg-foreground/[0.05] hover:border-primary/[0.12] hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-250 cursor-pointer group"
              onClick={() => toast("Em breve", { description: title })}
            >
              <div
                className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
              >
                {icon}
              </div>
              <div className="min-w-0">
                <p className="text-[0.7rem] font-semibold text-foreground mb-0.5">
                  {title}
                </p>
                <p className="text-[0.6rem] text-muted-foreground/45 leading-snug">
                  {description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
