"use client";

import * as React from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DialogFormShellProps {
  /**
   * Controla se o diálogo está aberto
   */
  open: boolean;
  /**
   * Callback quando o estado de abertura muda
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Título do diálogo
   */
  title: React.ReactNode;
  /**
   * Descrição/subtítulo abaixo do título (ex: metadados, instruções)
   */
  description?: React.ReactNode;
  /**
   * Conteúdo do formulário
   */
  children: React.ReactNode;
  /**
   * Botões de ação do rodapé (Salvar, Próximo, Deletar, etc.)
   * NÃO inclua botão Cancelar — o shell já renderiza um automaticamente à esquerda.
   * O conteúdo passado aqui será posicionado à direita do footer.
   */
  footer?: React.ReactNode;
  /**
   * Configuração para formulários multi-step
   */
  multiStep?: {
    current: number;
    total: number;
    stepTitle?: string;
  };
  /**
   * Largura máxima do diálogo (apenas desktop)
   * @default "lg"
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  /**
   * Classes adicionais para o container do conteúdo
   */
  className?: string;
  /**
   * Classes adicionais para o body (área de conteúdo scrollável).
   * Use para override de overflow, layout flex, etc.
   */
  bodyClassName?: string;
  /**
   * Ocultar o rodapé padrão do shell (útil quando o formulário tem seu próprio rodapé)
   */
  hideFooter?: boolean;
}

export function DialogFormShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  multiStep,
  maxWidth = "lg",
  className,
  bodyClassName,
  hideFooter,
}: DialogFormShellProps) {
  // Calcular largura máxima
  const maxWidthClass = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
    "3xl": "sm:max-w-3xl",
    "4xl": "sm:max-w-4xl",
    "5xl": "sm:max-w-5xl",
  }[maxWidth];

  // Calcular progresso para multi-step
  const progressValue = multiStep
    ? multiStep.total <= 1
      ? 100 // Se total <= 1, progresso completo (evita divisão por zero)
      : ((multiStep.current - 1) / (multiStep.total - 1)) * 100
    : 0;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        showCloseButton={false} // Removemos o botão X padrão
        className={cn(
          maxWidthClass,
          "bg-card overflow-hidden",
          "p-0 gap-0", // Removemos padding padrão para controlar layout
          "transition-[max-width] duration-300 ease-in-out", // Transição suave ao mudar largura
          className
        )}
      >
        <ResponsiveDialogHeader className="px-6 py-4 shrink-0 border-b">
          <ResponsiveDialogTitle className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </ResponsiveDialogTitle>

          {description && (
            <ResponsiveDialogDescription className="text-sm text-muted-foreground">
              {description}
            </ResponsiveDialogDescription>
          )}

          {/* Barra de progresso para multi-step */}
          {multiStep && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {multiStep.stepTitle}
                </span>
                <span>
                  Etapa {multiStep.current} de {multiStep.total}
                </span>
              </div>
              <Progress value={progressValue} className="h-1.5" />
            </div>
          )}
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className={cn("flex-1 min-h-0", bodyClassName)}>
          {children}
        </ResponsiveDialogBody>

        {!hideFooter && (
          <ResponsiveDialogFooter className="px-6 py-4 border-t shrink-0">
            <div className="flex w-full items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <div className="flex items-center gap-2">
                {footer}
              </div>
            </div>
          </ResponsiveDialogFooter>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export type { DialogFormShellProps };
