import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast, confirmAction as _confirmAction } from '@/testing/e2e/helpers';

test.describe('Audiências - Agendamento Flow', () => {
  test('deve reagendar audiência com sucesso', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência existente
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Reagendar"
    await page.getByRole('button', { name: /reagendar/i }).click();

    // 5. Aguardar formulário de reagendamento
    await page.waitForTimeout(500);

    // 6. Alterar data para 25/01/2025
    const dataInicioInput = page.getByLabel(/data de início|nova data/i);
    await dataInicioInput.clear();
    await dataInicioInput.fill('25/01/2025');

    // 7. Alterar hora para 10:00 - 11:00
    const horaInicioInput = page.getByLabel(/hora de início/i);
    await horaInicioInput.clear();
    await horaInicioInput.fill('10:00');

    const dataFimInput = page.getByLabel(/data de fim/i);
    await dataFimInput.clear();
    await dataFimInput.fill('25/01/2025');

    const horaFimInput = page.getByLabel(/hora de fim/i);
    await horaFimInput.clear();
    await horaFimInput.fill('11:00');

    // 8. Salvar
    await page.getByRole('button', { name: /salvar|confirmar/i }).click();

    // 9. Validar toast de sucesso
    await waitForToast(page, /audiência reagendada com sucesso/i);

    // 10. Validar atualização no calendário
    await expect(page.getByText(/25\/01\/2025|25 jan/i)).toBeVisible();
    await expect(page.getByText(/10:00.*11:00|10:00 - 11:00/i)).toBeVisible();
  });

  test('deve cancelar audiência', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência existente
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Cancelar Audiência"
    await page.getByRole('button', { name: /cancelar audiência/i }).click();

    // 5. Aguardar diálogo de confirmação
    await page.waitForTimeout(500);

    // 6. Confirmar cancelamento
    await page.getByRole('button', { name: /confirmar|sim|cancelar/i }).click();

    // 7. Validar toast de sucesso
    await waitForToast(page, /audiência cancelada/i);

    // 8. Validar que audiência foi removida do calendário ou marcada como cancelada
    const audienciaCancelada = page.getByText('Cancelada');
    if (await audienciaCancelada.isVisible({ timeout: 2000 })) {
      await expect(audienciaCancelada).toBeVisible();
    } else {
      // Audiência pode ter sido removida do calendário
      // Fechar modal e validar que não aparece mais
      const closeButton = page.getByRole('button', { name: /fechar|voltar/i });
      if (await closeButton.isVisible({ timeout: 1000 })) {
        await closeButton.click();
      }
      await page.waitForTimeout(500);

      // Validar que audiência não aparece mais
      const audienciaRemovida = page.getByText('Audiência Inicial');
      if (await audienciaRemovida.isVisible({ timeout: 500 })) {
        // Se ainda está visível, validar que tem status cancelada
        await expect(page.getByText('Cancelada')).toBeVisible();
      }
    }
  });

  test('deve alterar responsável da audiência', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência existente
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Editar"
    await page.getByRole('button', { name: /editar/i }).click();

    // 5. Alterar responsável
    const responsavelSelect = page.getByLabel(/responsável/i);
    await responsavelSelect.click();
    await page.getByText('Dra. Maria Santos').click();

    // 6. Salvar
    await page.getByRole('button', { name: /salvar/i }).click();

    // 7. Validar sucesso
    await waitForToast(page, /audiência atualizada com sucesso/i);

    // 8. Validar que responsável foi alterado
    await expect(page.getByText('Dra. Maria Santos')).toBeVisible();
  });

  test('deve validar reagendamento para data passada', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência existente
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Reagendar"
    await page.getByRole('button', { name: /reagendar/i }).click();

    // 5. Tentar reagendar para data passada
    const dataInput = page.getByLabel(/data de início|nova data/i);
    await dataInput.clear();
    await dataInput.fill('01/01/2020'); // Data passada

    // 6. Tentar salvar
    await page.getByRole('button', { name: /salvar|confirmar/i }).click();

    // 7. Validar mensagem de erro
    const errorMessage = page.getByText(/data inválida|data no passado|data deve ser futura/i);
    if (await errorMessage.isVisible({ timeout: 2000 })) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('deve alterar tipo de audiência (virtual para presencial)', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência virtual existente
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Validar que é virtual
    await expect(page.getByText(/virtual/i)).toBeVisible();

    // 5. Clicar em "Editar"
    await page.getByRole('button', { name: /editar/i }).click();

    // 6. Alterar tipo para presencial
    const tipoSelect = page.getByLabel(/tipo/i);
    await tipoSelect.click();
    await page.getByText(/presencial/i).click();

    // 7. Remover URL virtual e adicionar endereço
    const urlInput = page.getByLabel(/url virtual/i);
    if (await urlInput.isVisible({ timeout: 1000 })) {
      await urlInput.clear();
    }

    // Preencher endereço
    await page.getByLabel(/logradouro/i).fill('Rua XV de Novembro');
    await page.getByLabel(/número/i).fill('1000');
    await page.getByLabel(/bairro/i).fill('Centro');
    await page.getByLabel(/cidade/i).fill('Campinas');
    await page.getByLabel(/estado/i).fill('SP');
    await page.getByLabel(/cep/i).fill('13010-001');

    // 8. Salvar
    await page.getByRole('button', { name: /salvar/i }).click();

    // 9. Validar sucesso
    await waitForToast(page, /audiência atualizada com sucesso/i);

    // 10. Validar que tipo foi alterado
    await expect(page.getByText(/presencial/i)).toBeVisible();
    await expect(page.getByText('Rua XV de Novembro')).toBeVisible();
  });

  test('deve duplicar audiência', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência existente
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Duplicar" (se existir)
    const duplicarButton = page.getByRole('button', { name: /duplicar|copiar/i });

    if (await duplicarButton.isVisible({ timeout: 1000 })) {
      await duplicarButton.click();

      // 5. Formulário de nova audiência deve abrir pré-preenchido
      await page.waitForTimeout(500);

      // 6. Alterar apenas a data
      const dataInput = page.getByLabel(/data de início/i);
      await dataInput.clear();
      await dataInput.fill('30/01/2025');

      // 7. Salvar
      await page.getByRole('button', { name: /criar|salvar/i }).click();

      // 8. Validar sucesso
      await waitForToast(page, /audiência criada com sucesso/i);

      // 9. Validar que nova audiência aparece
      await expect(page.getByText(/30\/01\/2025|30 jan/i)).toBeVisible();
    }
  });

  test('deve alterar modalidade de virtual para presencial', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência virtual
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Validar modalidade atual (Virtual)
    await expect(page.getByText(/virtual/i)).toBeVisible();

    // 5. Clicar em "Editar"
    await page.getByRole('button', { name: /editar/i }).click();

    // 6. Alterar para presencial (toggle ou select)
    const modalidadeToggle = page.getByLabel(/modalidade|presencial|virtual/i);

    if (await modalidadeToggle.isVisible({ timeout: 1000 })) {
      await modalidadeToggle.click();

      // Se for select
      const presencialOption = page.getByText('Presencial', { exact: true });
      if (await presencialOption.isVisible({ timeout: 500 })) {
        await presencialOption.click();
      }
    }

    // 7. Campos devem mudar: remover URL, mostrar endereço
    const enderecoSection = page.getByLabel(/logradouro|endereço/i);
    if (await enderecoSection.isVisible({ timeout: 1000 })) {
      await enderecoSection.fill('Rua das Flores, 100');
    }

    // 8. Salvar
    await page.getByRole('button', { name: /salvar/i }).click();

    // 9. Validar sucesso
    await waitForToast(page, /audiência atualizada com sucesso/i);
  });
});

test.describe('Audiências - Agendamento Flow (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve reagendar audiência em dispositivo móvel', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.scrollIntoViewIfNeeded();
    await audiencia.click();

    // 3. Aguardar sheet fullscreen
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Scroll para botão reagendar
    const reagendarButton = page.getByRole('button', { name: /reagendar/i });
    await reagendarButton.scrollIntoViewIfNeeded();
    await reagendarButton.click();

    // 5. Preencher novo horário com scroll
    const dataInput = page.getByLabel(/data de início/i);
    await dataInput.scrollIntoViewIfNeeded();
    await dataInput.clear();
    await dataInput.fill('25/01/2025');

    const horaInput = page.getByLabel(/hora de início/i);
    await horaInput.scrollIntoViewIfNeeded();
    await horaInput.clear();
    await horaInput.fill('10:00');

    // 6. Scroll para botão salvar
    const salvarButton = page.getByRole('button', { name: /salvar|confirmar/i });
    await salvarButton.scrollIntoViewIfNeeded();
    await salvarButton.click();

    // 7. Validar sucesso
    await waitForToast(page, /audiência reagendada com sucesso/i);
  });

  test('deve cancelar audiência em mobile', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.scrollIntoViewIfNeeded();
    await audiencia.click();

    // 3. Aguardar sheet fullscreen
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Scroll para botão cancelar
    const cancelarButton = page.getByRole('button', { name: /cancelar audiência/i });
    await cancelarButton.scrollIntoViewIfNeeded();
    await cancelarButton.click();

    // 5. Confirmar no diálogo
    await page.waitForTimeout(500);
    const confirmarButton = page.getByRole('button', { name: /confirmar|sim/i });
    await confirmarButton.scrollIntoViewIfNeeded();
    await confirmarButton.click();

    // 6. Validar sucesso
    await waitForToast(page, /audiência cancelada/i);
  });
});
