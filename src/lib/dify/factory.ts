import { DifyService } from './service';

export async function createDifyServiceForUser(userId: string): Promise<DifyService> {
    const service = await DifyService.createAsync(userId);
    return service;
}

/**
 * Cria um DifyService configurado para um app específico (pelo ID do dify_app).
 * Usado quando o assistente sabe exatamente qual app Dify usar.
 */
export async function createDifyServiceForApp(appId: string): Promise<DifyService> {
    const service = await DifyService.createAsync('system', appId);
    return service;
}
