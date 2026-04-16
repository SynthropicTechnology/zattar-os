"use client";

import { useState, useRef } from "react";
import { useFormularioStore } from '@/shared/assinatura-digital/store';
import CanvasAssinatura, { type CanvasAssinaturaRef } from '@/shared/assinatura-digital/components/signature/canvas-assinatura';
import FormStepLayout from "./form-step-layout";
import { toast } from "sonner";
import { apiFetch } from "@/lib/http/api-fetch";
import { v4 as uuidv4 } from 'uuid'; // Comment 6: Para gerar requestId único
import { API_ROUTES } from '@/shared/assinatura-digital/constants';
import { collectDeviceFingerprint } from '@/shared/assinatura-digital/utils';
import type { DeviceFingerprintData } from '@/shared/assinatura-digital/types/api';
import {
  validateSignatureQuality,
  validatePhotoQuality,
  validateDataConsistency,
} from '@/shared/assinatura-digital/utils';

async function getClientIP(): Promise<{ ip: string; source?: string }> {
  try {
    const response = await apiFetch<{ ip: string; source?: string; warning?: string }>(API_ROUTES.getClientIp);
    const ip = response.data?.ip || "unknown";
    const source = response.data?.source || "unknown";

    console.log("📍 IP capturado:", {
      ip,
      source,
      warning: response.data?.warning
    });

    return { ip, source };
  } catch (error) {
    console.error("❌ Falha ao obter IP do cliente:", error);
    return { ip: "unknown", source: "error" };
  }
}

interface HttpError extends Error {
  response?: {
    status?: number;
    data?: {
      error?: string;
      message?: string;
      code?: string;
    };
  };
}

export default function AssinaturaManuscritaStep() {
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<CanvasAssinaturaRef>(null);

  const {
    fotoBase64,
    latitude,
    longitude,
    geolocationAccuracy,
    geolocationTimestamp,
    setAssinaturaBase64,
    dadosCPF,
    dadosPessoais,
    dadosContrato,
    setDadosAssinatura,
    setPdfsGerados,
    proximaEtapa,
    etapaAnterior,
    setSubmitting,
    templateIdSelecionado,
    templateIds,
    getCachedTemplate,
    segmentoId,
    segmentoNome,
    formularioId,
    sessaoId,
    formularioFlowConfig,
  } = useFormularioStore();

  const handleContinuar = async () => {
    // Extrair dados de termos do store
    const { termosAceite, termosVersao, termosDataAceite } = useFormularioStore.getState();

    // Verificar se assinatura foi desenhada
    if (canvasRef.current?.isEmpty()) {
      toast.error("Por favor, assine no campo acima");
      return;
    }

    setLoading(true);
    setSubmitting(true);

    try {
      // Obter assinatura em base64
      const assinatura = canvasRef.current?.getSignatureBase64() || "";

      // Validar qualidade da assinatura (apenas formato e presença)
      const assinaturaValidation = validateSignatureQuality(assinatura);
      if (!assinaturaValidation.valid) {
        toast.error(assinaturaValidation.issues[0]);
        setLoading(false);
        setSubmitting(false);
        return;
      }

      // Validar aceite de termos (obrigatório)
      if (!termosAceite || termosAceite !== true) {
        toast.error("Você deve aceitar os termos antes de assinar");
        setLoading(false);
        setSubmitting(false);
        return;
      }

      if (!termosVersao || !termosDataAceite) {
        toast.error("Dados de aceite de termos incompletos. Volte à etapa de termos.");
        setLoading(false);
        setSubmitting(false);
        return;
      }

      // IMPORTANTE: Foto é obrigatória para conformidade MP 2.200-2 quando foto_necessaria=true
      // Sem foto, não há evidência biométrica suficiente para assinatura eletrônica avançada
      // Validar foto apenas se necessária (baseado em formularioFlowConfig.foto_necessaria)
      const fotoNecessaria = formularioFlowConfig?.foto_necessaria ?? true; // Padrão: true se undefined

      if (fotoNecessaria) {
        if (!fotoBase64) {
          toast.error("Foto não encontrada. Volte e capture uma foto.");
          setLoading(false);
          setSubmitting(false);
          return;
        }

        const fotoValidation = validatePhotoQuality(fotoBase64);
        if (!fotoValidation.valid) {
          toast.error(fotoValidation.issues[0]);
          setLoading(false);
          setSubmitting(false);
          return;
        }
      }

      // Coletar device fingerprint para auditoria
      let deviceFingerprint: DeviceFingerprintData | null = null;
      try {
        deviceFingerprint = await collectDeviceFingerprint();
        console.log('📱 Device fingerprint coletado:', {
          resolution: deviceFingerprint.screen_resolution,
          platform: deviceFingerprint.platform,
          hardwareConcurrency: deviceFingerprint.hardware_concurrency,
        });
      } catch (error) {
        console.warn('⚠️ Falha ao coletar device fingerprint (não crítico):', error);
        // Não bloquear assinatura se fingerprint falhar
      }

      // Validar segmentoId
      if (!segmentoId || typeof segmentoId !== 'number' || segmentoId <= 0) {
        toast.error('Erro: ID do segmento não definido');
        setLoading(false);
        setSubmitting(false);
        return;
      }

      if (!formularioId || typeof formularioId !== 'number' || formularioId <= 0) {
        toast.error('Erro: ID do formulário não definido');
        setLoading(false);
        setSubmitting(false);
        return;
      }

      // Validar sessaoId com fallback defensivo
      let validSessaoId = sessaoId;
      if (!validSessaoId || typeof validSessaoId !== 'string' || !validSessaoId.trim()) {
        console.warn('⚠️ sessaoId ausente - tentando recuperar/gerar novo ID');

        // Tentativa de recuperação: gerar novo sessaoId
        const novoSessaoId = uuidv4();
        useFormularioStore.getState().setSessaoId(novoSessaoId);

        // Recarregar variável local
        validSessaoId = useFormularioStore.getState().sessaoId;

        // Verificar se a recuperação foi bem-sucedida
        if (!validSessaoId || typeof validSessaoId !== 'string' || !validSessaoId.trim()) {
          console.error('❌ sessaoId não definido - falha na recuperação');
          toast.error('Erro: Sessão não inicializada. Recarregue o formulário.');
          setLoading(false);
          setSubmitting(false);
          return;
        }

        console.log('✅ sessaoId recuperado:', validSessaoId);
      }

      const consistencyValidation = validateDataConsistency({
        cpf: dadosCPF?.cpf || "",
        email: dadosPessoais?.email || "",
        telefone: dadosPessoais?.celular || "",
        nomeCompleto: dadosPessoais?.nome_completo || "",
      });

      if (!consistencyValidation.valid) {
        toast.error(`Erro de consistência: ${consistencyValidation.issues[0]}`);
        setLoading(false);
        setSubmitting(false);
        return;
      }

      // Obter metadados de segurança
      const { ip, source: ipSource } = await getClientIP();
      const userAgent = window.navigator.userAgent;

      // Validar formulário para verificar se metadados de segurança são obrigatórios
      // Metadados obrigatórios se o array existe e tem elementos (padrão: ['ip', 'user_agent'])
      const metadadosSeguranca = formularioFlowConfig?.metadados_seguranca ?? ['ip', 'user_agent'];
      const metadadosSegurancaObrigatorios = metadadosSeguranca.length > 0;

      // Validar e bloquear se IP não foi capturado e metadados são obrigatórios
      if (ip === "unknown" || !ip) {
        console.warn("⚠️ IP não capturado corretamente:", {
          ip,
          source: ipSource,
          metadadosSegurancaObrigatorios,
          message: "Verifique configuração de proxy/headers. Consulte docs/TROUBLESHOOTING_IP_GEOLOCATION.md"
        });

        if (metadadosSegurancaObrigatorios) {
          // Formulário exige metadados de segurança - BLOQUEAR submissão
          toast.error(
            "Não foi possível identificar seu endereço IP. " +
            "Este documento requer validação de metadados de segurança. " +
            "Por favor, contate o suporte ou tente novamente mais tarde."
          );
          setLoading(false);
          setSubmitting(false);
          return;
        } else {
          // Formulário não exige metadados - apenas avisar
          toast(
            "Aviso: IP não identificado",
            {
              description: "Não foi possível identificar seu endereço IP. A assinatura será processada sem metadados de segurança.",
            }
          );
        }
      }

      // Extrair IDs do store
      const clienteId = dadosCPF?.clienteId || dadosPessoais?.cliente_id;
      const contratoId = dadosContrato?.contrato_id;
      const parteContrariaDados = Array.isArray(dadosContrato?.parte_contraria_dados)
        ? (dadosContrato.parte_contraria_dados as Array<{ id: number; nome: string; cpf?: string | null; cnpj?: string | null }>)
        : undefined;
      const clienteDadosPayload = dadosPessoais
        ? {
            id: dadosPessoais.cliente_id,
            nome: dadosPessoais.nome_completo,
            cpf: dadosPessoais.cpf,
            email: dadosPessoais.email,
            celular: dadosPessoais.celular || null,
            telefone: dadosPessoais.telefone || null,
            endereco: [
              dadosPessoais.endereco_logradouro,
              dadosPessoais.endereco_numero,
              dadosPessoais.endereco_bairro,
              dadosPessoais.endereco_cidade,
              dadosPessoais.endereco_uf,
              dadosPessoais.endereco_cep,
            ]
              .filter(Boolean)
              .join(', '),
          }
        : undefined;

      // Log de debug para diagnosticar problemas (apenas IDs técnicos, sem PII)
      // PII (CPF, email, nome) é removido para segurança
      if (process.env.NODE_ENV !== 'production') {
        // Em desenvolvimento, logar com mais detalhes (mas ainda mascarando PII)
        console.log('🔍 Estado antes de finalizar assinatura (dev mode):', {
          contratoId,
          clienteId,
          cpfMasked: dadosCPF?.cpf ? `***${dadosCPF.cpf.slice(-3)}` : 'N/A',
          segmentoId,
          segmentoNome,
          sessaoId: validSessaoId,
          metadadosSeguranca: {
            ipCapturado: !!ip && ip !== 'unknown',
            ipSource,
            userAgentPrefix: userAgent.substring(0, 30) + '...',
          },
          geolocalizacao: {
            capturada: typeof latitude === 'number' && typeof longitude === 'number',
            accuracy: geolocationAccuracy,
          },
          foto: {
            capturada: !!fotoBase64,
            necessaria: fotoNecessaria,
          },
          termos: {
            aceite: termosAceite,
            versao: termosVersao,
            dataAceite: termosDataAceite,
          },
          deviceFingerprint: {
            coletado: !!deviceFingerprint,
            platform: deviceFingerprint?.platform,
            resolution: deviceFingerprint?.screen_resolution,
          },
        });
      } else {
        // Em produção, logar apenas IDs técnicos
        console.log('🔍 Finalizando assinatura:', {
          contratoId,
          clienteId,
          sessaoId: validSessaoId,
          metadadosCapturados: {
            ip: !!ip && ip !== 'unknown',
            geo: typeof latitude === 'number' && typeof longitude === 'number',
            foto: !!fotoBase64,
          }
        });
      }

      // Validação robusta de clienteId
      if (!clienteId || typeof clienteId !== 'number' || clienteId <= 0) {
        toast.error("ID do cliente não encontrado. Volte e preencha os dados novamente.");
        setLoading(false);
        setSubmitting(false);
        return;
      }

      // Validação robusta de contratoId (opcional - pode ser null)
      if (contratoId !== null && contratoId !== undefined && (typeof contratoId !== 'number' || contratoId <= 0)) {
        toast.error("ID do contrato inválido. Volte e preencha o formulário novamente.");
        setLoading(false);
        setSubmitting(false);
        return;
      }

      // Comment 2: Validação rigorosa de campos obrigatórios para o backend
      // Validar templateIds
      const templatesParaGerar: string[] = templateIds || [];

      if (templatesParaGerar.length === 0) {
        toast.error("Nenhum template configurado para este formulário. Volte à seleção de formulários e tente novamente.");
        setLoading(false);
        setSubmitting(false);
        return;
      }

      // Validar segmento_nome (trim para remover espaços)
      if (!segmentoNome || typeof segmentoNome !== 'string' || !segmentoNome.trim()) {
        toast.error("Nome do segmento não definido. Volte ao início e recarregue o formulário.");
        setLoading(false);
        setSubmitting(false);
        return;
      }

      // Validar template_id selecionado ou primeiro disponível
      const templateIdParaEnvio = templateIdSelecionado || templatesParaGerar[0];
      if (!templateIdParaEnvio || !templateIdParaEnvio.trim()) {
        toast.error("ID do template não definido. Volte à etapa de visualização para revisar o documento.");
        setLoading(false);
        setSubmitting(false);
        return;
      }

      // Comment 2: Opcional - prefetch para validar existência no cache
      const cachedTemplateParaEnvio = getCachedTemplate(templateIdParaEnvio);
      if (!cachedTemplateParaEnvio) {
        console.warn('⚠️ Template não encontrado no cache:', templateIdParaEnvio);
        // Não é impeditivo - o backend validará
      }

      // Mostrar progresso
      toast(
        "Gerando documentos...",
        {
          description: `Processando ${templatesParaGerar.length} documento(s)`,
        }
      );

      // Log consolidado de captura de dados para diagnóstico (sem PII)
      if (process.env.NODE_ENV !== 'production') {
        console.log('📋 Resumo de captura de dados (dev mode):', {
          ip: {
            capturado: ip && ip !== "unknown",
            fonte: ipSource,
          },
          geolocalizacao: {
            capturada: typeof latitude === 'number' && typeof longitude === 'number',
            accuracy: geolocationAccuracy,
            hasTimestamp: !!geolocationTimestamp,
          },
          foto: {
            capturada: !!fotoBase64,
            necessaria: fotoNecessaria,
            tamanho: fotoBase64 ? `${Math.round(fotoBase64.length / 1024)}KB` : 'N/A',
          },
          template: {
            id: templateIdParaEnvio,
            total: templatesParaGerar.length,
          }
        });
      }

      // Comment 12: Payload base com geolocalização apenas quando válida
      // IMPORTANTE: Geolocalização só é incluída se latitude E longitude forem números válidos
      // Caso contrário, campos não são enviados (não enviamos null/undefined)
      // IMPORTANTE: IP só é incluído se for válido (não "unknown")
      const basePayload: Record<string, unknown> = {
        cliente_id: clienteId,
        contrato_id: contratoId ?? null,
        formulario_id: formularioId,
        assinatura_base64: assinatura,
        user_agent: userAgent,
        segmento_id: segmentoId,
        segmento_nome: segmentoNome,
        sessao_id: validSessaoId, // UUID para agrupar múltiplas assinaturas da mesma sessão

        // Conformidade legal MP 2.200-2
        termos_aceite: termosAceite,
        termos_aceite_versao: termosVersao, // Renomeado de termos_versao para alinhar com backend
      };

      if (clienteDadosPayload) {
        basePayload.cliente_dados = clienteDadosPayload;
      }

      if (parteContrariaDados && parteContrariaDados.length > 0) {
        basePayload.parte_contraria_dados = parteContrariaDados;
      }

      // Incluir dados do formulário dinâmico (acao) para resolução de variáveis no PDF
      if (dadosContrato) {
        const RESERVED_KEYS = new Set(['contrato_id', 'cliente_dados', 'parte_contraria_dados']);
        const acaoDados: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(dadosContrato)) {
          if (!RESERVED_KEYS.has(key) && value !== undefined && value !== null) {
            acaoDados[key] = value;
          }
        }
        if (Object.keys(acaoDados).length > 0) {
          basePayload.acao_dados = acaoDados;
        }
      }

      // Incluir device fingerprint se coletado
      if (deviceFingerprint) {
        basePayload.dispositivo_fingerprint_raw = deviceFingerprint;
      }

      // Incluir IP apenas se for válido (não "unknown")
      // Se metadados de segurança são obrigatórios, já teríamos bloqueado acima
      if (ip && ip !== "unknown") {
        basePayload.ip_address = ip;
      }

      // Incluir foto apenas se necessária
      if (fotoNecessaria && fotoBase64) {
        basePayload.foto_base64 = fotoBase64;
      }

      // Comment 12: Incluir campos de geolocalização somente quando latitude E longitude são números válidos
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        basePayload.latitude = latitude;
        basePayload.longitude = longitude;

        // Incluir accuracy e timestamp somente se disponíveis
        if (typeof geolocationAccuracy === 'number') {
          basePayload.geolocation_accuracy = geolocationAccuracy;
        }
        if (typeof geolocationTimestamp === 'string' && geolocationTimestamp.trim()) {
          basePayload.geolocation_timestamp = geolocationTimestamp;
        }
      }

      // Comment 6: Helper para retry com backoff exponencial
      const retryWithBackoff = async <T,>(
        fn: () => Promise<T>,
        maxRetries: number = 1,
        baseDelay: number = 1000
      ): Promise<T> => {
        let lastError: unknown;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            return await fn();
          } catch (error: unknown) {
            lastError = error;

            // Não fazer retry em erros 4xx (exceto 408 timeout)
            if (error instanceof Error && 'response' in error) {
              const httpError = error as HttpError;
              const status = httpError.response?.status;
              if (status && status >= 400 && status < 500 && status !== 408) {
                throw error; // Erro de validação, não retry
              }
            }

            // Último attempt, não esperar
            if (attempt === maxRetries) {
              throw error;
            }

            // Backoff exponencial: 1s, 2s
            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(`⏳ Retry ${attempt + 1}/${maxRetries} após ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        throw lastError;
      };

      // Comment 3 + Comment 6: Envolver chamada em try/catch com timeout e requestId
      const geracaoPromises = templatesParaGerar.map(async (templateId: string) => {
        const requestId = uuidv4(); // Comment 6: requestId único por template

        try {
          const result = await retryWithBackoff(async () => {
            const response = await apiFetch<{ pdf_url: string; protocolo: string; assinatura_id: number | null }>(API_ROUTES.finalize, {
              method: "POST",
              body: JSON.stringify({
                ...basePayload,
                template_id: templateId,
              }),
              headers: {
                'x-request-id': requestId,
              },
              // timeout is not directly supported by fetch/apiFetch usually, but we can ignore for now or implement signal
            });

            if (response.success && response.data) {
              const data = response.data;
              return {
                template_id: templateId,
                pdf_url: data.pdf_url,
                protocolo: data.protocolo,
                assinatura_id: data.assinatura_id,
              };
            } else {
              const errorMsg = response.error || response.message || 'Erro desconhecido';
              throw new Error(`Template ${templateId}: ${errorMsg}`);
            }
          }, 1);

          return result;
        } catch (error: unknown) {
          // Comment 3: Capturar erro de rede ou resposta HTTP
          if (error instanceof Error && 'response' in error) {
            const httpError = error as HttpError;
            const statusCode = httpError.response?.status;
            const errorData = httpError.response?.data;
            // Comment 2: Priorizar error antes de message na extração
            const errorMsg = errorData?.error || errorData?.message || error.message;

            // Comment 6: Detectar timeout
            const isTimeout = error.message.toLowerCase().includes('timeout') || statusCode === 408;

            // Construir objeto de erro detalhado
            const errorInfo = {
              template_id: templateId,
              requestId, // Comment 6: Incluir requestId para rastreamento
              status: statusCode,
              message: isTimeout ? `Tempo esgotado na geração do documento (template ${templateId})` : errorMsg,
              code: errorData?.code,
              isTimeout,
            };

            console.error('❌ Falha na geração de PDF:', errorInfo);
            throw errorInfo;
          } else if (error instanceof Error) {
            throw { template_id: templateId, requestId, message: error.message };
          } else {
            throw { template_id: templateId, requestId, message: 'Erro desconhecido' };
          }
        }
      });

      // Executar em paralelo com Promise.allSettled para não abortar todo fluxo se um falhar
      const resultadosSettled = await Promise.allSettled(geracaoPromises);

      // Comment 7: assinatura_id pode ser null (sucesso parcial)
      const resultados = resultadosSettled
        .filter((result): result is PromiseFulfilledResult<{ template_id: string; pdf_url: string; protocolo: string; assinatura_id: number | null }> =>
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      const falhas = resultadosSettled
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason);

      // Comment 3: Se houver falhas, agregar detalhes e exibir em console expandível
      if (falhas.length > 0) {
        console.groupCollapsed(`❌ ${falhas.length} falha(s) na geração de PDFs`);
        falhas.forEach((falha: unknown) => {
          if (typeof falha === 'object' && falha !== null && 'template_id' in falha) {
            const errObj = falha as { template_id: string; message?: string; status?: number; code?: string };
            console.error(`Template ${errObj.template_id}:`, {
              status: errObj.status || 'N/A',
              code: errObj.code || 'N/A',
              message: errObj.message || 'Erro desconhecido',
            });
          } else {
            console.error('Erro sem detalhes:', falha);
          }
        });
        console.groupEnd();

        // Construir mensagem de erro expandível com IDs dos templates que falharam
        const templatesFalhados = falhas
          .map((f: unknown) => (typeof f === 'object' && f !== null && 'template_id' in f ? (f as { template_id: string }).template_id : 'desconhecido'))
          .join(', ');

        toast(
          "Aviso: Alguns documentos falharam",
          {
            description: `${resultados.length} documento(s) gerado(s), mas ${falhas.length} falharam (IDs: ${templatesFalhados}). Verifique o console para detalhes.`,
          }
        );
      }

      // Comment 8: Se nenhum PDF foi gerado, fornecer contexto detalhado
      if (resultados.length === 0) {
        const templateIdsStr = templatesParaGerar.join(', ');
        const errorMessage = [
          `Não foi possível gerar nenhum documento.`,
          `Templates tentados: ${templatesParaGerar.length} (IDs: ${templateIdsStr})`,
          `Ação sugerida: Volte à visualização e revise o documento, ou contate o suporte informando o erro.`,
        ].join('\n');

        console.error('🚨 Erro total na geração de PDFs:', {
          templateIdsTentados: templatesParaGerar,
          totalTentativas: templatesParaGerar.length,
          falhas: falhas.length,
        });

        toast(
          "Erro: Nenhum documento gerado",
          {
            description: `Tentamos gerar ${templatesParaGerar.length} documento(s), mas todos falharam. Verifique o console para detalhes.`,
          }
        );

        throw new Error(errorMessage);
      }

      // Salvar dados no store (usar primeiro resultado como principal)
      const primeiroResultado = resultados[0];

      // Comment 12: Montar objeto de dados de assinatura sem spreads de undefined
      // Comment 3: Incluir dispositivo_fingerprint_raw no objeto de dados de assinatura
      const dadosAssinatura: {
        assinatura_id: number | null;
        assinatura_base64: string;
        foto_base64: string;
        ip_address: string;
        user_agent: string;
        data_assinatura: string;
        latitude?: number;
        longitude?: number;
        geolocation_accuracy?: number;
        geolocation_timestamp?: string;
        dispositivo_fingerprint_raw?: DeviceFingerprintData | null;
      } = {
        assinatura_id: primeiroResultado.assinatura_id,
        assinatura_base64: assinatura,
        foto_base64: fotoBase64 || "",
        ip_address: ip,
        user_agent: userAgent,
        data_assinatura: new Date().toISOString(),
        // Comment 3: Incluir fingerprint do dispositivo (pode ser null se coleta falhou)
        dispositivo_fingerprint_raw: deviceFingerprint,
      };

      // Comment 12: Incluir geolocalização somente se latitude E longitude válidos
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        dadosAssinatura.latitude = latitude;
        dadosAssinatura.longitude = longitude;

        if (typeof geolocationAccuracy === 'number') {
          dadosAssinatura.geolocation_accuracy = geolocationAccuracy;
        }
        if (typeof geolocationTimestamp === 'string' && geolocationTimestamp.trim()) {
          dadosAssinatura.geolocation_timestamp = geolocationTimestamp;
        }
      }

      setDadosAssinatura(dadosAssinatura);

      // Salvar assinatura no store
      setAssinaturaBase64(assinatura);

      // Armazenar URLs de todos os PDFs gerados
      setPdfsGerados(resultados);

      toast.success(`${resultados.length} documento(s) gerado(s) com sucesso!`);

      // Avançar para próxima etapa (Sucesso)
      proximaEtapa();
    } catch (error: unknown) {
      console.error("Erro ao finalizar assinatura:", error);
      let errorMessage = "Erro ao salvar assinatura. Tente novamente.";

      // Comment 2: Priorizar error antes de message
      if (error instanceof Error && 'response' in error) {
        const httpError = error as HttpError;
        const errorData = httpError.response?.data;
        errorMessage = errorData?.error || errorData?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };


  return (
    <FormStepLayout
      title="Assine aqui"
      description="Desenhe sua assinatura no campo abaixo para validar o contrato."
      onPrevious={etapaAnterior}
      onNext={handleContinuar}
      nextLabel="Assinar e finalizar"
      isNextDisabled={loading}
      isPreviousDisabled={loading}
      isLoading={loading}
    >
      <CanvasAssinatura ref={canvasRef} />
    </FormStepLayout>
  );
}
