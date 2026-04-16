import type { TemplateCampo } from "../types";

type PreviewTemplate = {
  id: string;
  template_uuid: string;
  nome: string;
  descricao?: string;
  arquivo_original: string;
  arquivo_nome: string;
  arquivo_tamanho: number;
  status: string;
  versao: number;
  ativo: boolean;
  campos: TemplateCampo[];
  conteudo_markdown: string | null;
};

type PreviewOptions = {
  segmentoId?: number;
  segmentoNome?: string;
};

function safeKey(name: string): string {
  return name.trim().replace(/\s+/g, "_").replace(/[^\w]/g, "").toLowerCase();
}

export function generateMockDataForPreview(
  template: PreviewTemplate,
  options: PreviewOptions = {}
) {
  const extras: Record<string, unknown> = {};

  for (const campo of template.campos ?? []) {
    const rawKey =
      (campo as unknown as Record<string, unknown>).nome ??
      (campo as unknown as Record<string, unknown>).key;
    const key =
      typeof rawKey === "string" && rawKey.trim() ? safeKey(rawKey) : undefined;
    if (!key) continue;
    extras[key] = `{{${key}}}`;
  }

  const now = new Date();

  return {
    cliente: {
      id: 0,
      nome: "Cliente Teste",
      cpf: "00000000000",
      email: "cliente.teste@example.com",
      celular: "11999999999",
    },
    segmento: {
      id: options.segmentoId ?? 0,
      nome: options.segmentoNome ?? "Segmento",
      slug: "segmento-teste",
      ativo: true,
    },
    formulario: {
      id: 0,
      formulario_uuid: template.template_uuid,
      nome: template.nome,
      slug: "formulario-teste",
      segmento_id: options.segmentoId ?? 1,
      ativo: true,
      template_id: template.id,
      template_uuid: template.template_uuid,
      template_nome: template.nome,
      gerado_em: now.toISOString(),
    },
    protocolo: `preview-${template.id}-${now.getTime()}`,
    ip: "127.0.0.1",
    user_agent: "preview-test",
    extras,
    images: {} as Record<string, string>,
  };
}
