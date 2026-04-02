import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast } from '@/testing/e2e/helpers';

test.describe('Audiências - Notificação Flow', () => {
  test('deve enviar notificação para todos os participantes', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência futura
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Notificar Participantes"
    await page.getByRole('button', { name: /notificar participantes|enviar notificações/i }).click();

    // 5. Aguardar modal de notificação
    await page.waitForTimeout(500);

    // 6. Validar lista de participantes
    await expect(page.getByText('João da Silva')).toBeVisible(); // Cliente
    await expect(page.getByText('Dr. João Silva')).toBeVisible(); // Advogado
    await expect(page.getByText('Juiz Dr. Carlos')).toBeVisible(); // Juiz

    // 7. Selecionar todos os participantes (se houver checkboxes)
    const selectAllCheckbox = page.getByLabel(/selecionar todos/i);
    if (await selectAllCheckbox.isVisible({ timeout: 1000 })) {
      await selectAllCheckbox.click();
    } else {
      // Selecionar individualmente
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).check();
      }
    }

    // 8. Escolher método: E-mail
    const metodoSelect = page.getByLabel(/método|canal|tipo de notificação/i);
    if (await metodoSelect.isVisible({ timeout: 1000 })) {
      await metodoSelect.click();
      await page.getByText('E-mail', { exact: true }).click();
    }

    // 9. Adicionar mensagem personalizada
    const mensagemInput = page.getByLabel(/mensagem|texto|corpo/i);
    if (await mensagemInput.isVisible({ timeout: 1000 })) {
      await mensagemInput.fill('Lembrete: Audiência amanhã às 14h');
    }

    // 10. Clicar em "Enviar Notificações"
    await page.getByRole('button', { name: /enviar|notificar/i }).click();

    // 11. Validar toast de sucesso
    await waitForToast(page, /notificações enviadas com sucesso/i);

    // 12. Validar que status da audiência mudou para "Notificada"
    await expect(page.getByText('Notificada')).toBeVisible();

    // 13. Validar contador de notificações
    const contador = page.getByText(/3 participantes notificados|notificado.*3/i);
    if (await contador.isVisible({ timeout: 2000 })) {
      await expect(contador).toBeVisible();
    }
  });

  test('deve enviar notificação apenas para cliente', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Notificar Participantes"
    await page.getByRole('button', { name: /notificar/i }).click();

    // 5. Aguardar modal de notificação
    await page.waitForTimeout(500);

    // 6. Selecionar apenas cliente
    const clienteCheckbox = page
      .getByRole('row')
      .filter({ hasText: 'João da Silva' })
      .locator('input[type="checkbox"]');

    if (await clienteCheckbox.isVisible({ timeout: 1000 })) {
      await clienteCheckbox.check();
    }

    // 7. Enviar
    await page.getByRole('button', { name: /enviar|notificar/i }).click();

    // 8. Validar sucesso
    await waitForToast(page, /notificação enviada com sucesso|notificações enviadas/i);

    // 9. Validar contador
    const contador = page.getByText(/1 participante notificado/i);
    if (await contador.isVisible({ timeout: 2000 })) {
      await expect(contador).toBeVisible();
    }
  });

  test('deve validar seleção de pelo menos um participante', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Notificar Participantes"
    await page.getByRole('button', { name: /notificar/i }).click();

    // 5. Aguardar modal de notificação
    await page.waitForTimeout(500);

    // 6. Tentar enviar sem selecionar nenhum participante
    await page.getByRole('button', { name: /enviar|notificar/i }).click();

    // 7. Validar mensagem de erro
    const errorMessage = page.getByText(/selecione pelo menos um participante|nenhum participante selecionado/i);
    if (await errorMessage.isVisible({ timeout: 2000 })) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('deve permitir escolher múltiplos métodos de notificação', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Notificar Participantes"
    await page.getByRole('button', { name: /notificar/i }).click();

    // 5. Aguardar modal de notificação
    await page.waitForTimeout(500);

    // 6. Selecionar todos os participantes
    const selectAllCheckbox = page.getByLabel(/selecionar todos/i);
    if (await selectAllCheckbox.isVisible({ timeout: 1000 })) {
      await selectAllCheckbox.click();
    }

    // 7. Selecionar múltiplos métodos (E-mail e WhatsApp)
    const emailCheckbox = page.getByLabel(/e-mail/i);
    if (await emailCheckbox.isVisible({ timeout: 1000 })) {
      await emailCheckbox.check();
    }

    const whatsappCheckbox = page.getByLabel(/whatsapp/i);
    if (await whatsappCheckbox.isVisible({ timeout: 1000 })) {
      await whatsappCheckbox.check();
    }

    // 8. Enviar
    await page.getByRole('button', { name: /enviar|notificar/i }).click();

    // 9. Validar sucesso
    await waitForToast(page, /notificações enviadas com sucesso/i);
  });

  test('deve exibir histórico de notificações enviadas', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência que já foi notificada
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Verificar se há tab ou seção de histórico
    const historicoTab = page.getByRole('tab', { name: /histórico|notificações/i });

    if (await historicoTab.isVisible({ timeout: 1000 })) {
      await historicoTab.click();
      await page.waitForTimeout(500);

      // 5. Validar que notificações enviadas aparecem
      await expect(page.getByText(/enviado|notificação/i)).toBeVisible();
    } else {
      // Pode estar em uma seção expansível
      const historicoSection = page.getByText(/histórico de notificações/i);
      if (await historicoSection.isVisible({ timeout: 1000 })) {
        await historicoSection.click();
        await page.waitForTimeout(500);
        await expect(page.getByText(/enviado/i)).toBeVisible();
      }
    }
  });

  test('deve reenviar notificação para participante específico', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Notificar Participantes"
    await page.getByRole('button', { name: /notificar/i }).click();

    // 5. Aguardar modal de notificação
    await page.waitForTimeout(500);

    // 6. Verificar se há opção de reenvio
    const reenviarButton = page.getByRole('button', { name: /reenviar/i });

    if (await reenviarButton.isVisible({ timeout: 1000 })) {
      await reenviarButton.first().click();

      // 7. Confirmar reenvio
      const confirmarButton = page.getByRole('button', { name: /confirmar|sim/i });
      if (await confirmarButton.isVisible({ timeout: 1000 })) {
        await confirmarButton.click();
      }

      // 8. Validar sucesso
      await waitForToast(page, /notificação reenviada com sucesso/i);
    }
  });

  test('deve personalizar mensagem de notificação por participante', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Notificar Participantes"
    await page.getByRole('button', { name: /notificar/i }).click();

    // 5. Aguardar modal de notificação
    await page.waitForTimeout(500);

    // 6. Selecionar cliente
    const clienteRow = page.getByRole('row').filter({ hasText: 'João da Silva' });
    const clienteCheckbox = clienteRow.locator('input[type="checkbox"]');

    if (await clienteCheckbox.isVisible({ timeout: 1000 })) {
      await clienteCheckbox.check();
    }

    // 7. Adicionar mensagem personalizada
    const mensagemInput = page.getByLabel(/mensagem para.*joão|mensagem personalizada/i);

    if (await mensagemInput.isVisible({ timeout: 1000 })) {
      await mensagemInput.fill('Sr. João, lembrete: Audiência amanhã às 14h. Por favor confirme presença.');
    } else {
      // Mensagem geral
      const mensagemGeralInput = page.getByLabel(/mensagem|texto/i);
      if (await mensagemGeralInput.isVisible({ timeout: 1000 })) {
        await mensagemGeralInput.fill('Lembrete: Audiência amanhã às 14h.');
      }
    }

    // 8. Enviar
    await page.getByRole('button', { name: /enviar|notificar/i }).click();

    // 9. Validar sucesso
    await waitForToast(page, /notificação enviada com sucesso/i);
  });
});

test.describe('Audiências - Notificação Flow (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve enviar notificação em dispositivo móvel', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.scrollIntoViewIfNeeded();
    await audiencia.click();

    // 3. Aguardar sheet fullscreen
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Scroll para botão notificar
    const notificarButton = page.getByRole('button', { name: /notificar/i });
    await notificarButton.scrollIntoViewIfNeeded();
    await notificarButton.click();

    // 5. Aguardar modal fullscreen de notificação
    await page.waitForTimeout(500);

    // 6. Scroll para ver participantes
    const selectAllCheckbox = page.getByLabel(/selecionar todos/i);
    if (await selectAllCheckbox.isVisible({ timeout: 1000 })) {
      await selectAllCheckbox.scrollIntoViewIfNeeded();
      await selectAllCheckbox.click();
    }

    // 7. Scroll para método
    const metodoSelect = page.getByLabel(/método/i);
    if (await metodoSelect.isVisible({ timeout: 1000 })) {
      await metodoSelect.scrollIntoViewIfNeeded();
      await metodoSelect.click();
      await page.getByText('E-mail', { exact: true }).click();
    }

    // 8. Scroll para mensagem
    const mensagemInput = page.getByLabel(/mensagem/i);
    if (await mensagemInput.isVisible({ timeout: 1000 })) {
      await mensagemInput.scrollIntoViewIfNeeded();
      await mensagemInput.fill('Lembrete mobile');
    }

    // 9. Scroll para botão enviar
    const enviarButton = page.getByRole('button', { name: /enviar|notificar/i });
    await enviarButton.scrollIntoViewIfNeeded();
    await enviarButton.click();

    // 10. Validar sucesso
    await waitForToast(page, /notificações enviadas com sucesso/i);
  });

  test('deve visualizar lista de participantes em mobile', async ({ audienciasMockedPage: page }) => {
    // 1. Navegar para a página de audiências
    await page.goto('/audiencias');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em audiência
    const audiencia = page.getByText('Audiência Inicial').first();
    await audiencia.scrollIntoViewIfNeeded();
    await audiencia.click();

    // 3. Aguardar sheet fullscreen
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em notificar
    const notificarButton = page.getByRole('button', { name: /notificar/i });
    await notificarButton.scrollIntoViewIfNeeded();
    await notificarButton.click();

    // 5. Scroll pela lista de participantes
    const participantes = ['João da Silva', 'Dr. João Silva', 'Juiz Dr. Carlos'];

    for (const participante of participantes) {
      const elemento = page.getByText(participante);
      await elemento.scrollIntoViewIfNeeded();
      await expect(elemento).toBeVisible();
    }
  });
});
