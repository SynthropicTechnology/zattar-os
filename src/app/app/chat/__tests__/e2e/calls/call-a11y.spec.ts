import { test, expect } from '../fixtures/call-fixtures';
import AxeBuilder from '@axe-core/playwright';

test.describe('Call Accessibility', () => {
  test('deve passar nos testes de acessibilidade (axe)', async ({ page }) => {
    await page.goto('/chat');
    await page.getByTestId('chat-room-item').first().click();
    await page.getByLabel('Iniciar chamada de vídeo').click();

    await expect(page.locator('div[role="dialog"]')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('div[role="dialog"]')
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
