/**
 * Arquivo: captura/services/partes/types.ts
 *
 * PROPÓSITO:
 * Define tipos TypeScript para resultados de captura de partes de processos.
 * Estes tipos são usados pelos serviços de captura e endpoints de API.
 *
 * EXPORTAÇÕES:
 * - CapturaPartesResult: Tipo para resultado de captura de partes de um processo
 * - CapturaPartesErro: Tipo para erros ocorridos durante captura
 * - TipoParteClassificacao: Union type para classificação de partes
 *
 * QUEM USA ESTE ARQUIVO:
 * - backend/captura/services/partes/partes-capture.service.ts
 * - app/api/captura/trt/partes/route.ts
 */

import type { PartePJE } from '@/app/(authenticated)/captura/pje-trt/partes/types';

/**
 * Tipo: TipoParteClassificacao
 *
 * PROPÓSITO:
 * Union type para os três tipos possíveis de classificação de partes.
 * 
 * IMPORTANTE:
 * Este tipo é idêntico a `EntidadeTipoProcessoParte` do sistema interno.
 * Mantido separado para clareza semântica (classificação vs entidade).
 *
 * VALORES POSSÍVEIS:
 * - 'cliente': Parte representada por advogado do nosso escritório
 * - 'parte_contraria': Parte oposta ao nosso cliente (não representada por nós)
 * - 'terceiro': Parte especial (perito, MP, testemunha, etc.)
 */
export type TipoParteClassificacao = 'cliente' | 'parte_contraria' | 'terceiro';

/**
 * Tipo: CapturaPartesErro
 *
 * PROPÓSITO:
 * Representa um erro ocorrido durante o processamento de uma parte específica.
 * Usado para registrar falhas parciais sem interromper toda a captura.
 *
 * QUANDO É USADO:
 * - Erro ao fazer upsert da entidade (cliente/parte_contraria/terceiro)
 * - Erro ao salvar representantes
 * - Erro ao criar vínculo processo-parte
 * - Erro ao buscar representantes via API PJE
 *
 * EXEMPLO:
 * {
 *   parteIndex: 2,
 *   parteDados: { idParte: 123, nome: "João Silva", ... },
 *   erro: "Erro ao fazer upsert de cliente: duplicate key value"
 * }
 */
export interface CapturaPartesErro {
  /** Índice da parte na lista (0-based) - útil para debugging */
  parteIndex: number;

  /** Dados parciais da parte que causou erro - evita logar objeto completo */
  parteDados: Partial<PartePJE>;

  /** Mensagem de erro descritiva */
  erro: string;
}

/**
 * Tipo: CapturaPartesResult
 *
 * PROPÓSITO:
 * Resultado completo da captura de partes de um processo.
 * Contém contadores de sucesso e lista de erros para auditoria.
 *
 * QUANDO É RETORNADO:
 * - Após conclusão de capturarPartesProcesso() (sucesso ou falha parcial)
 * - Usado como resposta do endpoint POST /api/captura/trt/partes
 *
 * CENÁRIOS:
 *
 * 1. Sucesso total:
 *    {
 *      processoId: 100,
 *      numeroProcesso: "0001234-56.2024.5.03.0001",
 *      totalPartes: 3,
 *      clientes: 1,
 *      partesContrarias: 1,
 *      terceiros: 1,
 *      representantes: 5,
 *      vinculos: 3,
 *      erros: [],
 *      duracaoMs: 2500
 *    }
 *
 * 2. Falha parcial (1 parte falhou):
 *    {
 *      processoId: 100,
 *      numeroProcesso: "0001234-56.2024.5.03.0001",
 *      totalPartes: 3,
 *      clientes: 1,
 *      partesContrarias: 0, // Falhou
 *      terceiros: 1,
 *      representantes: 3,
 *      vinculos: 2,
 *      erros: [
 *        {
 *          parteIndex: 1,
 *          parteDados: { idParte: 456, nome: "Empresa XYZ" },
 *          erro: "Erro ao fazer upsert: CNPJ inválido"
 *        }
 *      ],
 *      duracaoMs: 3200
 *    }
 *
 * 3. Processo sem partes:
 *    {
 *      processoId: 100,
 *      numeroProcesso: "0001234-56.2024.5.03.0001",
 *      totalPartes: 0,
 *      clientes: 0,
 *      partesContrarias: 0,
 *      terceiros: 0,
 *      representantes: 0,
 *      vinculos: 0,
 *      erros: [],
 *      duracaoMs: 800
 *    }
 */
export interface CapturaPartesResult {
  /** ID do processo na tabela acervo - referência para log e auditoria */
  processoId: number;

  /** Número CNJ do processo - ex: "0001234-56.2024.5.03.0001" */
  numeroProcesso: string;

  /** Total de partes encontradas no processo (independente de sucesso/falha) */
  totalPartes: number;

  /** Quantidade de clientes identificados e salvos com sucesso */
  clientes: number;

  /** Quantidade de partes contrárias identificadas e salvas com sucesso */
  partesContrarias: number;

  /** Quantidade de terceiros identificados e salvos com sucesso */
  terceiros: number;

  /** Total de representantes salvos (soma de todas as partes) */
  representantes: number;

  /** Total de vínculos processo-parte criados em processo_partes */
  vinculos: number;

  /** Lista de erros ocorridos durante processamento - vazio [] se tudo ok */
  erros: CapturaPartesErro[];

  /** Tempo total de execução em milissegundos - útil para monitoramento de performance */
  duracaoMs: number;

  /** JSON bruto completo retornado pela API PJE - para auditoria (Supabase JSONB) */
  payloadBruto: Record<string, unknown> | null;
}