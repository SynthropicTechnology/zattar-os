'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash, Bot, MessageSquare, Workflow, Sparkles, Globe } from 'lucide-react';
import { Assistente } from '../../domain';
import { truncarDescricao } from '../../utils';

const DIFY_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  chat: { label: 'Chat', icon: <MessageSquare className="h-3 w-3" /> },
  chatflow: { label: 'Chatflow', icon: <MessageSquare className="h-3 w-3" /> },
  agent: { label: 'Agent', icon: <Bot className="h-3 w-3" /> },
  workflow: { label: 'Workflow', icon: <Workflow className="h-3 w-3" /> },
  completion: { label: 'Completion', icon: <Sparkles className="h-3 w-3" /> },
};

interface AssistenteCardProps {
  assistente: Assistente;
  difyAppType?: string;
  onView: (assistente: Assistente) => void;
  onEdit: (assistente: Assistente) => void;
  onDelete: (assistente: Assistente) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function AssistenteCard({
  assistente,
  difyAppType,
  onView,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}: AssistenteCardProps) {
  const temDescricao = assistente.descricao && assistente.descricao.trim().length > 0;
  const isDify = assistente.tipo === 'dify';
  const typeConfig = isDify && difyAppType ? DIFY_TYPE_CONFIG[difyAppType] : null;

  return (
    <Card className="relative flex flex-col h-35 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer border border-border bg-card">
      {/* Área clicável para visualização */}
      <div
        className="flex-1 overflow-hidden"
        onClick={() => onView(assistente)}
      >
        <CardHeader className="px-4 pt-3 pb-2">
          <div className="flex items-start justify-between gap-2 pr-8">
            <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
              {assistente.nome}
            </CardTitle>
          </div>
          {/* Badge de tipo */}
          <div className="mt-1">
            {isDify && typeConfig ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                {typeConfig.icon}
                {typeConfig.label}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                <Globe className="h-3 w-3" />
                Iframe
              </Badge>
            )}
          </div>
        </CardHeader>

        {temDescricao && (
          <CardContent className="px-4 pt-0 pb-2">
            <p className="text-xs text-muted-foreground line-clamp-2" title={assistente.descricao || ''}>
              {truncarDescricao(assistente.descricao || null, 120)}
            </p>
          </CardContent>
        )}
      </div>

      {/* Menu dropdown */}
      {(canEdit || canDelete) && (
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-accent"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Ações do assistente</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && !isDify && (
                <DropdownMenuItem onClick={() => onEdit(assistente)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(assistente)}>
                  <Trash className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </Card>
  );
}
