'use client';

/**
 * Card de documento para visualização em grid
 */

import * as React from 'react';
import { FileText, MoreVertical, Share2, Trash2, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import type { DocumentoComUsuario } from '@/app/(authenticated)/documentos/types';

interface DocumentCardProps {
  documento: DocumentoComUsuario;
  onClick: () => void;
}

export function DocumentCard({ documento, onClick }: DocumentCardProps) {
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{documento.titulo}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {documento.descricao || 'Sem descrição'}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={handleMenuClick}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Mover para lixeira
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags */}
        {documento.tags && documento.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {documento.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {documento.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{documento.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{documento.criador.nomeCompleto}</span>
          </div>
          <span>
            {formatDistanceToNow(new Date(documento.updated_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
