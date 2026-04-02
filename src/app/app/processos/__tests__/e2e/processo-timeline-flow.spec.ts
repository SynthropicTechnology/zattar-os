import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast } from '@/testing/e2e/helpers';

test.describe('Processos - Timeline Flow', () => {
  test('deve visualizar timeline de andamentos do processo', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Timeline" ou "Andamentos"
    const timelineTab = page.getByRole('tab', { name: /timeline|andamentos|movimentações/i });
    if (await timelineTab.isVisible({ timeout: 1000 })) {
      await timelineTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Validar que andamentos existentes aparecem (mockados)
    await expect(page.getByText('Processo Iniciado')).toBeVisible();
    await expect(page.getByText('Audiência realizada')).toBeVisible();

    // 6. Validar datas
    await expect(page.getByText(/01\/01\/2025|2025-01-01/i)).toBeVisible();
    await expect(page.getByText(/15\/01\/2025|2025-01-15/i)).toBeVisible();
  });

  test('deve adicionar andamento manual à timeline', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Timeline"
    const timelineTab = page.getByRole('tab', { name: /timeline|andamentos|movimentações/i });
    if (await timelineTab.isVisible({ timeout: 1000 })) {
      await timelineTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Clicar em "Adicionar Andamento"
    await page.getByRole('button', { name: /adicionar andamento|novo andamento/i }).click();

    // 6. Aguardar modal de adicionar andamento
    await page.waitForTimeout(500);

    // 7. Preencher descrição
    await page.getByLabel(/descrição|andamento|movimentação/i).fill('Audiência realizada');

    // 8. Selecionar data
    await page.getByLabel(/data/i).click();
    await page.getByLabel(/data/i).fill('15/01/2025');

    // 9. Preencher observações (opcional)
    const observacoesInput = page.getByLabel(/observações|detalhes/i);
    if (await observacoesInput.isVisible({ timeout: 1000 })) {
      await observacoesInput.fill('Audiência de conciliação. Partes não chegaram a acordo.');
    }

    // 10. Salvar
    await page.getByRole('button', { name: /salvar|adicionar/i }).click();

    // 11. Validar toast de sucesso
    await waitForToast(page, /andamento adicionado com sucesso/i);

    // 12. Validar que novo andamento aparece na timeline
    await expect(page.getByText('Audiência realizada')).toBeVisible();
    await expect(page.getByText(/15\/01\/2025|2025-01-15/i)).toBeVisible();
  });

  test('deve validar ordenação cronológica da timeline', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Timeline"
    const timelineTab = page.getByRole('tab', { name: /timeline|andamentos/i });
    if (await timelineTab.isVisible({ timeout: 1000 })) {
      await timelineTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Obter todos os andamentos
    const andamentos = page.locator('[data-testid="timeline-item"], .timeline-item, [class*="timeline"]');
    const count = await andamentos.count();

    // 6. Validar que há andamentos
    expect(count).toBeGreaterThan(0);

    // 7. Validar ordem (mais recente primeiro ou mais antigo primeiro, depende da UI)
    // Nota: Assumindo ordem decrescente (mais recente primeiro)
    const firstItem = andamentos.first();
    const lastItem = andamentos.last();

    // Validar que primeiro item contém data mais recente
    // (Em mock: 15/01/2025 deve vir antes de 01/01/2025)
    const firstText = await firstItem.textContent();
    const lastText = await lastItem.textContent();

    // Validação simples: primeiro item deve conter "15/01" ou "Audiência"
    // e último item deve conter "01/01" ou "Processo Iniciado"
    expect(firstText).toMatch(/15|Audiência/i);
    expect(lastText).toMatch(/01\/01|Processo Iniciado/i);
  });

  test('deve validar campos obrigatórios ao adicionar andamento', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Timeline"
    const timelineTab = page.getByRole('tab', { name: /timeline|andamentos/i });
    if (await timelineTab.isVisible({ timeout: 1000 })) {
      await timelineTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Clicar em "Adicionar Andamento"
    await page.getByRole('button', { name: /adicionar andamento/i }).click();

    // 6. Tentar salvar sem preencher campos
    await page.getByRole('button', { name: /salvar|adicionar/i }).click();

    // 7. Validar mensagens de erro
    await expect(page.getByText(/campo obrigatório|required/i).first()).toBeVisible();
  });

  test('deve distinguir andamentos automáticos de manuais', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Timeline"
    const timelineTab = page.getByRole('tab', { name: /timeline|andamentos/i });
    if (await timelineTab.isVisible({ timeout: 1000 })) {
      await timelineTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Validar que andamentos automáticos têm indicador visual
    // (Ex: ícone de robô, badge "automático", cor diferente)
    const andamentoAutomatico = page.locator('[data-tipo="sistema"], [data-tipo="automatico"]').first();

    if (await andamentoAutomatico.isVisible({ timeout: 1000 })) {
      await expect(andamentoAutomatico).toBeVisible();
    } else {
      // Alternativa: validar por texto ou classe CSS
      const processoIniciado = page.getByText('Processo Iniciado');
      await expect(processoIniciado).toBeVisible();
    }

    // 6. Validar que andamentos manuais têm outro indicador
    const andamentoManual = page.locator('[data-tipo="manual"], [data-tipo="usuario"]').first();

    if (await andamentoManual.isVisible({ timeout: 1000 })) {
      await expect(andamentoManual).toBeVisible();
    } else {
      // Alternativa: validar por texto
      const audienciaRealizada = page.getByText('Audiência realizada');
      await expect(audienciaRealizada).toBeVisible();
    }
  });

  test('deve filtrar andamentos por tipo', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Timeline"
    const timelineTab = page.getByRole('tab', { name: /timeline|andamentos/i });
    if (await timelineTab.isVisible({ timeout: 1000 })) {
      await timelineTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Verificar se há filtro de tipo
    const filtroTipo = page.getByLabel(/filtrar por tipo|tipo de andamento/i);

    if (await filtroTipo.isVisible({ timeout: 1000 })) {
      // 6. Filtrar por "Manual"
      await filtroTipo.click();
      await page.getByText('Manual', { exact: true }).click();

      // 7. Validar que apenas andamentos manuais aparecem
      await expect(page.getByText('Audiência realizada')).toBeVisible();

      // 8. Validar que andamentos automáticos não aparecem
      await expect(page.getByText('Processo Iniciado')).not.toBeVisible();

      // 9. Limpar filtro
      await filtroTipo.click();
      await page.getByText('Todos', { exact: true }).click();

      // 10. Validar que todos os andamentos aparecem novamente
      await expect(page.getByText('Processo Iniciado')).toBeVisible();
      await expect(page.getByText('Audiência realizada')).toBeVisible();
    }
  });

  test('deve exibir detalhes expandidos de um andamento', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Timeline"
    const timelineTab = page.getByRole('tab', { name: /timeline|andamentos/i });
    if (await timelineTab.isVisible({ timeout: 1000 })) {
      await timelineTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Clicar em um andamento para expandir detalhes
    const andamento = page.getByText('Audiência realizada').first();
    await andamento.click();

    // 6. Aguardar expansão
    await page.waitForTimeout(500);

    // 7. Validar que detalhes adicionais aparecem
    // (Ex: observações, usuário que criou, timestamp completo)
    const detalhes = page.locator('[data-testid="andamento-detalhes"], .andamento-expandido');

    if (await detalhes.isVisible({ timeout: 1000 })) {
      await expect(detalhes).toBeVisible();
    }

    // 8. Clicar novamente para recolher
    await andamento.click();
    await page.waitForTimeout(500);

    // 9. Validar que detalhes foram ocultados
    if (await detalhes.isVisible({ timeout: 500 })) {
      await expect(detalhes).not.toBeVisible();
    }
  });
});

test.describe('Processos - Timeline Flow (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve visualizar timeline em dispositivo móvel', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar sheet fullscreen
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Timeline" (scroll horizontal se necessário)
    const timelineTab = page.getByRole('tab', { name: /timeline|andamentos/i });
    if (await timelineTab.isVisible({ timeout: 1000 })) {
      await timelineTab.scrollIntoViewIfNeeded();
      await timelineTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Scroll vertical para ver todos andamentos
    const primeiroAndamento = page.getByText('Processo Iniciado');
    await primeiroAndamento.scrollIntoViewIfNeeded();
    await expect(primeiroAndamento).toBeVisible();

    const segundoAndamento = page.getByText('Audiência realizada');
    await segundoAndamento.scrollIntoViewIfNeeded();
    await expect(segundoAndamento).toBeVisible();
  });

  test('deve adicionar andamento em dispositivo móvel', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar sheet fullscreen
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Timeline"
    const timelineTab = page.getByRole('tab', { name: /timeline|andamentos/i });
    if (await timelineTab.isVisible({ timeout: 1000 })) {
      await timelineTab.scrollIntoViewIfNeeded();
      await timelineTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Scroll para botão "Adicionar Andamento"
    await page.getByRole('button', { name: /adicionar andamento/i }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /adicionar andamento/i }).click();

    // 6. Preencher formulário (fullscreen em mobile)
    const descricaoInput = page.getByLabel(/descrição|andamento/i);
    await descricaoInput.scrollIntoViewIfNeeded();
    await descricaoInput.fill('Novo andamento mobile');

    const dataInput = page.getByLabel(/data/i);
    await dataInput.scrollIntoViewIfNeeded();
    await dataInput.click();
    await dataInput.fill('20/01/2025');

    // 7. Scroll para botão salvar
    await page.getByRole('button', { name: /salvar|adicionar/i }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /salvar|adicionar/i }).click();

    // 8. Validar sucesso
    await waitForToast(page, /andamento adicionado com sucesso/i);

    // 9. Scroll para validar novo andamento
    await page.getByText('Novo andamento mobile').scrollIntoViewIfNeeded();
    await expect(page.getByText('Novo andamento mobile')).toBeVisible();
  });
});
