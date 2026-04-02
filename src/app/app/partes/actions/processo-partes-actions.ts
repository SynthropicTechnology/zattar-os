"use server";

import { createDbClient } from "@/lib/supabase";
import type {
  PoloProcessoParte,
  TipoParteProcesso,
} from "@/app/app/partes";
import type { ParteComDadosCompletos } from "../types/processo-partes";

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; message: string };

type VínculoProcessoParteRow = {
  id: number;
  processo_id: number;
  tipo_entidade: "cliente" | "parte_contraria" | "terceiro";
  entidade_id: number;
  id_pje: number;
  id_pessoa_pje: number | null;
  tipo_parte: TipoParteProcesso;
  polo: PoloProcessoParte;
  trt: string;
  grau: string;
  numero_processo: string;
  principal: boolean;
  ordem: number;
  dados_pje_completo: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type EntidadeContatoRow = {
  id: number;
  nome: string;
  tipo_pessoa: "pf" | "pj";
  cpf: string | null;
  cnpj: string | null;
  emails: string[] | null;
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_residencial: string | null;
  numero_residencial: string | null;
  ddd_comercial: string | null;
  numero_comercial: string | null;
};

function mapTelefone(entidade: EntidadeContatoRow): {
  ddd_telefone: string | null;
  numero_telefone: string | null;
} {
  // Preferir residencial; fallback para comercial
  const ddd = entidade.ddd_residencial ?? entidade.ddd_comercial ?? null;
  const numero =
    entidade.numero_residencial ?? entidade.numero_comercial ?? null;
  return { ddd_telefone: ddd, numero_telefone: numero };
}

function mapParteComDados(
  vinculo: VínculoProcessoParteRow,
  entidade: EntidadeContatoRow | undefined
): ParteComDadosCompletos {
  const telefone = entidade
    ? mapTelefone(entidade)
    : { ddd_telefone: null, numero_telefone: null };

  return {
    ...vinculo,
    nome: entidade?.nome ?? "—",
    tipo_pessoa: entidade?.tipo_pessoa ?? "pf",
    cpf: entidade?.cpf ?? null,
    cnpj: entidade?.cnpj ?? null,
    emails: entidade?.emails ?? null,
    ddd_celular: entidade?.ddd_celular ?? null,
    numero_celular: entidade?.numero_celular ?? null,
    ddd_telefone: telefone.ddd_telefone,
    numero_telefone: telefone.numero_telefone,
  };
}

export async function actionBuscarPartesPorProcessoEPolo(
  processoId: number,
  polo: PoloProcessoParte
): Promise<
  ActionResult<{
    partes: ParteComDadosCompletos[];
    principal: ParteComDadosCompletos | null;
  }>
> {
  try {
    if (!processoId || processoId <= 0) {
      return {
        success: false,
        error: "processoId inválido",
        message: "Parâmetros inválidos.",
      };
    }

    const polosValidos: PoloProcessoParte[] = [
      "ATIVO",
      "PASSIVO",
      "NEUTRO",
      "TERCEIRO",
    ];
    if (!polosValidos.includes(polo)) {
      return {
        success: false,
        error: "polo inválido",
        message: "Parâmetros inválidos.",
      };
    }

    const supabase = createDbClient();

    const { data: vinculosRaw, error: vinculosError } = await supabase
      .from("processo_partes")
      .select(
        "id,processo_id,tipo_entidade,entidade_id,id_pje,id_pessoa_pje,tipo_parte,polo,trt,grau,numero_processo,principal,ordem,dados_pje_completo,created_at,updated_at"
      )
      .eq("processo_id", processoId)
      .eq("polo", polo)
      .order("principal", { ascending: false })
      .order("ordem", { ascending: true });

    if (vinculosError) {
      return {
        success: false,
        error: vinculosError.message,
        message: "Falha ao buscar partes do processo.",
      };
    }

    const vinculos = (vinculosRaw ??
      []) as unknown as VínculoProcessoParteRow[];
    if (vinculos.length === 0) {
      return {
        success: true,
        data: { partes: [], principal: null },
        message: "Nenhuma parte encontrada.",
      };
    }

    const idsClientes = vinculos
      .filter((v) => v.tipo_entidade === "cliente")
      .map((v) => v.entidade_id);
    const idsPartesContrarias = vinculos
      .filter((v) => v.tipo_entidade === "parte_contraria")
      .map((v) => v.entidade_id);
    const idsTerceiros = vinculos
      .filter((v) => v.tipo_entidade === "terceiro")
      .map((v) => v.entidade_id);

    const [clientesRes, partesContrariasRes, terceirosRes] = await Promise.all([
      idsClientes.length > 0
        ? supabase
            .from("clientes")
            .select(
              "id,nome,tipo_pessoa,cpf,cnpj,emails,ddd_celular,numero_celular,ddd_residencial,numero_residencial,ddd_comercial,numero_comercial"
            )
            .in("id", idsClientes)
        : Promise.resolve({ data: [] as unknown[], error: null }),
      idsPartesContrarias.length > 0
        ? supabase
            .from("partes_contrarias")
            .select(
              "id,nome,tipo_pessoa,cpf,cnpj,emails,ddd_celular,numero_celular,ddd_residencial,numero_residencial,ddd_comercial,numero_comercial"
            )
            .in("id", idsPartesContrarias)
        : Promise.resolve({ data: [] as unknown[], error: null }),
      idsTerceiros.length > 0
        ? supabase
            .from("terceiros")
            .select(
              "id,nome,tipo_pessoa,cpf,cnpj,emails,ddd_celular,numero_celular,ddd_residencial,numero_residencial,ddd_comercial,numero_comercial"
            )
            .in("id", idsTerceiros)
        : Promise.resolve({ data: [] as unknown[], error: null }),
    ]);

    const firstError =
      clientesRes.error ?? partesContrariasRes.error ?? terceirosRes.error;
    if (firstError) {
      return {
        success: false,
        error: firstError.message,
        message: "Falha ao buscar dados das partes.",
      };
    }

    const clientes = (clientesRes.data ??
      []) as unknown as EntidadeContatoRow[];
    const partesContrarias = (partesContrariasRes.data ??
      []) as unknown as EntidadeContatoRow[];
    const terceiros = (terceirosRes.data ??
      []) as unknown as EntidadeContatoRow[];

    const mapClientes = new Map(clientes.map((c) => [c.id, c]));
    const mapPartesContrarias = new Map(partesContrarias.map((c) => [c.id, c]));
    const mapTerceiros = new Map(terceiros.map((c) => [c.id, c]));

    const partes: ParteComDadosCompletos[] = vinculos.map((v) => {
      const entidade =
        v.tipo_entidade === "cliente"
          ? mapClientes.get(v.entidade_id)
          : v.tipo_entidade === "parte_contraria"
          ? mapPartesContrarias.get(v.entidade_id)
          : mapTerceiros.get(v.entidade_id);

      return mapParteComDados(v, entidade);
    });

    const principal = partes.find((p) => p.principal) ?? partes[0] ?? null;

    return {
      success: true,
      data: { partes, principal },
      message: "Partes carregadas com sucesso.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Falha ao buscar partes do processo.",
    };
  }
}

export async function actionBuscarProcessosPorEntidade(
  tipoEntidade: "cliente" | "parte_contraria" | "terceiro",
  entidadeId: number
): Promise<ActionResult<VínculoProcessoParteRow[]>> {
  try {
    if (!entidadeId || entidadeId <= 0) {
      return {
        success: false,
        error: "entidadeId inválido",
        message: "Parâmetros inválidos.",
      };
    }

    const tiposValidos: ("cliente" | "parte_contraria" | "terceiro")[] = [
      "cliente",
      "parte_contraria",
      "terceiro",
    ];
    if (!tiposValidos.includes(tipoEntidade)) {
      return {
        success: false,
        error: "tipoEntidade inválido",
        message: "Parâmetros inválidos.",
      };
    }

    const supabase = createDbClient();

    const { data: vinculos, error: vinculosError } = await supabase
      .from("processo_partes")
      .select("*")
      .eq("tipo_entidade", tipoEntidade)
      .eq("entidade_id", entidadeId)
      .order("created_at", { ascending: false });

    if (vinculosError) {
      return {
        success: false,
        error: vinculosError.message,
        message: "Falha ao buscar processos da entidade.",
      };
    }

    return {
      success: true,
      data: (vinculos ?? []) as VínculoProcessoParteRow[],
      message: "Processos carregados com sucesso.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Falha ao buscar processos da entidade.",
    };
  }
}

type RepresentanteComProcessos = {
  id: number;
  nome: string;
  cpf: string;
  oab: string | null; // Para compatibilidade com config (subtitleField: "oab")
  oab_principal: string | null;
  total_processos_comuns: number;
  avatar_iniciais: string;
};

export async function actionBuscarRepresentantesPorCliente(
  clienteId: number
): Promise<ActionResult<RepresentanteComProcessos[]>> {
  try {
    if (!clienteId || clienteId <= 0) {
      return {
        success: false,
        error: "clienteId inválido",
        message: "Parâmetros inválidos.",
      };
    }

    const supabase = createDbClient();

    // 1. Buscar processos onde o cliente está vinculado
    const { data: processosCliente, error: processosError } = await supabase
      .from("processo_partes")
      .select("processo_id")
      .eq("tipo_entidade", "cliente")
      .eq("entidade_id", clienteId);

    if (processosError) {
      return {
        success: false,
        error: processosError.message,
        message: "Falha ao buscar processos do cliente.",
      };
    }

    if (!processosCliente || processosCliente.length === 0) {
      return {
        success: true,
        data: [],
        message: "Cliente não possui processos vinculados.",
      };
    }

    const processoIds = processosCliente.map((p) => p.processo_id);

    // 2. Buscar representantes nesses mesmos processos
    const { data: representantesVinculos, error: repError } = await supabase
      .from("processo_partes")
      .select("entidade_id, processo_id")
      .eq("tipo_entidade", "representante")
      .in("processo_id", processoIds);

    if (repError) {
      return {
        success: false,
        error: repError.message,
        message: "Falha ao buscar representantes.",
      };
    }

    if (!representantesVinculos || representantesVinculos.length === 0) {
      return {
        success: true,
        data: [],
        message: "Nenhum representante encontrado nos processos do cliente.",
      };
    }

    // 3. Agregar por representante e contar processos
    const repProcessosMap = new Map<number, Set<number>>();
    for (const vinculo of representantesVinculos) {
      const repId = vinculo.entidade_id as number;
      const procId = vinculo.processo_id as number;
      if (!repProcessosMap.has(repId)) {
        repProcessosMap.set(repId, new Set());
      }
      repProcessosMap.get(repId)!.add(procId);
    }

    const repIds = Array.from(repProcessosMap.keys());

    // 4. Buscar dados dos representantes
    const { data: representantes, error: repDataError } = await supabase
      .from("representantes")
      .select("id, nome, cpf, oabs")
      .in("id", repIds);

    if (repDataError) {
      return {
        success: false,
        error: repDataError.message,
        message: "Falha ao buscar dados dos representantes.",
      };
    }

    // 5. Montar resultado com OAB principal e contagem
    const resultado: RepresentanteComProcessos[] = (representantes as RepresentanteDbRow[] || []).map(
      (rep) => {
        const oabPrincipal =
          rep.oabs?.find((o) => o.principal) || rep.oabs?.[0];
        const oabStr = oabPrincipal
          ? `${oabPrincipal.numero}/${oabPrincipal.uf}`
          : null;

        const totalProcessos = repProcessosMap.get(rep.id)?.size || 0;
        const iniciais = rep.nome
          ? rep.nome
              .split(" ")
              .slice(0, 2)
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
          : "??";

        return {
          id: rep.id,
          nome: rep.nome,
          cpf: rep.cpf,
          oab: oabStr, // Campo esperado pela config
          oab_principal: oabStr,
          total_processos_comuns: totalProcessos,
          avatar_iniciais: iniciais,
        };
      }
    );

    // Ordenar por total de processos (mais relevantes primeiro)
    resultado.sort((a, b) => b.total_processos_comuns - a.total_processos_comuns);

    return {
      success: true,
      data: resultado,
      message: "Representantes carregados com sucesso.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Falha ao buscar representantes do cliente.",
    };
  }
}

type ClienteComProcessos = {
  id: number;
  nome: string;
  cpf: string | null;
  cnpj: string | null;
  cpf_cnpj: string | null; // Para compatibilidade com config (subtitleField: "cpf_cnpj")
  total_processos_comuns: number;
  avatar_iniciais: string;
};

type ClienteDbRow = {
  id: number;
  nome: string;
  cpf: string | null;
  cnpj: string | null;
};

type OabData = {
  numero: string;
  uf: string;
  principal?: boolean;
};

type RepresentanteDbRow = {
  id: number;
  nome: string;
  cpf: string;
  oabs: OabData[] | null;
};

export async function actionBuscarClientesPorRepresentante(
  representanteId: number
): Promise<ActionResult<ClienteComProcessos[]>> {
  try {
    if (!representanteId || representanteId <= 0) {
      return {
        success: false,
        error: "representanteId inválido",
        message: "Parâmetros inválidos.",
      };
    }

    const supabase = createDbClient();

    // 1. Buscar processos onde o representante está vinculado
    const { data: processosRep, error: processosError } = await supabase
      .from("processo_partes")
      .select("processo_id")
      .eq("tipo_entidade", "representante")
      .eq("entidade_id", representanteId);

    if (processosError) {
      return {
        success: false,
        error: processosError.message,
        message: "Falha ao buscar processos do representante.",
      };
    }

    if (!processosRep || processosRep.length === 0) {
      return {
        success: true,
        data: [],
        message: "Representante não possui processos vinculados.",
      };
    }

    const processoIds = processosRep.map((p) => p.processo_id);

    // 2. Buscar clientes nesses mesmos processos
    const { data: clientesVinculos, error: clientesError } = await supabase
      .from("processo_partes")
      .select("entidade_id, processo_id")
      .eq("tipo_entidade", "cliente")
      .in("processo_id", processoIds);

    if (clientesError) {
      return {
        success: false,
        error: clientesError.message,
        message: "Falha ao buscar clientes.",
      };
    }

    if (!clientesVinculos || clientesVinculos.length === 0) {
      return {
        success: true,
        data: [],
        message: "Nenhum cliente encontrado nos processos do representante.",
      };
    }

    // 3. Agregar por cliente e contar processos
    const clienteProcessosMap = new Map<number, Set<number>>();
    for (const vinculo of clientesVinculos) {
      const clienteId = vinculo.entidade_id as number;
      const procId = vinculo.processo_id as number;
      if (!clienteProcessosMap.has(clienteId)) {
        clienteProcessosMap.set(clienteId, new Set());
      }
      clienteProcessosMap.get(clienteId)!.add(procId);
    }

    const clienteIds = Array.from(clienteProcessosMap.keys());

    // 4. Buscar dados dos clientes
    const { data: clientes, error: clientesDataError } = await supabase
      .from("clientes")
      .select("id, nome, cpf, cnpj")
      .in("id", clienteIds);

    if (clientesDataError) {
      return {
        success: false,
        error: clientesDataError.message,
        message: "Falha ao buscar dados dos clientes.",
      };
    }

    // 5. Montar resultado com contagem
    const resultado: ClienteComProcessos[] = (clientes as ClienteDbRow[] || []).map(
      (cliente) => {
        const totalProcessos =
          clienteProcessosMap.get(cliente.id)?.size || 0;
        const iniciais = cliente.nome
          ? cliente.nome
              .split(" ")
              .slice(0, 2)
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
          : "??";

        return {
          id: cliente.id,
          nome: cliente.nome,
          cpf: cliente.cpf,
          cnpj: cliente.cnpj,
          cpf_cnpj: cliente.cpf || cliente.cnpj || null, // Campo esperado pela config
          total_processos_comuns: totalProcessos,
          avatar_iniciais: iniciais,
        };
      }
    );

    // Ordenar por total de processos (mais relevantes primeiro)
    resultado.sort((a, b) => b.total_processos_comuns - a.total_processos_comuns);

    return {
      success: true,
      data: resultado,
      message: "Clientes carregados com sucesso.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Falha ao buscar clientes do representante.",
    };
  }
}
