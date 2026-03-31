"use client";

import {
  AlertCircle,
  BellIcon,
  Calendar,
  CheckCheckIcon,
  ClockIcon,
  FileText,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-breakpoint";
import {
  useNotificacoes,
  useNotificacoesRealtime,
} from "@/features/notificacoes";
import type { TipoNotificacaoUsuario } from "@/features/notificacoes";
import { useUser, useAuthSession } from "@/providers/user-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ============================================================================
// Mapeamento de ícones por tipo de notificação
// ============================================================================

const TIPO_ICON_MAP: Record<
  TipoNotificacaoUsuario,
  { icon: LucideIcon; className: string }
> = {
  processo_atribuido: {
    icon: FileText,
    className: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950",
  },
  processo_movimentacao: {
    icon: FileText,
    className: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950",
  },
  audiencia_atribuida: {
    icon: Calendar,
    className:
      "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950",
  },
  audiencia_alterada: {
    icon: Calendar,
    className:
      "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950",
  },
  expediente_atribuido: {
    icon: Inbox,
    className: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950",
  },
  expediente_alterado: {
    icon: Inbox,
    className:
      "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950",
  },
  prazo_vencendo: {
    icon: ClockIcon,
    className:
      "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950",
  },
  prazo_vencido: {
    icon: AlertCircle,
    className: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950",
  },
};

// ============================================================================
// Componente Principal
// ============================================================================

const Notifications = () => {
  const isMobile = useIsMobile();
  const userData = useUser();
  const { sessionToken } = useAuthSession();
  const {
    notificacoes,
    contador,
    loading,
    refetch,
    marcarComoLida,
    marcarTodasComoLidas,
  } = useNotificacoes({
    pagina: 1,
    limite: 20,
    lida: false,
  });

  // Escutar novas notificações em tempo real
  useNotificacoesRealtime({
    usuarioId: userData.id ?? undefined,
    sessionToken,
    onNovaNotificacao: () => {
      refetch();
    },
  });

  // Gerar link para a entidade relacionada
  const getEntityLink = (tipo: string, id: number) => {
    switch (tipo) {
      case "processo":
        return `/processos/${id}`;
      case "audiencia":
        return `/audiencias/${id}`;
      case "expediente":
        return `/expedientes/lista`;
      case "pericia":
        return `/pericias/${id}`;
      default:
        return "#";
    }
  };

  // Formatar data relativa
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return dateString;
    }
  };

  const unreadCount = contador.total;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="relative">
          <BellIcon className="size-4" />
          {unreadCount > 0 && (
            <span className="bg-destructive absolute inset-e-0 top-0 block size-2 shrink-0 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isMobile ? "center" : "end"}
        className="ms-4 w-[calc(100vw-2rem)] sm:w-80 p-0"
      >
        {/* Header fixo */}
        <DropdownMenuLabel className="sticky top-0 z-10 p-0">
          <div className="flex items-center justify-between border-b bg-card px-4 py-3">
            <span className="text-sm font-semibold">
              Notificações
              {unreadCount > 0 && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  ({unreadCount})
                </span>
              )}
            </span>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    marcarTodasComoLidas();
                  }}
                >
                  <CheckCheckIcon className="mr-1 size-3" />
                  Marcar todas
                </Button>
              )}
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                asChild
              >
                <Link href="/notificacoes">Ver todas</Link>
              </Button>
            </div>
          </div>
        </DropdownMenuLabel>

        {/* Lista de notificações */}
        <ScrollArea className="max-h-87.5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-sm text-muted-foreground">
                Carregando...
              </span>
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <BellIcon className="size-8 text-muted-foreground/60" />
              <span className="text-sm text-muted-foreground">
                Nenhuma notificação
              </span>
            </div>
          ) : (
            notificacoes.map((item) => {
              const iconConfig = TIPO_ICON_MAP[item.tipo];
              const IconComponent = iconConfig?.icon ?? BellIcon;
              const iconClassName =
                iconConfig?.className ?? "text-muted-foreground bg-muted";

              return (
                <DropdownMenuItem
                  key={item.id}
                  className="flex cursor-pointer items-start gap-3 rounded-none border-b px-4 py-3.5 focus:bg-accent"
                  asChild
                >
                  <Link
                    href={getEntityLink(
                      item.entidade_tipo,
                      item.entidade_id
                    )}
                    onClick={() => {
                      if (!item.lida) {
                        marcarComoLida(item.id);
                      }
                    }}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                        iconClassName
                      )}
                    >
                      <IconComponent className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          !item.lida
                            ? "font-medium text-foreground"
                            : "text-foreground/80"
                        )}
                      >
                        {item.titulo}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {item.descricao}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/60">
                        <ClockIcon className="size-3" />
                        {formatDate(item.created_at)}
                      </p>
                    </div>

                    {!item.lida && (
                      <span className="mt-2.5 block size-2 shrink-0 rounded-full bg-destructive" />
                    )}
                  </Link>
                </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
