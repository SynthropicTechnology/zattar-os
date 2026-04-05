"use client";

import { useEffect, useState } from "react";
import {
  Fingerprint,
  CopyIcon,
  CheckIcon,
  ChevronLeftIcon,
  Loader2Icon,
  AlertCircleIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useTwoFAuth, type TwoFAuthAccount } from "@/hooks/use-twofauth";

/**
 * Componente para exibir o ícone de uma conta 2FA
 * Suporta URLs e base64, com fallback para ícone padrão
 */
function AccountIcon({ account, size = "md" }: { account: TwoFAuthAccount; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSizeClasses = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  // Gerar iniciais do serviço para fallback
  const initials = account.service
    ? account.service
        .split(" ")
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "2F"
    : "2F";

  // Verificar se o ícone é uma URL válida ou base64
  const hasValidIcon = account.icon && (
    account.icon.startsWith("http") ||
    account.icon.startsWith("data:image") ||
    account.icon.startsWith("/")
  );

  return (
    <Avatar className={cn(sizeClasses, "bg-primary/10")}>
      {hasValidIcon ? (
        <AvatarImage
          src={account.icon!}
          alt={account.service || "2FA"}
          className="object-cover"
        />
      ) : null}
      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
        {account.icon && !hasValidIcon ? (
          // Se há um ícone mas não é URL/base64, pode ser um nome de ícone
          <ShieldCheckIcon className={iconSizeClasses} />
        ) : (
          initials
        )}
      </AvatarFallback>
    </Avatar>
  );
}

export function AuthenticatorPopover() {
  const {
    accounts,
    isLoading,
    error,
    selectedAccount,
    currentOTP,
    otpLoading,
    otpError,
    timeRemaining,
    fetchAccounts,
    selectAccount,
    copyOTPToClipboard,
  } = useTwoFAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Buscar contas quando o popover abre (com guard contra retry infinito em caso de erro)
  useEffect(() => {
    if (isOpen && accounts.length === 0 && !isLoading && !error) {
      fetchAccounts();
    }
  }, [isOpen, accounts.length, isLoading, error, fetchAccounts]);

  // Manipular alteracao de estado do popover
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      selectAccount(null);
      setCopied(false);
    }
  };

  // Copiar OTP
  const handleCopy = async () => {
    const success = await copyOTPToClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Voltar para lista de contas
  const handleBack = () => {
    selectAccount(null);
    setCopied(false);
  };

  // Calcular progresso do timer (0-100)
  const period = selectedAccount?.period || 30;
  const progress = (timeRemaining / period) * 100;



  // Formatar codigo OTP com espaco no meio (123 456)
  const formatOTP = (code: string) => {
    if (code.length === 6) {
      return `${code.slice(0, 3)} ${code.slice(3)}`;
    }
    return code;
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="size-8 rounded-lg">
          <Fingerprint className="size-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[calc(100vw-2rem)] rounded-xl border-border/20 bg-popover/80 p-0 shadow-lg backdrop-blur-xl dark:bg-popover/70 sm:w-80"
      >
        {/* ── Header ── */}
        <div className="relative flex items-center justify-between rounded-t-xl px-3.5 py-2.5">
          <div className="pointer-events-none absolute inset-0 rounded-t-xl bg-linear-to-br from-primary/6 via-transparent to-transparent" />
          {selectedAccount ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-auto p-0 text-[13px]"
                onClick={handleBack}
              >
                <ChevronLeftIcon className="mr-1 h-3.5 w-3.5" />
                Voltar
              </Button>
              <span className="relative text-[13px] font-semibold tracking-tight">Autenticador</span>
            </>
          ) : (
            <span className="relative text-[13px] font-semibold tracking-tight">Contas 2FA</span>
          )}
        </div>
        <div className="mx-3 h-px bg-border/30" />

        {/* ── Content ── */}
        {selectedAccount ? (
          <div className="space-y-3.5 p-3.5">
            {/* Ícone e nome da conta */}
            <div className="flex flex-col items-center text-center">
              <AccountIcon account={selectedAccount} size="md" />
              <div className="mt-2 text-[13px] text-muted-foreground">
                {selectedAccount.service || "Conta"}
              </div>
              <div className="text-[11px] text-muted-foreground/60">
                {selectedAccount.account || `ID: ${selectedAccount.id}`}
              </div>
            </div>

            {/* Codigo OTP */}
            <div className="flex flex-col items-center gap-2">
              {otpLoading ? (
                <div className="flex h-14 items-center justify-center">
                  <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground/60" />
                </div>
              ) : otpError ? (
                <div className="flex flex-col items-center gap-2 text-destructive">
                  <AlertCircleIcon className="h-5 w-5" />
                  <span className="text-[11px] text-center">{otpError}</span>
                </div>
              ) : currentOTP ? (
                <>
                  <div
                    className={cn(
                      "cursor-pointer select-all font-mono text-2xl font-bold tracking-wider",
                      "transition-colors hover:text-primary",
                      timeRemaining <= 5 && "animate-pulse text-destructive"
                    )}
                    onClick={handleCopy}
                    title="Clique para copiar"
                  >
                    {formatOTP(currentOTP.password)}
                  </div>

                  {/* Timer e progresso */}
                  <div className="w-full space-y-1">
                    <Progress
                      value={progress}
                      className={cn(
                        "h-1",
                        timeRemaining <= 5 && "[&>div]:bg-destructive"
                      )}
                    />
                    <div className="flex justify-between text-[11px] text-muted-foreground/60">
                      <span>Expira em</span>
                      <span
                        className={cn(
                          "font-mono",
                          timeRemaining <= 5 && "font-bold text-destructive"
                        )}
                      >
                        {timeRemaining}s
                      </span>
                    </div>
                  </div>

                  {/* Botao copiar */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 w-full rounded-lg border-border/30 text-[13px]"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="mr-2 h-3.5 w-3.5 text-green-500" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <CopyIcon className="mr-2 h-3.5 w-3.5" />
                        Copiar Código
                      </>
                    )}
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-64">
            {isLoading ? (
              <div className="flex h-full items-center justify-center p-8">
                <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground/60" />
              </div>
            ) : error ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <AlertCircleIcon className="mb-2 h-7 w-7 text-destructive" />
                <span className="text-[13px] text-muted-foreground">{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 rounded-lg border-border/30 text-[13px]"
                  onClick={fetchAccounts}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : accounts.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <KeyRoundIcon className="mb-2 h-7 w-7 text-muted-foreground/40" />
                <span className="text-[13px] text-muted-foreground/70">
                  Nenhuma conta 2FA cadastrada
                </span>
              </div>
            ) : (
              <div className="p-1">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left",
                      "cursor-pointer transition-colors duration-150 hover:bg-primary/6"
                    )}
                    onClick={() => selectAccount(account)}
                  >
                    <div className="shrink-0">
                      <AccountIcon account={account} size="sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">
                        {account.service || `Conta #${account.id}`}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground/60">
                        {account.account || account.otp_type.toUpperCase()}
                      </div>
                    </div>
                    <div className="shrink-0 text-[10px] text-muted-foreground/50">
                      {account.digits} dígitos
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
