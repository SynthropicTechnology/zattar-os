'use client';

/**
 * Componente que exibe avatares dos colaboradores online
 * Mostra quem está editando o documento em tempo real
 */

import * as React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CollaboratorPresence } from '@/hooks/use-realtime-collaboration';

interface CollaboratorsAvatarsProps {
  collaborators: CollaboratorPresence[];
}

export function CollaboratorsAvatars({ collaborators }: CollaboratorsAvatarsProps) {
  if (collaborators.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center -space-x-2">
      <TooltipProvider>
        {collaborators.slice(0, 5).map((collab) => (
          <Tooltip key={collab.user_id}>
            <TooltipTrigger asChild>
              <Avatar
                className="h-8 w-8 border-2 border-background"
                style={{ borderColor: collab.color }}
              >
                <AvatarFallback
                  className="text-xs text-white"
                  style={{ backgroundColor: collab.color }}
                >
                  {collab.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{collab.name}</p>
              <p className="text-xs text-muted-foreground">Editando agora</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {collaborators.length > 5 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8 border-2 border-background">
                <AvatarFallback className="text-xs">
                  +{collaborators.length - 5}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{collaborators.length - 5} mais editando</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}
