import { describe, it, expect } from '@jest/globals';

/**
 * MAIL MODULE — Repository Tests
 *
 * O repository.ts do módulo mail é atualmente um stub/placeholder.
 * As operações de dados são feitas via API routes (/api/mail/*) usando
 * IMAP/SMTP diretamente, sem queries Supabase.
 *
 * Este arquivo valida que o módulo repository existe e documenta
 * a arquitetura atual. Quando queries Supabase forem adicionadas
 * ao repository, os testes devem ser expandidos seguindo o padrão
 * do módulo notas (createChainableMock + jest.mock('@/lib/supabase')).
 */

describe('Mail Repository', () => {
    it('deve existir como módulo importável', async () => {
        // O repository.ts existe como ponto de extensão
        const repo = await import('../../repository');
        expect(repo).toBeDefined();
    });

    it('deve exportar as funções e constantes esperadas do repositório', async () => {
        const repo = await import('../../repository');
        // Filtra chaves internas do módulo ES (__esModule, default)
        const businessKeys = Object.keys(repo).filter(
            (k) => !['__esModule', 'default'].includes(k),
        );
        // O repository foi implementado com CRUD de credenciais_email via Supabase.
        // Operações de IMAP/SMTP continuam nas API routes (/api/mail/*).
        // TODO: expandir testes de unidade seguindo o padrão do módulo notas
        //       (createChainableMock + jest.mock('@/lib/supabase')) quando necessário.
        expect(businessKeys).toEqual(
            expect.arrayContaining([
                'CLOUDRON_DEFAULTS',
                'getEmailCredentialsById',
                'getEmailCredentials',
                'getAllEmailCredentials',
                'credentialsToMailConfig',
                'getUserMailConfig',
                'saveEmailCredentials',
                'deleteEmailCredentials',
            ]),
        );
        expect(businessKeys).toHaveLength(8);
    });
});
