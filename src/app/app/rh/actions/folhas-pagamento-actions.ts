
'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from './utils';
import { checkPermission } from '@/lib/auth/authorization';
import * as service from '../service';
import {
  gerarFolhaSchema,
  aprovarFolhaSchema,
  pagarFolhaSchema
} from '../domain';
import type { ListarFolhasParams } from '../domain';

interface ListarFolhasPagamentoParams extends ListarFolhasParams {
  incluirTotais?: boolean;
}

export async function actionListarFolhasPagamento(params: ListarFolhasPagamentoParams) {
  try {
    const { userId } = await requireAuth(['folhas_pagamento:listar']);
    const result = await service.listarFolhasPagamento(params);

    const podeVisualizarTodos = await checkPermission(userId, 'folhas_pagamento', 'visualizar_todos');

    if (!podeVisualizarTodos) {
      result.items = result.items
        .filter(folha => folha.itens.some(item => item.usuarioId === userId))
        .map(folha => ({
          ...folha,
          itens: folha.itens.filter(item => item.usuarioId === userId)
        }));
      
      // Ajuste básico de paginação para refletir apenas os itens filtrados na página atual
      // Nota: Isso não corrige o total global, que exigiria suporte no repositório
      result.paginacao.total = result.items.length; 
    }

    let totais;
    if (params.incluirTotais) {
      totais = await service.calcularTotaisPorStatus();
    }

    return { 
      success: true, 
      data: {
        ...result,
        totais
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao listar folhas' 
    };
  }
}

export async function actionBuscarFolhaPagamento(id: number) {
  try {
    await requireAuth(['folhas_pagamento:listar']);
    const folha = await service.buscarFolhaPorId(id);
    if (!folha) {
      return { success: false, error: 'Folha de pagamento não encontrada' };
    }
    return { success: true, data: folha };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao buscar folha' 
    };
  }
}

export async function actionBuscarFolhaPorPeriodo(mes: number, ano: number) {
  try {
    await requireAuth(['folhas_pagamento:listar']);
    const folha = await service.buscarFolhaPorPeriodo(mes, ano);
    return { success: true, data: folha };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar folha por período'
    };
  }
}

export async function actionGerarFolhaPagamento(formData: FormData) {
  try {
    const { userId } = await requireAuth(['folhas_pagamento:criar']);

    const dados = {
      mesReferencia: Number(formData.get('mesReferencia')),
      anoReferencia: Number(formData.get('anoReferencia')),
      dataPagamento: formData.get('dataPagamento') ? String(formData.get('dataPagamento')) : undefined,
      observacoes: formData.get('observacoes') ? String(formData.get('observacoes')) : undefined,
    };

    const validacao = gerarFolhaSchema.safeParse(dados);
    if (!validacao.success) {
      return { 
        success: false, 
        error: validacao.error.errors[0].message 
      };
    }

    const folha = await service.gerarFolhaPagamento(validacao.data, userId);
    
    revalidatePath('/app/rh/folhas-pagamento');
    return { success: true, data: folha };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao gerar folha' 
    };
  }
}

export async function actionPreviewGerarFolha(mes: number, ano: number) {
  try {
    await requireAuth(['folhas_pagamento:criar']); // Needed to simulate generation
    const preview = await service.previewGerarFolha(mes, ano);
    return { success: true, data: preview };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao gerar preview da folha' 
    };
  }
}

export async function actionAprovarFolhaPagamento(id: number, formData: FormData) {
  try {
    const { userId } = await requireAuth(['folhas_pagamento:aprovar']);

    const dados = {
      contaBancariaId: Number(formData.get('contaBancariaId')),
      contaContabilId: Number(formData.get('contaContabilId')),
      centroCustoId: formData.get('centroCustoId') ? Number(formData.get('centroCustoId')) : undefined,
      observacoes: formData.get('observacoes') ? String(formData.get('observacoes')) : undefined,
    };

    const validacao = aprovarFolhaSchema.safeParse(dados);
    if (!validacao.success) {
      return { 
        success: false, 
        error: validacao.error.errors[0].message 
      };
    }

    const folha = await service.aprovarFolhaPagamento(id, validacao.data, userId);
    
    revalidatePath('/app/rh/folhas-pagamento');
    revalidatePath(`/app/rh/folhas-pagamento/${id}`);
    revalidatePath('/app/financeiro'); // Invalidate financeiro as we created launches
    
    return { success: true, data: folha };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao aprovar folha' 
    };
  }
}

export async function actionPagarFolhaPagamento(id: number, formData: FormData) {
  try {
    await requireAuth(['folhas_pagamento:pagar']);

    const dados = {
      formaPagamento: String(formData.get('formaPagamento')),
      contaBancariaId: Number(formData.get('contaBancariaId')),
      dataEfetivacao: formData.get('dataEfetivacao') ? String(formData.get('dataEfetivacao')) : undefined,
      observacoes: formData.get('observacoes') ? String(formData.get('observacoes')) : undefined,
    };

    const validacao = pagarFolhaSchema.safeParse(dados);
    if (!validacao.success) {
      return { 
        success: false, 
        error: validacao.error.errors[0].message 
      };
    }

    const folha = await service.pagarFolhaPagamento(id, validacao.data);
    
    revalidatePath('/app/rh/folhas-pagamento');
    revalidatePath(`/app/rh/folhas-pagamento/${id}`);
    revalidatePath('/app/financeiro');
    
    return { success: true, data: folha };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao pagar folha' 
    };
  }
}


export async function actionAtualizarFolhaPagamento(id: number, formData: FormData) {
  try {

    await requireAuth(['folhas_pagamento:editar']); 

    const dados = {
      dataPagamento: formData.get('dataPagamento') ? String(formData.get('dataPagamento')) : undefined,
      observacoes: formData.get('observacoes') ? String(formData.get('observacoes')) : undefined,
    };

    // No schema for simple update yet, or reuse partial schema
    
    const folha = await service.atualizarFolhaPagamento(id, dados);
    
    revalidatePath('/app/rh/folhas-pagamento');
    revalidatePath(`/app/rh/folhas-pagamento/${id}`);
    return { success: true, data: folha };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao atualizar folha' 
    };
  }
}

export async function actionVerificarCancelamentoFolha(id: number) {
  try {
    await requireAuth(['folhas_pagamento:cancelar']); 
    const result = await service.podeCancelarFolha(id);
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao verificar cancelamento' 
    };
  }
}

export async function actionObterResumoPagamento(id: number) {
  try {
    await requireAuth(['folhas_pagamento:pagar']);
    const resumo = await service.calcularTotalAPagar(id);
    return { success: true, data: resumo };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao obter resumo de pagamento' 
    };
  }
}

export async function actionCancelarFolhaPagamento(id: number, motivo?: string) {
    try {
        await requireAuth(['folhas_pagamento:cancelar']);
        const folha = await service.cancelarFolhaPagamento(id, motivo);
        
        revalidatePath('/app/rh/folhas-pagamento');
        revalidatePath(`/app/rh/folhas-pagamento/${id}`);
        revalidatePath('/app/financeiro');

        return { success: true, data: folha };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao cancelar folha'
        };
    }
}

export async function actionExcluirFolhaPagamento(id: number) {
  try {
    await requireAuth(['folhas_pagamento:deletar']); // Only draft deletion
    await service.deletarFolhaPagamento(id);
    
    revalidatePath('/app/rh/folhas-pagamento');

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao excluir folha' 
    };
  }
}
