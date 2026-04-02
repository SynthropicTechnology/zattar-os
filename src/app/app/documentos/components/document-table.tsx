'use client';

/**
 * Tabela de documentos para visualização em lista
 */

import * as React from 'react';
import { FileText, MoreVertical, Share2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import type { DocumentoComUsuario } from '@/app/app/documentos/types';

interface DocumentTableProps {
  documentos: DocumentoComUsuario[];
  onDocumentoClick: (id: number) => void;
}

export function DocumentTable({ documentos, onDocumentoClick }: DocumentTableProps) {
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Criado por</TableHead>
            <TableHead>Última modificação</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documentos.map((doc) => (
            <TableRow
              key={doc.id}
              className="cursor-pointer"
              onClick={() => onDocumentoClick(doc.id)}
            >
              <TableCell>
                <div className="rounded bg-primary/10 p-2 w-fit">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{doc.titulo}</div>
                  {doc.descricao && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {doc.descricao}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {doc.tags && doc.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.slice(0, 2).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {doc.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{doc.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">{doc.criador.nomeCompleto}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(doc.updated_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={handleMenuClick}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
