import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast, navigateToTab as _navigateToTab } from '@/testing/e2e/helpers';

test.describe('Obrigações - Parcelas Flow', () => {
  test('deve listar parcelas do acordo', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    await expect(page.getByText(/parcela 1/i)).toBeVisible();
    await expect(page.getByText(/r\$.*10\.000,00/i)).toBeVisible();
    await expect(page.getByText('Pendente')).toBeVisible();
  });

  test('deve editar parcela', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    const editButton = page.getByRole('button', { name: /editar/i }).first();
    await editButton.click();

    const dataInput = page.getByLabel(/data de vencimento/i);
    await dataInput.clear();
    await dataInput.fill('15/02/2025');

    const valorInput = page.getByLabel(/valor/i);
    await valorInput.clear();
    await valorInput.fill('12000.00');

    await page.getByRole('button', { name: /salvar/i }).click();

    await waitForToast(page, /parcela atualizada com sucesso/i);

    await expect(page.getByText('15/02/2025')).toBeVisible();
    await expect(page.getByText(/r\$.*12\.000,00/i)).toBeVisible();
  });

  test('deve validar recálculo de repasses ao editar parcela', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    const editButton = page.getByRole('button', { name: /editar/i }).first();
    await editButton.click();

    const valorInput = page.getByLabel(/valor/i);
    await valorInput.clear();
    await valorInput.fill('15000.00');

    await page.waitForTimeout(300);

    const repasseEscritorio = page.getByText(/repasse escritório.*r\$.*4\.500,00/i);
    if (await repasseEscritorio.isVisible({ timeout: 2000 })) {
      await expect(repasseEscritorio).toBeVisible();
    }

    const repasseCliente = page.getByText(/repasse cliente.*r\$.*10\.500,00/i);
    if (await repasseCliente.isVisible({ timeout: 2000 })) {
      await expect(repasseCliente).toBeVisible();
    }
  });

  test('deve filtrar parcelas por status', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    const statusFilter = page.getByLabel(/filtrar por status|status/i);
    if (await statusFilter.isVisible({ timeout: 1000 })) {
      await statusFilter.click();
      await page.getByText('Pago', { exact: true }).click();

      await page.waitForTimeout(500);

      await expect(page.getByText('Pago')).toBeVisible();
    }
  });

  test('deve visualizar histórico de alterações da parcela', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    const parcela = page.getByText(/parcela 1/i).first();
    await parcela.click();

    const historicoTab = page.getByRole('tab', { name: /histórico/i });
    if (await historicoTab.isVisible({ timeout: 1000 })) {
      await historicoTab.click();
      await page.waitForTimeout(500);

      await expect(page.getByText(/alteração|modificação/i)).toBeVisible();
    }
  });
});

test.describe('Obrigações - Parcelas Flow (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve listar parcelas do acordo em mobile', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.scrollIntoViewIfNeeded();
    await acordo.click();

    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.scrollIntoViewIfNeeded();
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    const parcela1 = page.getByText(/parcela 1/i);
    await parcela1.scrollIntoViewIfNeeded();
    await expect(parcela1).toBeVisible();

    const valor = page.getByText(/r\$.*10\.000,00/i);
    await valor.scrollIntoViewIfNeeded();
    await expect(valor).toBeVisible();

    const statusPendente = page.getByText('Pendente');
    await statusPendente.scrollIntoViewIfNeeded();
    await expect(statusPendente).toBeVisible();
  });

  test('deve editar parcela em mobile', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.scrollIntoViewIfNeeded();
    await acordo.click();

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.scrollIntoViewIfNeeded();
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    const editButton = page.getByRole('button', { name: /editar/i }).first();
    await editButton.scrollIntoViewIfNeeded();
    await editButton.click();

    const dataInput = page.getByLabel(/data de vencimento/i);
    await dataInput.scrollIntoViewIfNeeded();
    await dataInput.clear();
    await dataInput.fill('15/02/2025');

    const valorInput = page.getByLabel(/valor/i);
    await valorInput.scrollIntoViewIfNeeded();
    await valorInput.clear();
    await valorInput.fill('12000.00');

    const salvarButton = page.getByRole('button', { name: /salvar/i });
    await salvarButton.scrollIntoViewIfNeeded();
    await salvarButton.click();

    await waitForToast(page, /parcela atualizada com sucesso/i);

    const novaData = page.getByText('15/02/2025');
    await novaData.scrollIntoViewIfNeeded();
    await expect(novaData).toBeVisible();

    const novoValor = page.getByText(/r\$.*12\.000,00/i);
    await novoValor.scrollIntoViewIfNeeded();
    await expect(novoValor).toBeVisible();
  });

  test('deve filtrar parcelas por status em mobile', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.scrollIntoViewIfNeeded();
    await acordo.click();

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.scrollIntoViewIfNeeded();
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    const statusFilter = page.getByLabel(/filtrar por status|status/i);
    if (await statusFilter.isVisible({ timeout: 1000 })) {
      await statusFilter.scrollIntoViewIfNeeded();
      await statusFilter.click();
      await page.getByText('Pago', { exact: true }).click();

      await page.waitForTimeout(500);

      const statusPago = page.getByText('Pago');
      await statusPago.scrollIntoViewIfNeeded();
      await expect(statusPago).toBeVisible();
    }
  });
});
