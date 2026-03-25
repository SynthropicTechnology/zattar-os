/**
 * Módulo de Tarefas - Visualização Lista
 *
 * A visualização em quadro/kanban vive nas sub-rotas:
 * /app/tarefas/quadro/[boardSlug] (expedientes, audiencias, pericias, obrigacoes)
 */

"use client";

import * as React from "react";
import { useCopilotReadable } from "@copilotkit/react-core";
import type { TarefaDisplayItem, Quadro } from "./domain";
import { useTarefaStore } from "./store";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { TaskDetailSheet } from "./components/task-detail-sheet";
import { TaskDialog } from "./components/task-dialog";

interface TarefasClientProps {
    data: TarefaDisplayItem[];
    quadros: Quadro[];
}

export function TarefasClient({ data, quadros }: TarefasClientProps) {
    const { setTarefas, setQuadros, isCreateDialogOpen, setCreateDialogOpen } = useTarefaStore();

    React.useEffect(() => {
        setTarefas(data);
        setQuadros(quadros);
    }, [data, quadros, setTarefas, setQuadros]);

    // ── Copilot: expor contexto de tarefas ──
    const tarefasResumo = React.useMemo(() => {
        const todo = data.filter(t => t.status === 'todo').length;
        const emProgresso = data.filter(t => t.status === 'in progress').length;
        const concluidas = data.filter(t => t.status === 'done').length;
        const canceladas = data.filter(t => t.status === 'canceled').length;
        const backlog = data.filter(t => t.status === 'backlog').length;
        const atrasadas = data.filter(t => {
            if (!t.dueDate || t.status === 'done' || t.status === 'canceled') return false;
            return new Date(t.dueDate) < new Date();
        }).length;
        return { total: data.length, todo, em_progresso: emProgresso, concluidas, canceladas, backlog, atrasadas, quadros: quadros.length };
    }, [data, quadros]);

    useCopilotReadable({
        description: 'Resumo das tarefas do usuário: totais por status e contagem de atrasadas',
        value: tarefasResumo,
    });

    return (
        <>
            <DataTable data={data} columns={columns} />
            <TaskDetailSheet />
            <TaskDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
        </>
    );
}
