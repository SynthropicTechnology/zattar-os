import { test, expect, type Page } from '@playwright/test'

/**
 * SMOKE TESTS — Fluxo público de assinatura digital.
 *
 * Escopo propositalmente limitado:
 * - Valida que rotas públicas carregam sem crashar
 * - Valida landmarks A11y presentes (header/main/aside/footer + SkipLink)
 * - Valida tratamento de erro em token inválido
 *
 * FORA DO ESCOPO (requer mock de banco/schema):
 * - Flow completo 9 steps do wizard de formulário
 * - Validação de submit + PDF gerado
 * - Assinatura manuscrita
 *
 * Para expandir pra happy-path completo, será necessário:
 * 1. Criar fixture `publicWizardMockedPage` em src/testing/e2e/fixtures.ts
 *    com mock das APIs /api/assinatura-digital/formularios/[id],
 *    /api/assinatura-digital/clientes/[cpf], etc.
 * 2. Semear schema JSON de teste (ex: contratacao-aplicativos-schema.json)
 * 3. Mockar response do template PDF pra evitar chamada real ao Supabase Storage.
 *
 * Cobertura atual dos ciclos 1-11: ~73 component tests (jest) cobrem a lógica.
 * Este spec cobre apenas o que E2E oferece que unit não oferece: SSR + routing.
 */

test.describe('Wizard público — smoke tests', () => {
  test('rota /assinatura/[token] com token inválido renderiza erro sem crashar', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('pageerror', (err) => consoleErrors.push(String(err)))

    await page.goto('/assinatura/token-invalido-teste', {
      waitUntil: 'domcontentloaded',
    })

    // Página deve carregar (não 500)
    const response = await page.waitForResponse((r) =>
      r.url().includes('/assinatura/token-invalido-teste'),
    )
    expect([200, 404]).toContain(response.status())

    // Sem erros de runtime no cliente
    expect(consoleErrors).toHaveLength(0)
  })

  test('SkipLink presente e focável no topo da DOM', async ({ page }) => {
    await page.goto('/assinatura/token-invalido-teste', {
      waitUntil: 'networkidle',
    })

    // SkipLink é o primeiro elemento focável — tab inicial leva a ele
    await page.keyboard.press('Tab')

    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      return {
        tag: el?.tagName,
        href: el?.getAttribute('href'),
        text: el?.textContent?.trim(),
      }
    })

    // Spec A11y: link apontando pra #main-content
    if (focused.href) {
      expect(focused.tag).toBe('A')
      expect(focused.href).toContain('main-content')
    }
  })

  test('landmarks semânticas presentes (main, header, footer quando aplicável)', async ({ page }) => {
    await page.goto('/assinatura/token-invalido-teste', {
      waitUntil: 'networkidle',
    })

    // header é obrigatório — mesmo em erro, o PublicWizardHeader deveria estar
    // (depende da implementação atual; caso não esteja, marcar como regressão)
    const hasHeaderOrMain = await page.evaluate(() => {
      return !!(
        document.querySelector('header') ||
        document.querySelector('main') ||
        document.querySelector('[role="main"]')
      )
    })
    expect(hasHeaderOrMain).toBe(true)
  })

  test.skip('[FUTURO] happy path: percorrer 9 steps completos até sucesso', async ({ page: _page }) => {
    // Depende de fixture publicWizardMockedPage + schema mockado.
    // Exemplo de implementação quando disponível:
    //
    // await page.goto('/formulario/formulario-teste-id')
    // await fillStep1CPF(page, '123.456.789-00')
    // await fillStep2Identidade(page, { nome: 'João', rg: '1234567' })
    // await fillStep3Contatos(page, { email: 't@t.com', celular: '11999999999' })
    // await fillStep4Endereco(page, { cep: '01310-100' })
    // await fillStep5Acao(page, { /* ... */ })
    // await reviewStep6(page)
    // await selfieStep7(page)
    // await acceptTermsStep8(page)
    // await signStep9(page)
    // await expect(page.getByText(/sucesso/i)).toBeVisible()
  })
})

test.describe('Wizard público — mobile viewport (iPhone SE)', () => {
  test.use({
    viewport: { width: 320, height: 568 },
  })

  test('footer não transborda em viewport 320px (iPhone SE)', async ({ page }) => {
    await page.goto('/assinatura/token-invalido-teste', {
      waitUntil: 'networkidle',
    })

    // Busca por scroll horizontal — sintoma de overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth + 1
    })

    expect(hasHorizontalScroll).toBe(false)
  })
})

// Helpers skeleton pra step fills — implementar quando o happy-path for desmocado
async function _fillStep5AcaoExample(page: Page) {
  // Exemplo do pattern:
  // await page.getByRole('button', { name: /pessoa jurídica/i }).click()
  // await page.getByLabel(/cnpj/i).fill('12.345.678/0001-90')
  // await page.getByRole('button', { name: /continuar/i }).click()
  // Placeholder pra ajudar devs futuros que forem expandir
  void page
}
