
import { ProfileShellClient } from "./profile-shell-client";
import { actionBuscarCliente } from "@/app/app/partes/actions/clientes-actions";
import { actionBuscarParteContraria } from "@/app/app/partes/actions/partes-contrarias-actions";
import { actionBuscarTerceiro } from "@/app/app/partes/actions/terceiros-actions";
import { actionBuscarRepresentantePorId } from "@/app/app/partes/actions/representantes-actions";
import { actionBuscarUsuario } from "@/app/app/usuarios/actions/usuarios-actions";
import { actionBuscarProcessosPorEntidade, actionBuscarClientesPorRepresentante } from "@/app/app/partes/actions/processo-partes-actions";
import { actionBuscarAtividadesPorEntidade } from "../actions/profile-actions";
import {
  adaptClienteToProfile,
  adaptParteContrariaToProfile,
  adaptTerceiroToProfile,
  adaptRepresentanteToProfile,
  adaptUsuarioToProfile,
} from "../utils/profile-adapters";
import { createDbClient } from "@/lib/supabase";
import { ProfileData } from "../configs/types";
import { mapCodigoStatusToEnum, StatusProcesso } from "@/app/app/processos";
import type { ProcessoVinculo } from "../types";

interface ProfileShellProps {
  entityType: 'cliente' | 'parte_contraria' | 'terceiro' | 'representante' | 'usuario';
  entityId: number;
}

export async function ProfileShell({ entityType, entityId }: ProfileShellProps) {
  let result;
  let adapter;

  try {
    switch (entityType) {
        case "cliente":
          result = await actionBuscarCliente(entityId);
          adapter = adaptClienteToProfile;
          break;
        case "parte_contraria":
          result = await actionBuscarParteContraria(entityId);
          adapter = adaptParteContrariaToProfile;
          break;
        case "terceiro":
          result = await actionBuscarTerceiro(entityId);
          adapter = adaptTerceiroToProfile;
          break;
        case "representante":
          result = await actionBuscarRepresentantePorId(entityId, {
            incluirEndereco: true,
          });
          adapter = adaptRepresentanteToProfile;
          break;
        case "usuario":
          result = await actionBuscarUsuario(entityId);
          adapter = adaptUsuarioToProfile;
          break;
        default:
          throw new Error(`Tipo de entidade desconhecido: ${entityType}`);
    }
  } catch(e) {
      return <div>Erro ao carregar dados: {String(e)}</div>;
  }

  if (!result || !result.success || !result.data) {
    return <div>Perfil não encontrado ou erro ao carregar dados. {result?.error}</div>;
  }

  // Verificar se result.data não é um objeto vazio
  if (typeof result.data !== 'object' || result.data === null || Object.keys(result.data).length === 0) {
    return <div>Dados do perfil inválidos ou vazios.</div>;
  }

  const profileData: ProfileData = adapter 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? adapter(result.data as any) 
    : (result.data as ProfileData);
  
  // Garantir que stats existe
  if (!profileData.stats) {
    profileData.stats = {};
  }

  // Fetch related processes server-side if applicable
  if (["cliente", "parte_contraria", "terceiro"].includes(entityType)) {
      try {
          const procResult = await actionBuscarProcessosPorEntidade(entityType as "cliente" | "parte_contraria" | "terceiro", entityId);
          if (procResult.success && Array.isArray(procResult.data)) {
              const supabase = createDbClient();
              const processoIds = procResult.data.map((p: Record<string, unknown>) => p.processo_id as number);

              if (processoIds.length > 0) {
                // Buscar dados do acervo para enriquecer processos
                const { data: processosAcervo, error: acervoError } = await supabase
                  .from("acervo")
                  .select("id, codigo_status_processo, data_autuacao, data_arquivamento")
                  .in("id", processoIds);

                if (!acervoError && processosAcervo) {
                  // Criar mapa de acervo por ID para lookup rápido
                  const acervoMap = new Map<number, { status: StatusProcesso; data_autuacao: string | null; data_arquivamento: string | null }>();
                  for (const acervo of processosAcervo) {
                    acervoMap.set(acervo.id, {
                      status: mapCodigoStatusToEnum(acervo.codigo_status_processo || ""),
                      data_autuacao: acervo.data_autuacao,
                      data_arquivamento: acervo.data_arquivamento,
                    });
                  }

                  // Enriquecer cada processo com dados do acervo
                  const processosEnriquecidos: ProcessoVinculo[] = procResult.data.map((p: Record<string, unknown>) => {
                    const processoId = p.processo_id as number;
                    const acervoData = acervoMap.get(processoId);
                    return {
                      ...p,
                      status: acervoData?.status ?? StatusProcesso.OUTRO,
                      data_autuacao: acervoData?.data_autuacao ?? null,
                      data_arquivamento: acervoData?.data_arquivamento ?? null,
                    } as ProcessoVinculo;
                  });

                  profileData.processos = processosEnriquecidos;

                  // Contar processos ativos (não arquivados)
                  const processosAtivos = processosEnriquecidos.filter(
                    (p) => !p.data_arquivamento && p.status !== StatusProcesso.ARQUIVADO
                  ).length;

                  profileData.stats = {
                      ...(profileData.stats || {}),
                      total_processos: procResult.data.length,
                      processos_ativos: processosAtivos,
                  };
                } else {
                  // Fallback sem dados de acervo - adiciona valores padrão para campos enriquecidos
                  const processosFallback: ProcessoVinculo[] = procResult.data.map((p: Record<string, unknown>) => ({
                    ...p,
                    status: StatusProcesso.OUTRO,
                    data_autuacao: null,
                    data_arquivamento: null,
                  } as ProcessoVinculo));

                  profileData.processos = processosFallback;

                  // Sem dados de acervo, consideramos todos como ativos (não arquivados)
                  const processosAtivos = processosFallback.filter(
                    (p) => !p.data_arquivamento && p.status !== StatusProcesso.ARQUIVADO
                  ).length;

                  profileData.stats = {
                      ...(profileData.stats || {}),
                      total_processos: procResult.data.length,
                      processos_ativos: processosAtivos,
                  };
                }
              } else {
                profileData.processos = [];
                profileData.stats = {
                    ...(profileData.stats || {}),
                    total_processos: 0,
                    processos_ativos: 0,
                };
              }
          }
      } catch (e) {
          console.error("Erro ao buscar processos no servidor", e);
      }
  }

  // Para representantes, buscar total de clientes
  if (entityType === "representante") {
    try {
      const clientesResult = await actionBuscarClientesPorRepresentante(entityId);
      if (clientesResult.success && Array.isArray(clientesResult.data)) {
        profileData.stats = {
          ...(profileData.stats || {}),
          total_clientes: clientesResult.data.length,
        };
      }
    } catch (e) {
      console.error("Erro ao buscar clientes do representante", e);
    }
  }

  // Para usuários, buscar audiências e processos atribuídos
  if (entityType === "usuario") {
    try {
      const supabase = createDbClient();
      
      // Contar audiências onde o usuário é responsável
      const { count: totalAudiencias, error: audienciasError } = await supabase
        .from("audiencias")
        .select("*", { count: "exact", head: true })
        .eq("responsavel_id", entityId);

      // Contar processos atribuídos ao usuário (via acervo.advogado_id ou responsavel_id se existir)
      // Nota: acervo não tem responsavel_id direto, mas podemos buscar via processo_partes ou outras relações
      // Por enquanto, vamos contar apenas audiências
      
      profileData.stats = {
        ...(profileData.stats || {}),
        total_audiencias: audienciasError ? 0 : (totalAudiencias || 0),
      };
    } catch (e) {
      console.error("Erro ao buscar stats do usuário", e);
    }
  }

  // Buscar atividades para todas as entidades
  try {
    const atividadesResult = await actionBuscarAtividadesPorEntidade(entityType, entityId);
    if (atividadesResult.success && Array.isArray(atividadesResult.data)) {
      profileData.activities = atividadesResult.data;
    }
  } catch (e) {
    console.error("Erro ao buscar atividades", e);
    profileData.activities = [];
  }

  return (
    <ProfileShellClient 
        entityType={entityType} 
        entityId={entityId} 
        initialData={profileData} 
    />
  );
}
