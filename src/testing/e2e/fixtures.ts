import { test as base, type Page } from '@playwright/test';
import {
  mockProcessosAPI,
  mockAudienciasAPI,
  mockFinanceiroAPI,
  mockObrigacoesAPI,
  mockCommonAPIs,
} from './mocks';

type CustomFixtures = {
  authenticatedPage: Page;
  processosMockedPage: Page;
  audienciasMockedPage: Page;
  financeiroMockedPage: Page;
  obrigacoesMockedPage: Page;
};

export const test = base.extend<CustomFixtures>({
  authenticatedPage: async ({ page }, usePage) => {
    // Mock de autenticação
    await page.route('**/api/auth/session', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 1,
            nome: 'Usuário Teste',
            email: 'teste@example.com',
            cargo: 'Advogado',
          },
          session: {
            access_token: 'mock-token',
            expires_at: Date.now() + 3600000,
          },
        }),
      })
    );

    // Mock de verificação de permissões
    await page.route('**/api/usuarios/*/permissoes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            processos: { ler: true, criar: true, editar: true, excluir: true },
            audiencias: { ler: true, criar: true, editar: true, excluir: true },
            financeiro: { ler: true, criar: true, editar: true, excluir: true },
            obrigacoes: { ler: true, criar: true, editar: true, excluir: true },
          },
        }),
      })
    );

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
    const projectId = new URL(supabaseUrl).hostname.split('.')[0];
    const storageKey = `sb-${projectId}-auth-token`;

    // Add Supabase Cookies to prevent Server Components from throwing AuthSessionMissingError
    await page.context().addCookies([
      { name: storageKey, value: 'mock-token', domain: 'localhost', path: '/' },
      { name: 'sb-mocked-auth-token', value: 'mock-token', domain: 'localhost', path: '/' }
    ]);
    
    // Add Supabase LocalStorage mock to prevent Supabase Auth client from throwing AuthSessionMissingError
    await page.addInitScript((key: string) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-token',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: {
            id: 'mock-auth',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'admin@zattar.com',
            app_metadata: {},
            user_metadata: {},
          },
        })
      );
      // Try multiple possible Supabase refs
      window.localStorage.setItem('sb-ec9bb-auth-token', window.localStorage.getItem(key)!);
      window.localStorage.setItem('sb-127.0.0.1-auth-token', window.localStorage.getItem(key)!);
      window.localStorage.setItem('sb-localhost-auth-token', window.localStorage.getItem(key)!);
    }, storageKey);

    // Mock network call for getUser()
    await page.route('**/auth/v1/user', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-auth',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'admin@zattar.com',
          app_metadata: {},
          user_metadata: {},
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }),
      });
    });

    // Mock network call for /api/auth/me
    await page.route('**/api/auth/me', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 1, authUserId: 'mock-auth', nomeCompleto: 'Admin', isSuperAdmin: true, permissoes: [] }
        }),
      });
    });

    // Setup de mocks globais para todas as features
    await mockCommonAPIs(page);
    await mockProcessosAPI(page);
    await mockAudienciasAPI(page);
    await mockFinanceiroAPI(page);
    await mockObrigacoesAPI(page);

    // eslint-disable-next-line react-hooks/rules-of-hooks -- usePage is a Playwright fixture parameter, not a React hook
    await usePage(page);
  },

  processosMockedPage: async ({ page }, usePage) => {
    // Página com mocks específicos para processos
    await page.route('**/api/auth/session', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, nome: 'Usuário Teste', email: 'teste@example.com' },
        }),
      })
    );

    await mockCommonAPIs(page);
    await mockProcessosAPI(page);

    // eslint-disable-next-line react-hooks/rules-of-hooks -- usePage is a Playwright fixture parameter, not a React hook
    await usePage(page);
  },

  audienciasMockedPage: async ({ page }, usePage) => {
    // Página com mocks específicos para audiências
    await page.route('**/api/auth/session', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, nome: 'Usuário Teste', email: 'teste@example.com' },
        }),
      })
    );

    await mockCommonAPIs(page);
    await mockAudienciasAPI(page);
    await mockProcessosAPI(page);

    // eslint-disable-next-line react-hooks/rules-of-hooks -- usePage is a Playwright fixture parameter, not a React hook
    await usePage(page);
  },

  financeiroMockedPage: async ({ page }, usePage) => {
    // Página com mocks específicos para financeiro
    await page.route('**/api/auth/session', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, nome: 'Usuário Teste', email: 'teste@example.com' },
        }),
      })
    );

    await mockCommonAPIs(page);
    await mockFinanceiroAPI(page);

    // eslint-disable-next-line react-hooks/rules-of-hooks -- usePage is a Playwright fixture parameter, not a React hook
    await usePage(page);
  },

  obrigacoesMockedPage: async ({ page }, usePage) => {
    // Página com mocks específicos para obrigações
    await page.route('**/api/auth/session', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, nome: 'Usuário Teste', email: 'teste@example.com' },
        }),
      })
    );

    await mockCommonAPIs(page);
    await mockObrigacoesAPI(page);
    await mockProcessosAPI(page);

    // eslint-disable-next-line react-hooks/rules-of-hooks -- usePage is a Playwright fixture parameter, not a React hook
    await usePage(page);
  },
});

export { expect } from '@playwright/test';
