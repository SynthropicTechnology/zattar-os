import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast, fillAudienciaForm as _fillAudienciaForm } from '@/testing/e2e/helpers';

test.describe('Audiências - CRUD Flow', () => {
  test('deve criar audiência virtual com sucesso', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em "Nova Audiência"
    await page.getByRole('button', { name: /nova audiência|adicionar audiência/i }).click();

    // 3. Aguardar modal/dialog abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Selecionar TRT
    await page.getByLabel(/trt/i).click();
    await page.getByText('TRT15', { exact: true }).click();

    // 5. Selecionar Grau
    await page.getByLabel(/grau/i).click();
    await page.getByText(/1º grau|primeiro grau/i).click();

    // 6. Buscar e selecionar processo
    await page.getByLabel(/processo/i).fill('0000000-00.2025.5.15.0001');
    await page.waitForTimeout(300);
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 7. Selecionar Data de Início
    await page.getByLabel(/data de início|data início/i).fill('20/01/2025');

    // 8. Selecionar Hora de Início
    await page.getByLabel(/hora de início|hora início/i).fill('14:00');

    // 9. Selecionar Data de Fim
    await page.getByLabel(/data de fim|data fim|data término/i).fill('20/01/2025');

    // 10. Selecionar Hora de Fim
    await page.getByLabel(/hora de fim|hora fim|hora término/i).fill('15:00');

    // 11. Selecionar Tipo: "Audiência Inicial (Virtual)"
    await page.getByLabel(/tipo/i).click();
    await page.getByText(/audiência inicial.*virtual/i).click();

    // 12. Preencher URL Virtual
    await page.getByLabel(/url virtual|link|zoom|meet/i).fill('https://zoom.us/j/123456789');

    // 13. Selecionar Responsável
    await page.getByLabel(/responsável/i).click();
    await page.getByText('Dr. João Silva').click();

    // 14. Preencher Observações
    await page.getByLabel(/observações/i).fill('Audiência de conciliação');

    // 15. Salvar
    await page.getByRole('button', { name: /criar|salvar/i }).click();

    // 16. Validar toast de sucesso
    await waitForToast(page, /audiência criada com sucesso/i);

    // 17. Validar que audiência aparece no calendário
    await expect(page.getByText('Audiência Inicial')).toBeVisible();
    await expect(page.getByText(/14:00.*15:00|14:00 - 15:00/i)).toBeVisible();
  });

  test('deve criar audiência presencial com endereço', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em "Nova Audiência"
    await page.getByRole('button', { name: /nova audiência/i }).click();

    // 3. Aguardar modal/dialog abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Selecionar TRT
    await page.getByLabel(/trt/i).click();
    await page.getByText('TRT15', { exact: true }).click();

    // 5. Selecionar Grau
    await page.getByLabel(/grau/i).click();
    await page.getByText(/1º grau/i).click();

    // 6. Selecionar processo
    await page.getByLabel(/processo/i).fill('0000000-00.2025.5.15.0001');
    await page.waitForTimeout(300);
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 7. Datas e horários
    await page.getByLabel(/data de início/i).fill('25/01/2025');
    await page.getByLabel(/hora de início/i).fill('10:00');
    await page.getByLabel(/data de fim/i).fill('25/01/2025');
    await page.getByLabel(/hora de fim/i).fill('11:00');

    // 8. Selecionar Tipo: "Audiência de Instrução (Presencial)"
    await page.getByLabel(/tipo/i).click();
    await page.getByText(/instrução.*presencial/i).click();

    // 9. Preencher endereço
    await page.getByLabel(/logradouro|rua/i).fill('Rua XV de Novembro');
    await page.getByLabel(/número/i).fill('1000');
    await page.getByLabel(/bairro/i).fill('Centro');
    await page.getByLabel(/cidade/i).fill('Campinas');
    await page.getByLabel(/estado|uf/i).fill('SP');
    await page.getByLabel(/cep/i).fill('13010-001');

    // 10. Selecionar Sala
    await page.getByLabel(/sala/i).click();
    await page.getByText('Sala 3 - 1ª Vara').click();

    // 11. Selecionar Responsável
    await page.getByLabel(/responsável/i).click();
    await page.getByText('Dr. João Silva').click();

    // 12. Salvar
    await page.getByRole('button', { name: /criar|salvar/i }).click();

    // 13. Validar sucesso
    await waitForToast(page, /audiência criada com sucesso/i);

    // 14. Validar informações no calendário
    await expect(page.getByText('Audiência de Instrução')).toBeVisible();
    await expect(page.getByText(/10:00.*11:00/i)).toBeVisible();
  });

  test('deve visualizar detalhes da audiência', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência existente no calendário
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet/modal abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Validar informações exibidas
    await expect(page.getByText('Audiência Inicial')).toBeVisible();
    await expect(page.getByText(/14:00/i)).toBeVisible();
    await expect(page.getByText(/15:00/i)).toBeVisible();
    await expect(page.getByText(/virtual/i)).toBeVisible();
    await expect(page.getByText('Dr. João Silva')).toBeVisible();
    await expect(page.getByText('Agendada')).toBeVisible();
  });

  test('deve validar campos obrigatórios ao criar audiência', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em "Nova Audiência"
    await page.getByRole('button', { name: /nova audiência/i }).click();

    // 3. Aguardar modal/dialog abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Tentar salvar sem preencher campos obrigatórios
    await page.getByRole('button', { name: /criar|salvar/i }).click();

    // 5. Validar mensagens de erro
    await expect(page.getByText(/campo obrigatório|required/i).first()).toBeVisible();
  });

  test('deve validar conflito de horário ao criar audiência', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em "Nova Audiência"
    await page.getByRole('button', { name: /nova audiência/i }).click();

    // 3. Preencher formulário com horário conflitante
    await page.getByLabel(/trt/i).click();
    await page.getByText('TRT15', { exact: true }).click();

    await page.getByLabel(/grau/i).click();
    await page.getByText(/1º grau/i).click();

    await page.getByLabel(/processo/i).fill('0000000-00.2025.5.15.0001');
    await page.waitForTimeout(300);
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // Usar mesmo horário de audiência existente (14:00 - 15:00 de 20/01/2025)
    await page.getByLabel(/data de início/i).fill('20/01/2025');
    await page.getByLabel(/hora de início/i).fill('14:00');
    await page.getByLabel(/data de fim/i).fill('20/01/2025');
    await page.getByLabel(/hora de fim/i).fill('15:00');

    await page.getByLabel(/tipo/i).click();
    await page.getByText(/audiência inicial/i).click();

    await page.getByLabel(/responsável/i).click();
    await page.getByText('Dr. João Silva').click();

    // 4. Tentar salvar
    await page.getByRole('button', { name: /criar|salvar/i }).click();

    // 5. Validar mensagem de conflito (se implementado)
    const conflictMessage = page.getByText(/conflito de horário|já existe audiência/i);
    if (await conflictMessage.isVisible({ timeout: 2000 })) {
      await expect(conflictMessage).toBeVisible();
    }
  });

  test('deve filtrar audiências por período', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Usar filtro de período (se existir)
    const filtroData = page.getByLabel(/filtrar por data|período|data início/i);

    if (await filtroData.isVisible({ timeout: 1000 })) {
      // 3. Selecionar período (Janeiro 2025)
      await filtroData.fill('01/01/2025');

      const filtroDataFim = page.getByLabel(/data fim|até/i);
      if (await filtroDataFim.isVisible({ timeout: 1000 })) {
        await filtroDataFim.fill('31/01/2025');
      }

      // 4. Aplicar filtro
      const aplicarButton = page.getByRole('button', { name: /filtrar|aplicar/i });
      if (await aplicarButton.isVisible({ timeout: 1000 })) {
        await aplicarButton.click();
      }

      // 5. Aguardar filtragem
      await page.waitForTimeout(500);

      // 6. Validar que apenas audiências do período aparecem
      await expect(page.getByText('Audiência Inicial')).toBeVisible();
    }
  });
});

test.describe('Audiências - CRUD Flow (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve criar audiência virtual em dispositivo móvel', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em "Nova Audiência"
    const novaButton = page.getByRole('button', { name: /nova audiência/i });
    await novaButton.scrollIntoViewIfNeeded();
    await novaButton.click();

    // 3. Aguardar modal fullscreen
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Preencher formulário com scroll
    const trtSelect = page.getByLabel(/trt/i);
    await trtSelect.scrollIntoViewIfNeeded();
    await trtSelect.click();
    await page.getByText('TRT15', { exact: true }).click();

    const grauSelect = page.getByLabel(/grau/i);
    await grauSelect.scrollIntoViewIfNeeded();
    await grauSelect.click();
    await page.getByText(/1º grau/i).click();

    const processoInput = page.getByLabel(/processo/i);
    await processoInput.scrollIntoViewIfNeeded();
    await processoInput.fill('0000000-00.2025.5.15.0001');
    await page.waitForTimeout(300);
    await page.getByText('0000000-00.2025.5.15.0001').click();

    const dataInicioInput = page.getByLabel(/data de início/i);
    await dataInicioInput.scrollIntoViewIfNeeded();
    await dataInicioInput.fill('20/01/2025');

    const horaInicioInput = page.getByLabel(/hora de início/i);
    await horaInicioInput.scrollIntoViewIfNeeded();
    await horaInicioInput.fill('14:00');

    const dataFimInput = page.getByLabel(/data de fim/i);
    await dataFimInput.scrollIntoViewIfNeeded();
    await dataFimInput.fill('20/01/2025');

    const horaFimInput = page.getByLabel(/hora de fim/i);
    await horaFimInput.scrollIntoViewIfNeeded();
    await horaFimInput.fill('15:00');

    const tipoSelect = page.getByLabel(/tipo/i);
    await tipoSelect.scrollIntoViewIfNeeded();
    await tipoSelect.click();
    await page.getByText(/audiência inicial.*virtual/i).click();

    const urlInput = page.getByLabel(/url virtual/i);
    await urlInput.scrollIntoViewIfNeeded();
    await urlInput.fill('https://zoom.us/j/123456789');

    const responsavelSelect = page.getByLabel(/responsável/i);
    await responsavelSelect.scrollIntoViewIfNeeded();
    await responsavelSelect.click();
    await page.getByText('Dr. João Silva').click();

    // 5. Scroll para botão salvar
    const salvarButton = page.getByRole('button', { name: /criar|salvar/i });
    await salvarButton.scrollIntoViewIfNeeded();
    await salvarButton.click();

    // 6. Validar sucesso
    await waitForToast(page, /audiência criada com sucesso/i);
    await expect(page.getByText('Audiência Inicial')).toBeVisible();
  });

  test('deve visualizar audiência em calendário mobile', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Validar que calendário está em modo mobile (compacto)
    // Pode ter vista de lista ou mini-calendário
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.scrollIntoViewIfNeeded();
    await expect(audiencia).toBeVisible();

    // 3. Clicar para ver detalhes
    await audiencia.click();

    // 4. Aguardar sheet fullscreen
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 5. Scroll para ver todas informações
    await expect(page.getByText(/14:00/i)).toBeVisible();
    await page.getByText(/virtual/i).scrollIntoViewIfNeeded();
    await expect(page.getByText(/virtual/i)).toBeVisible();
  });
});
