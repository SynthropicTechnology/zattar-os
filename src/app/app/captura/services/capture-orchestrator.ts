/**
 * CAPTURA ORCHESTRATOR - Camada de Abstração de Serviço
 *
 * Este serviço atua como uma camada de orquestração de alto nível para integrações de captura.
 * Ele isola a lógica de negócios da infraestrutura do backend e utiliza drivers polimórficos.
 *
 * Responsabilidades:
 * 1. Coordenar o fluxo de captura (AUTH -> BUSCA -> PARSE -> PERSISTÊNCIA)
 * 2. Gerenciar erros e logs de auditoria
 * 3. Integrar com outros módulos (ex: Processos)
 *
 * @module features/captura/services/capture-orchestrator
 */

import { Result, ok, err, appError } from '@/types';
import { getDriver } from '../drivers/factory';
import { buscarCredencial, buscarConfigTribunal, salvarLogCaptura } from '../repository';
import { criarProcesso } from '@/app/app/processos/service';
import { getAdvogadoByCredentialId } from '../credentials/credential.service';
import type { JudicialDriver } from '../drivers/judicial-driver.interface';
import type {
    ConfigTribunal,
    BuscarProcessosParams,
    ResultadoCaptura,
    TipoCaptura,
} from '../domain';
import { mapearTipoAcessoParaGrau, mapearTipoCapturaParaOrigem } from '../domain';
import type { CreateProcessoInput } from '@/app/app/processos/domain';

/**
 * Parâmetros para executar uma captura
 */
export interface ExecutarCapturaParams {
    tribunalId: string;
    credencialId: number;
    tipoCaptura: TipoCaptura;
    periodo?: {
        dataInicio: string; // YYYY-MM-DD
        dataFim: string; // YYYY-MM-DD
    };
    filtros?: Record<string, unknown>;
}

/**
 * Executa uma captura de processos/audiências via orquestrador.
 * Esta é a função principal que deve ser utilizada por API Routes e Server Actions.
 *
 * Fluxo:
 * 1. Buscar credencial e configuração do tribunal
 * 2. Obter driver via Factory (polimórfico)
 * 3. Autenticar no sistema judicial
 * 4. Buscar processos/audiências
 * 5. Persistir resultados
 * 6. Encerrar driver
 */
export async function executarCaptura(
    params: ExecutarCapturaParams
): Promise<Result<ResultadoCaptura>> {
    let driver: JudicialDriver | null = null;

    try {
        // 1. Buscar credencial
        const credencial = await buscarCredencial(params.credencialId);
        if (!credencial) {
            return err(appError('NOT_FOUND', 'Credencial não encontrada'));
        }

        // 2. Buscar configuração do tribunal
        const config = await buscarConfigTribunal(params.tribunalId);
        if (!config) {
            return err(appError('NOT_FOUND', 'Configuração do tribunal não encontrada'));
        }

        // 3. Obter driver via Factory (polimórfico - não sabe se é PJE, ESAJ, etc)
        driver = await getDriver(params.tribunalId);

        // 4. Autenticar (polimórfico)
        await driver.autenticar(credencial, config);

        // 5. Buscar processos (polimórfico)
        const paramsBusca: BuscarProcessosParams = {
            tipo: params.tipoCaptura,
            periodo: params.periodo,
            filtros: params.filtros,
        };

        const resultado = await driver.buscarProcessos(paramsBusca);

        // 6. Preencher metadados faltantes
        resultado.metadados.tribunal = params.tribunalId;
        resultado.metadados.grau = mapearTipoAcessoParaGrau(config.tipoAcesso);

        // 7. Buscar advogadoId da credencial
        const advogado = await getAdvogadoByCredentialId(params.credencialId);
        if (!advogado) {
            return err(appError('NOT_FOUND', 'Advogado não encontrado para a credencial fornecida'));
        }

        // 8. Persistir resultados
        await persistirResultado(
            resultado,
            params.tribunalId,
            config,
            advogado.id,
            params.tipoCaptura
        );

        // 9. Salvar log
        await salvarLogCaptura({
            tribunalId: params.tribunalId,
            credencialId: params.credencialId,
            tipo: params.tipoCaptura,
            resultado: resultado,
            duracaoMs: resultado.metadados.duracaoMs,
        });

        return ok(resultado);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Salvar log de erro
        await salvarLogCaptura({
            tribunalId: params.tribunalId,
            credencialId: params.credencialId,
            tipo: params.tipoCaptura,
            resultado: null,
            erro: errorMessage,
            duracaoMs: 0,
        }).catch(() => {
            // Ignorar erro ao salvar log
        });

        return err(appError('EXTERNAL_SERVICE_ERROR', errorMessage, { params }));
    } finally {
        // 10. Sempre fechar driver
        if (driver) {
            try {
                await driver.encerrar();
            } catch (error) {
                console.error('Erro ao encerrar driver:', error);
                // Não propagar erro de encerramento
            }
        }
    }
}

/**
 * Persiste resultados da captura no banco de dados.
 * Método auxiliar interno do orquestrador.
 */
async function persistirResultado(
    resultado: ResultadoCaptura,
    tribunalId: string,
    config: ConfigTribunal,
    advogadoId: number,
    tipoCaptura: TipoCaptura
): Promise<void> {
    // Mapear origem a partir do tipo de captura
    const origem = mapearTipoCapturaParaOrigem(tipoCaptura);

    // Usar código do tribunal (tribunalCodigo) em vez de tribunalId
    // O código é compatível com o que o domínio de processos espera
    const trtCodigo = config.tribunalCodigo || tribunalId;

    for (const processo of resultado.processos) {
        try {
            // Mapear ProcessoCapturado para CreateProcessoInput
            const input: CreateProcessoInput = {
                idPje: processo.idPje,
                advogadoId: advogadoId,
                origem: origem,
                trt: trtCodigo,
                grau: resultado.metadados.grau,
                numeroProcesso: processo.numeroProcesso,
                numero: parseInt(processo.numeroProcesso.split('-')[0], 10) || 0,
                descricaoOrgaoJulgador: processo.orgaoJulgador,
                classeJudicial: processo.classeJudicial,
                codigoStatusProcesso: processo.status,
                nomeParteAutora: processo.parteAutora,
                nomeParteRe: processo.parteRe,
                dataAutuacao: processo.dataAutuacao,
                segredoJustica: false,
                juizoDigital: false,
                temAssociacao: false,
                prioridadeProcessual: 0,
                qtdeParteAutora: 1,
                qtdeParteRe: 1,
            };

            // Tentar criar processo
            const result = await criarProcesso(input);

            if (!result.success) {
                // Se processo já existe, tentar atualizar
                if (result.error.code === 'VALIDATION_ERROR' && result.error.message.includes('já existe')) {
                    // TODO: Implementar atualização de processo existente
                    console.warn(`Processo ${processo.numeroProcesso} já existe, pulando...`);
                } else {
                    console.error(`Erro ao criar processo ${processo.numeroProcesso}:`, result.error);
                }
            }
        } catch (error) {
            console.error(`Erro ao persistir processo ${processo.numeroProcesso}:`, error);
            // Continuar com próximo processo mesmo em caso de erro
        }
    }
}
