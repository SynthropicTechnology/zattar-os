"use client";

/**
 * Hook para gerenciar contas 2FAuth
 *
 * Fornece funções para CRUD de contas e geração de OTP
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  TwoFAuthAccount,
  OTPResult,
  CreateAccountParams,
  UpdateAccountParams,
} from "@/lib/integrations/twofauth/types";

export type { TwoFAuthAccount, OTPResult };

interface UseTwoFAuthAccountsState {
  accounts: TwoFAuthAccount[];
  isLoading: boolean;
  error: string | null;
  selectedAccount: TwoFAuthAccount | null;
  currentOTP: OTPResult | null;
  otpLoading: boolean;
  otpError: string | null;
  timeRemaining: number;
  isPermissionError: boolean;
}

interface UseTwoFAuthAccountsReturn extends UseTwoFAuthAccountsState {
  // Queries
  fetchAccounts: () => Promise<void>;
  getAccount: (id: number) => Promise<TwoFAuthAccount | null>;

  // Mutations
  createAccount: (data: CreateAccountParams) => Promise<TwoFAuthAccount | null>;
  updateAccount: (id: number, data: UpdateAccountParams) => Promise<TwoFAuthAccount | null>;
  deleteAccount: (id: number) => Promise<boolean>;

  // OTP
  selectAccount: (account: TwoFAuthAccount | null) => void;
  fetchOTP: (accountId: number) => Promise<OTPResult | null>;
  copyOTPToClipboard: () => Promise<boolean>;

  // Utilities
  refresh: () => Promise<void>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useTwoFAuthAccounts(): UseTwoFAuthAccountsReturn {
  const [accounts, setAccounts] = useState<TwoFAuthAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<TwoFAuthAccount | null>(null);
  const [currentOTP, setCurrentOTP] = useState<OTPResult | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isPermissionError, setIsPermissionError] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // ---------------------------------------------------------------------------
  // QUERIES
  // ---------------------------------------------------------------------------

  const fetchAccounts = useCallback(async () => {
    if (isPermissionError) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/twofauth/accounts");
      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        setIsPermissionError(true);
        throw new Error("Não autorizado. Verifique as configurações de API.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar contas");
      }

      if (isMountedRef.current) {
        setAccounts(data.data || []);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isPermissionError]);

  const getAccount = useCallback(async (id: number): Promise<TwoFAuthAccount | null> => {
    try {
      const response = await fetch(`/api/twofauth/accounts/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar conta");
      }

      return data.data;
    } catch {
      return null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // MUTATIONS
  // ---------------------------------------------------------------------------

  const createAccount = useCallback(
    async (accountData: CreateAccountParams): Promise<TwoFAuthAccount | null> => {
      try {
        const response = await fetch("/api/twofauth/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(accountData),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao criar conta");
        }

        // Atualizar lista local
        if (isMountedRef.current) {
          setAccounts((prev) => [...prev, data.data]);
        }

        return data.data;
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : "Erro ao criar conta");
        }
        return null;
      }
    },
    []
  );

  const updateAccount = useCallback(
    async (id: number, accountData: UpdateAccountParams): Promise<TwoFAuthAccount | null> => {
      try {
        const response = await fetch(`/api/twofauth/accounts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(accountData),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao atualizar conta");
        }

        // Atualizar lista local
        if (isMountedRef.current) {
          setAccounts((prev) =>
            prev.map((account) => (account.id === id ? data.data : account))
          );

          // Atualizar conta selecionada se for a mesma
          if (selectedAccount?.id === id) {
            setSelectedAccount(data.data);
          }
        }

        return data.data;
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : "Erro ao atualizar conta");
        }
        return null;
      }
    },
    [selectedAccount]
  );

  const deleteAccount = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        const response = await fetch(`/api/twofauth/accounts/${id}`, {
          method: "DELETE",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao excluir conta");
        }

        // Remover da lista local
        if (isMountedRef.current) {
          setAccounts((prev) => prev.filter((account) => account.id !== id));

          // Limpar seleção se for a conta excluída
          if (selectedAccount?.id === id) {
            setSelectedAccount(null);
            setCurrentOTP(null);
          }
        }

        return true;
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : "Erro ao excluir conta");
        }
        return false;
      }
    },
    [selectedAccount]
  );

  // ---------------------------------------------------------------------------
  // OTP
  // ---------------------------------------------------------------------------

  const fetchOTP = useCallback(async (accountId: number): Promise<OTPResult | null> => {
    setOtpLoading(true);
    setOtpError(null);

    try {
      const response = await fetch(`/api/twofauth/accounts/${accountId}/otp`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar OTP");
      }

      const otpResult: OTPResult = data.data;

      if (isMountedRef.current) {
        setCurrentOTP(otpResult);
        const period = selectedAccount?.period || 30;
        const now = Math.floor(Date.now() / 1000);
        setTimeRemaining(period - (now % period));
      }

      return otpResult;
    } catch (err) {
      if (isMountedRef.current) {
        setOtpError(err instanceof Error ? err.message : "Erro desconhecido");
        setCurrentOTP(null);
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setOtpLoading(false);
      }
    }
  }, [selectedAccount]);

  const selectAccount = useCallback(
    (account: TwoFAuthAccount | null) => {
      setSelectedAccount(account);
      setCurrentOTP(null);
      setOtpError(null);

      if (account) {
        fetchOTP(account.id);
      }
    },
    [fetchOTP]
  );

  const copyOTPToClipboard = useCallback(async (): Promise<boolean> => {
    if (!currentOTP?.password) return false;

    try {
      await navigator.clipboard.writeText(currentOTP.password);
      return true;
    } catch {
      return false;
    }
  }, [currentOTP]);

  // ---------------------------------------------------------------------------
  // TIMER
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (selectedAccount && currentOTP) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const period = selectedAccount.period || 30;
      const now = Math.floor(Date.now() / 1000);
      const initialRemaining = period - (now % period);
      setTimeRemaining(initialRemaining);

      timerRef.current = setInterval(() => {
        const currentTime = Math.floor(Date.now() / 1000);
        const remaining = period - (currentTime % period);
        setTimeRemaining(remaining);

        if (remaining === period && selectedAccount) {
          fetchOTP(selectedAccount.id);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [selectedAccount, currentOTP, fetchOTP]);

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    // State
    accounts,
    isLoading,
    error,
    selectedAccount,
    currentOTP,
    otpLoading,
    otpError,
    timeRemaining,
    isPermissionError,

    // Queries
    fetchAccounts,
    getAccount,

    // Mutations
    createAccount,
    updateAccount,
    deleteAccount,

    // OTP
    selectAccount,
    fetchOTP,
    copyOTPToClipboard,

    // Utilities
    refresh: fetchAccounts,
  };
}

export default useTwoFAuthAccounts;
