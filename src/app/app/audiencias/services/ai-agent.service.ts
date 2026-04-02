/**
 * Serviço de busca de audiências por CPF do cliente
 *
 * Orquestra:
 * - Busca no PostgreSQL (audiencias + processo_partes + clientes)
 * - Formatação sanitizada para consumo pelo Agente IA
 */

import type {
  AudienciaClienteCpfRow,
  AudienciasClienteCpfResponse,
  AudienciaRespostaIA,
  ClienteRespostaIA,
  ResumoAudienciasIA,
  LocalAudienciaIA,
} from '../domain';
import { buscarAudienciasPorCpf } from '../repository';
import { sanitizeForLogs } from '@/lib/utils/sanitize-logs';

// ============================================================================
// Funções de Formatação
// ============================================================================

/**
 * Formata CPF para exibição (123.456.789-01)
 */
function formatarCpf(cpf: string): string {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return cpf;

  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata data para DD/MM/YYYY
 */
function formatarData(data: string | Date | null): string | null {
  if (!data) return null;

  const dateObj = typeof data === 'string' ? new Date(data) : data;
  if (isNaN(dateObj.getTime())) return null;

  const dia = dateObj.getDate().toString().padStart(2, '0');
  const mes = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const ano = dateObj.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata horário para HH:mm
 */
function formatarHora(hora: string | null): string | null {
  if (!hora) return null;

  // Se já está no formato HH:mm:ss ou HH:mm, extrair apenas HH:mm
  const match = hora.match(/^(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }

  return hora;
}

/**
 * Formata intervalo de horário
 */
function formatarHorario(horaInicio: string | null, horaFim: string | null): string {
  const inicio = formatarHora(horaInicio);
  const fim = formatarHora(horaFim);

  if (inicio && fim) {
    return `${inicio} - ${fim}`;
  }

  if (inicio) {
    return inicio;
  }

  return 'Horário não informado';
}

/**
 * Traduz código do TRT para nome completo
 */
function traduzirTrt(trt: string): string {
  const trtNormalizado = trt.toUpperCase().replace('TRT', 'TRT');
  const nomes: Record<string, string> = {
    TRT1: 'TRT da 1ª Região (RJ)',
    TRT2: 'TRT da 2ª Região (SP Capital)',
    TRT3: 'TRT da 3ª Região (MG)',
    TRT4: 'TRT da 4ª Região (RS)',
    TRT5: 'TRT da 5ª Região (BA)',
    TRT6: 'TRT da 6ª Região (PE)',
    TRT7: 'TRT da 7ª Região (CE)',
    TRT8: 'TRT da 8ª Região (PA/AP)',
    TRT9: 'TRT da 9ª Região (PR)',
    TRT10: 'TRT da 10ª Região (DF/TO)',
    TRT11: 'TRT da 11ª Região (AM/RR)',
    TRT12: 'TRT da 12ª Região (SC)',
    TRT13: 'TRT da 13ª Região (PB)',
    TRT14: 'TRT da 14ª Região (RO/AC)',
    TRT15: 'TRT da 15ª Região (Campinas)',
    TRT16: 'TRT da 16ª Região (MA)',
    TRT17: 'TRT da 17ª Região (ES)',
    TRT18: 'TRT da 18ª Região (GO)',
    TRT19: 'TRT da 19ª Região (AL)',
    TRT20: 'TRT da 20ª Região (SE)',
    TRT21: 'TRT da 21ª Região (RN)',
    TRT22: 'TRT da 22ª Região (PI)',
    TRT23: 'TRT da 23ª Região (MT)',
    TRT24: 'TRT da 24ª Região (MS)',
  };
  return nomes[trtNormalizado] || trt;
}

/**
 * Traduz tipo_parte para texto amigável
 */
function traduzirTipoParte(tipoParte: string): string {
  const nomes: Record<string, string> = {
    AUTOR: 'Autor',
    REU: 'Réu',
    RECLAMANTE: 'Reclamante',
    RECLAMADO: 'Reclamado',
    EXEQUENTE: 'Exequente',
    EXECUTADO: 'Executado',
    EMBARGANTE: 'Embargante',
    EMBARGADO: 'Embargado',
    APELANTE: 'Apelante',
    APELADO: 'Apelado',
    AGRAVANTE: 'Agravante',
    AGRAVADO: 'Agravado',
    OUTRO: 'Outro',
  };
  return nomes[tipoParte] || tipoParte;
}

/**
 * Traduz status de audiência para texto amigável
 */
function traduzirStatusAudiencia(status: string, descricao: string | null): string {
  if (descricao) return descricao;

  const nomes: Record<string, string> = {
    M: 'Designada',
    C: 'Cancelada',
    F: 'Realizada',
    A: 'Adiada',
    R: 'Redesignada',
  };
  return nomes[status] || status;
}

/**
 * Traduz modalidade para texto amigável
 */
function traduzirModalidade(modalidade: 'virtual' | 'presencial' | 'hibrida' | null): 'Virtual' | 'Presencial' | 'Híbrida' {
  if (modalidade === 'virtual') return 'Virtual';
  if (modalidade === 'presencial') return 'Presencial';
  if (modalidade === 'hibrida') return 'Híbrida';
  return 'Virtual'; // Default
}

/**
 * Formata endereço presencial
 */
function formatarEndereco(endereco: Record<string, unknown> | null): string | null {
  if (!endereco) return null;

  const partes: string[] = [];

  if (endereco.logradouro) {
    let linha = String(endereco.logradouro);
    if (endereco.numero) linha += `, ${endereco.numero}`;
    if (endereco.complemento) linha += ` - ${endereco.complemento}`;
    partes.push(linha);
  }

  if (endereco.bairro) partes.push(String(endereco.bairro));

  if (endereco.cidade || endereco.municipio) {
    let linha = String(endereco.cidade || endereco.municipio);
    if (endereco.estado || endereco.uf) linha += `/${endereco.estado || endereco.uf}`;
    partes.push(linha);
  }

  if (endereco.cep) partes.push(`CEP: ${endereco.cep}`);

  return partes.length > 0 ? partes.join(' - ') : null;
}

/**
 * Formata local da audiência
 */
function formatarLocal(audiencia: AudienciaClienteCpfRow): LocalAudienciaIA {
  const modalidade = audiencia.modalidade || 'virtual';

  let presencaHibrida: string | null = null;
  if (audiencia.presenca_hibrida === 'advogado') {
    presencaHibrida = 'Advogado comparece presencialmente';
  } else if (audiencia.presenca_hibrida === 'cliente') {
    presencaHibrida = 'Cliente comparece presencialmente';
  }

  return {
    tipo: modalidade === 'hibrida' ? 'hibrido' : modalidade,
    url_virtual: audiencia.url_audiencia_virtual,
    endereco: formatarEndereco(audiencia.endereco_presencial),
    sala: audiencia.sala_audiencia_nome,
    presenca_hibrida: presencaHibrida,
  };
}

// ============================================================================
// Formatação de Audiência
// ============================================================================

/**
 * Formata uma audiência para a resposta da API
 */
function formatarAudiencia(audiencia: AudienciaClienteCpfRow): AudienciaRespostaIA {
  // Determinar parte contrária (inverso do polo do cliente)
  const parteContraria = audiencia.polo === 'ATIVO'
    ? audiencia.polo_passivo_nome || 'Não informado'
    : audiencia.polo_ativo_nome || 'Não informado';

  return {
    numero_processo: audiencia.numero_processo,
    tipo: audiencia.tipo_audiencia_descricao || 'Audiência',
    data: formatarData(audiencia.data_inicio) || 'Data não informada',
    horario: formatarHorario(audiencia.hora_inicio, audiencia.hora_fim),
    modalidade: traduzirModalidade(audiencia.modalidade),
    status: traduzirStatusAudiencia(audiencia.status, audiencia.status_descricao),
    local: formatarLocal(audiencia),
    partes: {
      polo_ativo: audiencia.polo_ativo_nome || 'Não informado',
      polo_passivo: audiencia.polo_passivo_nome || 'Não informado',
    },
    papel_cliente: traduzirTipoParte(audiencia.tipo_parte),
    parte_contraria: parteContraria,
    tribunal: traduzirTrt(audiencia.trt),
    vara: audiencia.orgao_julgador_descricao || 'Não informado',
    sigilo: audiencia.segredo_justica,
    observacoes: audiencia.observacoes,
  };
}

// ============================================================================
// Cálculo de Resumo
// ============================================================================

/**
 * Calcula o resumo estatístico das audiências
 */
function calcularResumo(audiencias: AudienciaClienteCpfRow[]): ResumoAudienciasIA {
  const agora = new Date();
  let futuras = 0;
  let realizadas = 0;
  let canceladas = 0;

  for (const audiencia of audiencias) {
    const dataAudiencia = new Date(audiencia.data_inicio);

    // Verificar status
    if (audiencia.status === 'C') {
      canceladas++;
    } else if (audiencia.status === 'F') {
      realizadas++;
    } else if (dataAudiencia > agora) {
      futuras++;
    } else {
      realizadas++;
    }
  }

  return {
    total_audiencias: audiencias.length,
    futuras,
    realizadas,
    canceladas,
  };
}

// ============================================================================
// Função Principal
// ============================================================================

/**
 * Busca todas as audiências de um cliente pelo CPF
 * Retorna dados sanitizados e formatados para consumo pelo Agente IA WhatsApp
 *
 * @param cpf - CPF do cliente (aceita formato com ou sem pontuação)
 * @returns Resposta formatada com cliente, resumo e audiências
 */
export async function buscarAudienciasClientePorCpf(
  cpf: string
): Promise<AudienciasClienteCpfResponse> {
  // Normalizar CPF (remover pontuação)
  const cpfNormalizado = cpf.replace(/\D/g, '');

  if (cpfNormalizado.length !== 11) {
    return {
      success: false,
      error: 'CPF inválido. Deve conter 11 dígitos.',
    };
  }

  const cpfLog = (sanitizeForLogs({ cpf: cpfNormalizado }) as { cpf: string }).cpf;
  console.log(`🔍 [BuscarAudienciasCpf] Iniciando busca para CPF ${cpfLog}`);

  try {
    // 1. Buscar audiências no PostgreSQL
    const resultado = await buscarAudienciasPorCpf(cpfNormalizado);

    if (!resultado.cliente) {
      console.log('ℹ️ [BuscarAudienciasCpf] Cliente não encontrado');
      return {
        success: false,
        error: 'Cliente não encontrado para este CPF.',
      };
    }

    const cliente: ClienteRespostaIA = {
      nome: resultado.cliente.nome,
      cpf: formatarCpf(resultado.cliente.cpf),
    };

    if (resultado.audiencias.length === 0) {
      console.log('ℹ️ [BuscarAudienciasCpf] Nenhuma audiência encontrada');
      return {
        success: true,
        data: {
          cliente,
          resumo: {
            total_audiencias: 0,
            futuras: 0,
            realizadas: 0,
            canceladas: 0,
          },
          audiencias: [],
        },
      };
    }

    console.log(`✅ [BuscarAudienciasCpf] ${resultado.audiencias.length} audiências encontradas`);

    // 2. Calcular resumo
    const resumo = calcularResumo(resultado.audiencias);

    // 3. Formatar audiências
    const audienciasFormatadas = resultado.audiencias.map(formatarAudiencia);

    // 4. Ordenar por data (mais próximas primeiro para futuras, mais recentes primeiro para passadas)
    audienciasFormatadas.sort((a, b) => {
      // Converter DD/MM/YYYY para Date
      const parseData = (str: string) => {
        if (str === 'Data não informada') return new Date(0);
        const [dia, mes, ano] = str.split('/').map(Number);
        return new Date(ano, mes - 1, dia);
      };

      const dataA = parseData(a.data);
      const dataB = parseData(b.data);
      const agora = new Date();

      // Audiências futuras vêm primeiro, ordenadas da mais próxima para mais distante
      const aFutura = dataA > agora;
      const bFutura = dataB > agora;

      if (aFutura && !bFutura) return -1;
      if (!aFutura && bFutura) return 1;

      // Se ambas futuras, ordenar da mais próxima para mais distante
      if (aFutura && bFutura) {
        return dataA.getTime() - dataB.getTime();
      }

      // Se ambas passadas, ordenar da mais recente para mais antiga
      return dataB.getTime() - dataA.getTime();
    });

    console.log(`✅ [BuscarAudienciasCpf] Resposta montada com sucesso`, {
      cliente: cliente.nome,
      totalAudiencias: resumo.total_audiencias,
      futuras: resumo.futuras,
      realizadas: resumo.realizadas,
      canceladas: resumo.canceladas,
    });

    return {
      success: true,
      data: {
        cliente,
        resumo,
        audiencias: audienciasFormatadas,
      },
    };

  } catch (error) {
    console.error('❌ [BuscarAudienciasCpf] Erro na busca:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno ao buscar audiências',
    };
  }
}
