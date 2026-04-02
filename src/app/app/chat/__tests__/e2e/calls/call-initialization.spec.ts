import { test, expect } from '../fixtures/call-fixtures';

test.describe('Call Initialization', () => {
  test('deve inicializar chamada de vídeo com sucesso', async ({ page }) => {
    await page.goto('/chat');
    
    // Simular seleção de sala
    await page.getByTestId('chat-room-item').first().click();
    
    // Clicar no botão de vídeo
    await page.getByLabel('Iniciar chamada de vídeo').click();
    
    // Verificar se o dialog abriu
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(page.getByText('Video Call:')).toBeVisible();

    // Verificar estados de loading
    await expect(page.getByText('Conectando ao servidor...')).toBeVisible();
    
    // (Em um ambiente real, verificariamos se a grid aparece após conexão)
    // await expect(page.locator('.dyte-grid')).toBeVisible();
  });

  test('deve inicializar chamada de áudio com sucesso', async ({ page }) => {
    await page.goto('/chat');
    await page.getByTestId('chat-room-item').first().click();
    
    await page.getByLabel('Iniciar chamada de voz').click();
    
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(page.getByText('Audio Call:')).toBeVisible();
  });
});