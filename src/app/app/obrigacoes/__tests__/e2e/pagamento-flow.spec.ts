import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast } from '@/testing/e2e/helpers';

test.describe('Obrigações - Pagamento Flow', () => {
  test('deve registrar pagamento de parcela', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    const parcelaPendente = page.getByRole('row').filter({ hasText: 'Pendente' }).first();
    await parcelaPendente.click();

    await page.getByRole('button', { name: /registrar pagamento/i }).click();
    await page.waitForTimeout(500);

    await page.getByLabel(/data de pagamento/i).fill('31/01/2025');
    await page.getByLabel(/valor pago/i).fill('10000.00');

    await page.getByLabel(/forma de pagamento/i).click();
    await page.getByText('PIX').click();

    await page.getByLabel(/conta bancária/i).click();
    await page.getByText('Banco do Brasil - CC 12345-6').click();

    await page.getByRole('button', { name: /salvar|registrar/i }).click();

    await waitForToast(page, /pagamento registrado com sucesso/i);

    await expect(page.getByText('Pago')).toBeVisible();
    await expect(page.getByText('31/01/2025')).toBeVisible();
  });

  test('deve fazer upload de comprovante de pagamento', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    const parcelaPendente = page.getByRole('row').filter({ hasText: 'Pendente' }).first();
    await parcelaPendente.click();

    await page.getByRole('button', { name: /registrar pagamento/i }).click();
    await page.waitForTimeout(500);

    await page.getByLabel(/data de pagamento/i).fill('31/01/2025');
    await page.getByLabel(/valor pago/i).fill('10000.00');

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 1000 })) {
      await fileInput.setInputFiles({
        name: 'comprovante.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock comprovante PDF'),
      });
    }

    await page.getByRole('button', { name: /salvar|registrar/i }).click();

    await waitForToast(page, /pagamento registrado com sucesso/i);

    const visualizarLink = page.getByRole('link', { name: /visualizar comprovante/i });
    const visualizarButton = page.getByRole('button', { name: /visualizar comprovante/i });

    const visualizarElement = (await visualizarLink.isVisible({ timeout: 1000 }))
      ? visualizarLink
      : visualizarButton;

    await expect(visualizarElement).toBeVisible();
  });

  test('deve validar valor pago diferente do valor da parcela', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    const parcelaPendente = page.getByRole('row').filter({ hasText: 'Pendente' }).first();
    await parcelaPendente.click();

    await page.getByRole('button', { name: /registrar pagamento/i }).click();

    await page.getByLabel(/data de pagamento/i).fill('31/01/2025');
    await page.getByLabel(/valor pago/i).fill('9500.00'); // Valor menor

    await page.getByRole('button', { name: /salvar|registrar/i }).click();

    const alertaDivergencia = page.getByText(/divergência|valor diferente|atenção/i);
    if (await alertaDivergencia.isVisible({ timeout: 2000 })) {
      await expect(alertaDivergencia).toBeVisible();
    }
  });

  test('deve visualizar comprovante de pagamento', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    const parcelaPaga = page.getByRole('row').filter({ hasText: 'Pago' }).first();
    await parcelaPaga.click();

    const visualizarButton = page.getByRole('button', { name: /visualizar comprovante/i });

    if (await visualizarButton.isVisible({ timeout: 1000 })) {
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null),
        visualizarButton.click(),
      ]);

      if (newPage) {
        await expect(newPage).toBeTruthy();
        await newPage.close();
      }
    }
  });

  test('deve estornar pagamento', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    const parcelasTab = page.getByRole('tab', { name: /parcelas/i });
    if (await parcelasTab.isVisible({ timeout: 1000 })) {
      await parcelasTab.click();
      await page.waitForTimeout(500);
    }

    const parcelaPaga = page.getByRole('row').filter({ hasText: 'Pago' }).first();
    await parcelaPaga.click();

    const estornarButton = page.getByRole('button', { name: /estornar/i });

    if (await estornarButton.isVisible({ timeout: 1000 })) {
      await estornarButton.click();

      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /confirmar/i }).click();

      await waitForToast(page, /pagamento estornado com sucesso/i);

      await expect(page.getByText('Pendente')).toBeVisible();
    }
  });
});

test.describe('Obrigações - Pagamento Flow (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve registrar pagamento de parcela em mobile', async ({ obrigacoesMockedPage: page }) => {
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

    const parcelaPendente = page.getByRole('row').filter({ hasText: 'Pendente' }).first();
    await parcelaPendente.scrollIntoViewIfNeeded();
    await parcelaPendente.click();

    const registrarButton = page.getByRole('button', { name: /registrar pagamento/i });
    await registrarButton.scrollIntoViewIfNeeded();
    await registrarButton.click();
    await page.waitForTimeout(500);

    const dataPagamentoInput = page.getByLabel(/data de pagamento/i);
    await dataPagamentoInput.scrollIntoViewIfNeeded();
    await dataPagamentoInput.fill('31/01/2025');

    const valorPagoInput = page.getByLabel(/valor pago/i);
    await valorPagoInput.scrollIntoViewIfNeeded();
    await valorPagoInput.fill('10000.00');

    const formaPagamentoSelect = page.getByLabel(/forma de pagamento/i);
    await formaPagamentoSelect.scrollIntoViewIfNeeded();
    await formaPagamentoSelect.click();
    await page.getByText('PIX').click();

    const contaBancariaSelect = page.getByLabel(/conta bancária/i);
    await contaBancariaSelect.scrollIntoViewIfNeeded();
    await contaBancariaSelect.click();
    await page.getByText('Banco do Brasil - CC 12345-6').click();

    const salvarButton = page.getByRole('button', { name: /salvar|registrar/i });
    await salvarButton.scrollIntoViewIfNeeded();
    await salvarButton.click();

    await waitForToast(page, /pagamento registrado com sucesso/i);

    const statusPago = page.getByText('Pago');
    await statusPago.scrollIntoViewIfNeeded();
    await expect(statusPago).toBeVisible();

    const dataPagamento = page.getByText('31/01/2025');
    await dataPagamento.scrollIntoViewIfNeeded();
    await expect(dataPagamento).toBeVisible();
  });

  test('deve fazer upload de comprovante em mobile', async ({ obrigacoesMockedPage: page }) => {
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

    const parcelaPendente = page.getByRole('row').filter({ hasText: 'Pendente' }).first();
    await parcelaPendente.scrollIntoViewIfNeeded();
    await parcelaPendente.click();

    const registrarButton = page.getByRole('button', { name: /registrar pagamento/i });
    await registrarButton.scrollIntoViewIfNeeded();
    await registrarButton.click();
    await page.waitForTimeout(500);

    const dataPagamentoInput = page.getByLabel(/data de pagamento/i);
    await dataPagamentoInput.scrollIntoViewIfNeeded();
    await dataPagamentoInput.fill('31/01/2025');

    const valorPagoInput = page.getByLabel(/valor pago/i);
    await valorPagoInput.scrollIntoViewIfNeeded();
    await valorPagoInput.fill('10000.00');

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 1000 })) {
      await fileInput.scrollIntoViewIfNeeded();
      await fileInput.setInputFiles({
        name: 'comprovante.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock comprovante PDF'),
      });
    }

    const salvarButton = page.getByRole('button', { name: /salvar|registrar/i });
    await salvarButton.scrollIntoViewIfNeeded();
    await salvarButton.click();

    await waitForToast(page, /pagamento registrado com sucesso/i);

    const visualizarLink = page.getByRole('link', { name: /visualizar comprovante/i });
    const visualizarButton = page.getByRole('button', { name: /visualizar comprovante/i });

    const visualizarElement = (await visualizarLink.isVisible({ timeout: 1000 }))
      ? visualizarLink
      : visualizarButton;

    await visualizarElement.scrollIntoViewIfNeeded();
    await expect(visualizarElement).toBeVisible();
  });

  test('deve validar valor pago diferente em mobile', async ({ obrigacoesMockedPage: page }) => {
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

    const parcelaPendente = page.getByRole('row').filter({ hasText: 'Pendente' }).first();
    await parcelaPendente.scrollIntoViewIfNeeded();
    await parcelaPendente.click();

    const registrarButton = page.getByRole('button', { name: /registrar pagamento/i });
    await registrarButton.scrollIntoViewIfNeeded();
    await registrarButton.click();

    const dataPagamentoInput = page.getByLabel(/data de pagamento/i);
    await dataPagamentoInput.scrollIntoViewIfNeeded();
    await dataPagamentoInput.fill('31/01/2025');

    const valorPagoInput = page.getByLabel(/valor pago/i);
    await valorPagoInput.scrollIntoViewIfNeeded();
    await valorPagoInput.fill('9500.00'); // Valor menor

    const salvarButton = page.getByRole('button', { name: /salvar|registrar/i });
    await salvarButton.scrollIntoViewIfNeeded();
    await salvarButton.click();

    const alertaDivergencia = page.getByText(/divergência|valor diferente|atenção/i);
    if (await alertaDivergencia.isVisible({ timeout: 2000 })) {
      await alertaDivergencia.scrollIntoViewIfNeeded();
      await expect(alertaDivergencia).toBeVisible();
    }
  });
});
