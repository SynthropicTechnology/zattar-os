/**
 * Labels curtos para cada step do wizard público de assinatura digital.
 * Consumido por FormularioContainer (sidebar), PublicStepCard (chip)
 * e qualquer UI que precise narrar o progresso.
 */
export const STEP_LABELS: Record<string, string> = {
  cpf: 'CPF',
  pendentes: 'Pendentes',
  pessoais: 'Dados',
  identidade: 'Identidade',
  contatos: 'Contatos',
  endereco: 'Endereço',
  acao: 'Ação',
  visualizacao: 'Revisão',
  foto: 'Selfie',
  termos: 'Termos',
  assinatura: 'Assinar',
  sucesso: 'Pronto',
}

/**
 * Steps que não entram na contagem visual (pendentes é opcional,
 * sucesso é estado terminal).
 */
export const STEPS_HIDDEN_FROM_PROGRESS: ReadonlyArray<string> = [
  'pendentes',
  'sucesso',
]
