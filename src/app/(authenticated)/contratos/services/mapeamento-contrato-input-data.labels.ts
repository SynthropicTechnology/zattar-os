/**
 * Human-readable labels for template variable keys.
 * Used by the "campos faltantes" modal to show the user which data is missing.
 */
export const LABELS_CAMPOS_CONTRATO: Readonly<Record<string, string>> = {
  'cliente.nome_completo': 'Nome completo do cliente',
  'cliente.nacionalidade': 'Nacionalidade',
  'cliente.estado_civil': 'Estado civil',
  'cliente.rg': 'RG',
  'cliente.cpf': 'CPF',
  'cliente.endereco_logradouro': 'Logradouro (rua, avenida)',
  'cliente.endereco_numero': 'Número do endereço',
  'cliente.endereco_bairro': 'Bairro',
  'cliente.endereco_cidade': 'Cidade',
  'cliente.endereco_estado': 'UF',
  'cliente.endereco_cep': 'CEP',
  'cliente.ddd_celular': 'DDD do celular',
  'cliente.numero_celular': 'Número do celular',
  'cliente.email': 'E-mail',
  'acao.nome_empresa_pessoa': 'Nome da parte contrária',
};

export function labelParaChave(chave: string): string {
  return LABELS_CAMPOS_CONTRATO[chave] ?? chave;
}
