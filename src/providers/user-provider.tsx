'use client';

/**
 * Provider unificado de autenticação, perfil e permissões do usuário.
 *
 * Faz UMA única chamada a GET /api/auth/me após o login e distribui
 * todos os dados via React Context, eliminando fetches duplicados.
 *
 * Hooks expostos:
 * - useUser()        → dados do perfil (id, nome, email, avatar, isSuperAdmin)
 * - usePermissoes()  → permissões + temPermissao(recurso, operacao)
 * - useAuthSession() → isAuthenticated, sessionToken, logout
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { resolveAvatarUrl } from '@/lib/avatar-url';
import type { Permissao } from '@/app/(authenticated)/usuarios';

// ─── Tipos ───────────────────────────────────────────────

export interface UserData {
  id: number;
  authUserId: string;
  nomeCompleto: string;
  nomeExibicao: string;
  emailCorporativo: string;
  emailPessoal: string | null;
  avatarUrl: string | null;
  isSuperAdmin: boolean;
}

interface UserContextValue {
  // Dados do usuário
  user: UserData | null;

  // Permissões
  permissoes: Permissao[];
  temPermissao: (recurso: string, operacao: string) => boolean;

  // Auth
  isAuthenticated: boolean;
  sessionToken: string | null;
  isLoading: boolean;

  // Ações
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────

const UserContext = createContext<UserContextValue | undefined>(undefined);

// ─── Rotas públicas (não fazem logout automático) ────────

const PUBLIC_ROUTES = [
  '/app/login',
  '/app/confirm',
  '/app/forgot-password',
  '/app/update-password',
  '/app/error',
];

// ─── Provider ────────────────────────────────────────────

export function UserProvider({
  children,
  initialUser = null,
  initialPermissoes = [],
}: {
  children: ReactNode;
  initialUser?: UserData | null;
  initialPermissoes?: Permissao[];
}) {
  const [user, setUser] = useState<UserData | null>(initialUser);
  const [permissoes, setPermissoes] = useState<Permissao[]>(initialPermissoes);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  // Se recebemos dados do server, não precisa de loading na UI
  const [isLoading, setIsLoading] = useState(!initialUser);

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const logoutInProgressRef = useRef(false);
  // Se inicializamos com usuário, consideramos que já buscamos inicialmente
  const hasFetchedRef = useRef(!!initialUser);
  const userRef = useRef<UserData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Manter ref sincronizado com state
  userRef.current = user;

  const clearAuthState = useCallback(() => {
    setUser(null);
    setPermissoes([]);
    setSessionToken(null);
  }, []);

  const isCurrentRoutePublic = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return PUBLIC_ROUTES.some((route) => window.location.pathname.startsWith(route));
  }, []);

  /**
   * Logout: limpa sessão, cookies e redireciona para login
   */
  const logout = useCallback(async () => {
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;

    try {
      try {
        await supabase.auth.signOut();
      } catch {
        // Sessão pode já ter expirado
      }

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {});

      // Limpar localStorage
      if (typeof window !== 'undefined') {
        ['chat-notifications', 'chat-unread-counts', 'call-layout'].forEach(
          (key) => localStorage.removeItem(key)
        );
      }
    } catch {
      // Continuar com redirect mesmo com erro
    } finally {
      clearAuthState();
      hasFetchedRef.current = false;
      logoutInProgressRef.current = false;
      router.push('/app/login');
      router.refresh();
    }
  }, [clearAuthState, router, supabase]);

  const invalidateSession = useCallback(async () => {
    clearAuthState();
    setIsLoading(false);

    if (!isCurrentRoutePublic()) {
      await logout();
    }
  }, [clearAuthState, isCurrentRoutePublic, logout]);

  // Função auxiliar para verificar erros de Lock
  const isLockOrAbortError = (error: unknown) => {
    if (!error) return false;
    const errString = String(error).toLowerCase();
    return errString.includes('lock') || errString.includes('abort') || errString.includes('steal');
  };

  /**
   * Busca dados do usuário + permissões da API consolidada
   */
  const fetchUserData = useCallback(async (signal?: AbortSignal) => {
    if (typeof window === 'undefined') return;

    try {
      // Validar sessão Supabase via getUser() — faz chamada ao servidor Auth
      // para garantir que o token é válido. Não usar getSession() aqui pois
      // ele apenas lê do storage local e pode retornar dados desatualizados.
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (signal?.aborted) return;

      if (authError || !authUser) {
        if (isLockOrAbortError(authError)) {
          // Apenas ignore timeout/lock no carregamento para não deslogar abruptamente
          console.warn('getUser() abortado ou em lock, ignorando para não causar logout.');
          setIsLoading(false);
          return;
        }
        hasFetchedRef.current = false;
        await invalidateSession();
        return;
      }

      // Buscar dados consolidados da API
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        signal,
      });

      if (signal?.aborted) return;

      if (response.status === 401) {
        hasFetchedRef.current = false;
        await invalidateSession();
        return;
      }

      if (!response.ok) {
        console.error('Erro ao buscar dados do usuário:', response.status);
        if (response.status === 403 || response.status === 404) {
          hasFetchedRef.current = false;
          await invalidateSession();
          return;
        }

        hasFetchedRef.current = false;
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (signal?.aborted) return;

      if (data.success && data.data) {
        setUser({
          id: data.data.id,
          authUserId: data.data.authUserId,
          nomeCompleto: data.data.nomeCompleto,
          nomeExibicao: data.data.nomeExibicao,
          emailCorporativo: data.data.emailCorporativo,
          emailPessoal: data.data.emailPessoal,
          avatarUrl: resolveAvatarUrl(data.data.avatarUrl),
          isSuperAdmin: data.data.isSuperAdmin,
        });
        setPermissoes(data.data.permissoes);
      } else {
        hasFetchedRef.current = false;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Erro ao carregar dados do usuário:', error);
      hasFetchedRef.current = false;
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [invalidateSession, supabase]);

  // Fetch inicial + listener de auth state
  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const init = async () => {
      // Se não tem usuário inicial (SSR cache loss etc), deve buscar
      if (!userRef.current && !hasFetchedRef.current) {
        hasFetchedRef.current = true;
        await fetchUserData(controller.signal);
      }
    };

    const validateSession = async () => {
      if (!mounted || logoutInProgressRef.current) return;

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (!mounted) return;

      if (userError || !userData.user) {
        if (isLockOrAbortError(userError)) {
          console.warn('Cuidado: Sessão validation teve Lock/Abort Error. Ignorando.');
          return;
        }
        console.log('Sessão inválida detectada, fazendo logout automático');
        hasFetchedRef.current = false;
        await invalidateSession();
      }
    };

    init();

    // Revalidar quando a aba volta a receber foco e também periodicamente.
    // visibilitychange deve checar o estado para evitar validações
    // desnecessárias quando o usuário SAI da aba (hidden).
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateSession();
      }
    };
    window.addEventListener('focus', validateSession);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    intervalId = setInterval(validateSession, 60000);

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || logoutInProgressRef.current) return;

      // Ignite initial fetch if not INITIAL_SESSION, to avoid duplicate concurrent getUser()
      if (event === 'INITIAL_SESSION') return;

      if (session?.access_token) {
        setSessionToken(session.access_token);

        // Supabase recomenda não confiar em session.user de onAuthStateChange,
        // pois esse objeto vem do storage local; validar via getUser().
        const { data: verifiedUserData, error: verifiedUserError } = await supabase.auth.getUser();
        
        if (verifiedUserError || !verifiedUserData.user) {
          if (isLockOrAbortError(verifiedUserError)) {
             console.warn('onAuthStateChange teve Lock/Abort Error. Ignorando.');
             return;
          }
          hasFetchedRef.current = false;
          await invalidateSession();
          return;
        }

        if (!userRef.current || userRef.current.authUserId !== verifiedUserData.user.id) {
          hasFetchedRef.current = false;
          await fetchUserData(controller.signal);
        }
      } else if (event === 'SIGNED_OUT') {
        // Apenas reagir ao SIGNED_OUT explícito.
        hasFetchedRef.current = false;
        clearAuthState();
        await invalidateSession();
      }
    });

    return () => {
      mounted = false;
      controller.abort();
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('focus', validateSession);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const temPermissao = useCallback(
    (recurso: string, operacao: string): boolean => {
      if (!user) return false;
      if (user.isSuperAdmin) return true;
      return permissoes.some(
        (p) => p.recurso === recurso && p.operacao === operacao && p.permitido
      );
    },
    [user, permissoes]
  );

  const refetch = useCallback(async () => {
    // Abortar fetch anterior se existir
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    hasFetchedRef.current = false;
    setIsLoading(true);
    await fetchUserData(controller.signal);
  }, [fetchUserData]);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      permissoes,
      temPermissao,
      isAuthenticated: !!user,
      sessionToken,
      isLoading,
      logout,
      refetch,
    }),
    [user, permissoes, temPermissao, sessionToken, isLoading, logout, refetch]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// ─── Hooks derivados ─────────────────────────────────────

/**
 * Dados do perfil do usuário logado.
 * Lê do UserProvider (zero fetches).
 */
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser deve ser usado dentro de <UserProvider>');

  return {
    ...ctx.user,
    isLoading: ctx.isLoading,
    refetch: ctx.refetch,
  };
}

/**
 * Permissões do usuário logado.
 * Lê do UserProvider (zero fetches).
 */
export function usePermissoes() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('usePermissoes deve ser usado dentro de <UserProvider>');

  return {
    data: ctx.user
      ? {
          usuarioId: ctx.user.id,
          isSuperAdmin: ctx.user.isSuperAdmin,
          permissoes: ctx.permissoes,
        }
      : null,
    permissoes: ctx.permissoes,
    temPermissao: ctx.temPermissao,
    isLoading: ctx.isLoading,
  };
}

/**
 * Estado de autenticação e ações de sessão.
 * Lê do UserProvider (zero fetches).
 */
export function useAuthSession() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useAuthSession deve ser usado dentro de <UserProvider>');

  return {
    user: ctx.user,
    isAuthenticated: ctx.isAuthenticated,
    sessionToken: ctx.sessionToken,
    isLoading: ctx.isLoading,
    logout: ctx.logout,
  };
}
