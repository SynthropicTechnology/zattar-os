import { createServiceClient } from '@/lib/supabase/service-client';
import { DifyService } from '@/lib/dify/service';
import * as documentosService from '@/app/(authenticated)/documentos/service';
import * as expedientesRepository from '@/app/(authenticated)/expedientes/repository';
import type { Expediente } from '@/app/(authenticated)/expedientes/domain';
import * as assistentesTiposRepository from './repository';
import type { Value } from 'platejs';

/**
 * SERVIÇO DE GERAÇÃO AUTOMÁTICA DE PEÇAS
 * 
 * Orquestra o processo completo de geração automática de peças jurídicas:
 * 1. Identifica o assistente configurado para o tipo de expediente
 * 2. Extrai os campos necessários do metadata do Dify
 * 3. Busca dados do expediente/processo
 * 4. Prepara e envia requisição para o Dify
 * 5. Cria documento com o resultado
 * 6. Vincula documento ao expediente
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ResultadoGeração {
  documento_id: number;
  expediente_id: number;
  sucesso: boolean;
  mensagem: string;
  conteudo_gerado?: string;
}

interface CampoFormulario {
  type: string;
  label: string;
  variable: string;
  required?: boolean;
}

interface MetadataDify {
  info?: {
    name: string;
    description?: string;
  };
  parameters?: {
    user_input_form?: Array<Record<string, CampoFormulario>>;
  };
  meta?: Record<string, unknown>;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Gera automaticamente uma peça jurídica para um expediente
 */
export async function gerarPecaAutomatica(
  expediente_id: number,
  usuario_id: number
): Promise<ResultadoGeração> {
  try {
    // 1. Buscar expediente
    const expedienteResult = await expedientesRepository.findExpedienteById(expediente_id);
    if (!expedienteResult.success || !expedienteResult.data) {
      throw new Error('Expediente não encontrado');
    }
    const expediente = expedienteResult.data;

    // 2. Verificar se tem tipo configurado
    if (!expediente.tipoExpedienteId) {
      return {
        documento_id: 0,
        expediente_id,
        sucesso: false,
        mensagem: 'Expediente não possui tipo configurado',
      };
    }

    // 3. Buscar assistente configurado para este tipo
    const relacao = await assistentesTiposRepository.buscarPorTipoExpediente(
      expediente.tipoExpedienteId
    );

    if (!relacao || !relacao.ativo) {
      return {
        documento_id: 0,
        expediente_id,
        sucesso: false,
        mensagem: 'Nenhum assistente configurado para este tipo de expediente',
      };
    }

    if (!relacao.assistente_dify_app_id) {
      return {
        documento_id: 0,
        expediente_id,
        sucesso: false,
        mensagem: 'Assistente configurado não possui integração com Dify',
      };
    }

    // 4. Buscar metadata do app Dify
    const supabase = createServiceClient();
    const { data: difyApp, error: difyError } = await supabase
      .from('dify_apps')
      .select('api_key, api_url, metadata')
      .eq('id', relacao.assistente_dify_app_id)
      .single();

    if (difyError || !difyApp) {
      throw new Error('App Dify não encontrado');
    }

    const metadata = difyApp.metadata as MetadataDify;

    // 5. Extrair campos necessários do formulário
    const campos = extrairCamposFormulario(metadata);

    // 6. Preparar dados do expediente/processo
    const dadosPreparados = await prepararDadosExpediente(expediente, campos);

    // 7. Chamar API Dify
    const difyService = new DifyService(difyApp.api_key, difyApp.api_url);
    
    // Determinar se é chat ou workflow baseado no metadata
    const isWorkflow = metadata.info?.name?.toLowerCase().includes('workflow');
    
    let textoGerado: string;
    
    if (isWorkflow) {
      const workflowResult = await difyService.executarWorkflow(
        {
          inputs: dadosPreparados,
        },
        `user_${usuario_id}`
      );

      if (workflowResult.isErr()) {
        throw new Error(`Erro ao executar workflow: ${workflowResult.error.message}`);
      }

      const workflowData = workflowResult.value;
      textoGerado = extrairTextoDeWorkflow(workflowData);
    } else {
      const chatResult = await difyService.enviarMensagem(
        {
          query: preparQueryChat(dadosPreparados),
          inputs: dadosPreparados,
        },
        `user_${usuario_id}`
      );

      if (chatResult.isErr()) {
        throw new Error(`Erro ao enviar mensagem: ${chatResult.error.message}`);
      }

      textoGerado = chatResult.value.answer;
    }

    // 8. Criar documento com o resultado
    const tituloDocumento = `${metadata.info?.name || 'Peça'} - ${expediente.numeroProcesso || 'Processo'}`;
    
    const conteudoPlate: Value = converterTextoParaPlate(textoGerado);

    const documento = await documentosService.criarDocumento(
      {
        titulo: tituloDocumento,
        conteudo: conteudoPlate,
        descricao: `Gerado automaticamente pelo assistente ${relacao.assistente_nome}`,
        tags: ['gerado-automaticamente', 'dify', metadata.info?.name || 'peça'],
      },
      usuario_id
    );

    // 9. Vincular documento ao expediente
    await supabase
      .from('expedientes')
      .update({ id_documento: documento.id })
      .eq('id', expediente_id);

    return {
      documento_id: documento.id,
      expediente_id,
      sucesso: true,
      mensagem: 'Peça gerada com sucesso',
      conteudo_gerado: textoGerado.substring(0, 500), // Preview
    };

  } catch (error) {
    console.error('Erro ao gerar peça automática:', error);
    return {
      documento_id: 0,
      expediente_id,
      sucesso: false,
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido ao gerar peça',
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extrai campos do formulário do metadata Dify
 */
function extrairCamposFormulario(metadata: MetadataDify): CampoFormulario[] {
  const campos: CampoFormulario[] = [];
  
  if (!metadata.parameters?.user_input_form) {
    return campos;
  }

  for (const fieldWrapper of metadata.parameters.user_input_form) {
    // Cada item é um objeto com uma chave que é o tipo do campo
    const fieldType = Object.keys(fieldWrapper)[0];
    const field = fieldWrapper[fieldType];
    
    if (field && field.variable) {
      campos.push({
        type: field.type || fieldType,
        label: field.label || field.variable,
        variable: field.variable,
        required: field.required || false,
      });
    }
  }

  return campos;
}

/**
 * Prepara dados do expediente/processo para enviar ao Dify
 */
async function prepararDadosExpediente(
  expediente: Expediente,
  campos: CampoFormulario[]
): Promise<Record<string, string>> {
  const dados: Record<string, string> = {};

  // Mapear campos comuns do expediente
  const mapeamentos: Record<string, string> = {
    'reclamante': expediente.nomeParteAutora || '',
    'reclamada': expediente.nomeParteRe || '',
    'admissao': expediente.dataAutuacao || '',
    'rescisao': expediente.dataArquivamento || '',
    'processo': expediente.numeroProcesso || '',
    'numero_processo': expediente.numeroProcesso || '',
    'tribunal': expediente.trt || '',
    'grau': expediente.grau || '',
    'vara': expediente.siglaOrgaoJulgador || '',
    'orgao_julgador': expediente.siglaOrgaoJulgador || '',
    'relato_entrevista': expediente.descricaoArquivos || expediente.observacoes || '',
    'observacoes': expediente.observacoes || '',
    'prazo': expediente.dataPrazoLegalParte || '',
  };

  // Preencher apenas os campos que o formulário solicita
  for (const campo of campos) {
    const variableLower = campo.variable.toLowerCase();
    
    if (mapeamentos[variableLower]) {
      dados[campo.variable] = mapeamentos[variableLower];
    } else {
      // Tentar matching parcial
      const matchKey = Object.keys(mapeamentos).find(key => 
        variableLower.includes(key) || key.includes(variableLower)
      );
      
      if (matchKey) {
        dados[campo.variable] = mapeamentos[matchKey];
      } else {
        dados[campo.variable] = ''; // Campo não encontrado
      }
    }
  }

  return dados;
}

/**
 * Prepara query para chat do Dify
 */
function preparQueryChat(dados: Record<string, string>): string {
  return `Por favor, gere a peça jurídica com base nos seguintes dados: ${JSON.stringify(dados, null, 2)}`;
}

/**
 * Extrai texto do resultado de workflow
 */
function extrairTextoDeWorkflow(workflowData: { data?: { outputs?: { text?: string; output?: string } } }): string {
  // Tentar extrair de diferentes possíveis estruturas
  if (workflowData.data?.outputs?.text) {
    return workflowData.data.outputs.text;
  }
  
  if (workflowData.data?.outputs?.output) {
    return workflowData.data.outputs.output;
  }
  
  if (typeof workflowData.data?.outputs === 'string') {
    return workflowData.data.outputs;
  }

  // Fallback: converter para string
  return JSON.stringify(workflowData.data?.outputs || workflowData, null, 2);
}

/**
 * Converte texto simples para estrutura Plate.js
 */
function converterTextoParaPlate(texto: string): Value {
  // Dividir por parágrafos (linhas vazias ou \n\n)
  const paragrafos = texto.split(/\n\n+/);
  
  return paragrafos.map(paragrafo => ({
    type: 'p',
    children: [{ text: paragrafo.trim() }],
  })) as Value;
}
