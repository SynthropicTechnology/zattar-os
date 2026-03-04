"use client";

import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import {
  KANBAN_COLUMNS,
  STATUS_TAREFA_LABELS,
  type StatusTarefa,
  type Tarefa,
} from "../../lib/domain";
import { useTaskBoard } from "../../hooks/use-task-board";
import { TaskCard } from "./task-card";

interface TaskBoardProps {
  tarefas: Tarefa[];
}

function KanbanColumn({
  status,
  tarefas,
}: {
  status: StatusTarefa;
  tarefas: Tarefa[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const columnColors: Record<StatusTarefa, string> = {
    a_fazer: "border-t-slate-400",
    em_progresso: "border-t-blue-400",
    em_revisao: "border-t-purple-400",
    concluido: "border-t-green-400",
    cancelado: "border-t-red-400",
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-w-70 flex-1 flex-col rounded-lg border border-t-4 bg-muted/30",
        columnColors[status],
        isOver && "ring-2 ring-primary/20"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-semibold">
          {STATUS_TAREFA_LABELS[status]}
        </h3>
        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
          {tarefas.length}
        </span>
      </div>

      <SortableContext
        items={tarefas.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 p-2 min-h-25">
          {tarefas.map((tarefa) => (
            <TaskCard key={tarefa.id} tarefa={tarefa} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function TaskBoard({ tarefas }: TaskBoardProps) {
  const {
    columns,
    activeTarefa,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useTaskBoard(tarefas);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tarefas={columns[status]}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTarefa ? (
          <TaskCard tarefa={activeTarefa} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
