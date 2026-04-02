
'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from './utils';
import { checkPermission } from '@/lib/auth/authorization';
import * as service from '../service';
import { 
  criarSalarioSchema, 
  atualizarSalarioSchema 
} from '../domain';
import type {
  ListarSalariosParams as ListarParamsType,
  AtualizarSalarioDTO
} from '../domain';

interface ListarSalariosActionParams extends ListarParamsType {
  incluirTotais?: boolean;
  incluirSemSalario?: boolean;
}

export async function actionListarSalarios(params: ListarSalariosActionParams) {
  try {
    const { userId } = await requireAuth(['salarios:listar']);
    
    const podeVisualizarTodos = await checkPermission(userId, 'salarios', 'visualizar_todos');
    
    if (!podeVisualizarTodos) {
      params.usuarioId = userId;
    }

    const result = await service.listarSalarios(params);
    
    let totais;
    if (params.incluirTotais) {
      totais = await service.calcularTotaisSalariosAtivos();
    }

    let usuariosSemSalario;
    if (params.incluirSemSalario) {
      usuariosSemSalario = await service.listarUsuariosSemSalarioVigente();
    }

    return { 
      success: true, 
      data: {
        ...result,
        totais,
        usuariosSemSalario
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao listar salários' 
    };
  }
}

export async function actionBuscarSalariosDoUsuario(usuarioId: number) {
  try {
    await requireAuth(['salarios:listar']);
    const salarios = await service.buscarSalariosDoUsuario(usuarioId);
    return { success: true, data: salarios };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao buscar salários do usuário' 
    };
  }
}

export async function actionBuscarSalario(id: number) {
  try {
    await requireAuth(['salarios:listar']); // or 'salarios:visualizar' if exists
    const salario = await service.buscarSalarioPorId(id);
    if (!salario) {
      return { success: false, error: 'Salário não encontrado' };
    }
    return { success: true, data: salario };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao buscar salário' 
    };
  }
}

export async function actionCriarSalario(formData: FormData) {
  try {
    const { userId } = await requireAuth(['salarios:criar']);
    
    const dados = {
      usuarioId: Number(formData.get('usuarioId')),
      salarioBruto: Number(formData.get('salarioBruto')),
      dataInicioVigencia: formData.get('dataInicioVigencia'),
      cargoId: formData.get('cargoId') ? Number(formData.get('cargoId')) : undefined,
      observacoes: formData.get('observacoes') ? String(formData.get('observacoes')) : undefined,
    };

    const validacao = criarSalarioSchema.safeParse(dados);
    if (!validacao.success) {
      return { 
        success: false, 
        error: validacao.error.errors[0].message 
      };
    }

    const salario = await service.criarSalario(validacao.data, userId);
    
    revalidatePath('/app/rh/salarios');
    return { success: true, data: salario };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao criar salário' 
    };
  }
}

export async function actionAtualizarSalario(id: number, formData: FormData) {
  try {
    await requireAuth(['salarios:editar']);
    
    // Parse fields manually because some might be missing
    const dados: AtualizarSalarioDTO = {};
    
    if (formData.has('salarioBruto')) dados.salarioBruto = Number(formData.get('salarioBruto'));
    if (formData.has('cargoId')) dados.cargoId = formData.get('cargoId') ? Number(formData.get('cargoId')) : null;
    if (formData.has('dataFimVigencia')) dados.dataFimVigencia = String(formData.get('dataFimVigencia'));
    if (formData.has('observacoes')) dados.observacoes = String(formData.get('observacoes'));
    if (formData.has('ativo')) dados.ativo = formData.get('ativo') === 'true';

    const validacao = atualizarSalarioSchema.safeParse(dados);
    if (!validacao.success) {
      return { 
        success: false, 
        error: validacao.error.errors[0].message 
      };
    }

    const salario = await service.atualizarSalario(id, validacao.data);
    
    revalidatePath('/app/rh/salarios');
    return { success: true, data: salario };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao atualizar salário' 
    };
  }
}

export async function actionEncerrarVigenciaSalario(id: number, dataFim: string) {
  try {
    await requireAuth(['salarios:editar']);
    const salario = await service.encerrarVigenciaSalario(id, dataFim);
    revalidatePath('/app/rh/salarios');
    return { success: true, data: salario };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao encerrar vigência' 
    };
  }
}

export async function actionInativarSalario(id: number) {
  try {
    await requireAuth(['salarios:editar']);
    const salario = await service.inativarSalario(id);
    revalidatePath('/app/rh/salarios');
    return { success: true, data: salario };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao inativar salário' 
    };
  }
}

export async function actionExcluirSalario(id: number) {
  try {
    await requireAuth(['salarios:deletar']);
    await service.deletarSalario(id);
    revalidatePath('/app/rh/salarios');
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao excluir salário' 
    };
  }
}
