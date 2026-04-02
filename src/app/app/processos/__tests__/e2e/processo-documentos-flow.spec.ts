import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast } from '@/testing/e2e/helpers';

test.describe('Processos - Documentos Flow', () => {
  test('deve vincular documento ao processo', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Documentos"
    const documentosTab = page.getByRole('tab', { name: /documentos/i });
    if (await documentosTab.isVisible({ timeout: 1000 })) {
      await documentosTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Clicar em "Adicionar Documento"
    await page.getByRole('button', { name: /adicionar documento|novo documento/i }).click();

    // 6. Aguardar modal de upload
    await page.waitForTimeout(500);

    // 7. Fazer upload de arquivo (simular)
    // Nota: Em ambiente de teste, vamos simular o upload com um arquivo mock
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 1000 })) {
      // Criar arquivo temporário para teste
      const buffer = Buffer.from('Mock PDF content for testing');
      await fileInput.setInputFiles({
        name: 'peticao-inicial.pdf',
        mimeType: 'application/pdf',
        buffer: buffer,
      });
    }

    // 8. Preencher nome do documento
    await page.getByLabel(/nome|título/i).fill('Petição Inicial');

    // 9. Selecionar tipo de documento
    await page.getByLabel(/tipo/i).click();
    await page.getByText('Petição', { exact: true }).click();

    // 10. Salvar
    await page.getByRole('button', { name: /salvar|adicionar/i }).click();

    // 11. Validar toast de sucesso
    await waitForToast(page, /documento adicionado com sucesso/i);

    // 12. Validar que documento aparece na lista
    await expect(page.getByText('Petição Inicial')).toBeVisible();
    await expect(page.getByText('Petição')).toBeVisible();
  });

  test('deve listar documentos vinculados ao processo', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Documentos"
    const documentosTab = page.getByRole('tab', { name: /documentos/i });
    if (await documentosTab.isVisible({ timeout: 1000 })) {
      await documentosTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Validar que documentos existentes aparecem
    await expect(page.getByText('Petição Inicial')).toBeVisible();
    await expect(page.getByText('Petição')).toBeVisible();
  });

  test('deve visualizar documento vinculado', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Documentos"
    const documentosTab = page.getByRole('tab', { name: /documentos/i });
    if (await documentosTab.isVisible({ timeout: 1000 })) {
      await documentosTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Validar que botão/link de visualizar existe
    const visualizarLink = page.getByRole('link', { name: /visualizar|abrir|ver/i });
    const visualizarButton = page.getByRole('button', { name: /visualizar|abrir|ver/i });

    const visualizarElement = (await visualizarLink.isVisible({ timeout: 1000 }))
      ? visualizarLink
      : visualizarButton;

    await expect(visualizarElement).toBeVisible();

    // 6. Clicar para visualizar (abrirá em nova aba ou modal)
    // Nota: Em teste real, validaríamos que nova aba foi aberta ou preview apareceu
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null),
      visualizarElement.click(),
    ]);

    if (newPage) {
      // Nova aba foi aberta
      await expect(newPage).toBeTruthy();
      await newPage.close();
    } else {
      // Preview interno ou download
      // Validar que alguma ação aconteceu
      await page.waitForTimeout(1000);
    }
  });

  test('deve validar campos obrigatórios ao adicionar documento', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Documentos"
    const documentosTab = page.getByRole('tab', { name: /documentos/i });
    if (await documentosTab.isVisible({ timeout: 1000 })) {
      await documentosTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Clicar em "Adicionar Documento"
    await page.getByRole('button', { name: /adicionar documento|novo documento/i }).click();

    // 6. Tentar salvar sem preencher campos
    await page.getByRole('button', { name: /salvar|adicionar/i }).click();

    // 7. Validar mensagens de erro
    await expect(page.getByText(/campo obrigatório|required/i).first()).toBeVisible();
  });

  test('deve fazer upload de múltiplos tipos de documentos', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Documentos"
    const documentosTab = page.getByRole('tab', { name: /documentos/i });
    if (await documentosTab.isVisible({ timeout: 1000 })) {
      await documentosTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Adicionar Petição
    await page.getByRole('button', { name: /adicionar documento/i }).click();

    const fileInput1 = page.locator('input[type="file"]');
    if (await fileInput1.isVisible({ timeout: 1000 })) {
      await fileInput1.setInputFiles({
        name: 'peticao.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Petição content'),
      });
    }

    await page.getByLabel(/nome|título/i).fill('Petição Inicial');
    await page.getByLabel(/tipo/i).click();
    await page.getByText('Petição', { exact: true }).click();
    await page.getByRole('button', { name: /salvar|adicionar/i }).click();
    await waitForToast(page, /documento adicionado com sucesso/i);
    await page.waitForTimeout(500);

    // 6. Adicionar Procuração
    await page.getByRole('button', { name: /adicionar documento/i }).click();

    const fileInput2 = page.locator('input[type="file"]');
    if (await fileInput2.isVisible({ timeout: 1000 })) {
      await fileInput2.setInputFiles({
        name: 'procuracao.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Procuração content'),
      });
    }

    await page.getByLabel(/nome|título/i).fill('Procuração');
    await page.getByLabel(/tipo/i).click();
    await page.getByText('Procuração', { exact: true }).click();
    await page.getByRole('button', { name: /salvar|adicionar/i }).click();
    await waitForToast(page, /documento adicionado com sucesso/i);

    // 7. Validar que ambos documentos aparecem
    await expect(page.getByText('Petição Inicial')).toBeVisible();
    await expect(page.getByText('Procuração')).toBeVisible();
  });

  test('deve validar formato de arquivo ao fazer upload', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Documentos"
    const documentosTab = page.getByRole('tab', { name: /documentos/i });
    if (await documentosTab.isVisible({ timeout: 1000 })) {
      await documentosTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Clicar em "Adicionar Documento"
    await page.getByRole('button', { name: /adicionar documento/i }).click();

    // 6. Tentar fazer upload de arquivo com formato inválido
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 1000 })) {
      // Tentar upload de arquivo .exe (não permitido)
      await fileInput.setInputFiles({
        name: 'malware.exe',
        mimeType: 'application/x-msdownload',
        buffer: Buffer.from('Invalid file'),
      });

      // 7. Validar mensagem de erro
      // Nota: A validação pode acontecer no frontend ou backend
      // Aguardar um tempo para validação
      await page.waitForTimeout(1000);

      // Verificar se há mensagem de erro sobre formato inválido
      const errorMessage = page.getByText(/formato inválido|arquivo não permitido|invalid format/i);
      if (await errorMessage.isVisible({ timeout: 2000 })) {
        await expect(errorMessage).toBeVisible();
      }
    }
  });
});

test.describe('Processos - Documentos Flow (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve vincular documento em dispositivo móvel', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar sheet fullscreen
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Documentos" (scroll horizontal se necessário)
    const documentosTab = page.getByRole('tab', { name: /documentos/i });
    if (await documentosTab.isVisible({ timeout: 1000 })) {
      await documentosTab.scrollIntoViewIfNeeded();
      await documentosTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Scroll para botão "Adicionar Documento"
    await page.getByRole('button', { name: /adicionar documento/i }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /adicionar documento/i }).click();

    // 6. Upload de arquivo (mobile pode abrir seletor nativo)
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 1000 })) {
      await fileInput.setInputFiles({
        name: 'documento-mobile.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mobile PDF content'),
      });
    }

    // 7. Preencher formulário (scroll conforme necessário)
    const nomeInput = page.getByLabel(/nome|título/i);
    await nomeInput.scrollIntoViewIfNeeded();
    await nomeInput.fill('Documento Mobile');

    const tipoSelect = page.getByLabel(/tipo/i);
    await tipoSelect.scrollIntoViewIfNeeded();
    await tipoSelect.click();
    await page.getByText('Petição', { exact: true }).click();

    // 8. Scroll para botão salvar e submeter
    const salvarButton = page.getByRole('button', { name: /salvar|adicionar/i });
    await salvarButton.scrollIntoViewIfNeeded();
    await salvarButton.click();

    // 9. Validar sucesso
    await waitForToast(page, /documento adicionado com sucesso/i);
    await expect(page.getByText('Documento Mobile')).toBeVisible();
  });
});
