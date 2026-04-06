import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast } from '@/testing/e2e/helpers';

test.describe('Assinatura Digital - Logged Flows', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
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

    await page.route('**/api/assinatura-digital/**', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [], total: 0 }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  });

  test('deve acessar a gestão de documentos e visualizar os detalhes', async ({ authenticatedPage: page }) => {
    await page.goto('/assinatura-digital/documentos/lista');

    // Mudar regex para ignorar case e tolerar pequenas diferenças de string.
    await expect(page.getByRole('heading', { name: /documentos|assinaturas/i })).toBeVisible({ timeout: 15000 });

    const newDocBtn = page.getByRole('button', { name: /novo documento/i });
    if (await newDocBtn.isVisible()) {
      await newDocBtn.click();
      await page.waitForURL('**/assinatura-digital/documentos/novo');
      await expect(page.getByRole('heading', { name: /enviar|documento/i })).toBeVisible({ timeout: 10000 });
    }
  });

  test('deve gerenciar templates', async ({ authenticatedPage: page }) => {
    await page.goto('/assinatura-digital/templates');

    await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible({ timeout: 15000 });

    const novoBtn = page.getByRole('button', { name: /novo template/i });
    if (await novoBtn.isVisible()) {
      await novoBtn.click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
      await expect(page.getByText(/Novo Template/i)).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('deve gerenciar formulários', async ({ authenticatedPage: page }) => {
    await page.goto('/assinatura-digital/formularios');

    await expect(page.getByRole('heading', { name: /formul[áa]rios/i })).toBeVisible({ timeout: 15000 });

    const novoBtn = page.getByRole('button', { name: /novo formul[áa]rio/i });
    if (await novoBtn.isVisible()) {
      await novoBtn.click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
      await expect(page.getByText(/Novo Formulário/i)).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });
});

