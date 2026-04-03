import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { NACIONALIDADES } from "@/app/(authenticated)/assinatura-digital/feature/constants/nacionalidades";
import { applyRateLimit } from "@/app/(authenticated)/assinatura-digital/feature/utils/rate-limit";

const schema = z.object({ cpf: z.string().length(11) });

// ---------------------------------------------------------------------------
// Parsing: DB values → form select codes
// ---------------------------------------------------------------------------
const ENUM_TO_ESTADO_CIVIL: Record<string, string> = {
  solteiro: "1",
  casado: "2",
  divorciado: "4",
  viuvo: "5",
};

const ENUM_TO_GENERO: Record<string, string> = {
  masculino: "1",
  feminino: "2",
  outro: "3",
  prefiro_nao_informar: "4",
};

const NACIONALIDADE_TO_CODE: Record<string, string> = {};
for (const [code, text] of Object.entries(NACIONALIDADES)) {
  NACIONALIDADE_TO_CODE[text] = String(code);
}

function extractEmail(emails: unknown): string | null {
  if (!Array.isArray(emails) || emails.length === 0) return null;
  const first = emails[0];
  if (typeof first === "string") return first;
  if (typeof first === "object" && first !== null && "email" in first) {
    return typeof first.email === "string" ? first.email : null;
  }
  return null;
}

function combinePhone(ddd: string | null, numero: string | null): string | null {
  if (ddd && numero) return `${ddd}${numero}`;
  if (numero) return numero;
  return null;
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, "verificarCpf");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { cpf } = schema.parse(body);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("clientes")
      .select("*, enderecos(*)")
      .eq("cpf", cpf)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (!data) {
      return NextResponse.json({ exists: false, cliente: null });
    }

    // Supabase retorna objeto único (não array) para relações many-to-one (clientes.endereco_id → enderecos.id)
    const endereco = Array.isArray(data.enderecos) ? data.enderecos[0] : data.enderecos;

    const cliente = {
      id: data.id,
      nome: data.nome,
      cpf: data.cpf,
      rg: data.rg ?? null,
      data_nascimento: data.data_nascimento ?? null,
      estado_civil: data.estado_civil ? ENUM_TO_ESTADO_CIVIL[data.estado_civil] ?? null : null,
      genero: data.genero ? ENUM_TO_GENERO[data.genero] ?? null : null,
      nacionalidade: data.nacionalidade ? NACIONALIDADE_TO_CODE[data.nacionalidade] ?? null : null,
      email: extractEmail(data.emails),
      celular: combinePhone(data.ddd_celular, data.numero_celular),
      telefone: combinePhone(data.ddd_residencial, data.numero_residencial),
      cep: endereco?.cep ?? null,
      logradouro: endereco?.logradouro ?? null,
      numero: endereco?.numero ?? null,
      complemento: endereco?.complemento ?? null,
      bairro: endereco?.bairro ?? null,
      cidade: endereco?.municipio ?? null,
      uf: endereco?.estado_sigla ?? null,
    };

    // Buscar contratos pendentes (em_contratacao) do cliente
    let contratos_pendentes: Array<Record<string, unknown>> = [];
    try {
      const { data: contratosPendentes } = await supabase
        .from("contratos")
        .select(`
          id,
          segmento_id,
          cadastrado_em,
          observacoes,
          segmentos(nome),
          contrato_partes(
            tipo_entidade,
            nome_snapshot,
            cpf_cnpj_snapshot,
            papel_contratual
          )
        `)
        .eq("cliente_id", data.id)
        .eq("status", "em_contratacao")
        .order("cadastrado_em", { ascending: false })
        .limit(10);

      if (contratosPendentes && contratosPendentes.length > 0) {
        // Filtrar contratos que já possuem assinatura concluída
        const contractIds = contratosPendentes.map((c) => c.id);
        const { data: assinaturasExistentes } = await supabase
          .from("assinatura_digital_assinaturas")
          .select("contrato_id")
          .in("contrato_id", contractIds)
          .eq("status", "concluida");

        const signedIds = new Set(
          (assinaturasExistentes || []).map((a) => a.contrato_id)
        );

        contratos_pendentes = contratosPendentes
          .filter((c) => !signedIds.has(c.id))
          .map((c) => ({
            id: c.id,
            segmento_id: c.segmento_id,
            segmento_nome: Array.isArray(c.segmentos)
              ? (c.segmentos[0] as Record<string, unknown>)?.nome ?? null
              : (c.segmentos as Record<string, unknown> | null)?.nome ?? null,
            cadastrado_em: c.cadastrado_em,
            observacoes: c.observacoes,
            partes: (c.contrato_partes as Array<Record<string, unknown>>) || [],
          }));
      }
    } catch (pendingError) {
      // Não bloquear o fluxo se a busca de pendentes falhar
      console.error("Erro ao buscar contratos pendentes:", pendingError);
    }

    return NextResponse.json({
      exists: true,
      cliente,
      contratos_pendentes,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }
    console.error("Erro ao verificar CPF:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
