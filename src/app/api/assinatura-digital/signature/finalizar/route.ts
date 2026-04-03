import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { finalizeSignature } from '@/app/(authenticated)/assinatura-digital/feature/services/signature.service';
import type { FinalizePayload } from '@/app/(authenticated)/assinatura-digital/feature';
import {
  applyRateLimit,
} from '@/app/(authenticated)/assinatura-digital/feature/utils/rate-limit';
import { validateMultipleImages } from '@/app/(authenticated)/assinatura-digital/feature/utils/file-validation';
import { createServiceClient } from '@/lib/supabase/service-client';

/** Tamanho máximo para imagens: 5MB */
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;

/**
 * Schema de validação para payload de finalização de assinatura.
 *
 * VALIDAÇÃO CONDICIONAL:
 * - `foto_base64`: Obrigatório se `formulario.foto_necessaria = true`
 *   A validação é feita após o parse do schema, consultando a configuração
 *   do formulário no banco. Retorna erro 400 com formato consistente.
 */
const schema = z.object({
  // IDs obrigatórios com mensagens descritivas
  cliente_id: z.number({
    required_error: 'ID do cliente é obrigatório',
    invalid_type_error: 'ID do cliente deve ser um número',
  }),
  contrato_id: z.number({
    invalid_type_error: 'ID do contrato deve ser um número',
  }).optional().nullable(),
  template_id: z.string({
    required_error: 'ID do template é obrigatório',
  }).min(1, 'ID do template não pode estar vazio'),
  segmento_id: z.number({
    required_error: 'ID do segmento é obrigatório',
    invalid_type_error: 'ID do segmento deve ser um número',
  }),
  segmento_nome: z.string().optional(),
  formulario_id: z.number({
    required_error: 'ID do formulário é obrigatório',
    invalid_type_error: 'ID do formulário deve ser um número',
  }),

  // Cliente (opcional, mas validado se presente)
  cliente_dados: z.object({
    id: z.number(),
    nome: z.string(),
    cpf: z.string().optional().nullable(),
    cnpj: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    celular: z.string().optional().nullable(),
    telefone: z.string().optional().nullable(),
    endereco: z.string().optional(),
  }).optional(),

  // Dados de assinatura
  assinatura_base64: z.string({
    required_error: 'Assinatura é obrigatória',
  }).min(1, 'Assinatura não pode estar vazia'),

  // Foto - opcional no schema, validação condicional após parse (vide handler POST)
  // Obrigatório quando formulario.foto_necessaria = true
  foto_base64: z.string().optional().nullable(),

  // Geolocalização (opcional)
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  geolocation_accuracy: z.number().optional().nullable(),
  geolocation_timestamp: z.string().optional().nullable(),

  // Metadados de segurança
  ip_address: z.string().optional().nullable(),
  user_agent: z.string().optional().nullable(),
  sessao_id: z.string().uuid().optional().nullable(),

  // Conformidade legal MP 2.200-2
  termos_aceite: z.boolean({
    required_error: 'Aceite dos termos é obrigatório',
    invalid_type_error: 'Aceite dos termos deve ser um valor booleano',
  }).refine((val) => val === true, {
    message: 'Aceite dos termos é obrigatório para finalizar a assinatura',
  }),
  termos_aceite_versao: z.string({
    required_error: 'Versão dos termos é obrigatória',
  }).min(1, 'Versão dos termos não pode estar vazia'),
  dispositivo_fingerprint_raw: z.record(z.unknown()).optional().nullable(),
});

/**
 * Extrai IP do cliente a partir dos headers da requisição.
 * Verifica x-forwarded-for (proxies/load balancers) e x-real-ip.
 */
function getClientIp(request: NextRequest): string | null {
  // x-forwarded-for pode conter múltiplos IPs: "client, proxy1, proxy2"
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  // Fallback para x-real-ip (usado por alguns proxies)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return null;
}

/**
 * Endpoint PÚBLICO para finalizar assinatura de formulários.
 *
 * IMPORTANTE: Este endpoint NÃO requer autenticação pois é usado
 * por formulários públicos acessados por usuários finais.
 *
 * Segurança:
 * - Rate limiting: 5 requisições por minuto por IP
 * - Validação Zod de todos os campos obrigatórios
 * - IP e user-agent extraídos do request e mesclados ao payload
 * - UUID de sessão para rastreamento
 *
 * Campos obrigatórios:
 * - `cliente_id`, `template_id`, `segmento_id`, `formulario_id`
 * - `assinatura_base64` - Data URL da assinatura manuscrita
 * - `termos_aceite` - Deve ser `true` (conformidade legal MP 2.200-2)
 * - `termos_aceite_versao` - Versão dos termos aceitos (ex: "v1.0-MP2200-2")
 *
 * Campos opcionais:
 * - `contrato_id` - ID do contrato associado (opcional)
 *
 * Campos condicionais:
 * - `foto_base64` - Obrigatório se `formulario.foto_necessaria = true` (validado no serviço)
 *
 * @returns {Promise<NextResponse>} 201 Created com dados da assinatura ou erro apropriado
 */
export async function POST(request: NextRequest) {
  // Rate limiting: 5 requisições por minuto por IP
  const rateLimitResponse = await applyRateLimit(request, 'finalizar');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();

    // Extrair IP e user-agent do request para garantir auditoria
    const serverIp = getClientIp(request);
    const serverUserAgent = request.headers.get('user-agent');

    // Mesclar valores do servidor se não fornecidos pelo cliente (ou vazios)
    const enrichedBody = {
      ...body,
      ip_address: body.ip_address || serverIp || null,
      user_agent: body.user_agent || serverUserAgent || null,
    };

    const payload = schema.parse(enrichedBody) as FinalizePayload;

    // Validar imagens base64 (tamanho máximo + magic bytes)
    const imageValidation = validateMultipleImages(
      {
        assinatura_base64: payload.assinatura_base64,
        foto_base64: payload.foto_base64,
      },
      { maxSize: IMAGE_MAX_SIZE }
    );

    if (!imageValidation.allValid) {
      return NextResponse.json({
        error: 'Imagens inválidas',
        message: 'Uma ou mais imagens não passaram na validação',
        details: imageValidation.errors,
      }, { status: 400 });
    }

    // Validação condicional de foto baseada em formulario.foto_necessaria
    // Isso é feito aqui para retornar erro 400 com formato consistente (similar ao Zod)
    const supabase = createServiceClient();
    const { data: formulario } = await supabase
      .from('assinatura_digital_formularios')
      .select('foto_necessaria')
      .eq('id', payload.formulario_id)
      .single();

    if (formulario?.foto_necessaria === true && !payload.foto_base64) {
      return NextResponse.json({
        error: 'Dados de assinatura inválidos',
        message: 'Foto é obrigatória para este formulário',
        details: {
          foto_base64: ['Foto é obrigatória quando o formulário exige verificação de identidade'],
        },
      }, { status: 400 });
    }

    const result = await finalizeSignature(payload);

    const warnings: string[] = [];

    if (payload.contrato_id) {
      try {
        const { data: contratoAtual } = await supabase
          .from('contratos')
          .select('id, status, documentos, created_by, responsavel_id')
          .eq('id', payload.contrato_id)
          .single();

        if (contratoAtual) {
          if (contratoAtual.status !== 'contratado') {
            const { error: statusError } = await supabase
              .from('contratos')
              .update({ status: 'contratado' })
              .eq('id', payload.contrato_id);

            if (statusError) {
              throw new Error(`Falha ao atualizar status do contrato: ${statusError.message}`);
            }

            await supabase.from('contrato_status_historico').insert({
              contrato_id: payload.contrato_id,
              from_status: contratoAtual.status,
              to_status: 'contratado',
              changed_at: new Date().toISOString(),
              reason: 'Contrato assinado via assinatura digital',
            });
          }

          // Legacy: salvar referência no campo texto contratos.documentos
          const documentoAssinatura = {
            tipo: 'assinatura_digital',
            assinatura_id: result.assinatura_id,
            template_id: payload.template_id,
            protocolo: result.protocolo,
            pdf_url: result.pdf_url,
            assinado_em: new Date().toISOString(),
          };

          let documentosList: Array<Record<string, unknown>> = [];
          if (typeof contratoAtual.documentos === 'string' && contratoAtual.documentos.trim()) {
            try {
              const parsed = JSON.parse(contratoAtual.documentos) as unknown;
              if (Array.isArray(parsed)) {
                documentosList = parsed.filter((item): item is Record<string, unknown> =>
                  typeof item === 'object' && item !== null
                );
              }
            } catch {
              documentosList = [];
            }
          }

          documentosList.push(documentoAssinatura);

          await supabase
            .from('contratos')
            .update({ documentos: JSON.stringify(documentosList) })
            .eq('id', payload.contrato_id);

          // Vincular PDF ao contrato via arquivos + contrato_documentos
          const criadorId = contratoAtual.created_by || contratoAtual.responsavel_id;
          if (criadorId && result.pdf_key && result.pdf_raw_url) {
            const { data: arquivo, error: arquivoError } = await supabase
              .from('arquivos')
              .insert({
                nome: `Contrato Assinado - ${result.protocolo}.pdf`,
                tipo_mime: 'application/pdf',
                tamanho_bytes: result.pdf_size,
                b2_key: result.pdf_key,
                b2_url: result.pdf_raw_url,
                tipo_media: 'pdf',
                criado_por: criadorId,
              })
              .select('id')
              .single();

            if (arquivoError) {
              console.error('[FINALIZAR] Erro ao criar registro de arquivo:', arquivoError);
            } else if (arquivo) {
              const { error: vinculoError } = await supabase
                .from('contrato_documentos')
                .insert({
                  contrato_id: payload.contrato_id,
                  arquivo_id: arquivo.id,
                  tipo_peca: null,
                  created_by: criadorId,
                });

              if (vinculoError) {
                console.error('[FINALIZAR] Erro ao vincular arquivo ao contrato:', vinculoError);
              } else {
                console.log('[FINALIZAR] PDF vinculado ao contrato com sucesso:', {
                  contrato_id: payload.contrato_id,
                  arquivo_id: arquivo.id,
                });
              }
            }
          }
        }
      } catch (contractError) {
        console.error('Erro ao sincronizar contrato após assinatura:', contractError);
        warnings.push(
          contractError instanceof Error
            ? contractError.message
            : 'Falha ao atualizar dados do contrato pós-assinatura'
        );
      }
    }

    // Não expor campos internos (pdf_raw_url, pdf_key, pdf_size) na resposta
    const { pdf_raw_url: _rawUrl, pdf_key: _key, pdf_size: _size, ...publicResult } = result;

    return NextResponse.json(
      { success: true, data: publicResult, warnings: warnings.length > 0 ? warnings : undefined },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Retornar mensagem descritiva com detalhes dos campos inválidos
      return NextResponse.json({
        error: 'Dados de assinatura inválidos',
        message: 'Verifique os campos obrigatórios e tente novamente',
        details: error.flatten().fieldErrors,
      }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Erro ao finalizar assinatura';
    console.error('Erro em POST /assinatura-digital/signature/finalizar:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
