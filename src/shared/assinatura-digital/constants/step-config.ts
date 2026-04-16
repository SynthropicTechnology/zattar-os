/**
 * Configuração de etapas do formulário de assinatura digital
 *
 * O fluxo completo padrão possui 8 etapas:
 * 0: CPF
 * 1: Dados Pessoais
 * 2: Dados da Ação
 * 3: Termos de Aceite
 * 4: Captura de Foto
 * 5: Visualização do PDF/Documento
 * 6: Assinatura
 * 7: Sucesso/Conclusão
 */

/**
 * Número padrão de etapas no fluxo completo do formulário.
 * Usado como fallback quando stepConfigs não está definido.
 */
export const DEFAULT_TOTAL_STEPS = 8;

/**
 * Identificadores das etapas do formulário
 */
export const STEP_IDS = {
  CPF: 'cpf',
  DADOS_PESSOAIS: 'dados-pessoais',
  DADOS_ACAO: 'dados-acao',
  TERMOS_ACEITE: 'termos-aceite',
  FOTO: 'foto',
  VISUALIZACAO: 'visualizacao',
  ASSINATURA: 'assinatura',
  SUCESSO: 'sucesso',
} as const;
