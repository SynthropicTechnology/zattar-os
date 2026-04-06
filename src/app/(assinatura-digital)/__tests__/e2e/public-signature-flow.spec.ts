import { test, expect } from '@/testing/e2e/fixtures';

test.describe('Assinatura Digital - Fluxo Público de Assinatura', () => {
  // Configurar para emular mobile para verificação responsiva se necessário
  test('deve renderizar a tela de welcome e tratar token inválido', async ({ page }) => {
    // 1. Navegar simulando um token inexistente/inválido
    await page.goto('/assinatura/invalid-token');
    await page.waitForLoadState('networkidle');

    // 2. Verificar fallback de erro
    await expect(page.getByText(/Token inválido/i)).toBeVisible();
    await expect(page.getByText(/link.*inválido ou expirado/i)).toBeVisible();
  });

  // Idealmente teriamos mocks na base do Playwright da rota GET de contexto público:
  // /api/assinatura-digital/public/context?token=xyz
  test('deve renderizar a tela de welcome com token simulado na API', async ({ page }) => {
    // Mock da API para o token de sucesso
    await page.route('**/api/assinatura-digital/public/context*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            documento: {
              titulo: 'Contrato de Honorários Teste',
              pdf_original_url: '/dummy.pdf',
              selfie_habilitada: true,
              geolocation_necessaria: false,
            },
            assinante: {
              dados_snapshot: {
                nome_completo: 'Maria Silva',
                cpf: '123.456.789-00',
                email: 'maria@example.com',
                telefone: '11999999999'
              }
            }
          }
        })
      });
    });

    await page.goto('/assinatura/fake-valid-token');
    await page.waitForLoadState('networkidle');

    // Welcome Step
    await expect(page.getByText('Contrato de Honorários Teste')).toBeVisible();
    await expect(page.getByRole('button', { name: /começar|iniciar/i })).toBeVisible();

    // Avanca para confirmacao de dados
    await page.getByRole('button', { name: /começar|iniciar/i }).click();

    // Confirm Details Step
    await expect(page.getByText('Maria Silva')).toBeVisible();
    await expect(page.getByText('123.456.789-00')).toBeVisible();

    await page.getByRole('button', { name: /continuar|Avançar/i }).click();

    // Review Step
    await expect(page.getByText(/Revis[ãa]o/i)).toBeVisible();
  });
});
