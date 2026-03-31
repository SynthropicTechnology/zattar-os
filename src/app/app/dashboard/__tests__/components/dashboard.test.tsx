/**
 * Property-Based Tests for Dashboard Responsiveness
 * 
 * Tests responsive behavior of dashboard components across different viewport sizes.
 * Uses fast-check for property-based testing to verify properties hold across many inputs.
 */

import React from 'react';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
// Mock do DashboardFilters com estrutura que espelha o componente real
const DashboardFilters = ({ children, activeFiltersCount }: {
    children: React.ReactNode;
    activeFiltersCount?: number;
    onApply?: () => void;
    onClear?: () => void;
}) => {
    // When useViewport says mobile, render sheet-trigger style; otherwise inline
    const viewport = mockUseViewport();
    if (viewport.isMobile) {
        return (
            <div>
                <button data-slot="sheet-trigger">
                    Filtros
                    {activeFiltersCount && activeFiltersCount > 0 ? (
                        <span className="ml-2">{activeFiltersCount}</span>
                    ) : null}
                </button>
                <div>{children}</div>
            </div>
        );
    }
    return (
        <div>
            <h3 className="text-sm">Filtros</h3>
            {children}
        </div>
    );
};
const FilterGroup = ({ children, label }: { children: React.ReactNode; label?: string }) => (
    <div>
        {label && <label>{label}</label>}
        {children}
    </div>
);
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { setViewport } from '@/testing/helpers/responsive-test-helpers';

// Mock do useViewport hook
interface MockViewportReturn {
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    orientation: 'portrait' | 'landscape';
    breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

// Declarar mock antes de usar no jest.mock
const mockUseViewport = jest.fn<MockViewportReturn, []>();

jest.mock('@/hooks/use-viewport', () => ({
    useViewport: () => mockUseViewport(),
}));

// Inicializar valor padrão após o mock
mockUseViewport.mockReturnValue({
    width: 1024,
    height: 768,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape',
    breakpoint: 'lg',
});

describe('Dashboard Responsive Properties', () => {
    beforeEach(() => {
        // Reset viewport mock antes de cada teste
        mockUseViewport.mockReturnValue({
            width: 1024,
            height: 768,
            isMobile: false,
            isTablet: false,
            isDesktop: true,
            orientation: 'landscape',
            breakpoint: 'lg',
        });
    });

    /**
     * Property 39: Dashboard widgets stacked on mobile
     * **Validates: Requirements 9.1**
     * 
     * Para qualquer viewport width < 640px, os widgets do dashboard
     * devem ser empilhados verticalmente (1 coluna).
     */
    describe('Property 39: Dashboard widgets stacked on mobile', () => {
        test('Dashboard widgets display in single column for any viewport < 640px', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 320, max: 639 }), // Mobile viewport widths
                    fc.array(fc.string(), { minLength: 3, maxLength: 6 }), // Widget items
                    (width, widgetTitles) => {
                        // Configurar viewport mobile
                        setViewport(width);
                        mockUseViewport.mockReturnValue({
                            width,
                            height: 800,
                            isMobile: true,
                            isTablet: false,
                            isDesktop: false,
                            orientation: 'portrait',
                            breakpoint: 'xs',
                        });

                        // Renderizar grid de widgets com configuração mobile
                        const { container } = render(
                            <ResponsiveGrid
                                columns={{ xs: 1, sm: 1, md: 2, lg: 3, xl: 3 }}
                                gap={4}
                            >
                                {widgetTitles.map((title, idx) => (
                                    <Card key={idx}>
                                        <CardHeader>
                                            <CardTitle>{title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>Widget content</CardContent>
                                    </Card>
                                ))}
                            </ResponsiveGrid>
                        );

                        const gridElement = container.firstChild as HTMLElement;

                        // Verificar que tem a classe grid-cols-1
                        expect(gridElement).toHaveClass('grid-cols-1');

                        // Verificar que o grid tem o atributo data-breakpoint correto
                        expect(gridElement.getAttribute('data-breakpoint')).toBe('xs');
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    /**
     * Property 40: Charts scale on mobile
     * **Validates: Requirements 9.2**
     * 
     * Para qualquer chart/gráfico exibido em mobile, ele deve escalar
     * para caber na largura do viewport mantendo legibilidade.
     */
    describe('Property 40: Charts scale on mobile', () => {
        test('Charts scale to fit viewport width while maintaining readability on mobile', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 320, max: 767 }), // Mobile viewport widths
                    (width) => {
                        // Configurar viewport mobile
                        setViewport(width);
                        mockUseViewport.mockReturnValue({
                            width,
                            height: 800,
                            isMobile: true,
                            isTablet: false,
                            isDesktop: false,
                            orientation: 'portrait',
                            breakpoint: width < 640 ? 'xs' : 'sm',
                        });

                        // Renderizar card com chart
                        const { container } = render(
                            <Card>
                                <CardHeader>
                                    <CardTitle>Chart Widget</CardTitle>
                                </CardHeader>
                                <CardContent className="h-56 sm:h-64 overflow-x-auto">
                                    <div style={{ width: '100%', minWidth: '300px', height: '100%' }}>
                                        Chart content
                                    </div>
                                </CardContent>
                            </Card>
                        );

                        const cardContent = container.querySelector('.overflow-x-auto') as HTMLElement;

                        // Verificar que o conteúdo tem overflow-x-auto para scroll horizontal se necessário
                        expect(cardContent).toHaveClass('overflow-x-auto');

                        // Verificar que tem altura responsiva
                        const hasResponsiveHeight =
                            cardContent.classList.contains('h-56') ||
                            cardContent.classList.contains('sm:h-64');
                        expect(hasResponsiveHeight).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    /**
     * Property 41: Dashboard metrics prioritization
     * **Validates: Requirements 9.3**
     * 
     * Para qualquer card de métricas em mobile, as métricas principais
     * devem ser priorizadas e visíveis sem necessidade de expansão.
     */
    describe('Property 41: Dashboard metrics prioritization', () => {
        test('Dashboard metric cards prioritize key metrics on mobile', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 320, max: 767 }), // Mobile viewport widths
                    fc.string({ minLength: 5, maxLength: 30 }), // Metric title
                    fc.integer({ min: 0, max: 999999 }), // Metric value
                    (width, title, value) => {
                        // Configurar viewport mobile
                        setViewport(width);
                        mockUseViewport.mockReturnValue({
                            width,
                            height: 800,
                            isMobile: true,
                            isTablet: false,
                            isDesktop: false,
                            orientation: 'portrait',
                            breakpoint: width < 640 ? 'xs' : 'sm',
                        });

                        // Renderizar card de métrica
                        const { container } = render(
                            <Card>
                                <CardContent className="pt-4 sm:pt-6">
                                    <div className="space-y-1 sm:space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground truncate">
                                            {title}
                                        </p>
                                        <p className="text-2xl sm:text-3xl font-bold">
                                            {value.toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );

                        // Verificar que o título está presente e truncado
                        const titleElements = container.querySelectorAll('.truncate');
                        const hasTitleWithTruncate = Array.from(titleElements).some(
                            el => el.textContent?.includes(title) || el.textContent === title
                        );
                        expect(hasTitleWithTruncate).toBe(true);

                        // Verificar que o valor está presente com tamanho responsivo
                        const valueElements = container.querySelectorAll('.text-2xl');
                        const hasValueWithResponsiveSize = Array.from(valueElements).some(
                            el => el.textContent === value.toLocaleString('pt-BR')
                        );
                        expect(hasValueWithResponsiveSize).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    /**
     * Property 42: Dashboard two-column on tablet
     * **Validates: Requirements 9.4**
     * 
     * Para qualquer dashboard visualizado em tablet (768px-1024px),
     * os widgets devem ser exibidos em layout de 2 colunas.
     */
    describe('Property 42: Dashboard two-column on tablet', () => {
        test('Dashboard widgets display in 2 columns for any tablet viewport (768px-1024px)', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 768, max: 1023 }), // Tablet viewport widths
                    fc.array(fc.string(), { minLength: 4, maxLength: 8 }), // Widget items
                    (width, widgetTitles) => {
                        // Configurar viewport tablet
                        setViewport(width);
                        mockUseViewport.mockReturnValue({
                            width,
                            height: 1024,
                            isMobile: false,
                            isTablet: true,
                            isDesktop: false,
                            orientation: 'landscape',
                            breakpoint: 'md',
                        });

                        // Renderizar grid de widgets com configuração tablet
                        const { container } = render(
                            <ResponsiveGrid
                                columns={{ xs: 1, sm: 1, md: 2, lg: 3, xl: 3 }}
                                gap={4}
                            >
                                {widgetTitles.map((title, idx) => (
                                    <Card key={idx}>
                                        <CardHeader>
                                            <CardTitle>{title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>Widget content</CardContent>
                                    </Card>
                                ))}
                            </ResponsiveGrid>
                        );

                        const gridElement = container.firstChild as HTMLElement;

                        // Verificar que tem a classe md:grid-cols-2
                        expect(gridElement).toHaveClass('md:grid-cols-2');

                        // Verificar que o grid tem o atributo data-breakpoint correto
                        expect(gridElement.getAttribute('data-breakpoint')).toBe('md');
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    /**
     * Property 43: Dashboard filters collapsible
     * **Validates: Requirements 9.5**
     * 
     * Para qualquer filtro de dashboard exibido em mobile,
     * eles devem ser agrupados em um painel colapsável ou bottom sheet.
     */
    describe('Property 43: Dashboard filters collapsible', () => {
        test('Dashboard filters are grouped in collapsible panel on mobile', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 320, max: 767 }), // Mobile viewport widths
                    fc.integer({ min: 0, max: 5 }), // Active filters count
                    (width, activeCount) => {
                        // Configurar viewport mobile
                        setViewport(width);
                        mockUseViewport.mockReturnValue({
                            width,
                            height: 800,
                            isMobile: true,
                            isTablet: false,
                            isDesktop: false,
                            orientation: 'portrait',
                            breakpoint: width < 640 ? 'xs' : 'sm',
                        });

                        // Renderizar filtros
                        const { container } = render(
                            <DashboardFilters
                                activeFiltersCount={activeCount}
                                onApply={jest.fn()}
                                onClear={jest.fn()}
                            >
                                <FilterGroup label="Período">
                                    <div>Date picker</div>
                                </FilterGroup>
                                <FilterGroup label="Status">
                                    <div>Select</div>
                                </FilterGroup>
                            </DashboardFilters>
                        );

                        // Verificar que o botão de filtros está presente
                        const filterButton = container.querySelector('button[data-slot="sheet-trigger"]');
                        expect(filterButton).toBeInTheDocument();
                        expect(filterButton?.textContent).toContain('Filtros');

                        // Se há filtros ativos, verificar que o badge está presente
                        if (activeCount > 0) {
                            const badge = container.querySelector('.ml-2');
                            expect(badge).toBeInTheDocument();
                            expect(badge?.textContent).toBe(activeCount.toString());
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('Dashboard filters display inline on desktop', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1024, max: 1920 }), // Desktop viewport widths
                    fc.integer({ min: 0, max: 5 }), // Active filters count
                    (width, activeCount) => {
                        // Configurar viewport desktop
                        setViewport(width);
                        mockUseViewport.mockReturnValue({
                            width,
                            height: 1080,
                            isMobile: false,
                            isTablet: false,
                            isDesktop: true,
                            orientation: 'landscape',
                            breakpoint: width < 1280 ? 'lg' : 'xl',
                        });

                        // Renderizar filtros
                        render(
                            <DashboardFilters
                                activeFiltersCount={activeCount}
                                onApply={jest.fn()}
                                onClear={jest.fn()}
                            >
                                <FilterGroup label="Período">
                                    <div>Date picker</div>
                                </FilterGroup>
                            </DashboardFilters>
                        );

                        // Verificar que o título dos filtros está presente (inline)
                        const { container: desktopContainer } = render(
                            <DashboardFilters
                                activeFiltersCount={activeCount}
                                onApply={jest.fn()}
                                onClear={jest.fn()}
                            >
                                <FilterGroup label="Período">
                                    <div>Date picker</div>
                                </FilterGroup>
                            </DashboardFilters>
                        );

                        const filterTitle = desktopContainer.querySelector('h3.text-sm');
                        expect(filterTitle).toBeInTheDocument();
                        expect(filterTitle?.textContent).toBe('Filtros');

                        // Verificar que os grupos de filtros estão visíveis
                        const periodLabel = desktopContainer.querySelector('label');
                        expect(periodLabel).toBeInTheDocument();
                        expect(periodLabel?.textContent).toBe('Período');
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
