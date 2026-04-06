import { test, expect } from '@playwright/test';

test.describe('Assinatura Digital - Fluxo Público de Assinatura', () => {
  // Configurar para emular mobile para verificação responsiva se necessário
  test('deve renderizar a tela de welcome e tratar token inválido', async ({ page }) => {
    // 1. Mock do retorno da API para token inválido para evitar timeout e usar o fluxo correto de erro
    await page.route('**/api/assinatura-digital/public/invalid-token', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Link inválido ou expirado.'
        })
      });
    });

    // 2. Navegar
    await page.goto('/assinatura/invalid-token');

    // 3. Verificar fallback de erro no State de ErrorState gerenciado pelo Contexto
    await expect(page.getByText(/Erro ao carregar/i)).toBeVisible();
    await expect(page.getByText(/link.*inválido ou expirado/i)).toBeVisible();
  });

  // O endpoint correto é /api/assinatura-digital/public/[token]
  test('deve renderizar a tela de welcome com token simulado na API', async ({ page }) => {
    // Mock da API para o token de sucesso
    await page.route('**/api/assinatura-digital/public/fake-valid-token', async (route) => {
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
              status: 'pronto'
            },
            assinante: {
              dados_snapshot: {
                nome_completo: 'Maria Silva',
                cpf: '123.456.789-00',
                email: 'maria@example.com',
                telefone: '11999999999'
              },
              status: 'pendente'
            }
          }
        })
      });
    });

    await page.goto('/assinatura/fake-valid-token');

    // Welcome Step
    await expect(page.getByText('Contrato de Honorários Teste')).toBeVisible();
    await expect(page.getByRole('button', { name: /começar|iniciar/i })).toBeVisible();

    // Avanca para confirmacao de dados
    await page.getByRole('button', { name: /começar|iniciar/i }).click();

    // Confirm Details Step
    await expect(page.getByText('Maria Silva')).toBeVisible();
    await expect(page.getByText('123.456.789-00')).toBeVisible();

    await page.getByRole('button', { name: /continuar|Avançar|Avança/i }).click();

    // Review Step
    await expect(page.getByText(/Revis[ãa]o/i)).toBeVisible();
  });
});
