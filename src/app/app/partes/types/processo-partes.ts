/**
 * Tipos para vínculos processo-partes
 */

/**
 * Polo do vínculo no processo (normalizado no sistema).
 */
export type PoloProcessoParte = 'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO';

/**
 * Tipos de parte aceitos no sistema.
 *
 * Observação: o PJE pode retornar muitos valores; quando não reconhecido,
 * a captura normaliza para `OUTRO`.
 */
export const TIPOS_PARTE_PROCESSO_VALIDOS = {
  AUTOR: true,
  REU: true,
  RECLAMANTE: true,
  RECLAMADO: true,
  TERCEIRO: true,
  PERITO: true,
  MINISTERIO_PUBLICO: true,
  ASSISTENTE: true,
  TESTEMUNHA: true,
  CUSTOS_LEGIS: true,
  AMICUS_CURIAE: true,
  OUTRO: true,
} as const;

export type TipoParteProcesso = keyof typeof TIPOS_PARTE_PROCESSO_VALIDOS;

/**
 * Parte com dados completos da entidade vinculada (shape usado no frontend)
 *
 * Nota: este tipo representa o payload retornado pelas actions (e antes pelas rotas REST),
 * combinando dados do vínculo (processo_partes) + dados essenciais da entidade (clientes/partes_contrarias/terceiros).
 */
export interface ParteComDadosCompletos {
  // Dados do vínculo
  id: number;
  processo_id: number;
  tipo_entidade: 'cliente' | 'parte_contraria' | 'terceiro';
  entidade_id: number;
  id_pje: number;
  id_pessoa_pje: number | null;
  tipo_parte: TipoParteProcesso;
  polo: PoloProcessoParte;
  trt: string;
  grau: string;
  numero_processo: string;
  principal: boolean;
  ordem: number;
  dados_pje_completo: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;

  // Dados essenciais da entidade (cliente/parte contrária/terceiro)
  nome: string;
  tipo_pessoa: 'pf' | 'pj';
  cpf: string | null;
  cnpj: string | null;
  emails: string[] | null;
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_telefone: string | null;
  numero_telefone: string | null;
}

