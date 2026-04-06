import { Page, expect } from '@playwright/test';

/**
 * Preenche formulário de processo
 */
export async function fillProcessoForm(
  page: Page,
  data: {
    numeroProcesso: string;
    trt: string;
    grau: string;
    classeJudicial: string;
    parteAutora: string;
    parteRe: string;
    orgaoJulgador: string;
    dataAutuacao: string;
  }
) {
  await page.getByLabel('Número do Processo').fill(data.numeroProcesso);

  await page.getByLabel('TRT').click();
  await page.getByText(data.trt, { exact: true }).click();

  await page.getByLabel('Grau').click();
  await page
    .getByText(data.grau === 'primeiro_grau' ? '1º Grau' : '2º Grau', { exact: true })
    .click();

  await page.getByLabel('Classe Judicial').fill(data.classeJudicial);
  await page.getByLabel('Parte Autora').fill(data.parteAutora);
  await page.getByLabel('Parte Ré').fill(data.parteRe);
  await page.getByLabel('Órgão Julgador').fill(data.orgaoJulgador);

  // Preencher data de autuação
  await page.getByLabel('Data de Autuação').click();
  await page.getByLabel('Data de Autuação').fill(data.dataAutuacao);
}

/**
 * Preenche formulário de audiência
 */
export async function fillAudienciaForm(
  page: Page,
  data: {
    processo: string;
    tipo: string;
    dataInicio: string;
    horaInicio: string;
    dataFim: string;
    horaFim: string;
    modalidade: 'virtual' | 'presencial';
    urlVirtual?: string;
    endereco?: {
      logradouro: string;
      numero: string;
      bairro: string;
      cidade: string;
      estado: string;
      cep: string;
    };
    sala?: string;
    responsavel: string;
    observacoes?: string;
  }
) {
  // Selecionar processo
  await page.getByLabel('Processo').click();
  await page.getByText(data.processo).click();

  // Selecionar tipo
  await page.getByLabel('Tipo').click();
  await page.getByText(data.tipo).click();

  // Datas e horários
  await page.getByLabel('Data de Início').fill(data.dataInicio);
  await page.getByLabel('Hora de Início').fill(data.horaInicio);
  await page.getByLabel('Data de Fim').fill(data.dataFim);
  await page.getByLabel('Hora de Fim').fill(data.horaFim);

  // Modalidade específica
  if (data.modalidade === 'virtual' && data.urlVirtual) {
    await page.getByLabel('URL Virtual').fill(data.urlVirtual);
  } else if (data.modalidade === 'presencial' && data.endereco) {
    await page.getByLabel('Logradouro').fill(data.endereco.logradouro);
    await page.getByLabel('Número').fill(data.endereco.numero);
    await page.getByLabel('Bairro').fill(data.endereco.bairro);
    await page.getByLabel('Cidade').fill(data.endereco.cidade);
    await page.getByLabel('Estado').fill(data.endereco.estado);
    await page.getByLabel('CEP').fill(data.endereco.cep);

    if (data.sala) {
      await page.getByLabel('Sala').click();
      await page.getByText(data.sala).click();
    }
  }

  // Responsável
  await page.getByLabel('Responsável').click();
  await page.getByText(data.responsavel).click();

  // Observações
  if (data.observacoes) {
    await page.getByLabel('Observações').fill(data.observacoes);
  }
}

/**
 * Preenche formulário de lançamento financeiro
 */
export async function fillLancamentoForm(
  page: Page,
  data: {
    descricao: string;
    valor: string;
    dataVencimento: string;
    categoria: string;
    formaPagamento: string;
    cliente?: string;
    contrato?: string;
    contaBancaria: string;
    contaContabil: string;
  }
) {
  await page.getByLabel('Descrição').fill(data.descricao);
  await page.getByLabel('Valor').fill(data.valor);
  await page.getByLabel('Data de Vencimento').fill(data.dataVencimento);

  await page.getByLabel('Categoria').click();
  await page.getByText(data.categoria).click();

  await page.getByLabel('Forma de Pagamento').click();
  await page.getByText(data.formaPagamento).click();

  if (data.cliente) {
    await page.getByLabel('Cliente').click();
    await page.getByText(data.cliente).click();
  }

  if (data.contrato) {
    await page.getByLabel('Contrato').click();
    await page.getByText(data.contrato).click();
  }

  await page.getByLabel('Conta Bancária').click();
  await page.getByText(data.contaBancaria).click();

  await page.getByLabel('Conta Contábil').click();
  await page.getByText(data.contaContabil).click();
}

/**
 * Preenche formulário de acordo
 */
export async function fillAcordoForm(
  page: Page,
  data: {
    processo: string;
    tipo: string;
    direcao: string;
    valorTotal: string;
    dataVencimento: string;
    numeroParcelas: string;
    intervaloParcelas: string;
    formaPagamento: string;
    distribuicao: string;
    percentualEscritorio: string;
    honorariosSucumbenciais: string;
  }
) {
  await page.getByLabel('Processo').click();
  await page.getByText(data.processo).click();

  await page.getByLabel('Tipo').click();
  await page.getByText(data.tipo).click();

  await page.getByLabel('Direção').click();
  await page.getByText(data.direcao).click();

  await page.getByLabel('Valor Total').fill(data.valorTotal);
  await page.getByLabel('Data de Vencimento').fill(data.dataVencimento);
  await page.getByLabel('Número de Parcelas').fill(data.numeroParcelas);
  await page.getByLabel('Intervalo entre Parcelas').fill(data.intervaloParcelas);

  await page.getByLabel('Forma de Pagamento').click();
  await page.getByText(data.formaPagamento).click();

  await page.getByLabel('Distribuição').click();
  await page.getByText(data.distribuicao).click();

  await page.getByLabel('Percentual Escritório').fill(data.percentualEscritorio);
  await page.getByLabel('Honorários Sucumbenciais').fill(data.honorariosSucumbenciais);
}

/**
 * Aguarda toast de notificação aparecer
 */
export async function waitForToast(page: Page, message: string, timeout = 5000) {
  const toast = page.getByText(message);
  await expect(toast).toBeVisible({ timeout });
  return toast;
}

/**
 * Aguarda loading state terminar
 */
export async function waitForLoadingToFinish(page: Page) {
  await page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 10000 });
}

/**
 * Faz upload de arquivo
 */
export async function uploadFile(page: Page, inputSelector: string, filePath: string) {
  const fileInput = page.locator(inputSelector);
  await fileInput.setInputFiles(filePath);
}

/**
 * Abre diálogo/sheet de detalhes
 */
export async function openDetailSheet(page: Page, itemText: string) {
  await page.getByText(itemText).click();
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });
}

/**
 * Fecha diálogo/sheet
 */
export async function closeDialog(page: Page) {
  const closeButton = page.getByRole('button', { name: /fechar|close/i });
  await closeButton.click();
  await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
}

/**
 * Navega para uma tab específica
 */
export async function navigateToTab(page: Page, tabName: string) {
  const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') });
  await tab.click();
  await page.waitForTimeout(500); // Aguarda transição
}

/**
 * Seleciona uma opção em um select/combobox
 */
export async function selectOption(page: Page, labelText: string, optionText: string) {
  await page.getByLabel(labelText).click();
  await page.getByText(optionText, { exact: true }).click();
}

/**
 * Preenche campo de busca e seleciona resultado
 */
export async function searchAndSelect(page: Page, inputLabel: string, searchTerm: string, resultText: string) {
  await page.getByLabel(inputLabel).fill(searchTerm);
  await page.waitForTimeout(300); // Aguarda debounce
  await page.getByText(resultText).click();
}

/**
 * Confirma ação em diálogo de confirmação
 */
export async function confirmAction(page: Page, confirmButtonText = 'Confirmar') {
  const confirmButton = page.getByRole('button', { name: new RegExp(confirmButtonText, 'i') });
  await confirmButton.click();
}

/**
 * Cancela ação em diálogo
 */
export async function cancelAction(page: Page, cancelButtonText = 'Cancelar') {
  const cancelButton = page.getByRole('button', { name: new RegExp(cancelButtonText, 'i') });
  await cancelButton.click();
}

/**
 * Valida que item existe na tabela
 */
export async function expectRowInTable(page: Page, rowText: string) {
  const row = page.getByRole('row').filter({ hasText: rowText });
  await expect(row).toBeVisible();
  return row;
}

/**
 * Valida múltiplos valores em uma linha da tabela
 */
export async function expectRowWithValues(page: Page, values: string[]) {
  for (const value of values) {
    await expect(page.getByRole('row').filter({ hasText: value })).toBeVisible();
  }
}

/**
 * Clica em botão de ação em uma linha da tabela
 */
export async function clickRowAction(page: Page, rowText: string, actionName: string) {
  const row = page.getByRole('row').filter({ hasText: rowText });
  const actionButton = row.getByRole('button', { name: new RegExp(actionName, 'i') });
  await actionButton.click();
}

/**
 * Aguarda download de arquivo
 */
export async function waitForDownload(page: Page, triggerAction: () => Promise<void>) {
  const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
  await triggerAction();
  const download = await downloadPromise;
  return download;
}

/**
 * Formata valor monetário para input
 */
export function formatCurrency(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

/**
 * Formata data para input (DD/MM/YYYY)
 */
export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Valida que elemento está em estado de loading
 */
export async function expectLoading(page: Page) {
  await expect(page.getByTestId('loading')).toBeVisible();
}

/**
 * Valida que loading terminou
 */
export async function expectNotLoading(page: Page) {
  await expect(page.getByTestId('loading')).not.toBeVisible();
}

/**
 * Navega para uma página específica
 */
export async function navigateToPage(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}
