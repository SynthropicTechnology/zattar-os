/**
 * ResponsiveTable
 * 
 * Componente de tabela responsiva que se adapta a diferentes tamanhos de tela.
 * Em mobile, oferece scroll horizontal com indicadores ou layout de cards.
 * Em desktop, exibe tabela completa com todas as colunas.
 */

'use client';

import * as React from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type PaginationState,
    type RowSelectionState,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, FileX, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { useViewport } from '@/hooks/use-viewport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type ResponsiveTableColumn<TData> = ColumnDef<TData> & {
    /**
     * Prioridade da coluna (1 = mais importante)
     * Colunas com menor prioridade são ocultadas primeiro em mobile
     */
    priority?: number;

    /**
     * Se a coluna deve ser sticky (fixada) em scroll horizontal
     */
    sticky?: boolean;

    /**
     * Renderização customizada para modo card (mobile)
     */
    cardRender?: (row: TData) => React.ReactNode;

    /**
     * Label para exibir no modo card
     */
    cardLabel?: string;
};

export interface ResponsiveTableProps<TData> {
    // Dados
    data: TData[];
    columns: ResponsiveTableColumn<TData>[];

    // Paginação server-side
    pagination?: {
        pageIndex: number;
        pageSize: number;
        total: number;
        totalPages: number;
        onPageChange: (pageIndex: number) => void;
        onPageSizeChange: (pageSize: number) => void;
    };

    // Ordenação server-side
    sorting?: {
        columnId: string | null;
        direction: 'asc' | 'desc' | null;
        onSortingChange: (columnId: string | null, direction: 'asc' | 'desc' | null) => void;
    };

    // Seleção de linhas
    rowSelection?: {
        state: RowSelectionState;
        onRowSelectionChange: (state: RowSelectionState) => void;
        getRowId?: (row: TData) => string;
    };

    // Estados
    isLoading?: boolean;
    error?: string | null;

    // Configurações responsivas
    mobileLayout?: 'cards' | 'scroll';
    stickyFirstColumn?: boolean;
    mobileVisibleColumns?: string[];

    // Ações de linha
    rowActions?: {
        label: string;
        onClick: (row: TData) => void;
        icon?: React.ReactNode;
    }[];

    // Configurações opcionais
    onRowClick?: (row: TData) => void;
    emptyMessage?: string;
    className?: string;
    hideTableBorder?: boolean;
    hideColumnBorders?: boolean;
}

export function ResponsiveTable<TData>({
    data,
    columns,
    pagination,
    sorting,
    rowSelection,
    isLoading = false,
    error = null,
    mobileLayout = 'scroll',
    stickyFirstColumn = false,
    mobileVisibleColumns,
    rowActions,
    onRowClick,
    emptyMessage = 'Nenhum resultado encontrado.',
    className,
    hideTableBorder = false,
    hideColumnBorders = false,
}: ResponsiveTableProps<TData>) {
    const viewport = useViewport();
    const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);

    // Determina se deve usar layout mobile
    const useMobileLayout = viewport.isMobile && mobileLayout === 'cards';

    // Sincronizar ordenação externa com estado interno
    React.useEffect(() => {
        if (sorting) {
            if (sorting.columnId && sorting.direction) {
                setInternalSorting([{
                    id: sorting.columnId,
                    desc: sorting.direction === 'desc',
                }]);
            } else {
                setInternalSorting([]);
            }
        }
    }, [sorting]);

    // Configurar paginação
    const paginationState: PaginationState = React.useMemo(() => {
        if (pagination) {
            return {
                pageIndex: pagination.pageIndex,
                pageSize: pagination.pageSize,
            };
        }
        return {
            pageIndex: 0,
            pageSize: 10,
        };
    }, [pagination]);

    // Filtrar colunas visíveis em mobile
    const visibleColumns = React.useMemo(() => {
        if (!viewport.isMobile) return columns;

        if (mobileVisibleColumns) {
            return columns.filter(col => {
                const id = (col as { id?: string; accessorKey?: string }).id ||
                    (col as { accessorKey?: string }).accessorKey;
                return id && mobileVisibleColumns.includes(id);
            });
        }

        // Ordenar por prioridade e pegar as mais importantes
        return [...columns]
            .sort((a, b) => (a.priority || 999) - (b.priority || 999))
            .slice(0, 3);
    }, [columns, viewport.isMobile, mobileVisibleColumns]);

    const table = useReactTable({
        data,
        columns: useMobileLayout ? columns : visibleColumns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: !!pagination,
        manualSorting: !!sorting,
        pageCount: pagination?.totalPages ?? -1,
        getRowId: rowSelection?.getRowId,
        enableRowSelection: !!rowSelection,
        state: {
            pagination: paginationState,
            sorting: internalSorting,
            rowSelection: rowSelection?.state ?? {},
        },
        onSortingChange: (updater) => {
            const newSorting = typeof updater === 'function' ? updater(internalSorting) : updater;
            setInternalSorting(newSorting);

            if (sorting && newSorting.length > 0) {
                const sort = newSorting[0];
                sorting.onSortingChange(sort.id, sort.desc ? 'desc' : 'asc');
            } else if (sorting) {
                sorting.onSortingChange(null, null);
            }
        },
        onRowSelectionChange: (updater) => {
            if (rowSelection) {
                const newSelection = typeof updater === 'function' ? updater(rowSelection.state) : updater;
                rowSelection.onRowSelectionChange(newSelection);
            }
        },
    });

    const handlePageChange = (newPageIndex: number) => {
        if (pagination && newPageIndex >= 0 && newPageIndex < pagination.totalPages) {
            pagination.onPageChange(newPageIndex);
        }
    };

    const handlePageSizeChange = (newPageSize: string) => {
        if (pagination) {
            pagination.onPageSizeChange(Number(newPageSize));
        }
    };

    // Renderização em modo card para mobile
    const renderCardLayout = () => {
        if (!table.getRowModel().rows?.length) {
            return (
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <FileX className="h-6 w-6" />
                        </EmptyMedia>
                        <EmptyTitle>{emptyMessage}</EmptyTitle>
                    </EmptyHeader>
                </Empty>
            );
        }

        return (
            <div className="space-y-4">
                {table.getRowModel().rows.map((row) => (
                    <Card
                        key={row.id}
                        className={cn(
                            'cursor-pointer transition-colors hover:bg-muted/50',
                            row.getIsSelected() && 'border-primary'
                        )}
                        onClick={() => onRowClick?.(row.original)}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <CardTitle className="text-base">
                                    {/* Renderiza a primeira coluna como título */}
                                    {flexRender(
                                        columns[0].cell,
                                        row.getAllCells()[0].getContext()
                                    )}
                                </CardTitle>
                                {rowActions && rowActions.length > 0 && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="sm" className="h-11 w-11 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {rowActions.map((action, idx) => (
                                                <DropdownMenuItem
                                                    key={idx}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        action.onClick(row.original);
                                                    }}
                                                >
                                                    {action.icon && <span className="mr-2">{action.icon}</span>}
                                                    {action.label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {columns.slice(1).map((column, idx) => {
                                const cell = row.getAllCells()[idx + 1];
                                if (!cell) return null;

                                const label = column.cardLabel ||
                                    (typeof column.header === 'string' ? column.header : '');

                                return (
                                    <div key={cell.id} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{label}:</span>
                                        <span className="font-medium">
                                            {flexRender(column.cell, cell.getContext())}
                                        </span>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    // Renderização em modo tabela
    const renderTableLayout = () => {
        return (
            <div className={cn(
                'relative w-full overflow-auto',
            )}>
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {error && (
                    <div className="p-4 text-center text-sm text-destructive">
                        {error}
                    </div>
                )}

                {!error && (
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header, index) => {
                                        const isSticky = stickyFirstColumn && index === 0;
                                        const columnSize = header.column.columnDef.size;
                                        const maxWidth = columnSize ? `${columnSize}px` : undefined;
                                        // Sempre centralizar headers
                                        const alignClass = 'text-center';

                                        return (
                                            <TableHead
                                                key={header.id}
                                                className={cn(
                                                    alignClass,
                                                    !hideColumnBorders && index < headerGroup.headers.length - 1 && 'border-r border-border',
                                                    // Primeira coluna sem sticky background especial
                                                    isSticky && 'sticky left-0 z-10 bg-card'
                                                )}
                                                style={maxWidth ? { maxWidth, minWidth: maxWidth } : undefined}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        );
                                    })}
                                    {rowActions && viewport.isMobile && (
                                        <TableHead className="w-12.5">
                                            <span className="sr-only">Ações</span>
                                        </TableHead>
                                    )}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row, rowIndex) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && 'selected'}
                                        className={cn(
                                            onRowClick ? 'cursor-pointer' : '',
                                            // Usar bg-muted/50 para linhas ímpares (alternância)
                                            rowIndex % 2 === 1 ? 'bg-muted/50' : ''
                                        )}
                                        onClick={() => onRowClick?.(row.original)}
                                    >
                                        {row.getVisibleCells().map((cell, index) => {
                                            const isSticky = stickyFirstColumn && index === 0;
                                            const columnSize = cell.column.columnDef.size;
                                            const maxWidth = columnSize ? `${columnSize}px` : undefined;
                                            const align = (cell.column.columnDef.meta as { align?: 'left' | 'center' | 'right' })?.align || 'center';
                                            const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
                                            const hasBorder = index < row.getVisibleCells().length - 1;

                                            return (
                                                <TableCell
                                                    key={cell.id}
                                                    className={cn(
                                                        alignClass,
                                                        hasBorder && !hideColumnBorders && 'border-r border-border',
                                                        // Primeira coluna sem sticky background especial
                                                        isSticky && 'sticky left-0 z-10 bg-inherit'
                                                    )}
                                                    style={maxWidth ? { maxWidth, minWidth: maxWidth } : undefined}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            );
                                        })}
                                        {rowActions && viewport.isMobile && (
                                            <TableCell className="w-12.5">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="sm" className="h-11 w-11 p-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {rowActions.map((action, idx) => (
                                                            <DropdownMenuItem
                                                                key={idx}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    action.onClick(row.original);
                                                                }}
                                                            >
                                                                {action.icon && <span className="mr-2">{action.icon}</span>}
                                                                {action.label}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length + (rowActions && viewport.isMobile ? 1 : 0)} className="p-0">
                                        <Empty>
                                            <EmptyHeader>
                                                <EmptyMedia variant="icon">
                                                    <FileX className="h-6 w-6" />
                                                </EmptyMedia>
                                                <EmptyTitle>{emptyMessage}</EmptyTitle>
                                            </EmptyHeader>
                                        </Empty>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>
        );
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Tabela ou Cards */}
            <div className={cn(
                !useMobileLayout && !hideTableBorder && 'rounded-lg border bg-card text-card-foreground shadow-sm'
            )}>
                {useMobileLayout ? renderCardLayout() : renderTableLayout()}
            </div>

            {/* Paginação */}
            {pagination && pagination.totalPages > 0 && (
                <div className={cn(
                    'flex items-center gap-2 px-2',
                    viewport.isMobile ? 'flex-col' : 'justify-between'
                )}>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                            {viewport.isMobile ? (
                                `${pagination.pageIndex + 1}/${pagination.totalPages}`
                            ) : (
                                <>
                                    Mostrando {pagination.pageIndex * pagination.pageSize + 1} a{' '}
                                    {Math.min((pagination.pageIndex + 1) * pagination.pageSize, pagination.total)} de{' '}
                                    {pagination.total} resultados
                                </>
                            )}
                        </p>
                        <Select
                            value={pagination.pageSize.toString()}
                            onValueChange={handlePageSizeChange}
                        >
                            <SelectTrigger className="h-8 w-[min(22vw,4.375rem)] bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 50, 100].map((size) => (
                                    <SelectItem key={size} value={size.toString()}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        {!viewport.isMobile && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(0)}
                                disabled={pagination.pageIndex === 0 || isLoading}
                                className="bg-background"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.pageIndex - 1)}
                            disabled={pagination.pageIndex === 0 || isLoading}
                            className="bg-background"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            {viewport.isMobile ? (
                                `${pagination.pageIndex + 1}/${pagination.totalPages}`
                            ) : (
                                `Página ${pagination.pageIndex + 1} de ${pagination.totalPages}`
                            )}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.pageIndex + 1)}
                            disabled={pagination.pageIndex >= pagination.totalPages - 1 || isLoading}
                            className="bg-background"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        {!viewport.isMobile && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.totalPages - 1)}
                                disabled={pagination.pageIndex >= pagination.totalPages - 1 || isLoading}
                                className="bg-background"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
