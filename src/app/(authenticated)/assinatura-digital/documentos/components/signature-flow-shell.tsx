"use client";

/**
 * SignatureFlowShell - Layout compartilhado para o fluxo de assinatura digital
 *
 * Fornece um header sticky com o stepper de progresso e um botao "Sair"
 * para todas as paginas do fluxo (Upload -> Configurar -> Revisar).
 *
 * Modos:
 * - "default": conteudo com padding e scroll (upload, review)
 * - "fullscreen": conteudo flex sem padding (editor)
 */

import { type ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignatureWorkflowStepper } from '@/app/(authenticated)/assinatura-digital/components/workflow';
import { useFormularioStore } from '@/shared/assinatura-digital/store/formulario-store';

/**
 * Mapeamento de segmentos de rota para indice do step.
 * A logica percorre o pathname procurando por estes segmentos.
 */
const ROUTE_STEP_MAP: Record<string, number> = {
  novo: 0,
  editar: 1,
  revisar: 2,
};

interface SignatureFlowShellProps {
  /** "default" para paginas com scroll (upload/review), "fullscreen" para editor */
  mode?: "default" | "fullscreen";
  children: ReactNode;
  className?: string;
}

export function SignatureFlowShell({
  mode = "default",
  children,
  className,
}: SignatureFlowShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setEtapaAtual } = useFormularioStore();

  // Sincroniza step automaticamente com base na rota
  useEffect(() => {
    const segments = pathname.split("/");
    for (const segment of segments) {
      if (segment in ROUTE_STEP_MAP) {
        setEtapaAtual(ROUTE_STEP_MAP[segment]);
        break;
      }
    }
  }, [pathname, setEtapaAtual]);

  const handleStepClick = (stepIndex: number) => {
    const stepRoutes: Record<number, string> = {
      0: "/app/assinatura-digital/documentos/novo",
    };

    const route = stepRoutes[stepIndex];
    if (route) {
      router.push(route);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col",
        mode === "fullscreen"
          ? "h-full overflow-hidden"
          : "min-h-full",
        className
      )}
    >
      {/* Flow Header com Stepper */}
      <header
        className={cn(
          "sticky top-0 z-40 flex items-center shrink-0",
          "bg-background",
          "h-14 px-4 lg:px-6"
        )}
      >
        {/* Botao Sair */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            router.push("/app/assinatura-digital/documentos/lista")
          }
          className="mr-4 shrink-0"
          aria-label="Sair do fluxo de assinatura"
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline ml-1.5">Sair</span>
        </Button>

        {/* Stepper centralizado */}
        <div className="flex-1 flex justify-center">
          <SignatureWorkflowStepper
            allowNavigation
            onStepClick={handleStepClick}
            className="max-w-lg"
          />
        </div>

        {/* Spacer para simetria */}
        <div className="w-16 shrink-0" />
      </header>

      {/* Area de conteudo */}
      <main
        className={cn(
          mode === "fullscreen"
            ? "flex-1 min-h-0 relative flex"
            : "flex-1 p-6 space-y-6"
        )}
      >
        {children}
      </main>
    </div>
  );
}
