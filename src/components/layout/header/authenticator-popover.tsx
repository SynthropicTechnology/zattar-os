"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheckIcon,
  CopyIcon,
  CheckIcon,
  ChevronLeftIcon,
  Loader2Icon,
  AlertCircleIcon,
  KeyRoundIcon,
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
        <Button size="icon" variant="ghost">
          <ShieldCheckIcon className="size-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          {selectedAccount ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-sm"
                onClick={handleBack}
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <span className="text-sm font-medium">Autenticador</span>
            </>
          ) : (
            <span className="text-sm font-medium">Contas 2FA</span>
          )}
        </div>

        {/* Content */}
        {selectedAccount ? (
          // Visualizacao do OTP
          <div className="p-4 space-y-4">
            {/* Ícone e nome da conta */}
            <div className="flex flex-col items-center text-center">
              <AccountIcon account={selectedAccount} size="md" />
              <div className="mt-2 text-sm text-muted-foreground">
                {selectedAccount.service || "Conta"}
              </div>
              <div className="text-xs text-muted-foreground/70">
                {selectedAccount.account || `ID: ${selectedAccount.id}`}
              </div>
            </div>

            {/* Codigo OTP */}
            <div className="flex flex-col items-center gap-2">
              {otpLoading ? (
                <div className="flex items-center justify-center h-16">
                  <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : otpError ? (
                <div className="flex flex-col items-center gap-2 text-destructive">
                  <AlertCircleIcon className="h-6 w-6" />
                  <span className="text-xs text-center">{otpError}</span>
                </div>
              ) : currentOTP ? (
                <>
                  <div
                    className={cn(
                      "text-3xl font-mono font-bold tracking-wider cursor-pointer select-all",
                      "hover:text-primary transition-colors",
                      timeRemaining <= 5 && "text-destructive animate-pulse"
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
                        "h-1.5",
                        timeRemaining <= 5 && "[&>div]:bg-destructive"
                      )}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Expira em</span>
                      <span
                        className={cn(
                          "font-mono",
                          timeRemaining <= 5 && "text-destructive font-bold"
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
                    className="w-full mt-2"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2 text-green-500" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-4 w-4 mr-2" />
                        Copiar Codigo
                      </>
                    )}
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        ) : (
          // Lista de contas
          <ScrollArea className="h-64">
            {isLoading ? (
              <div className="flex items-center justify-center h-full p-8">
                <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <AlertCircleIcon className="h-8 w-8 text-destructive mb-2" />
                <span className="text-sm text-muted-foreground">{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={fetchAccounts}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <KeyRoundIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Nenhuma conta 2FA cadastrada
                </span>
              </div>
            ) : (
              <div className="py-1">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 text-left",
                      "hover:bg-accent transition-colors",
                      "border-b border-border/50 last:border-b-0"
                    )}
                    onClick={() => selectAccount(account)}
                  >
                    <div className="shrink-0">
                      <AccountIcon account={account} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {account.service || `Conta #${account.id}`}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {account.account || account.otp_type.toUpperCase()}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {account.digits} digitos
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
