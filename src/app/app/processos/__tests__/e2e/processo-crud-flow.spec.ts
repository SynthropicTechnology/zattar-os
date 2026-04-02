import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast, fillProcessoForm } from '@/testing/e2e/helpers';

test.describe('Processos - CRUD Flow', () => {
  test('deve criar um novo processo com sucesso', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em "Novo Processo"
    await page.getByRole('button', { name: /novo processo/i }).click();

    // 3. Aguardar modal/dialog abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Preencher formulário
    await fillProcessoForm(page, {
      numeroProcesso: '0000000-00.2025.5.15.0001',
      trt: 'TRT15',
      grau: 'primeiro_grau',
      classeJudicial: 'Ação Trabalhista',
      parteAutora: 'João da Silva',
      parteRe: 'Empresa XYZ Ltda',
      orgaoJulgador: '1ª Vara do Trabalho de Campinas',
      dataAutuacao: '01/01/2025',
    });

    // 5. Clicar em "Criar Processo"
    await page.getByRole('button', { name: /criar|salvar/i }).click();

    // 6. Validar toast de sucesso
    await waitForToast(page, /processo criado com sucesso/i);

    // 7. Validar que processo aparece na tabela
    await expect(page.getByText('0000000-00.2025.5.15.0001')).toBeVisible();
    await expect(page.getByText('João da Silva')).toBeVisible();
    await expect(page.getByText('Empresa XYZ Ltda')).toBeVisible();
  });

  test('deve visualizar detalhes do processo', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em um processo existente na tabela
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Validar informações exibidas
    await expect(page.getByText('0000000-00.2025.5.15.0001')).toBeVisible();
    await expect(page.getByText('TRT15')).toBeVisible();
    await expect(page.getByText('Reclamação Trabalhista')).toBeVisible();
    await expect(page.getByText('João da Silva')).toBeVisible();
    await expect(page.getByText('Empresa XYZ Ltda')).toBeVisible();
    await expect(page.getByText('1ª Vara do Trabalho de Campinas')).toBeVisible();
  });

  test('deve editar um processo existente', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em um processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Clicar em "Editar"
    await page.getByRole('button', { name: /editar/i }).click();

    // 5. Alterar classe judicial
    const classeJudicialInput = page.getByLabel('Classe Judicial');
    await classeJudicialInput.clear();
    await classeJudicialInput.fill('Reclamação Trabalhista');

    // 6. Salvar
    await page.getByRole('button', { name: /salvar/i }).click();

    // 7. Validar toast de sucesso
    await waitForToast(page, /processo atualizado com sucesso/i);

    // 8. Validar que alteração foi aplicada
    await expect(page.getByText('Reclamação Trabalhista')).toBeVisible();
  });

  test('deve validar campos obrigatórios ao criar processo', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em "Novo Processo"
    await page.getByRole('button', { name: /novo processo/i }).click();

    // 3. Aguardar modal/dialog abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Tentar salvar sem preencher campos obrigatórios
    await page.getByRole('button', { name: /criar|salvar/i }).click();

    // 5. Validar mensagens de erro
    await expect(page.getByText(/campo obrigatório|required/i).first()).toBeVisible();
  });

  test('deve filtrar processos por número', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Usar campo de busca/filtro
    const searchInput = page.getByPlaceholder(/buscar|filtrar|pesquisar/i);
    await searchInput.fill('0000000-00.2025.5.15.0001');

    // 3. Aguardar filtragem
    await page.waitForTimeout(500); // Aguardar debounce

    // 4. Validar que apenas processo filtrado aparece
    await expect(page.getByText('0000000-00.2025.5.15.0001')).toBeVisible();
  });
});

test.describe('Processos - CRUD Flow (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve criar processo em dispositivo móvel', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em "Novo Processo" (pode estar em menu hamburguer)
    const newButton = page.getByRole('button', { name: /novo processo/i });
    if (await newButton.isVisible({ timeout: 1000 })) {
      await newButton.click();
    } else {
      // Abrir menu hamburguer se botão não estiver visível
      await page.getByRole('button', { name: /menu/i }).click();
      await page.getByRole('button', { name: /novo processo/i }).click();
    }

    // 3. Aguardar modal/dialog abrir (fullscreen em mobile)
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Preencher formulário
    await fillProcessoForm(page, {
      numeroProcesso: '0000000-00.2025.5.15.0002',
      trt: 'TRT15',
      grau: 'primeiro_grau',
      classeJudicial: 'Ação Trabalhista',
      parteAutora: 'Maria Santos',
      parteRe: 'Empresa ABC Ltda',
      orgaoJulgador: '2ª Vara do Trabalho de São Paulo',
      dataAutuacao: '15/01/2025',
    });

    // 5. Scroll para botão de submit (pode estar fora da viewport)
    await page.getByRole('button', { name: /criar|salvar/i }).scrollIntoViewIfNeeded();

    // 6. Clicar em "Criar Processo"
    await page.getByRole('button', { name: /criar|salvar/i }).click();

    // 7. Validar toast de sucesso
    await waitForToast(page, /processo criado com sucesso/i);

    // 8. Validar que processo aparece na lista (pode ter scroll horizontal)
    await expect(page.getByText('0000000-00.2025.5.15.0002')).toBeVisible();
  });

  test('deve visualizar detalhes em mobile com sheet fullscreen', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em um processo
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar sheet fullscreen abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Validar informações (pode precisar scroll)
    await expect(page.getByText('0000000-00.2025.5.15.0001')).toBeVisible();

    // Scroll para ver mais informações
    await page.getByText('Reclamação Trabalhista').scrollIntoViewIfNeeded();
    await expect(page.getByText('Reclamação Trabalhista')).toBeVisible();

    // 5. Fechar sheet
    await page.getByRole('button', { name: /fechar|voltar/i }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
  });
});
