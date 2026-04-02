'use server';

import { difyRepository } from './repository';
import { DifyService } from './service';
import { revalidatePath } from 'next/cache';
import { authenticateRequest } from '@/lib/auth/session';
import {
    criarAssistenteDify,
    deletarAssistentePorDifyApp,
    sincronizarAssistenteDify,
} from '@/app/app/assistentes/feature/service';

export async function listDifyAppsAction() {
    const result = await difyRepository.listDifyApps();
    if (result.isErr()) {
        throw new Error(result.error.message);
    }
    return result.value;
}

export async function getDifyAppAction(id: string) {
    const result = await difyRepository.getDifyApp(id);
    if (result.isErr()) {
        throw new Error(result.error.message);
    }
    return result.value;
}

export async function createDifyAppAction(data: { name: string; api_url: string; api_key: string; app_type: string }) {
    const result = await difyRepository.createDifyApp(data);
    if (result.isErr()) {
        throw new Error(result.error.message);
    }

    const difyApp = result.value;

    // Auto-criar assistente vinculado
    try {
        const user = await authenticateRequest();
        if (user) {
            await criarAssistenteDify(
                {
                    nome: difyApp.name,
                    descricao: `Assistente ${difyApp.app_type} via Dify`,
                    dify_app_id: difyApp.id,
                },
                user.id
            );
        }
    } catch (error) {
        console.error('[Dify] Erro ao auto-criar assistente:', error);
    }

    try {
        await sincronizarDifyAppMetadata(difyApp.id);
    } catch (error) {
        console.error('[Dify] Erro ao sincronizar metadata do app:', error);
    }

    revalidatePath('/app/configuracoes');
    revalidatePath('/app/assistentes');
    return { success: true, data: difyApp };
}

export async function updateDifyAppAction(id: string, data: Partial<{ name: string; api_url: string; api_key: string; app_type: string; is_active: boolean }>) {
    const result = await difyRepository.updateDifyApp(id, data);
    if (result.isErr()) {
        throw new Error(result.error.message);
    }

    // Sincronizar assistente vinculado
    try {
        await sincronizarAssistenteDify(id, {
            nome: data.name,
            ativo: data.is_active,
        });
    } catch (error) {
        console.error('[Dify] Erro ao sincronizar assistente:', error);
    }

    try {
        await sincronizarDifyAppMetadata(id);
    } catch (error) {
        console.error('[Dify] Erro ao sincronizar metadata do app:', error);
    }

    revalidatePath('/app/configuracoes');
    revalidatePath('/app/assistentes');
    return { success: true };
}

export async function deleteDifyAppAction(id: string) {
    // Deletar assistente vinculado primeiro
    try {
        await deletarAssistentePorDifyApp(id);
    } catch (error) {
        console.error('[Dify] Erro ao deletar assistente vinculado:', error);
    }

    const result = await difyRepository.deleteDifyApp(id);
    if (result.isErr()) {
        throw new Error(result.error.message);
    }

    revalidatePath('/app/configuracoes');
    revalidatePath('/app/assistentes');
    return { success: true };
}

export async function checkDifyAppConnectionAction(apiUrl: string, apiKey: string) {
    try {
        const serviceResult = DifyService.create(apiKey, apiUrl);
        if (serviceResult.isErr()) throw serviceResult.error;

        const service = serviceResult.value;
        const infoResult = await service.obterInfoApp();

        if (infoResult.isErr()) {
            return { success: false, message: infoResult.error.message };
        }

        return { success: true, data: infoResult.value };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, message };
    }
}

async function sincronizarDifyAppMetadata(appId: string) {
    const service = await DifyService.createAsync('system', appId);
    const metadataResult = await service.obterMetadataCompleta();
    if (metadataResult.isErr()) {
        throw metadataResult.error;
    }

    const updateResult = await difyRepository.updateDifyAppMetadata(appId, metadataResult.value);
    if (updateResult.isErr()) {
        throw updateResult.error;
    }
}

export async function syncDifyAppMetadataAction(appId: string) {
    try {
        await sincronizarDifyAppMetadata(appId);
        revalidatePath('/app/configuracoes');
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, message };
    }
}

export async function getDifyConfigAction() {
    const result = await difyRepository.getActiveDifyApp();
    if (result.isErr()) {
        return null;
    }
    return result.value;
}

export async function saveDifyConfigAction(data: { api_url: string; api_key: string }) {
    const activeResult = await difyRepository.getActiveDifyApp();

    if (activeResult.isOk() && activeResult.value) {
        const updateResult = await difyRepository.updateDifyApp(activeResult.value.id as string, {
            api_url: data.api_url,
            api_key: data.api_key,
        });
        if (updateResult.isErr()) {
            throw new Error(updateResult.error.message);
        }
    } else {
        const createResult = await difyRepository.createDifyApp({
            name: 'Dify App',
            api_url: data.api_url,
            api_key: data.api_key,
            app_type: 'chat',
        });
        if (createResult.isErr()) {
            throw new Error(createResult.error.message);
        }
    }

    revalidatePath('/app/configuracoes');
    return { success: true };
}

export async function checkDifyConnectionAction() {
    const configResult = await difyRepository.getActiveDifyApp();
    if (configResult.isErr() || !configResult.value) {
        return { success: false, message: 'Configuração não encontrada' };
    }

    const config = configResult.value;
    return checkDifyAppConnectionAction(config.api_url as string, config.api_key as string);
}
