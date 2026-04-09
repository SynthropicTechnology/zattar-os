'use client';

import * as React from 'react';
import { Check, Search, UserX } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { actionAtualizarProcesso } from '../actions';

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

interface ResponsavelPopoverProps {
  processoId: number;
  responsavel?: Usuario;
  usuarios: Usuario[];
  onUpdate: (processoId: number, novoResponsavelId: number | null) => void;
  children: React.ReactNode;
}

function getInitials(name: string): string {
  if (!name) return 'NA';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ResponsavelPopover({
  processoId,
  responsavel,
  usuarios,
  onUpdate,
  children,
}: ResponsavelPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const handleSelect = React.useCallback(
    async (userId: number | null) => {
      if (userId === (responsavel?.id ?? null)) {
        setOpen(false);
        return;
      }

      setIsPending(true);
      onUpdate(processoId, userId);
      setOpen(false);

      const formData = new FormData();
      if (userId !== null) {
        formData.set('responsavelId', userId.toString());
      } else {
        formData.set('responsavelId', '');
      }

      const result = await actionAtualizarProcesso(processoId, null, formData);
      if (!result.success) {
        onUpdate(processoId, responsavel?.id ?? null);
      }
      setIsPending(false);
    },
    [processoId, responsavel, onUpdate]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
          }}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-1.5 py-0.5 -mx-1.5 -my-0.5',
            'transition-colors hover:bg-muted/50 cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            isPending && 'opacity-60 pointer-events-none'
          )}
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-60 p-0 rounded-2xl glass-dropdown overflow-hidden"
        align="start"
        side="bottom"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Command className="bg-transparent">
          <div className="px-3 pt-3 pb-1.5">
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-2">
              Responsável
            </p>
            <CommandInput
              placeholder="Buscar..."
              className="h-8 text-xs rounded-lg"
            />
          </div>
          <CommandList className="max-h-52 px-1.5 pb-1.5">
            <CommandEmpty>
              <div className="flex flex-col items-center gap-1 py-3">
                <Search className="size-4 text-muted-foreground/30" />
                <span className="text-[11px] text-muted-foreground/40">Nenhum usuário encontrado</span>
              </div>
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="sem-responsavel"
                onSelect={() => handleSelect(null)}
                className="gap-2 rounded-lg text-xs px-2 py-1.5"
              >
                <UserX className="size-3.5 text-muted-foreground/40" />
                <span>Sem responsável</span>
                {!responsavel && (
                  <Check className="size-3 ml-auto text-primary" />
                )}
              </CommandItem>
              {usuarios.map((usuario) => (
                <CommandItem
                  key={usuario.id}
                  value={usuario.nomeExibicao}
                  onSelect={() => handleSelect(usuario.id)}
                  className="gap-2 rounded-lg text-xs px-2 py-1.5"
                >
                  <Avatar size="xs" className="border size-5">
                    <AvatarImage src={usuario.avatarUrl || undefined} />
                    <AvatarFallback className="text-[7px]">
                      {getInitials(usuario.nomeExibicao)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{usuario.nomeExibicao}</span>
                  {responsavel?.id === usuario.id && (
                    <Check className="size-3 ml-auto text-primary shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
