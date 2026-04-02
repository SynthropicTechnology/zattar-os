'use client';

/**
 * Card para exibição de template
 */

import * as React from 'react';
import { FileText, Globe, Lock, User, MoreVertical, Pencil, Trash2, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TemplateComUsuario } from '@/app/app/documentos/types';

interface TemplateCardProps {
  template: TemplateComUsuario;
  onUseTemplate: (template: TemplateComUsuario) => void;
  onEdit?: (template: TemplateComUsuario) => void;
  onDelete?: (template: TemplateComUsuario) => void;
  isOwner?: boolean;
}

export function TemplateCard({
  template,
  onUseTemplate,
  onEdit,
  onDelete,
  isOwner = false,
}: TemplateCardProps) {
  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-1">
              <CardTitle className="text-base line-clamp-1">{template.titulo}</CardTitle>
              {template.categoria && (
                <Badge variant="secondary" className="text-xs">
                  {template.categoria}
                </Badge>
              )}
            </div>
          </div>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(template)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(template)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-2">
        {template.descricao && (
          <CardDescription className="line-clamp-2">
            {template.descricao}
          </CardDescription>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-stretch gap-3 pt-0">
        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {template.visibilidade === 'publico' ? (
              <>
                <Globe className="h-3 w-3" />
                <span>Público</span>
              </>
            ) : (
              <>
                <Lock className="h-3 w-3" />
                <span>Privado</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{template.criador?.nomeCompleto || 'Usuário'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(template.updated_at)}
          </span>
          <span>{template.uso_count} uso{template.uso_count !== 1 ? 's' : ''}</span>
        </div>

        {/* Action button */}
        <Button onClick={() => onUseTemplate(template)} className="w-full">
          Usar Template
        </Button>
      </CardFooter>
    </Card>
  );
}
