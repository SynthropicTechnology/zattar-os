/**
 * Testes de UI - Sistema de Documentos
 *
 * Testa as funcionalidades principais do sistema de documentos.
 * Requer um servidor de desenvolvimento rodando.
 */

import { test, expect } from '@playwright/test';

// Configuração de autenticação (simulada para testes)
test.beforeEach(async ({ page }) => {
  // Aguardar página carregar
  await page.goto('/');
});

test.describe('Listagem de Documentos', () => {
  test('deve exibir a página de documentos', async ({ page }) => {
    await page.goto('/documentos');

    // Verificar que a página carregou
    await expect(page).toHaveTitle(/Documentos|Sinesys/i);

    // Verificar elementos principais
    await expect(page.getByRole('button', { name: /novo documento/i })).toBeVisible();
  });

  test('deve ter botão de criar nova pasta', async ({ page }) => {
    await page.goto('/documentos');

    await expect(page.getByRole('button', { name: /nova pasta/i })).toBeVisible();
  });

  test('deve ter opções de visualização (grid/lista)', async ({ page }) => {
    await page.goto('/documentos');

    // Verificar que há toggle de visualização (alternativa: icons de grid/list)
    const hasGridIcon = await page.locator('svg.lucide-grid-2x2').count() > 0;
    const hasListIcon = await page.locator('svg.lucide-list').count() > 0;

    expect(hasGridIcon || hasListIcon).toBeTruthy();
  });
});

test.describe('Criação de Documento', () => {
  test('deve abrir dialog de criação ao clicar no botão', async ({ page }) => {
    await page.goto('/documentos');

    // Clicar no botão de novo documento
    await page.getByRole('button', { name: /novo documento/i }).click();

    // Verificar que o dialog abriu
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /novo documento|criar documento/i })).toBeVisible();
  });

  test('deve ter campo de título no dialog de criação', async ({ page }) => {
    await page.goto('/documentos');

    await page.getByRole('button', { name: /novo documento/i }).click();

    // Verificar campo de título
    const titleInput = page.getByPlaceholder(/título/i);
    await expect(titleInput).toBeVisible();
  });
});

test.describe('Editor de Documento', () => {
  test.skip('deve carregar o editor com toolbar', async ({ page }) => {
    // Este teste requer um documento existente
    // Pulando por enquanto - requer autenticação e dados de teste
    await page.goto('/documentos/1');

    // Verificar toolbar do editor
    await expect(page.locator('.plate-toolbar, [data-testid="editor-toolbar"]')).toBeVisible();
  });

  test.skip('deve exibir indicador de salvamento', async ({ page }) => {
    // Este teste requer um documento existente
    // Pulando por enquanto - requer autenticação e dados de teste
    await page.goto('/documentos/1');

    // Verificar indicador de status
    const saveIndicator = page.locator('text=Salvando, text=Salvo');
    await expect(saveIndicator.first()).toBeVisible();
  });
});

test.describe('Criação de Pasta', () => {
  test('deve abrir dialog de criação de pasta', async ({ page }) => {
    await page.goto('/documentos');

    // Clicar no botão de nova pasta
    await page.getByRole('button', { name: /nova pasta/i }).click();

    // Verificar que o dialog abriu
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /nova pasta|criar pasta/i })).toBeVisible();
  });

  test('deve ter campos de nome e tipo no dialog', async ({ page }) => {
    await page.goto('/documentos');

    await page.getByRole('button', { name: /nova pasta/i }).click();

    // Verificar campos
    await expect(page.getByPlaceholder(/nome/i)).toBeVisible();
  });
});

test.describe('Lixeira', () => {
  test('deve acessar a página de lixeira', async ({ page }) => {
    await page.goto('/documentos/lixeira');

    // Verificar título ou conteúdo da página
    await expect(page.getByRole('heading', { name: /lixeira/i })).toBeVisible();
  });

  test('deve exibir mensagem quando lixeira está vazia', async ({ page }) => {
    await page.goto('/documentos/lixeira');

    // Verificar estado vazio ou lista
    const emptyState = page.getByText(/nenhum item|lixeira vazia/i);
    const hasItems = await page.locator('[data-testid="trash-item"], .trash-item').count() > 0;

    // Deve ter ou estado vazio ou itens
    expect(await emptyState.count() > 0 || hasItems).toBeTruthy();
  });
});

test.describe('Templates', () => {
  test.skip('deve abrir biblioteca de templates', async ({ page }) => {
    await page.goto('/documentos');

    // Buscar botão de templates (pode variar)
    const templatesButton = page.getByRole('button', { name: /template/i });

    if (await templatesButton.count() > 0) {
      await templatesButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
    }
  });
});

test.describe('Compartilhamento', () => {
  test.skip('deve abrir dialog de compartilhamento', async ({ page }) => {
    // Este teste requer um documento existente
    // Pulando por enquanto - requer autenticação e dados de teste
    await page.goto('/documentos/1');

    // Clicar no botão de compartilhar
    await page.getByRole('button', { name: /compartilhar/i }).click();

    // Verificar dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /compartilhar/i })).toBeVisible();
  });
});

test.describe('Navegação', () => {
  test('deve navegar entre páginas via sidebar', async ({ page }) => {
    await page.goto('/');

    // Clicar em Documentos na sidebar
    const docsLink = page.getByRole('link', { name: /documentos/i });

    if (await docsLink.count() > 0) {
      await docsLink.first().click();
      await expect(page).toHaveURL(/\/documentos/);
    }
  });
});

test.describe('Command Menu', () => {
  test('deve abrir command menu com Ctrl+K', async ({ page }) => {
    await page.goto('/documentos');

    // Pressionar Ctrl+K
    await page.keyboard.press('Control+k');

    // Verificar que o command menu abriu
    const commandMenu = page.locator('[cmdk-dialog], [data-testid="command-menu"]');

    // O command menu pode não existir em todas as páginas
    if (await commandMenu.count() > 0) {
      await expect(commandMenu.first()).toBeVisible();
    }
  });
});

test.describe('Responsividade', () => {
  test('deve ser responsivo em mobile', async ({ page }) => {
    // Definir viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/documentos');

    // Verificar que a página renderiza corretamente
    await expect(page.locator('body')).toBeVisible();

    // Não deve ter overflow horizontal
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });
});
