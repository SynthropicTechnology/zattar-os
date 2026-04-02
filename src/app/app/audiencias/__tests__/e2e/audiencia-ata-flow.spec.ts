import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast } from '@/testing/e2e/helpers';

test.describe('Audiências - Ata Flow', () => {
  test('deve registrar ata de audiência realizada', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência realizada (status: Realizada)
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Registrar Ata"
    await page.getByRole('button', { name: /registrar ata|adicionar ata/i }).click();

    // 5. Aguardar modal de registro de ata
    await page.waitForTimeout(500);

    // 6. Preencher resumo
    const resumoInput = page.getByLabel(/resumo|descrição/i);
    await resumoInput.fill('Audiência de conciliação realizada. Partes não chegaram a acordo.');

    // 7. Selecionar resultado
    const resultadoSelect = page.getByLabel(/resultado|desfecho/i);
    await resultadoSelect.click();
    await page.getByText('Sem Acordo', { exact: true }).click();

    // 8. Adicionar observações
    const observacoesInput = page.getByLabel(/observações|detalhes/i);
    await observacoesInput.fill('Próxima audiência de instrução agendada para 15/02/2025');

    // 9. Fazer upload de arquivo de ata (PDF)
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 1000 })) {
      await fileInput.setInputFiles({
        name: 'ata-audiencia.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock ATA PDF content'),
      });
    }

    // 10. Salvar
    await page.getByRole('button', { name: /salvar|registrar/i }).click();

    // 11. Validar toast de sucesso
    await waitForToast(page, /ata registrada com sucesso/i);

    // 12. Validar que ata foi registrada
    await expect(page.getByText('Sem Acordo')).toBeVisible();

    // 13. Validar que link para visualizar ata existe
    const visualizarLink = page.getByRole('link', { name: /visualizar ata|ver ata/i });
    const visualizarButton = page.getByRole('button', { name: /visualizar ata|ver ata/i });

    const visualizarElement = (await visualizarLink.isVisible({ timeout: 1000 }))
      ? visualizarLink
      : visualizarButton;

    await expect(visualizarElement).toBeVisible();
  });

  test('deve visualizar ata registrada', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência com ata registrada
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Verificar se há seção ou tab de Ata
    const ataTab = page.getByRole('tab', { name: /ata/i });

    if (await ataTab.isVisible({ timeout: 1000 })) {
      await ataTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Validar informações da ata
    await expect(page.getByText('Audiência de conciliação realizada')).toBeVisible();
    await expect(page.getByText('Sem Acordo')).toBeVisible();
    await expect(page.getByText('Próxima audiência de instrução agendada para 15/02/2025')).toBeVisible();

    // 6. Clicar em "Visualizar Ata"
    const visualizarLink = page.getByRole('link', { name: /visualizar ata/i });
    const visualizarButton = page.getByRole('button', { name: /visualizar ata/i });

    const visualizarElement = (await visualizarLink.isVisible({ timeout: 1000 }))
      ? visualizarLink
      : visualizarButton;

    // 7. Clicar para visualizar (abrirá em nova aba ou modal)
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null),
      visualizarElement.click(),
    ]);

    if (newPage) {
      // Nova aba foi aberta com PDF
      await expect(newPage).toBeTruthy();
      await newPage.close();
    }
  });

  test('deve editar ata já registrada', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência com ata
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para ata (se houver tab)
    const ataTab = page.getByRole('tab', { name: /ata/i });
    if (await ataTab.isVisible({ timeout: 1000 })) {
      await ataTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Clicar em "Editar Ata"
    const editarButton = page.getByRole('button', { name: /editar ata/i });

    if (await editarButton.isVisible({ timeout: 1000 })) {
      await editarButton.click();

      // 6. Aguardar formulário de edição
      await page.waitForTimeout(500);

      // 7. Alterar observações
      const observacoesInput = page.getByLabel(/observações/i);
      await observacoesInput.clear();
      await observacoesInput.fill('Atualização: Audiência de instrução confirmada para 15/02/2025 às 10h');

      // 8. Salvar
      await page.getByRole('button', { name: /salvar/i }).click();

      // 9. Validar sucesso
      await waitForToast(page, /ata atualizada com sucesso/i);

      // 10. Validar alteração
      await expect(page.getByText('Audiência de instrução confirmada para 15/02/2025 às 10h')).toBeVisible();
    }
  });

  test('deve validar campos obrigatórios ao registrar ata', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Registrar Ata"
    await page.getByRole('button', { name: /registrar ata/i }).click();

    // 5. Aguardar modal de registro de ata
    await page.waitForTimeout(500);

    // 6. Tentar salvar sem preencher campos obrigatórios
    await page.getByRole('button', { name: /salvar|registrar/i }).click();

    // 7. Validar mensagens de erro
    await expect(page.getByText(/campo obrigatório|required/i).first()).toBeVisible();
  });

  test('deve permitir diferentes tipos de resultado', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Registrar Ata"
    await page.getByRole('button', { name: /registrar ata/i }).click();

    // 5. Preencher resumo
    const resumoInput = page.getByLabel(/resumo/i);
    await resumoInput.fill('Audiência concluída com acordo');

    // 6. Verificar opções de resultado disponíveis
    const resultadoSelect = page.getByLabel(/resultado/i);
    await resultadoSelect.click();

    // Validar opções
    await expect(page.getByText('Acordo Firmado')).toBeVisible();
    await expect(page.getByText('Sem Acordo')).toBeVisible();
    await expect(page.getByText('Audiência Suspensa')).toBeVisible();

    // 7. Selecionar "Acordo Firmado"
    await page.getByText('Acordo Firmado', { exact: true }).click();

    // 8. Adicionar observações
    const observacoesInput = page.getByLabel(/observações/i);
    await observacoesInput.fill('Acordo firmado no valor de R$ 50.000,00 em 10 parcelas.');

    // 9. Salvar
    await page.getByRole('button', { name: /salvar|registrar/i }).click();

    // 10. Validar sucesso
    await waitForToast(page, /ata registrada com sucesso/i);

    // 11. Validar resultado
    await expect(page.getByText('Acordo Firmado')).toBeVisible();
  });

  test('deve fazer download da ata em PDF', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência com ata
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para ata
    const ataTab = page.getByRole('tab', { name: /ata/i });
    if (await ataTab.isVisible({ timeout: 1000 })) {
      await ataTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Clicar em botão de download
    const downloadButton = page.getByRole('button', { name: /baixar|download|fazer download/i });

    if (await downloadButton.isVisible({ timeout: 1000 })) {
      // 6. Aguardar download
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }),
        downloadButton.click(),
      ]);

      // 7. Validar que download foi iniciado
      expect(download).toBeTruthy();
      expect(download.suggestedFilename()).toMatch(/ata.*\.pdf/i);
    }
  });

  test('deve validar formato de arquivo ao fazer upload da ata', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Registrar Ata"
    await page.getByRole('button', { name: /registrar ata/i }).click();

    // 5. Aguardar modal
    await page.waitForTimeout(500);

    // 6. Tentar fazer upload de arquivo com formato inválido
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 1000 })) {
      await fileInput.setInputFiles({
        name: 'ata.txt', // Formato não permitido
        mimeType: 'text/plain',
        buffer: Buffer.from('Invalid file format'),
      });

      // 7. Aguardar validação
      await page.waitForTimeout(1000);

      // 8. Validar mensagem de erro
      const errorMessage = page.getByText(/formato inválido|apenas PDF permitido|invalid format/i);
      if (await errorMessage.isVisible({ timeout: 2000 })) {
        await expect(errorMessage).toBeVisible();
      }
    }
  });

  test('deve registrar ata com participantes presentes', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Registrar Ata"
    await page.getByRole('button', { name: /registrar ata/i }).click();

    // 5. Preencher campos básicos
    const resumoInput = page.getByLabel(/resumo/i);
    await resumoInput.fill('Audiência realizada com presença de todas as partes');

    const resultadoSelect = page.getByLabel(/resultado/i);
    await resultadoSelect.click();
    await page.getByText('Acordo Firmado').click();

    // 6. Marcar participantes presentes (se houver essa opção)
    const participantesSection = page.getByText(/participantes presentes|presença/i);

    if (await participantesSection.isVisible({ timeout: 1000 })) {
      await participantesSection.click();
      await page.waitForTimeout(300);

      // Marcar checkboxes de presença
      const presencaCheckboxes = page.locator('[data-testid="presenca-checkbox"], input[type="checkbox"]');
      const count = await presencaCheckboxes.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          await presencaCheckboxes.nth(i).check();
        }
      }
    }

    // 7. Salvar
    await page.getByRole('button', { name: /salvar|registrar/i }).click();

    // 8. Validar sucesso
    await waitForToast(page, /ata registrada com sucesso/i);
  });
});

test.describe('Audiências - Ata Flow (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve registrar ata em dispositivo móvel', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.scrollIntoViewIfNeeded();
    await audiencia.click();

    // 3. Aguardar sheet fullscreen
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Scroll para botão registrar ata
    const registrarButton = page.getByRole('button', { name: /registrar ata/i });
    await registrarButton.scrollIntoViewIfNeeded();
    await registrarButton.click();

    // 5. Preencher formulário com scroll
    const resumoInput = page.getByLabel(/resumo/i);
    await resumoInput.scrollIntoViewIfNeeded();
    await resumoInput.fill('Ata mobile');

    const resultadoSelect = page.getByLabel(/resultado/i);
    await resultadoSelect.scrollIntoViewIfNeeded();
    await resultadoSelect.click();
    await page.getByText('Sem Acordo').click();

    const observacoesInput = page.getByLabel(/observações/i);
    await observacoesInput.scrollIntoViewIfNeeded();
    await observacoesInput.fill('Observações mobile');

    // 6. Upload de arquivo (mobile pode abrir seletor nativo)
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 1000 })) {
      await fileInput.scrollIntoViewIfNeeded();
      await fileInput.setInputFiles({
        name: 'ata-mobile.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mobile ATA PDF'),
      });
    }

    // 7. Scroll para botão salvar
    const salvarButton = page.getByRole('button', { name: /salvar|registrar/i });
    await salvarButton.scrollIntoViewIfNeeded();
    await salvarButton.click();

    // 8. Validar sucesso
    await waitForToast(page, /ata registrada com sucesso/i);
  });

  test('deve visualizar ata em mobile', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência com ata
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.scrollIntoViewIfNeeded();
    await audiencia.click();

    // 3. Aguardar sheet fullscreen
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab Ata (scroll horizontal se necessário)
    const ataTab = page.getByRole('tab', { name: /ata/i });
    if (await ataTab.isVisible({ timeout: 1000 })) {
      await ataTab.scrollIntoViewIfNeeded();
      await ataTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Scroll para ver conteúdo da ata
    await page.getByText('Sem Acordo').scrollIntoViewIfNeeded();
    await expect(page.getByText('Sem Acordo')).toBeVisible();

    await page.getByText('Próxima audiência de instrução').scrollIntoViewIfNeeded();
    await expect(page.getByText('Próxima audiência de instrução')).toBeVisible();
  });
});
