/**
 * Arquivo: captura/services/partes/identificacao-partes.service.ts
 *
 * PROPÓSITO:
 * Lógica de negócio para identificar automaticamente o tipo de parte em um processo:
 * - cliente: Parte representada por advogado do nosso escritório
 * - parte_contraria: Parte oposta (não representada por nós)
 * - terceiro: Parte especial (perito, MP, testemunha, etc.)
 *
 * ALGORITMO:
 * 1. Verifica se tipo_parte está na lista de tipos especiais → terceiro
 * 2. Verifica se algum representante tem CPF/CNPJ igual ao advogado → cliente
 * 3. Caso contrário → parte_contraria
 *
 * EXPORTAÇÕES:
 * - identificarTipoParte(): Função principal de identificação
 * - normalizarCpf(): Helper para normalizar CPF (remove formatação)
 * - normalizarCnpj(): Helper para normalizar CNPJ (remove formatação)
 * - isTipoEspecial(): Helper para verificar se é tipo especial
 *
 * QUEM USA ESTE ARQUIVO:
 * - backend/captura/services/partes/partes-capture.service.ts
 */

import type { PartePJE } from '@/app/(authenticated)/captura/pje-trt/partes/types';
import type { TipoParteClassificacao } from './types';

/**
 * Lista de tipos de parte considerados "terceiros"
 *
 * PROPÓSITO:
 * Tipos especiais que não são nem cliente nem parte contrária.
 * São participantes auxiliares do processo (peritos, MP, testemunhas, etc.)
 *
 * IMPORTANTE:
 * Mesmo que um perito seja representado por advogado do escritório,
 * ele será classificado como terceiro (tipo especial tem prioridade).
 */
const TIPOS_ESPECIAIS = [
  'PERITO',
  'PERITO_CONTADOR',
  'PERITO_MEDICO',
  'PERITO_JUDICIAL',
  'MINISTERIO_PUBLICO',
  'MINISTERIO_PUBLICO_TRABALHO',
  'MINISTERIO_PUBLICO_ESTADUAL',
  'MINISTERIO_PUBLICO_FEDERAL',
  'ASSISTENTE',
  'ASSISTENTE_TECNICO',
  'TESTEMUNHA',
  'CUSTOS_LEGIS',
  'AMICUS_CURIAE',
  'PREPOSTO',
  'CURADOR',
  'CURADOR_ESPECIAL',
  'INVENTARIANTE',
  'ADMINISTRADOR',
  'SINDICO',
  'DEPOSITARIO',
  'LEILOEIRO',
  'LEILOEIRO_OFICIAL',
  'TRADUTOR',
  'INTERPRETE',
] as const;

/**
 * Interface para dados mínimos do advogado necessários para identificação
 */
export interface AdvogadoIdentificacao {
  /** ID do advogado */
  id: number;
  /** CPF ou CNPJ do advogado (com ou sem formatação) */
  documento: string;
  /** Nome do advogado (opcional, usado apenas para logging) */
  nome?: string;
}

/**
 * Função: identificarTipoParte
 *
 * PROPÓSITO:
 * Classifica uma parte em um dos três tipos: cliente, parte_contraria ou terceiro.
 * Usa lógica de prioridade: tipo especial > representante nosso > parte contrária.
 *
 * PARÂMETROS:
 * - parte: PartePJE (obrigatório)
 *   Dados completos da parte incluindo representantes
 *
 * - advogado: AdvogadoIdentificacao (obrigatório)
 *   Dados do advogado dono da credencial usada na captura
 *
 * RETORNO:
 * - 'cliente': Parte é representada por advogado do escritório
 * - 'parte_contraria': Parte não é representada por nós
 * - 'terceiro': Parte tem tipo especial (perito, MP, etc.)
 *
 * ALGORITMO:
 * 1. Verifica se tipoParte está em TIPOS_ESPECIAIS
 *    → Se sim, retorna 'terceiro'
 * 2. Normaliza documento do advogado (CPF ou CNPJ - remove pontos, hífens, barras)
 * 3. Valida documento do advogado (aceita 11 dígitos para CPF ou 14 para CNPJ)
 * 4. Para cada representante:
 *    a. Normaliza CPF/CNPJ do representante conforme tipo
 *    b. Valida CPF/CNPJ (11/14 dígitos, não sequência)
 *    c. Compara com documento do advogado
 *    d. Se match, retorna 'cliente'
 * 5. Se nenhum representante deu match, retorna 'parte_contraria'
 *
 * LOGGING:
 * - Info: Identificação bem-sucedida com detalhes
 * - Warning: Parte sem representantes, CPF/CNPJ inválido
 * - Debug: Cada comparação de CPF/CNPJ
 *
 * EXEMPLO:
 * const parte: PartePJE = {
 *   idParte: 123,
 *   nome: "João Silva",
 *   tipoParte: "AUTOR",
 *   representantes: [
 *     { numeroDocumento: "12345678900", nome: "Dra. Maria", ... }
 *   ],
 *   ...
 * };
 *
 * const advogado = { id: 1, documento: "123.456.789-00" };
 *
 * const tipo = identificarTipoParte(parte, advogado);
 * // Retorna 'cliente' (documento do representante = documento do advogado)
 */
export function identificarTipoParte(
  parte: PartePJE,
  advogado: AdvogadoIdentificacao
): TipoParteClassificacao {
  // Validação básica
  if (!parte || !advogado) {
    throw new Error('Parte e advogado são obrigatórios para identificação');
  }

  if (!advogado.documento) {
    throw new Error('Documento do advogado é obrigatório para identificação');
  }

  // 1. Verifica se é tipo especial (prioridade máxima)
  if (isTipoEspecial(parte.tipoParte)) {
    console.log(
      `[IDENTIFICACAO] Parte "${parte.nome}" (${parte.tipoParte}) identificada como TERCEIRO (tipo especial)`
    );
    return 'terceiro';
  }

  // 2. Normaliza e valida documento do advogado (deve ser feito ANTES de verificar representantes)
  const documentoAdvogadoNormalizado = normalizarDocumento(advogado.documento);

  // Valida documento do advogado (aceita CPF com 11 dígitos ou CNPJ com 14 dígitos)
  if (!documentoAdvogadoNormalizado || !isDocumentoValido(documentoAdvogadoNormalizado)) {
    throw new Error('Documento do advogado é inválido e não pode ser usado para identificação');
  }

  // 3. Verifica representantes
  const representantes = parte.representantes || [];

  // Se não tem representantes, classifica como parte contrária com warning
  if (representantes.length === 0) {
    console.warn(
      `[IDENTIFICACAO] Parte "${parte.nome}" sem representantes cadastrados - classificada como PARTE_CONTRARIA`
    );
    return 'parte_contraria';
  }

  // 4. Compara CPF/CNPJ de cada representante com documento do advogado
  for (const representante of representantes) {
    // Pula representantes sem documento
    if (!representante.numeroDocumento) {
      console.warn(
        `[IDENTIFICACAO] Representante "${representante.nome}" sem documento - pulando`
      );
      continue;
    }

    const tipoDocumento = representante.tipoDocumento || 'CPF'; // Assume CPF se não especificado

    console.log(
      `[IDENTIFICACAO] Verificando representante "${representante.nome}" com tipo documento: ${tipoDocumento}`
    );

    // Normaliza documento do representante (remove formatação)
    let documentoRepresentanteNormalizado: string;
    if (tipoDocumento === 'CPF') {
      documentoRepresentanteNormalizado = normalizarCpf(representante.numeroDocumento);

      // Valida CPF do representante
      if (!documentoRepresentanteNormalizado || !isCpfValido(documentoRepresentanteNormalizado)) {
        console.warn(
          `[IDENTIFICACAO] Representante "${representante.nome}" possui CPF inválido: ${representante.numeroDocumento} - pulando`
        );
        continue;
      }
    } else if (tipoDocumento === 'CNPJ') {
      documentoRepresentanteNormalizado = normalizarCnpj(representante.numeroDocumento);

      // Valida CNPJ do representante
      if (!documentoRepresentanteNormalizado || !isCnpjValido(documentoRepresentanteNormalizado)) {
        console.warn(
          `[IDENTIFICACAO] Representante "${representante.nome}" possui CNPJ inválido: ${representante.numeroDocumento} - pulando`
        );
        continue;
      }
    } else {
      console.warn(
        `[IDENTIFICACAO] Representante "${representante.nome}" possui tipo documento desconhecido: ${tipoDocumento} - pulando`
      );
      continue;
    }

    // Compara documentos normalizados (funciona tanto para CPF quanto CNPJ)
    if (documentoRepresentanteNormalizado === documentoAdvogadoNormalizado) {
      const tipoRepresentante = tipoDocumento === 'CPF' ? 'advogado' : 'escritório';
      console.log(
        `[IDENTIFICACAO] Parte "${parte.nome}" identificada como CLIENTE (representada por ${tipoRepresentante} ${representante.nome} - ${representante.numeroOAB || 'sem OAB'}/${representante.ufOAB || 'N/A'})`
      );
      return 'cliente';
    }

    console.debug(
      `[IDENTIFICACAO] Documento do representante ${representante.nome} não corresponde ao advogado da credencial`
    );
  }

  // 5. Nenhum representante deu match → parte contrária
  console.log(
    `[IDENTIFICACAO] Parte "${parte.nome}" identificada como PARTE_CONTRARIA (${representantes.length} representantes, nenhum do escritório)`
  );
  return 'parte_contraria';
}

/**
 * Função: normalizarDocumento
 *
 * PROPÓSITO:
 * Remove caracteres não numéricos de um CPF ou CNPJ para permitir comparação.
 * Função genérica que funciona tanto para CPF (11 dígitos) quanto CNPJ (14 dígitos).
 *
 * TRANSFORMAÇÕES:
 * - "123.456.789-00" → "12345678900" (CPF)
 * - "12.345.678/0001-90" → "12345678000190" (CNPJ)
 * - "123 456 789 00" → "12345678900"
 * - "12345678900" → "12345678900" (já normalizado)
 *
 * RETORNO:
 * - String apenas com dígitos
 * - String vazia se input for inválido
 */
export function normalizarDocumento(documento: string | undefined | null): string {
  if (!documento) return '';

  // Remove tudo que não é dígito
  return documento.replace(/\D/g, '');
}

/**
 * Função: normalizarCpf
 *
 * PROPÓSITO:
 * Remove caracteres não numéricos de um CPF para permitir comparação.
 *
 * TRANSFORMAÇÕES:
 * - "123.456.789-00" → "12345678900"
 * - "123 456 789 00" → "12345678900"
 * - "12345678900" → "12345678900" (já normalizado)
 *
 * RETORNO:
 * - String apenas com dígitos
 * - String vazia se input for inválido
 */
export function normalizarCpf(cpf: string | undefined | null): string {
  if (!cpf) return '';

  // Remove tudo que não é dígito
  return cpf.replace(/\D/g, '');
}

/**
 * Função: normalizarCnpj
 *
 * PROPÓSITO:
 * Remove caracteres não numéricos de um CNPJ para permitir comparação.
 *
 * TRANSFORMAÇÕES:
 * - "12.345.678/0001-90" → "12345678000190"
 * - "12 345 678 0001 90" → "12345678000190"
 * - "12345678000190" → "12345678000190" (já normalizado)
 *
 * RETORNO:
 * - String apenas com dígitos
 * - String vazia se input for inválido
 */
export function normalizarCnpj(cnpj: string | undefined | null): string {
  if (!cnpj) return '';

  // Remove tudo que não é dígito
  return cnpj.replace(/\D/g, '');
}

/**
 * Função: isCpfValido
 *
 * PROPÓSITO:
 * Valida se CPF normalizado é válido (11 dígitos e não é sequência de zeros).
 *
 * VALIDAÇÕES:
 * - Deve ter exatamente 11 dígitos
 * - Não pode ser "00000000000" (CPF inválido comum)
 * - Não pode ser "11111111111", "22222222222", etc.
 *
 * NOTA:
 * Esta é uma validação básica, não verifica dígitos verificadores.
 * Suficiente para o propósito de identificação de partes.
 */
function isCpfValido(cpfNormalizado: string): boolean {
  if (cpfNormalizado.length !== 11) return false;

  // Verifica se não é sequência de números iguais (00000000000, 11111111111, etc.)
  if (/^(\d)\1{10}$/.test(cpfNormalizado)) return false;

  return true;
}

/**
 * Função: isCnpjValido
 *
 * PROPÓSITO:
 * Valida se CNPJ normalizado é válido (14 dígitos e não é sequência de zeros).
 *
 * VALIDAÇÕES:
 * - Deve ter exatamente 14 dígitos
 * - Não pode ser "00000000000000" (CNPJ inválido comum)
 * - Não pode ser "11111111111111", "22222222222222", etc.
 *
 * NOTA:
 * Esta é uma validação básica, não verifica dígitos verificadores.
 * Suficiente para o propósito de identificação de partes.
 */
export function isCnpjValido(cnpjNormalizado: string): boolean {
  if (cnpjNormalizado.length !== 14) return false;

  // Verifica se não é sequência de números iguais (00000000000000, 11111111111111, etc.)
  if (/^(\d)\1{13}$/.test(cnpjNormalizado)) return false;

  return true;
}

/**
 * Função: isDocumentoValido
 *
 * PROPÓSITO:
 * Valida se documento normalizado (CPF ou CNPJ) é válido.
 * Aceita tanto CPF (11 dígitos) quanto CNPJ (14 dígitos).
 *
 * VALIDAÇÕES:
 * - Deve ter exatamente 11 dígitos (CPF) ou 14 dígitos (CNPJ)
 * - Não pode ser sequência de números iguais (00000000000, 11111111111111, etc.)
 *
 * NOTA:
 * Esta é uma validação básica, não verifica dígitos verificadores.
 * Suficiente para o propósito de identificação de partes.
 */
export function isDocumentoValido(documentoNormalizado: string): boolean {
  const comprimento = documentoNormalizado.length;

  // Aceita apenas CPF (11 dígitos) ou CNPJ (14 dígitos)
  if (comprimento !== 11 && comprimento !== 14) return false;

  // Verifica se não é sequência de números iguais
  // Para CPF: /^(\d)\1{10}$/ (11 dígitos)
  // Para CNPJ: /^(\d)\1{13}$/ (14 dígitos)
  const regex = comprimento === 11 ? /^(\d)\1{10}$/ : /^(\d)\1{13}$/;
  if (regex.test(documentoNormalizado)) return false;

  return true;
}

/**
 * Função: validarDocumentoAdvogado
 *
 * PROPÓSITO:
 * Valida o documento (CPF ou CNPJ) do advogado de forma isolada.
 * Lança exceção se o documento for inválido.
 *
 * PARÂMETROS:
 * - advogado: AdvogadoIdentificacao - Dados do advogado incluindo documento
 *
 * COMPORTAMENTO:
 * - Verifica se o documento está presente
 * - Normaliza o documento (remove formatação)
 * - Valida se tem 11 dígitos (CPF) ou 14 dígitos (CNPJ)
 * - Verifica se não é sequência de números iguais
 * - Lança exceção detalhada se inválido
 *
 * QUANDO USAR:
 * - Chamar uma única vez no início do fluxo de captura
 * - Antes de processar qualquer parte do processo
 * - Evita gerar erros repetidos por parte
 *
 * EXCEÇÕES:
 * - 'Documento do advogado é obrigatório para identificação'
 * - 'Documento do advogado é inválido e não pode ser usado para identificação'
 */
export function validarDocumentoAdvogado(advogado: AdvogadoIdentificacao): void {
  if (!advogado) {
    throw new Error('Advogado é obrigatório para validação');
  }

  if (!advogado.documento) {
    throw new Error('Documento do advogado é obrigatório para identificação');
  }

  const documentoNormalizado = normalizarDocumento(advogado.documento);

  if (!documentoNormalizado || !isDocumentoValido(documentoNormalizado)) {
    throw new Error('Documento do advogado é inválido e não pode ser usado para identificação');
  }
}

/**
 * Função: isTipoEspecial
 *
 * PROPÓSITO:
 * Verifica se o tipo da parte está na lista de tipos especiais (terceiros).
 *
 * PARÂMETROS:
 * - tipoParte: string - Tipo da parte retornado pelo PJE
 *
 * RETORNO:
 * - true: Tipo está na lista de tipos especiais
 * - false: Tipo não é especial (pode ser cliente ou parte contrária)
 *
 * COMPORTAMENTO:
 * - Comparação case-insensitive
 * - Remove underscores e espaços antes de comparar
 */
export function isTipoEspecial(tipoParte: string | undefined): boolean {
  if (!tipoParte) return false;

  const tipoNormalizado = tipoParte.toUpperCase().replace(/[_\s]/g, '');

  return TIPOS_ESPECIAIS.some(
    (tipoEspecial) => tipoEspecial.replace(/[_\s]/g, '') === tipoNormalizado
  );
}