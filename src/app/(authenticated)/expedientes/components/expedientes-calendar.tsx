'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/providers/user-provider';
import {
    Calendar as CalendarIcon,
    RefreshCw,
    Settings,
    AlertTriangle,
} from 'lucide-react';
import {
    startOfWeek,
    format,
    addWeeks,
    subWeeks,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { DataShell, DataTable, DataTableToolbar } from '@/components/shared/data-shell';
import { ResponsiveFilterPanel } from '@/components/ui/responsive-filter-panel';
import { AppBadge } from '@/components/ui/app-badge';

import { DialogFormShell } from '@/components/shared/dialog-shell';
import { FilterPopover, type FilterOption } from '@/app/(authenticated)/partes/components/shared';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { WeekDaysCarousel } from '@/components/shared';

import type { PaginatedResponse } from '@/types';
import { ListarExpedientesParams, type Expediente } from '../domain';
import { actionListarExpedientes } from '../actions';
import { columns } from './columns';
import { ExpedienteDialog } from './expediente-dialog';
import { buildExpedientesFilterGroups, parseExpedientesFilters } from './expedientes-toolbar-filters';
import { TiposExpedientesList } from '@/app/(authenticated)/tipos-expedientes';
import { ExpedientesBulkActions } from './expedientes-bulk-actions';

type UsuarioOption = { id: number; nome_exibicao?: string; nomeExibicao?: string; nome?: string };
type TipoExpedienteOption = { id: number; tipoExpediente?: string; tipo_expediente?: string; nome?: string };

// Helper para obter nome do usuário
function getUsuarioNome(u: UsuarioOption): string {
  return u.nomeExibicao || u.nome_exibicao || u.nome || `Usuário ${u.id}`;
}

const STATUS_OPTIONS: readonly FilterOption[] = [
  { value: 'pendentes', label: 'Pendentes' },
  { value: 'baixados', label: 'Baixados' },
];

export function ExpedientesCalendar() {
    const router = useRouter();

    // State
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [statusFilter, setStatusFilter] = React.useState<'todos' | 'pendentes' | 'baixados'>('pendentes');
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]); // Usado via filterGroups no TableToolbar
    const [isNovoDialogOpen, setIsNovoDialogOpen] = React.useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [mostrarTodos, setMostrarTodos] = React.useState(false); // Por padrão, usuário vê apenas seus expedientes
    const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

    // Data State
    const [data, setData] = React.useState<PaginatedResponse<Expediente> | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Aux Data State
    const [usuarios, setUsuarios] = React.useState<UsuarioOption[]>([]);
    const [tiposExpedientes, setTiposExpedientes] = React.useState<TipoExpedienteOption[]>([]);
    const userData = useUser();
    const currentUserId = userData.id ?? null;

    // Load auxiliary data and current user
    React.useEffect(() => {
        const fetchAuxData = async () => {
            try {
                const [usersResponse, tiposResponse] = await Promise.all([
                    fetch('/api/usuarios?ativo=true&limite=100'),
                    fetch('/api/tipos-expedientes?limite=100'),
                ]);

                // Processar resposta de usuários
                if (usersResponse.ok) {
                    const contentType = usersResponse.headers.get('content-type');
                    if (contentType?.includes('application/json')) {
                        const usersRes = await usersResponse.json();
                        if (usersRes.success && usersRes.data?.usuarios) {
                            setUsuarios(usersRes.data.usuarios);
                        }
                    }
                }

                // Processar resposta de tipos
                if (tiposResponse.ok) {
                    const contentType = tiposResponse.headers.get('content-type');
                    if (contentType?.includes('application/json')) {
                        const tiposRes = await tiposResponse.json();
                        if (tiposRes.success && tiposRes.data?.data) {
                            setTiposExpedientes(tiposRes.data.data);
                        }
                    }
                }

            } catch (err) {
                console.error('Erro ao carregar dados auxiliares:', err);
            }
        };
        fetchAuxData();
    }, []);

    // Parse filters from selected filter IDs
    const parsedFilters = React.useMemo(() => {
        return parseExpedientesFilters(selectedFilters);
    }, [selectedFilters]);

    // Fetch Data
    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Filtrar por data selecionada (calendário semanal)
            const dateStr = format(selectedDate, 'yyyy-MM-dd');

            const params: ListarExpedientesParams = {
                pagina: 1,
                limite: 100, // Mostrar mais itens na visão de calendário
                busca: globalFilter || undefined,
                dataPrazoLegalInicio: dateStr,
                dataPrazoLegalFim: dateStr,
                // Preserva comportamento legado: itens "sem prazo" devem aparecer no calendário
                // mesmo quando filtramos por um dia específico.
                incluirSemPrazo: true,
                // Carregamento padrão: apenas expedientes em aberto (baixado = null)
                baixado: false,
            };

            // Aplicar filtros do toolbar
            Object.assign(params, parsedFilters);

            // Filtro padrão: usuário comum vê apenas seus expedientes
            // Mas pode marcar para ver todos
            if (!mostrarTodos && currentUserId) {
                params.responsavelId = currentUserId;
            }

            // Status filter (pendentes/baixados/todos)
            if (statusFilter === 'pendentes') {
                params.baixado = false;
            } else if (statusFilter === 'baixados') {
                params.baixado = true;
            } else {
                // 'todos' - não define baixado, mostra todos
                delete params.baixado;
            }

            const result = await actionListarExpedientes(params);

            if (!result.success) {
                throw new Error(result.message || 'Erro ao listar expedientes');
            }

            setData(result.data as PaginatedResponse<Expediente>);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate, globalFilter, statusFilter, parsedFilters, mostrarTodos, currentUserId]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePreviousWeek = () => {
        const newDate = subWeeks(currentDate, 1);
        setCurrentDate(newDate);
        setSelectedDate(startOfWeek(newDate, { weekStartsOn: 1 }));
    };

    const handleNextWeek = () => {
        const newDate = addWeeks(currentDate, 1);
        setCurrentDate(newDate);
        setSelectedDate(startOfWeek(newDate, { weekStartsOn: 1 }));
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const handleSucessoOperacao = React.useCallback(() => {
        setRowSelection((currentSelection) => {
            if (Object.keys(currentSelection).length === 0) {
                return currentSelection;
            }

            return {};
        });
        fetchData();
        router.refresh();
    }, [fetchData, router]);

    const total = data?.pagination.total ?? 0;
    const tableData = data?.data ?? [];

    // Build filter groups with dynamic data
    const filterGroups = React.useMemo(() => {
        return buildExpedientesFilterGroups(usuarios, tiposExpedientes);
    }, [usuarios, tiposExpedientes]);

    // Table instance não é mais necessário, mas mantido para compatibilidade futura

    // Count expedientes sem data e vencidos para destacar
    const semDataCount = tableData.filter(e => !e.dataPrazoLegalParte).length;
    const vencidosCount = tableData.filter(e => e.prazoVencido && !e.baixadoEm).length;

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header / Week Navigation + Days Carousel (integrado) */}
            <div className="p-4 bg-card rounded-lg border shadow-sm">
                <WeekDaysCarousel
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    weekStartsOn={1}
                    onPrevious={handlePreviousWeek}
                    onNext={handleNextWeek}
                    onToday={handleToday}
                />
            </div>

            {/* List View for Selected Day */}
            <DataShell
                actionButton={{
                    label: 'Novo Expediente',
                    onClick: () => setIsNovoDialogOpen(true),
                }}
                header={
                    <>
                        {Object.keys(rowSelection).length > 0 && (
                            <ExpedientesBulkActions
                                selectedRows={tableData.filter((exp) => rowSelection[exp.id.toString()])}
                                usuarios={usuarios.map(u => ({ id: u.id, nomeExibicao: getUsuarioNome(u) }))}
                                onSuccess={() => {
                                    setRowSelection({});
                                    handleSucessoOperacao();
                                }}
                            />
                        )}
                        <DataTableToolbar
                            searchValue={globalFilter}
                            onSearchValueChange={setGlobalFilter}
                            searchPlaceholder="Buscar expedientes..."
                            filtersSlot={
                                <>
                                    <FilterPopover
                                        label="Status"
                                        options={STATUS_OPTIONS}
                                        value={statusFilter}
                                        onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
                                        defaultValue="todos"
                                    />
                                    <ResponsiveFilterPanel
                                        filterGroups={filterGroups}
                                        selectedFilters={selectedFilters}
                                        onFiltersChange={setSelectedFilters}
                                        title="Filtros de Expedientes"
                                        description="Filtre expedientes por tribunal, grau, responsável, tipo e outras características"
                                    />
                                </>
                            }
                            actionSlot={
                                <div className="flex items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => fetchData()}
                                            >
                                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Atualizar</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setIsSettingsOpen(true)}
                                            >
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Configurações - Tipos de Expedientes</TooltipContent>
                                    </Tooltip>
                                </div>
                            }
                        />
                    </>
                }
            >
                <div className="p-4 bg-muted/10 border-b">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Expedientes de {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                            <AppBadge variant="secondary" className="ml-2">
                                {total}
                            </AppBadge>
                        </h3>
                        {(semDataCount > 0 || vencidosCount > 0) && (
                            <div className="flex items-center gap-2">
                                {semDataCount > 0 && (
                                    <AppBadge variant="warning">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        {semDataCount} sem data
                                    </AppBadge>
                                )}
                                {vencidosCount > 0 && (
                                    <AppBadge variant="destructive">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        {vencidosCount} vencidos
                                    </AppBadge>
                                )}
                            </div>
                        )}
                    </div>
                    {!mostrarTodos && currentUserId && (
                        <div className="mt-2 text-sm text-muted-foreground">
                            Mostrando apenas seus expedientes.{' '}
                            <Button
                                variant="link"
                                className="h-auto p-0 text-primary"
                                onClick={() => setMostrarTodos(true)}
                            >
                                Ver todos
                            </Button>
                        </div>
                    )}
                    {mostrarTodos && (
                        <div className="mt-2 text-sm text-muted-foreground">
                            Mostrando todos os expedientes.{' '}
                            <Button
                                variant="link"
                                className="h-auto p-0 text-primary"
                                onClick={() => setMostrarTodos(false)}
                            >
                                Ver apenas meus
                            </Button>
                        </div>
                    )}
                </div>

                <DataTable
                    data={tableData}
                    columns={columns}
                    isLoading={isLoading}
                    error={error}
                    hidePagination={true}
                    rowSelection={{
                        state: rowSelection,
                        onRowSelectionChange: setRowSelection,
                        getRowId: (row) => row.id.toString(),
                    }}
                    options={{
                        meta: {
                            usuarios,
                            tiposExpedientes,
                            onSuccessAction: handleSucessoOperacao,
                        },
                    }}
                />
            </DataShell>

            <ExpedienteDialog
                open={isNovoDialogOpen}
                onOpenChange={setIsNovoDialogOpen}
                onSuccess={handleSucessoOperacao}
            />

            {/* Settings Dialog - Tipos de Expedientes */}
            <DialogFormShell
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                title="Tipos de Expedientes"
                maxWidth="4xl"
                footer={
                    <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                        Fechar
                    </Button>
                }
            >
                <div className="flex-1 overflow-auto h-[60vh]">
                    <TiposExpedientesList />
                </div>
            </DialogFormShell>
        </div>
    );
}
