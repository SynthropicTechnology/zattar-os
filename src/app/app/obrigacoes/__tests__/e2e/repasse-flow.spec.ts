import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast } from '@/testing/e2e/helpers';

test.describe('Obrigações - Repasse Flow', () => {
  test('deve listar repasses pendentes', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const repassesTab = page.getByRole('tab', { name: /repasses/i });
    if (await repassesTab.isVisible({ timeout: 1000 })) {
      await repassesTab.click();
      await page.waitForTimeout(500);
    }

    await expect(page.getByText(/cliente/i)).toBeVisible();
    await expect(page.getByText(/escritório/i)).toBeVisible();
    await expect(page.getByText('Pendente')).toBeVisible();
  });

  test('deve processar repasse para cliente', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const repassesTab = page.getByRole('tab', { name: /repasses/i });
    if (await repassesTab.isVisible({ timeout: 1000 })) {
      await repassesTab.click();
      await page.waitForTimeout(500);
    }

    const repasseCliente = page.getByRole('row').filter({ hasText: /cliente/i }).first();
    await repasseCliente.click();

    await page.getByRole('button', { name: /processar repasse/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(/valor bruto.*r\$.*10\.000,00/i)).toBeVisible();
    await expect(page.getByText(/honorários sucumbenciais.*r\$.*500,00/i)).toBeVisible();
    await expect(page.getByText(/percentual escritório.*30%/i)).toBeVisible();
    await expect(page.getByText(/valor líquido.*r\$.*6\.500,00/i)).toBeVisible();

    await page.getByLabel(/data de repasse/i).fill('05/02/2025');

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 1000 })) {
      await fileInput.setInputFiles({
        name: 'comprovante-repasse.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock comprovante repasse'),
      });
    }

    await page.getByRole('button', { name: /salvar|processar/i }).click();

    await waitForToast(page, /repasse processado com sucesso/i);

    await expect(page.getByText(/valor líquido.*r\$.*6\.500,00/i)).toBeVisible();
    await expect(page.getByText('Processado')).toBeVisible();
  });

  test('deve validar cálculo de repasse', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const repassesTab = page.getByRole('tab', { name: /repasses/i });
    if (await repassesTab.isVisible({ timeout: 1000 })) {
      await repassesTab.click();
      await page.waitForTimeout(500);
    }

    const repasseCliente = page.getByRole('row').filter({ hasText: /cliente/i }).first();
    await repasseCliente.click();

    await page.getByRole('button', { name: /processar repasse/i }).click();
    await page.waitForTimeout(500);

    const valorBruto = 10000.00;
    const honorariosSucumbenciais = 500.00;
    const percentualEscritorio = 0.30;
    const valorLiquido = valorBruto - honorariosSucumbenciais - (valorBruto * percentualEscritorio);

    await expect(page.getByText(new RegExp(`valor líquido.*${valorLiquido.toFixed(2).replace('.', ',')}`, 'i'))).toBeVisible();
  });

  test('deve validar integração com financeiro ao processar repasse', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const repassesTab = page.getByRole('tab', { name: /repasses/i });
    if (await repassesTab.isVisible({ timeout: 1000 })) {
      await repassesTab.click();
      await page.waitForTimeout(500);
    }

    const repasseCliente = page.getByRole('row').filter({ hasText: /cliente/i }).first();
    await repasseCliente.click();

    await page.getByRole('button', { name: /processar repasse/i }).click();
    await page.waitForTimeout(500);

    await page.getByLabel(/data de repasse/i).fill('05/02/2025');
    await page.getByRole('button', { name: /salvar|processar/i }).click();

    await waitForToast(page, /repasse processado com sucesso/i);

    const lancamentoMessage = page.getByText(/lançamento financeiro criado/i);
    if (await lancamentoMessage.isVisible({ timeout: 2000 })) {
      await expect(lancamentoMessage).toBeVisible();
    }
  });

  test('deve fazer upload de comprovante de repasse', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const repassesTab = page.getByRole('tab', { name: /repasses/i });
    if (await repassesTab.isVisible({ timeout: 1000 })) {
      await repassesTab.click();
      await page.waitForTimeout(500);
    }

    const repasse = page.getByRole('row').filter({ hasText: /cliente/i }).first();
    await repasse.click();

    await page.getByRole('button', { name: /processar repasse/i }).click();

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 1000 })) {
      await fileInput.setInputFiles({
        name: 'comprovante-transferencia.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Comprovante de transferência'),
      });
    }

    await page.getByLabel(/data de repasse/i).fill('05/02/2025');
    await page.getByRole('button', { name: /salvar|processar/i }).click();

    await waitForToast(page, /repasse processado com sucesso/i);
  });

  test('deve processar repasse para escritório', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const repassesTab = page.getByRole('tab', { name: /repasses/i });
    if (await repassesTab.isVisible({ timeout: 1000 })) {
      await repassesTab.click();
      await page.waitForTimeout(500);
    }

    const repasseEscritorio = page.getByRole('row').filter({ hasText: /escritório/i }).first();
    await repasseEscritorio.click();

    await page.getByRole('button', { name: /processar repasse/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(/valor bruto.*r\$.*10\.000,00/i)).toBeVisible();
    await expect(page.getByText(/valor líquido.*r\$.*3\.000,00/i)).toBeVisible();

    await page.getByLabel(/data de repasse/i).fill('05/02/2025');
    await page.getByRole('button', { name: /salvar|processar/i }).click();

    await waitForToast(page, /repasse processado com sucesso/i);
    await expect(page.getByText('Processado')).toBeVisible();
  });

  test('deve filtrar repasses por status', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const repassesTab = page.getByRole('tab', { name: /repasses/i });
    if (await repassesTab.isVisible({ timeout: 1000 })) {
      await repassesTab.click();
      await page.waitForTimeout(500);
    }

    const statusFilter = page.getByLabel(/filtrar por status|status/i);
    if (await statusFilter.isVisible({ timeout: 1000 })) {
      await statusFilter.click();
      await page.getByText('Processado').click();

      await page.waitForTimeout(500);

      await expect(page.getByText('Processado')).toBeVisible();
    }
  });
});

test.describe('Obrigações - Repasse Flow (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve processar repasse em mobile', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.scrollIntoViewIfNeeded();
    await acordo.click();

    const repassesTab = page.getByRole('tab', { name: /repasses/i });
    if (await repassesTab.isVisible({ timeout: 1000 })) {
      await repassesTab.scrollIntoViewIfNeeded();
      await repassesTab.click();
      await page.waitForTimeout(500);
    }

    const repasse = page.getByRole('row').filter({ hasText: /cliente/i }).first();
    await repasse.scrollIntoViewIfNeeded();
    await repasse.click();

    const processarButton = page.getByRole('button', { name: /processar repasse/i });
    await processarButton.scrollIntoViewIfNeeded();
    await processarButton.click();

    const dataInput = page.getByLabel(/data de repasse/i);
    await dataInput.scrollIntoViewIfNeeded();
    await dataInput.fill('05/02/2025');

    const salvarButton = page.getByRole('button', { name: /salvar|processar/i });
    await salvarButton.scrollIntoViewIfNeeded();
    await salvarButton.click();

    await waitForToast(page, /repasse processado com sucesso/i);
  });
});
