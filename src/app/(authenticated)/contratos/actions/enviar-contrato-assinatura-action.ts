'use server';

import { z } from 'zod';
import { authenticatedAction } from '@/lib/safe-action';
import {
  validarGeracaoPdfs,
  carregarDadosContrato,
  carregarFormularioContratacao,
  carregarTemplatesPorUuids,
} from '../services/documentos-contratacao.service';
import { contratoParaInputData } from '../services/mapeamento-contrato-input-data';
import { generatePdfFromTemplate } from '@/shared/assinatura-digital/services/template-pdf.service';
import { criarPacote } from '@/shared/assinatura-digital/services/pacote.service';

const schema = z.object({
  contratoId: z.number().int().positive(),
  overrides: z.record(z.string()).optional(),
});

export const actionEnviarContratoParaAssinatura = authenticatedAction(
  schema,
  async (input, { user }) => {
    // 1. Validate via caminho A's helper
    const validacao = await validarGeracaoPdfs(input.contratoId, input.overrides ?? {});
    if (validacao.status !== 'pronto') {
      return validacao;
    }

    // 2. Load context (same 3 loaders the caminho A service uses)
    const dados = await carregarDadosContrato(input.contratoId);
    const formulario = await carregarFormularioContratacao();
    if (!dados || !dados.cliente || !formulario) {
      return { status: 'erro' as const, mensagem: 'Dados insuficientes' };
    }
    const templates = await carregarTemplatesPorUuids(formulario.template_ids);

    // 3. Merge PDFs in parallel
    const mapeado = contratoParaInputData(dados);
    const ctx = {
      cliente: mapeado.cliente,
      segmento: {
        id: formulario.segmento_id,
        nome: 'Trabalhista',
        slug: 'trabalhista',
        ativo: true,
      },
      formulario: {
        id: formulario.id,
        formulario_uuid: formulario.formulario_uuid,
        nome: formulario.nome,
        slug: formulario.slug,
        segmento_id: formulario.segmento_id,
        ativo: formulario.ativo,
      },
      protocolo: `CTR-${dados.contrato.id}-${Date.now()}`,
      parte_contraria: mapeado.parteContrariaNome
        ? { nome: mapeado.parteContrariaNome }
        : undefined,
    };
    const extras: Record<string, unknown> = {
      ...mapeado.ctxExtras,
      ...(input.overrides ?? {}),
    };

    const templatesComPdfs = await Promise.all(
      templates.map(async (template) => ({
        template,
        pdfBuffer: await generatePdfFromTemplate(template, ctx, extras, undefined),
        titulo: template.nome,
      })),
    );

    // 4. Create pacote
    const primeiroEmail = dados.cliente.emails?.[0] ?? null;
    const clienteDadosSnapshot = {
      nome: dados.cliente.nome,
      cpf: dados.cliente.cpf ?? null,
      email: primeiroEmail,
    };

    const result = await criarPacote({
      contratoId: input.contratoId,
      formularioId: formulario.id,
      templatesComPdfs,
      clienteDadosSnapshot,
      userId: user.id,
      overrides: input.overrides ?? {},
    });

    return {
      status: result.status === 'reaproveitado' ? ('reaproveitado' as const) : ('criado' as const),
      token: result.token,
      expiraEm: result.expiraEm,
      quantidadeDocs: result.quantidadeDocs,
    };
  },
);
