"use client";

/**
 * TaskCard - Card de tarefa para visualização Kanban
 * 
 * Adaptado de src/features/kanban/components/unified-kanban-card.tsx
 * Mostra subtarefas, comentários, anexos e suporta eventos virtuais
 */

import * as React from "react";
import { Calendar, User, Paperclip, MessageSquare, CheckSquare, ExternalLink } from "lucide-react";

import { AppBadge } from "@/components/ui/app-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import type { TarefaDisplayItem } from "../domain";

const PRIORITY_COLORS: Record<string, string> = {
  high: "border-l-destructive",
  medium: "border-l-warning",
  low: "border-l-success",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

interface TaskCardProps {
  tarefa: TarefaDisplayItem;
  onClick?: () => void;
  disabled?: boolean;
}

export function TaskCard({ tarefa, onClick, disabled }: TaskCardProps) {
  const colorClass = PRIORITY_COLORS[tarefa.priority] ?? "border-l-info";
  
  const dueDate = tarefa.dueDate
    ? new Date(tarefa.dueDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : null;

  // Calculate subtasks progress
  const completedSubtasks = tarefa.subTasks.filter((st) => st.completed).length;
  const totalSubtasks = tarefa.subTasks.length;

  return (
    <Card
      className={cn(
        "cursor-pointer border-l-4 transition-colors hover:bg-accent/50",
        colorClass,
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={disabled ? undefined : onClick}
    >
      <CardHeader className="p-3 pb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Label badge */}
          <AppBadge variant="outline" className="text-[10px] px-1 py-0 capitalize">
            {tarefa.label}
          </AppBadge>

          {/* Virtual event indicator */}
          {tarefa.isVirtual && (
            <AppBadge variant="secondary" className="text-[10px] px-1 py-0">
              Evento
            </AppBadge>
          )}

          {/* Overdue indicator */}
          {tarefa.prazoVencido && (
            <AppBadge variant="destructive" className="text-[10px] px-1 py-0">
              Vencido
            </AppBadge>
          )}

          {/* Starred indicator */}
          {tarefa.starred && (
            <span className="text-warning">⭐</span>
          )}
        </div>

        <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
          {tarefa.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 pt-0 space-y-2">
        {/* Description */}
        {tarefa.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {tarefa.description}
          </p>
        )}

        {/* Assignees */}
        {tarefa.assignees.length > 0 && (
          <div className="flex -space-x-2 overflow-hidden">
            {tarefa.assignees.slice(0, 3).map((assignee, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Avatar size="sm" className="border-background border-2">
                    <AvatarImage
                      src={assignee.avatarUrl || "/placeholder.svg"}
                      alt={assignee.name}
                    />
                    <AvatarFallback className="text-[10px]">
                      {assignee.name[0]}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>{assignee.name}</TooltipContent>
              </Tooltip>
            ))}
            {tarefa.assignees.length > 3 && (
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted border-2 border-background text-[10px]">
                +{tarefa.assignees.length - 3}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Footer metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {/* Due date */}
            {dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {dueDate}
              </span>
            )}

            {/* Responsible (for virtual events) */}
            {tarefa.responsavelNome && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {tarefa.responsavelNome}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Subtasks */}
            {totalSubtasks > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" />
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Subtarefas concluídas</TooltipContent>
              </Tooltip>
            )}

            {/* Comments */}
            {tarefa.comments.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {tarefa.comments.length}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Comentários</TooltipContent>
              </Tooltip>
            )}

            {/* Attachments */}
            {tarefa.files.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    {tarefa.files.length}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Anexos</TooltipContent>
              </Tooltip>
            )}

            {/* External link for virtual events */}
            {tarefa.isVirtual && tarefa.url && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </TooltipTrigger>
                <TooltipContent>Abrir no módulo</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Priority badge */}
        <div className="flex items-center justify-between">
          <AppBadge variant="outline" className="text-[10px] px-1.5 py-0.5">
            {PRIORITY_LABELS[tarefa.priority]}
          </AppBadge>
        </div>
      </CardContent>
    </Card>
  );
}
