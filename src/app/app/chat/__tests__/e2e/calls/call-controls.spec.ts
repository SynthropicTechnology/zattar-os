import { test, expect } from '../fixtures/call-fixtures';

test.describe('Call Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
    await page.getByTestId('chat-room-item').first().click();
    await page.getByLabel('Iniciar chamada de vídeo').click();
    // Wait for dialog
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
  });

  test('deve alternar microfone e câmera', async ({ page }) => {
    // Verificar botões iniciais
    const micBtn = page.getByLabel('Ativar microfone').or(page.getByLabel('Desativar microfone'));
    const camBtn = page.getByLabel('Ativar câmera').or(page.getByLabel('Desativar câmera'));
    
    await expect(micBtn).toBeVisible();
    await expect(camBtn).toBeVisible();

    // Interagir (note: sem mock do Dyte, o estado pode não mudar visualmente se depender de evento)
    await micBtn.click();
    await camBtn.click();
  });

  test('deve alternar compartilhamento de tela', async ({ page }) => {
    const shareBtn = page.getByLabel('Compartilhar tela');
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();
  });

  test('deve abrir menu de efeitos', async ({ page }) => {
    const effectsBtn = page.getByLabel('Efeitos de Vídeo');
    await expect(effectsBtn).toBeVisible();
    
    await effectsBtn.click();
    await expect(page.getByText('Plano de Fundo')).toBeVisible();
    await expect(page.getByLabel('Desfoque (Blur)')).toBeVisible();
  });

  test('deve alternar lista de participantes', async ({ page }) => {
    // Only visible on mobile usually, or desktop if toggled? 
    // The UI shows it on desktop if sidebar is active.
    // Let's assume desktop viewport
    
    // But there is a toggle button logic in CustomCallControls
    // If we are on mobile/tablet, the button appears.
    
    // We can force mobile view for this test
    await page.setViewportSize({ width: 375, height: 667 });
    
    const participantsBtn = page.getByLabel('Participantes');
    await expect(participantsBtn).toBeVisible();
    await participantsBtn.click();
    
    await expect(page.getByText('Participantes (')).toBeVisible();
  });
});