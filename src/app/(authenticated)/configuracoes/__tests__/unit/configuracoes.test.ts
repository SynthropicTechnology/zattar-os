/**
 * Testes unitários para o módulo configuracoes
 *
 * O módulo configuracoes não possui domain.ts/service.ts/repository.ts.
 * A lógica testável reside em settings-nav-items.ts que contém:
 * - VALID_TABS: Set de tabs válidas
 * - findNavItem(): busca de item de navegação por tab ID
 * - ALL_NAV_ITEMS: lista achatada de todos os itens de navegação
 * - SETTINGS_NAV_GROUPS: estrutura de grupos de navegação
 * - SETTINGS_EXTERNAL_LINKS: links externos
 *
 * Requirements: 1.4, 1.5
 */

import {
    VALID_TABS,
    findNavItem,
    ALL_NAV_ITEMS,
    SETTINGS_NAV_GROUPS,
    SETTINGS_EXTERNAL_LINKS,
    type SettingsTab,
    type SettingsNavItem,
    type SettingsNavGroup,
} from '@/app/(authenticated)/configuracoes/components/settings-nav-items';

describe('Módulo configuracoes — settings-nav-items', () => {
    // ===========================================================================
    // VALID_TABS
    // ===========================================================================
    describe('VALID_TABS', () => {
        const expectedTabs: SettingsTab[] = [
            'metricas',
            'seguranca',
            'integracoes',
            'assistentes-ia',
            'aparencia',
            'prompts-ia',
            'tipos-expedientes',
            'tipos-audiencias',
        ];

        it('deve conter todas as tabs esperadas', () => {
            for (const tab of expectedTabs) {
                expect(VALID_TABS.has(tab)).toBe(true);
            }
        });

        it('deve ter exatamente o número correto de tabs', () => {
            expect(VALID_TABS.size).toBe(expectedTabs.length);
        });

        it('não deve conter tabs inválidas', () => {
            expect(VALID_TABS.has('inexistente' as SettingsTab)).toBe(false);
            expect(VALID_TABS.has('' as SettingsTab)).toBe(false);
        });
    });

    // ===========================================================================
    // findNavItem
    // ===========================================================================
    describe('findNavItem', () => {
        it('deve retornar o item correto para tab "metricas"', () => {
            const item = findNavItem('metricas');
            expect(item).toBeDefined();
            expect(item!.id).toBe('metricas');
            expect(item!.label).toBe('Métricas DB');
            expect(item!.description).toBeTruthy();
            expect(item!.icon).toBeDefined();
        });

        it('deve retornar undefined para tab inexistente', () => {
            const item = findNavItem('inexistente' as SettingsTab);
            expect(item).toBeUndefined();
        });

        it('deve retornar item com todas as propriedades obrigatórias para cada tab', () => {
            for (const tab of VALID_TABS) {
                const item = findNavItem(tab);
                expect(item).toBeDefined();
                expect(item!.id).toBe(tab);
                expect(typeof item!.label).toBe('string');
                expect(item!.label.length).toBeGreaterThan(0);
                expect(typeof item!.description).toBe('string');
                expect(item!.description.length).toBeGreaterThan(0);
                expect(item!.icon).toBeDefined();
            }
        });
    });

    // ===========================================================================
    // ALL_NAV_ITEMS
    // ===========================================================================
    describe('ALL_NAV_ITEMS', () => {
        it('deve ser um array com todos os itens de navegação', () => {
            expect(Array.isArray(ALL_NAV_ITEMS)).toBe(true);
            expect(ALL_NAV_ITEMS.length).toBe(VALID_TABS.size);
        });

        it('deve conter IDs únicos (sem duplicatas)', () => {
            const ids = ALL_NAV_ITEMS.map((item: SettingsNavItem) => item.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });

        it('deve ser derivado de SETTINGS_NAV_GROUPS (flatMap)', () => {
            const fromGroups = SETTINGS_NAV_GROUPS.flatMap(
                (g: SettingsNavGroup) => g.items,
            );
            expect(ALL_NAV_ITEMS).toEqual(fromGroups);
        });
    });

    // ===========================================================================
    // SETTINGS_NAV_GROUPS
    // ===========================================================================
    describe('SETTINGS_NAV_GROUPS', () => {
        it('deve conter grupos com labels não-vazios', () => {
            for (const group of SETTINGS_NAV_GROUPS) {
                expect(typeof group.label).toBe('string');
                expect(group.label.length).toBeGreaterThan(0);
            }
        });

        it('cada grupo deve conter pelo menos um item', () => {
            for (const group of SETTINGS_NAV_GROUPS) {
                expect(group.items.length).toBeGreaterThan(0);
            }
        });

        it('deve conter os grupos esperados', () => {
            const labels = SETTINGS_NAV_GROUPS.map((g: SettingsNavGroup) => g.label);
            expect(labels).toContain('Sistema');
            expect(labels).toContain('Integrações');
            expect(labels).toContain('Personalização');
            expect(labels).toContain('Operacional');
        });
    });

    // ===========================================================================
    // SETTINGS_EXTERNAL_LINKS
    // ===========================================================================
    describe('SETTINGS_EXTERNAL_LINKS', () => {
        it('deve ser um array', () => {
            expect(Array.isArray(SETTINGS_EXTERNAL_LINKS)).toBe(true);
        });

        it('cada link deve ter label, icon e href', () => {
            for (const link of SETTINGS_EXTERNAL_LINKS) {
                expect(typeof link.label).toBe('string');
                expect(link.label.length).toBeGreaterThan(0);
                expect(link.icon).toBeDefined();
                expect(typeof link.href).toBe('string');
                expect(link.href.startsWith('/')).toBe(true);
            }
        });
    });
});

describe('Módulo configuracoes — Barrel Export (index.ts)', () => {
    beforeEach(() => {
        jest.resetModules();
        // Mock heavy component deps to avoid deep import chains (audiencias → Supabase)
        jest.mock(
            '@/app/(authenticated)/configuracoes/components/configuracoes-settings-layout',
            () => ({ ConfiguracoesSettingsLayout: () => 'mock' }),
        );
        jest.mock(
            '@/app/(authenticated)/configuracoes/components/settings-section-header',
            () => ({ SettingsSectionHeader: () => 'mock' }),
        );
        jest.mock(
            '@/app/(authenticated)/configuracoes/components/settings-nav',
            () => ({ SettingsNav: () => 'mock' }),
        );
        jest.mock(
            '@/app/(authenticated)/configuracoes/components/settings-mobile-nav',
            () => ({ SettingsMobileNav: () => 'mock' }),
        );
        jest.mock(
            '@/app/(authenticated)/configuracoes/components/aparencia-content',
            () => ({ AparenciaContent: () => 'mock' }),
        );
    });

    afterEach(() => jest.restoreAllMocks());

    it('deve exportar componentes e tipos esperados', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const barrel = require('@/app/(authenticated)/configuracoes');

        expect(barrel).toHaveProperty('ConfiguracoesSettingsLayout');
        expect(barrel).toHaveProperty('SettingsSectionHeader');
        expect(barrel).toHaveProperty('SettingsNav');
        expect(barrel).toHaveProperty('SettingsMobileNav');
        expect(barrel).toHaveProperty('AparenciaContent');
        expect(barrel).toHaveProperty('VALID_TABS');
        expect(barrel).toHaveProperty('findNavItem');
    });

    it('não deve exportar domain/service/repository (módulo sem camadas FSD)', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const barrel = require('@/app/(authenticated)/configuracoes');

        expect(barrel).not.toHaveProperty('domain');
        expect(barrel).not.toHaveProperty('service');
        expect(barrel).not.toHaveProperty('repository');
    });
});

describe('Módulo configuracoes — page.tsx', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.mock('@/app/(authenticated)/admin', () => ({
            actionObterMetricasDB: jest.fn(),
        }));
        jest.mock('@/lib/integracoes', () => ({
            actionListarIntegracoesPorTipo: jest.fn(),
        }));
        jest.mock('@/lib/system-prompts', () => ({
            actionListarSystemPrompts: jest.fn(),
        }));
        jest.mock(
            '@/app/(authenticated)/configuracoes/components/configuracoes-settings-layout',
            () => ({ ConfiguracoesSettingsLayout: () => 'mock' }),
        );
        jest.mock('next/navigation', () => ({
            redirect: jest.fn(),
        }));
    });

    afterEach(() => jest.restoreAllMocks());

    it('deve exportar dynamic = "force-dynamic"', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const page = require('@/app/(authenticated)/configuracoes/page');
        expect(page.dynamic).toBe('force-dynamic');
    });

    it('deve exportar componente default (ConfiguracoesPage)', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const page = require('@/app/(authenticated)/configuracoes/page');
        expect(page.default).toBeDefined();
        expect(typeof page.default).toBe('function');
    });
});
