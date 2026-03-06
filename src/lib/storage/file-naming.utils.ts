/**
 * Utilitários para nomeação e organização de arquivos no Backblaze B2
 * 
 * Implementa a estratégia de organização:
 * - processos/{numeroProcesso}/{tipo}/arquivo.pdf
 * - Nomes padronizados por tipo de documento
 */

/**
 * Normaliza número de processo mantendo formato original
 * Ex: 0010702-80.2025.5.03.0111 -> 0010702-80.2025.5.03.0111
 */
export function normalizarNumeroProcesso(numero: string): string {
  return numero.trim();
}

/**
 * Extrai data no formato YYYYMMDD
 * @param date - Data a ser formatada (padrão: data atual)
 * @returns String no formato YYYYMMDD (ex: 20251121)
 */
export function extrairDataFormatada(date?: Date): string {
  const d = date || new Date();
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Gera nome de arquivo para documento de timeline
 * Formato: doc_{idDocumento}.pdf (estavel, sem data, para evitar duplicatas)
 *
 * @param documentoId - ID do documento no PJE
 * @returns Nome do arquivo (ex: doc_222702194.pdf)
 */
export function gerarNomeDocumentoTimeline(documentoId: string | number): string {
  return `doc_${documentoId}.pdf`;
}

/**
 * Gera nome de arquivo para pendente de manifestação
 * Formato: exp_{idExpediente}_doc_{idDocumento}_{YYYYMMDD}.pdf
 * 
 * @param pendenteId - ID do pendente (expediente)
 * @param documentoId - ID do documento no PJE
 * @returns Nome do arquivo (ex: exp_789_doc_234517663_20251121.pdf)
 */
export function gerarNomeDocumentoPendente(
  pendenteId: string | number,
  documentoId: string | number
): string {
  const dataFormatada = extrairDataFormatada();
  return `exp_${pendenteId}_doc_${documentoId}_${dataFormatada}.pdf`;
}

/**
 * Gera nome de arquivo para ata de audiência
 * Formato: ata_{idAudiencia}_{YYYYMMDD}.pdf
 * 
 * @param audienciaId - ID da audiência
 * @returns Nome do arquivo (ex: ata_456_20251121.pdf)
 */
export function gerarNomeDocumentoAudiencia(audienciaId: string | number): string {
  const dataFormatada = extrairDataFormatada();
  return `ata_${audienciaId}_${dataFormatada}.pdf`;
}

/**
 * Gera nome de arquivo para expediente genérico
 * Formato: exp_{idExpediente}_doc_{idDocumento}_{YYYYMMDD}.pdf
 * 
 * @param expedienteId - ID do expediente
 * @param documentoId - ID do documento no PJE
 * @returns Nome do arquivo (ex: exp_123_doc_987_20251121.pdf)
 */
export function gerarNomeDocumentoExpediente(
  expedienteId: string | number,
  documentoId: string | number
): string {
  const dataFormatada = extrairDataFormatada();
  return `exp_${expedienteId}_doc_${documentoId}_${dataFormatada}.pdf`;
}

/**
 * Tipos de origem de documentos
 */
export type TipoOrigemDocumento =
  | 'timeline'
  | 'pendente_manifestacao'
  | 'audiencias'
  | 'expedientes';

/**
 * Gera caminho completo para documento no Backblaze B2
 * Formato: processos/{numeroProcesso}/{tipoOrigem}/arquivo.pdf
 * 
 * @param numeroProcesso - Número do processo (ex: 0010702-80.2025.5.03.0111)
 * @param tipoOrigem - Tipo de origem do documento
 * @param nomeArquivo - Nome do arquivo gerado pelas funções acima
 * @returns Caminho completo (ex: processos/0010702-80.2025.5.03.0111/timeline/doc_123_20251121.pdf)
 */
export function gerarCaminhoDocumento(
  numeroProcesso: string,
  tipoOrigem: TipoOrigemDocumento,
  nomeArquivo: string
): string {
  const processoNormalizado = normalizarNumeroProcesso(numeroProcesso);
  return `processos/${processoNormalizado}/${tipoOrigem}/${nomeArquivo}`;
}

/**
 * Gera caminho e nome de arquivo completo para pendente de manifestação
 * 
 * @param numeroProcesso - Número do processo
 * @param pendenteId - ID do pendente
 * @param documentoId - ID do documento
 * @returns Caminho completo no Backblaze
 */
export function gerarCaminhoCompletoPendente(
  numeroProcesso: string,
  pendenteId: string | number,
  documentoId: string | number
): string {
  const nomeArquivo = gerarNomeDocumentoPendente(pendenteId, documentoId);
  return gerarCaminhoDocumento(numeroProcesso, 'pendente_manifestacao', nomeArquivo);
}

/**
 * Gera caminho e nome de arquivo completo para documento de timeline
 * 
 * @param numeroProcesso - Número do processo
 * @param documentoId - ID do documento
 * @returns Caminho completo no Backblaze
 */
export function gerarCaminhoCompletoTimeline(
  numeroProcesso: string,
  documentoId: string | number
): string {
  const nomeArquivo = gerarNomeDocumentoTimeline(documentoId);
  return gerarCaminhoDocumento(numeroProcesso, 'timeline', nomeArquivo);
}
