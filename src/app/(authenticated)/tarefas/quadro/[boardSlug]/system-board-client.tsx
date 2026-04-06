"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { List, LayoutGrid } from "lucide-react";

import * as Kanban from "@/components/ui/kanban";
import { AppBadge } from "@/components/ui/app-badge";
import { ViewModePopover } from "@/components/shared";

import type { SystemBoardDefinition, Quadro } from "../../domain";
import type { SystemBoardEventItem } from "../../service";
import { QuadroSelector } from "../../components/quadro-selector";
import { SystemBoardCard } from "../../components/system-board-card";
import { actionAtualizarStatusQuadroSistema } from "../../actions/tarefas-actions";
import { SYSTEM_BOARD_DEFINITIONS } from "../../domain";

interface SystemBoardClientProps {
  board: SystemBoardDefinition;
  events: SystemBoardEventItem[];
  quadros: Quadro[];
}

type ColumnRecord = Record<UniqueIdentifier, SystemBoardEventItem[]>;

function bucketEvents(
  board: SystemBoardDefinition,
  events: SystemBoardEventItem[]
): ColumnRecord {
  const result: ColumnRecord = {};
  for (const col of board.columns) {
    result[col.id] = [];
  }
  for (const event of events) {
    const col = board.columns.find((c) =>
      c.matchStatuses.includes(event.statusOrigem)
    );
    if (col) {
      result[col.id]!.push(event);
    }
  }
  return result;
}

export function SystemBoardClient({ board, events, quadros }: SystemBoardClientProps) {
  const router = useRouter();
  const [_isPending, startTransition] = React.useTransition();

  const initialColumns = React.useMemo(
    () => bucketEvents(board, events),
    [board, events]
  );

  const [columns, setColumns] = React.useState<ColumnRecord>(initialColumns);
  React.useEffect(() => setColumns(initialColumns), [initialColumns]);

  // Track the previous column state to detect cross-column moves
  const prevColumnsRef = React.useRef<ColumnRecord>(initialColumns);

  const handleValueChange = React.useCallback(
    (newColumns: Record<UniqueIdentifier, SystemBoardEventItem[]>) => {
      const oldColumns = prevColumnsRef.current;

      // Find which item moved to which column
      for (const [colId, items] of Object.entries(newColumns)) {
        const oldIds = new Set(
          (oldColumns[colId] ?? []).map((i) => i.id)
        );
        for (const item of items) {
          if (!oldIds.has(item.id)) {
            // This item moved INTO colId
            const targetCol = board.columns.find((c) => c.id === colId);

            if (!board.dndEnabled || !targetCol || targetCol.targetStatus === null) {
              toast.error("Não é possível mover para esta coluna.");
              // Revert
              setColumns(initialColumns);
              prevColumnsRef.current = initialColumns;
              return;
            }

            // Optimistically update
            setColumns(newColumns as ColumnRecord);
            prevColumnsRef.current = newColumns as ColumnRecord;

            startTransition(async () => {
              try {
                const result = await actionAtualizarStatusQuadroSistema({
                  source: board.source,
                  entityId: String(item.sourceEntityId),
                  targetColumnId: colId,
                });

                if (result.success) {
                  toast.success("Status atualizado com sucesso");
                  router.refresh();
                } else {
                  toast.error(result.error || "Erro ao atualizar status");
                  setColumns(initialColumns);
                  prevColumnsRef.current = initialColumns;
                }
              } catch {
                toast.error("Erro ao atualizar status");
                setColumns(initialColumns);
                prevColumnsRef.current = initialColumns;
              }
            });
            return;
          }
        }
      }

      // Same-column reorder
      setColumns(newColumns as ColumnRecord);
      prevColumnsRef.current = newColumns as ColumnRecord;
    },
    [board, initialColumns, router]
  );

  const handleQuadroChange = React.useCallback(
    (quadroId: string | null) => {
      if (!quadroId) {
        router.push("/app/tarefas");
        return;
      }
      const sysBoard = SYSTEM_BOARD_DEFINITIONS.find((b) => b.id === quadroId);
      if (sysBoard) {
        router.push(`/app/tarefas/quadro/${sysBoard.slug}`);
      } else {
        // Custom board — go back to tarefas main with board filter
        router.push("/app/tarefas");
      }
    },
    [router]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-page-title sm:text-3xl">
          Quadro - {board.titulo}
        </h1>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <QuadroSelector
            quadros={quadros}
            value={board.id}
            onValueChange={handleQuadroChange}
          />
        </div>
        <ViewModePopover
          value="quadro"
          onValueChange={(v) => {
            if (v === "lista") router.push("/app/tarefas");
          }}
          options={[
            { value: "lista", label: "Lista", icon: List },
            { value: "quadro", label: "Quadro", icon: LayoutGrid },
          ]}
        />
      </div>

      {/* Board */}
      <Kanban.Kanban
        value={columns}
        onValueChange={handleValueChange}
        getItemValue={(item: SystemBoardEventItem) => item.id}
        flatCursor={!board.dndEnabled}
      >
        <Kanban.KanbanBoard className="overflow-x-auto pb-4">
          {board.columns.map((col) => (
            <Kanban.KanbanColumn
              key={col.id}
              value={col.id}
              className="w-85 min-w-85 rounded-xl border border-border bg-card"
              disabled={!board.dndEnabled}
            >
              <div className="flex items-center justify-between p-3 pb-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{col.label}</span>
                  <AppBadge variant="outline">
                    {columns[col.id]?.length ?? 0}
                  </AppBadge>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-3">
                {(columns[col.id] ?? []).map((item) => (
                  <Kanban.KanbanItem
                    key={item.id}
                    value={item.id}
                    asHandle
                    disabled={!board.dndEnabled}
                  >
                    <SystemBoardCard event={item} />
                  </Kanban.KanbanItem>
                ))}
                {(columns[col.id]?.length ?? 0) === 0 && (
                  <div className="text-muted-foreground text-sm text-center py-4">
                    Nenhum item.
                  </div>
                )}
              </div>
            </Kanban.KanbanColumn>
          ))}
        </Kanban.KanbanBoard>
        <Kanban.KanbanOverlay>
          {({ value }) => {
            const item = events.find((e) => e.id === String(value));
            return item ? <SystemBoardCard event={item} /> : null;
          }}
        </Kanban.KanbanOverlay>
      </Kanban.Kanban>
    </div>
  );
}
