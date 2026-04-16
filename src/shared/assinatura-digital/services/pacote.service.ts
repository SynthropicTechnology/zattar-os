import { createServiceClient } from '@/lib/supabase/service-client';
import { randomBytes } from 'crypto';
import { createDocumentoFromUploadedPdf } from './documentos.service';
import type { TemplateBasico } from './data.service';

const DURACAO_PACOTE_DIAS = Number(process.env.PACOTE_DURACAO_DIAS ?? 7);

function gerarTokenCompartilhado(): string {
  return randomBytes(32).toString('hex');
}

export interface CriarPacoteInput {
  contratoId: number;
  formularioId: number;
  templatesComPdfs: Array<{ template: TemplateBasico; pdfBuffer: Buffer; titulo: string }>;
  clienteDadosSnapshot: { nome: string; cpf: string | null; email: string | null };
  userId: number | null;
  overrides?: Record<string, string>;
}

export interface CriarPacoteResult {
  status: 'criado' | 'reaproveitado';
  token: string;
  expiraEm: string;
  quantidadeDocs: number;
}

export async function criarPacote(input: CriarPacoteInput): Promise<CriarPacoteResult> {
  const supabase = createServiceClient();

  // 1. Check for existing active pacote
  const { data: existente } = await supabase
    .from('assinatura_digital_pacotes')
    .select('id, token_compartilhado, expira_em')
    .eq('contrato_id', input.contratoId)
    .eq('status', 'ativo')
    .gt('expira_em', new Date().toISOString())
    .maybeSingle();

  if (existente) {
    const { count } = await supabase
      .from('assinatura_digital_pacote_documentos')
      .select('id', { count: 'exact', head: true })
      .eq('pacote_id', existente.id);
    return {
      status: 'reaproveitado',
      token: existente.token_compartilhado,
      expiraEm: existente.expira_em,
      quantidadeDocs: count ?? 0,
    };
  }

  // 2. Create pacote
  const token = gerarTokenCompartilhado();
  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + DURACAO_PACOTE_DIAS);

  const { data: pacote, error: pacoteErr } = await supabase
    .from('assinatura_digital_pacotes')
    .insert({
      token_compartilhado: token,
      contrato_id: input.contratoId,
      formulario_id: input.formularioId,
      status: 'ativo',
      criado_por: input.userId,
      expira_em: expiraEm.toISOString(),
    })
    .select('id, token_compartilhado, expira_em')
    .single();

  if (pacoteErr || !pacote) {
    throw new Error(`Falha ao criar pacote: ${pacoteErr?.message ?? 'desconhecido'}`);
  }

  // 3. For each template: create document + assinante + junction row
  for (let i = 0; i < input.templatesComPdfs.length; i++) {
    const { pdfBuffer, titulo } = input.templatesComPdfs[i];

    const doc = await createDocumentoFromUploadedPdf({
      titulo,
      selfie_habilitada: false,
      pdfBuffer,
      created_by: input.userId,
      assinantes: [
        {
          assinante_tipo: 'cliente',
          dados_snapshot: input.clienteDadosSnapshot as unknown as Record<string, unknown>,
        },
      ],
    });

    // Link document to contrato (contrato_id isn't part of create schema)
    await supabase
      .from('assinatura_digital_documentos')
      .update({ contrato_id: input.contratoId })
      .eq('id', doc.documento.id);

    // Insert junction row
    await supabase.from('assinatura_digital_pacote_documentos').insert({
      pacote_id: pacote.id,
      documento_id: doc.documento.id,
      ordem: i + 1,
    });
  }

  return {
    status: 'criado',
    token: pacote.token_compartilhado,
    expiraEm: pacote.expira_em,
    quantidadeDocs: input.templatesComPdfs.length,
  };
}

import type {
  Pacote,
  PacoteComDocumentos,
  DocumentoNoPacote,
  PacoteStatus,
} from '../types/pacote';

export async function lerPacotePorToken(
  token: string,
): Promise<PacoteComDocumentos | null> {
  const supabase = createServiceClient();

  const { data: pacote, error } = await supabase
    .from('assinatura_digital_pacotes')
    .select('*')
    .eq('token_compartilhado', token)
    .maybeSingle();

  if (error || !pacote) return null;

  const { data: join } = await supabase
    .from('assinatura_digital_pacote_documentos')
    .select(`
      ordem,
      documento:assinatura_digital_documentos!documento_id (
        id, documento_uuid, titulo, status,
        assinantes:assinatura_digital_documento_assinantes ( id, token, concluido_em )
      )
    `)
    .eq('pacote_id', pacote.id)
    .order('ordem', { ascending: true });

  const documentos: DocumentoNoPacote[] = (join ?? []).map((row: Record<string, unknown>) => {
    const docRaw = row.documento;
    const doc = (Array.isArray(docRaw) ? docRaw[0] : docRaw) as
      | {
          id: number;
          documento_uuid: string;
          titulo: string | null;
          status: string;
          assinantes: Array<{ id: number; token: string; concluido_em: string | null }> | null;
        }
      | null
      | undefined;
    const assinantes = doc?.assinantes ?? [];
    const primeiro = assinantes[0];
    return {
      id: doc?.id ?? 0,
      documento_uuid: doc?.documento_uuid ?? '',
      titulo: doc?.titulo ?? null,
      status: doc?.status ?? 'pendente',
      ordem: row.ordem as number,
      token_assinante: primeiro?.token ?? '',
      assinado_em: primeiro?.concluido_em ?? null,
    };
  });

  const agora = new Date();
  let status_efetivo: PacoteStatus = pacote.status as PacoteStatus;
  if (new Date(pacote.expira_em).getTime() < agora.getTime()) {
    status_efetivo = 'expirado';
  } else if (
    documentos.length > 0 &&
    documentos.every((d) => d.assinado_em !== null)
  ) {
    status_efetivo = 'concluido';
  }

  return {
    pacote: pacote as Pacote,
    documentos,
    status_efetivo,
  };
}
