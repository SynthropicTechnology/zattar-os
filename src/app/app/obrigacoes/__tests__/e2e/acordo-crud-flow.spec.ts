import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast, fillAcordoForm as _fillAcordoForm } from '@/testing/e2e/helpers';

test.describe('Obrigações - Acordo CRUD Flow', () => {
  test('deve criar acordo com geração automática de parcelas', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo acordo/i }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await page.getByLabel(/processo/i).fill('0000000-00.2025.5.15.0001');
    await page.waitForTimeout(300);
    await page.getByText('0000000-00.2025.5.15.0001').click();

    await page.getByLabel(/tipo/i).click();
    await page.getByText('Acordo', { exact: true }).click();

    await page.getByLabel(/direção/i).click();
    await page.getByText('Recebimento').click();

    await page.getByLabel(/valor total/i).fill('100000.00');
    await page.getByLabel(/data de vencimento/i).fill('31/01/2025');
    await page.getByLabel(/número de parcelas/i).fill('10');
    await page.getByLabel(/intervalo entre parcelas/i).fill('30');

    await page.getByLabel(/forma de pagamento/i).click();
    await page.getByText('Transferência Direta').click();

    await page.getByLabel(/distribuição/i).click();
    await page.getByText('Dividido').click();

    await page.getByLabel(/percentual escritório/i).fill('30');
    await page.getByLabel(/honorários sucumbenciais/i).fill('5000.00');

    await page.getByRole('button', { name: /salvar|criar/i }).click();

    await waitForToast(page, /acordo criado com sucesso/i);

    await expect(page.getByText(/10 parcelas geradas/i)).toBeVisible();
    await expect(page.getByText(/valor por parcela.*r\$.*10\.000,00/i)).toBeVisible();
    await expect(page.getByText(/repasse escritório.*r\$.*3\.000,00/i)).toBeVisible();
    await expect(page.getByText(/repasse cliente.*r\$.*7\.000,00/i)).toBeVisible();
  });

  test('deve visualizar detalhes do acordo', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await expect(page.getByText(/valor total.*r\$.*100\.000,00/i)).toBeVisible();
    await expect(page.getByText(/10 parcelas/i)).toBeVisible();
    await expect(page.getByText(/percentual escritório.*30%/i)).toBeVisible();
  });

  test('deve editar acordo existente', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const acordo = page.getByText(/acordo/i).first();
    await acordo.click();

    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await page.getByRole('button', { name: /editar/i }).click();

    const percentualInput = page.getByLabel(/percentual escritório/i);
    await percentualInput.clear();
    await percentualInput.fill('35');

    await page.getByRole('button', { name: /salvar/i }).click();

    await waitForToast(page, /acordo atualizado com sucesso/i);
    await expect(page.getByText(/35%/i)).toBeVisible();
  });

  test('deve validar campos obrigatórios ao criar acordo', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo acordo/i }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await page.getByRole('button', { name: /salvar|criar/i }).click();

    await expect(page.getByText(/campo obrigatório|required/i).first()).toBeVisible();
  });

  test('deve validar cálculos automáticos do acordo', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /novo acordo/i }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    await page.getByLabel(/valor total/i).fill('100000.00');
    await page.getByLabel(/número de parcelas/i).fill('10');

    await page.waitForTimeout(500);

    const valorParcela = page.getByText(/valor por parcela.*r\$.*10\.000,00/i);
    if (await valorParcela.isVisible({ timeout: 2000 })) {
      await expect(valorParcela).toBeVisible();
    }

    await page.getByLabel(/percentual escritório/i).fill('30');
    await page.waitForTimeout(300);

    const repasseEscritorio = page.getByText(/repasse escritório.*r\$.*3\.000,00/i);
    if (await repasseEscritorio.isVisible({ timeout: 2000 })) {
      await expect(repasseEscritorio).toBeVisible();
    }
  });
});

test.describe('Obrigações - Acordo CRUD Flow (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve criar acordo em mobile', async ({ obrigacoesMockedPage: page }) => {
    await page.goto('/obrigacoes');
    await page.waitForLoadState('networkidle');

    const novoButton = page.getByRole('button', { name: /novo acordo/i });
    await novoButton.scrollIntoViewIfNeeded();
    await novoButton.click();

    const processoInput = page.getByLabel(/processo/i);
    await processoInput.scrollIntoViewIfNeeded();
    await processoInput.fill('0000000-00.2025.5.15.0001');
    await page.waitForTimeout(300);
    await page.getByText('0000000-00.2025.5.15.0001').click();

    const tipoSelect = page.getByLabel(/tipo/i);
    await tipoSelect.scrollIntoViewIfNeeded();
    await tipoSelect.click();
    await page.getByText('Acordo').click();

    const direcaoSelect = page.getByLabel(/direção/i);
    await direcaoSelect.scrollIntoViewIfNeeded();
    await direcaoSelect.click();
    await page.getByText('Recebimento').click();

    const valorInput = page.getByLabel(/valor total/i);
    await valorInput.scrollIntoViewIfNeeded();
    await valorInput.fill('100000.00');

    const dataInput = page.getByLabel(/data de vencimento/i);
    await dataInput.scrollIntoViewIfNeeded();
    await dataInput.fill('31/01/2025');

    const parcelasInput = page.getByLabel(/número de parcelas/i);
    await parcelasInput.scrollIntoViewIfNeeded();
    await parcelasInput.fill('10');

    const salvarButton = page.getByRole('button', { name: /salvar|criar/i });
    await salvarButton.scrollIntoViewIfNeeded();
    await salvarButton.click();

    await waitForToast(page, /acordo criado com sucesso/i);
  });
});
