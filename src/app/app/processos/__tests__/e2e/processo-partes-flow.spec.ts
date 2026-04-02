import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast, searchAndSelect } from '@/testing/e2e/helpers';

test.describe('Processos - Partes Flow', () => {
  test('deve adicionar parte autora ao processo', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Partes" (se existir)
    const partesTab = page.getByRole('tab', { name: /partes/i });
    if (await partesTab.isVisible({ timeout: 1000 })) {
      await partesTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Clicar em "Adicionar Parte"
    await page.getByRole('button', { name: /adicionar parte/i }).click();

    // 6. Aguardar modal de adicionar parte
    await page.waitForTimeout(500);

    // 7. Buscar cliente por nome
    const clienteInput = page.getByLabel(/cliente|nome/i);
    await clienteInput.fill('Maria Santos');
    await page.waitForTimeout(300); // Aguardar debounce

    // 8. Selecionar cliente da lista de sugestões
    await page.getByText('Maria Santos').click();

    // 9. Escolher tipo de parte: "Autor"
    await page.getByLabel(/tipo|função/i).click();
    await page.getByText('Autor', { exact: true }).click();

    // 10. Salvar
    await page.getByRole('button', { name: /salvar|adicionar/i }).click();

    // 11. Validar toast de sucesso
    await waitForToast(page, /parte adicionada com sucesso/i);

    // 12. Validar que parte aparece na lista
    await expect(page.getByText('Maria Santos')).toBeVisible();
    await expect(page.getByText('Autor')).toBeVisible();
  });

  test('deve adicionar parte ré ao processo', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Partes"
    const partesTab = page.getByRole('tab', { name: /partes/i });
    if (await partesTab.isVisible({ timeout: 1000 })) {
      await partesTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Clicar em "Adicionar Parte"
    await page.getByRole('button', { name: /adicionar parte/i }).click();

    // 6. Buscar parte contrária
    const parteInput = page.getByLabel(/cliente|nome|parte/i);
    await parteInput.fill('Empresa ABC Ltda');
    await page.waitForTimeout(300);

    // 7. Selecionar da lista
    await page.getByText('Empresa ABC Ltda').click();

    // 8. Escolher tipo de parte: "Ré"
    await page.getByLabel(/tipo|função/i).click();
    await page.getByText('Ré', { exact: true }).click();

    // 9. Salvar
    await page.getByRole('button', { name: /salvar|adicionar/i }).click();

    // 10. Validar sucesso
    await waitForToast(page, /parte adicionada com sucesso/i);

    // 11. Validar ambas as partes na lista
    await expect(page.getByText('Empresa ABC Ltda')).toBeVisible();
    await expect(page.getByText('Ré')).toBeVisible();
  });

  test('deve listar todas as partes vinculadas ao processo', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Partes"
    const partesTab = page.getByRole('tab', { name: /partes/i });
    if (await partesTab.isVisible({ timeout: 1000 })) {
      await partesTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Validar que partes existentes aparecem
    await expect(page.getByText('Maria Santos')).toBeVisible();
    await expect(page.getByText('Autor')).toBeVisible();

    await expect(page.getByText('Empresa ABC Ltda')).toBeVisible();
    await expect(page.getByText('Ré')).toBeVisible();
  });

  test('deve validar campos obrigatórios ao adicionar parte', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Partes"
    const partesTab = page.getByRole('tab', { name: /partes/i });
    if (await partesTab.isVisible({ timeout: 1000 })) {
      await partesTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Clicar em "Adicionar Parte"
    await page.getByRole('button', { name: /adicionar parte/i }).click();

    // 6. Tentar salvar sem preencher campos
    await page.getByRole('button', { name: /salvar|adicionar/i }).click();

    // 7. Validar mensagens de erro
    await expect(page.getByText(/campo obrigatório|required/i).first()).toBeVisible();
  });

  test('deve buscar e filtrar clientes ao adicionar parte', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Partes"
    const partesTab = page.getByRole('tab', { name: /partes/i });
    if (await partesTab.isVisible({ timeout: 1000 })) {
      await partesTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Clicar em "Adicionar Parte"
    await page.getByRole('button', { name: /adicionar parte/i }).click();

    // 6. Digitar no campo de busca
    const clienteInput = page.getByLabel(/cliente|nome/i);
    await clienteInput.fill('Maria');
    await page.waitForTimeout(300);

    // 7. Validar que sugestões aparecem
    await expect(page.getByText('Maria Santos')).toBeVisible();

    // 8. Validar que pode filtrar ainda mais
    await clienteInput.fill('João');
    await page.waitForTimeout(300);
    await expect(page.getByText('João Silva')).toBeVisible();
  });

  test('deve adicionar múltiplas partes ao mesmo processo', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo existente
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Partes"
    const partesTab = page.getByRole('tab', { name: /partes/i });
    if (await partesTab.isVisible({ timeout: 1000 })) {
      await partesTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Adicionar primeira parte (Autor)
    await page.getByRole('button', { name: /adicionar parte/i }).click();
    await searchAndSelect(page, /cliente|nome/i, 'Maria Santos', 'Maria Santos');
    await page.getByLabel(/tipo|função/i).click();
    await page.getByText('Autor', { exact: true }).click();
    await page.getByRole('button', { name: /salvar|adicionar/i }).click();
    await waitForToast(page, /parte adicionada com sucesso/i);

    // 6. Aguardar modal fechar
    await page.waitForTimeout(500);

    // 7. Adicionar segunda parte (Ré)
    await page.getByRole('button', { name: /adicionar parte/i }).click();
    await searchAndSelect(page, /cliente|nome/i, 'Empresa ABC', 'Empresa ABC Ltda');
    await page.getByLabel(/tipo|função/i).click();
    await page.getByText('Ré', { exact: true }).click();
    await page.getByRole('button', { name: /salvar|adicionar/i }).click();
    await waitForToast(page, /parte adicionada com sucesso/i);

    // 8. Validar que ambas as partes aparecem
    await expect(page.getByText('Maria Santos')).toBeVisible();
    await expect(page.getByText('Empresa ABC Ltda')).toBeVisible();
  });
});

test.describe('Processos - Partes Flow (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve adicionar parte em dispositivo móvel', async ({ processosMockedPage: page }) => {
    // 1. Navegar para a página de processos
    await page.goto('/processos');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em processo
    await page.getByText('0000000-00.2025.5.15.0001').click();

    // 3. Aguardar sheet fullscreen
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Navegar para tab "Partes" (pode precisar scroll horizontal)
    const partesTab = page.getByRole('tab', { name: /partes/i });
    if (await partesTab.isVisible({ timeout: 1000 })) {
      await partesTab.scrollIntoViewIfNeeded();
      await partesTab.click();
      await page.waitForTimeout(500);
    }

    // 5. Scroll para botão "Adicionar Parte"
    await page.getByRole('button', { name: /adicionar parte/i }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /adicionar parte/i }).click();

    // 6. Preencher formulário (fullscreen em mobile)
    const clienteInput = page.getByLabel(/cliente|nome/i);
    await clienteInput.scrollIntoViewIfNeeded();
    await clienteInput.fill('Maria Santos');
    await page.waitForTimeout(300);

    await page.getByText('Maria Santos').click();

    // 7. Selecionar tipo
    await page.getByLabel(/tipo|função/i).scrollIntoViewIfNeeded();
    await page.getByLabel(/tipo|função/i).click();
    await page.getByText('Autor', { exact: true }).click();

    // 8. Scroll para botão salvar
    await page.getByRole('button', { name: /salvar|adicionar/i }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /salvar|adicionar/i }).click();

    // 9. Validar sucesso
    await waitForToast(page, /parte adicionada com sucesso/i);
    await expect(page.getByText('Maria Santos')).toBeVisible();
  });
});
