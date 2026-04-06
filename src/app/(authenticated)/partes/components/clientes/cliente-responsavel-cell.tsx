'use client';

import * as React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { actionAtualizarClienteSafe } from '@/app/(authenticated)/partes/actions/clientes-actions';

import type { Cliente } from '@/app/(authenticated)/partes/types';
import { toast } from 'sonner';

interface Usuario {
    id: number;
    nomeExibicao: string;
    avatarUrl?: string | null;
}

interface ClienteResponsavelCellProps {
    cliente: Cliente;
    usuarios: Usuario[];
    onSuccess?: () => void;
}

function getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ClienteResponsavelCell({
    cliente,
    usuarios,
    onSuccess,
}: ClienteResponsavelCellProps) {
    const [open, setOpen] = React.useState(false);
    const [responsavelId, setResponsavelId] = React.useState<number | null>(
        cliente.responsavel_id ?? null
    );

    // Sync state if props change (unlikely/optional but good practice)
    React.useEffect(() => {
        setResponsavelId(cliente.responsavel_id ?? null);
    }, [cliente.responsavel_id]);

    const [isPending, startTransition] = React.useTransition();

    const handleSelect = (userId: string) => {
        const newId = userId === 'null' ? null : Number(userId);

        // Optimistic update
        setResponsavelId(newId);

        startTransition(async () => {
            const result = await actionAtualizarClienteSafe({
                id: cliente.id,
                data: {
                    responsavel_id: newId,
                },
            });

            if (result.success) {
                toast.success('Responsável atualizado');
                setOpen(false);
                onSuccess?.();
            } else {
                toast.error(result.message || 'Erro ao atualizar responsável');
                // Revert optimistic update on error
                setResponsavelId(cliente.responsavel_id ?? null);
            }
        });
    };

    const responsavel = usuarios.find((u) => u.id === responsavelId);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "flex items-center justify-center gap-2 h-8 w-full min-w-0 px-1 hover:bg-muted/50",
                        !responsavel && "text-muted-foreground"
                    )}
                    title={responsavel ? `Responsável: ${responsavel.nomeExibicao}` : 'Clique para atribuir responsável'}
                >
                    {responsavel ? (
                        <>
                            <Avatar size="sm">
                                <AvatarImage src={responsavel.avatarUrl || undefined} alt={responsavel.nomeExibicao} />
                                <AvatarFallback className="text-[10px] font-medium">
                                    {getInitials(responsavel.nomeExibicao)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-30 text-xs font-normal text-foreground">
                                {responsavel.nomeExibicao}
                            </span>
                        </>
                    ) : (
                        <span className="text-xs font-normal">Não atribuído</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
                <Command>
                    <CommandInput placeholder="Buscar usuário..." />
                    <CommandList>
                        <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="null"
                                onSelect={() => handleSelect('null')}
                                className="gap-2"
                            >
                                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed text-xs">
                                    ?
                                </div>
                                <span>Sem responsável</span>
                                {responsavelId === null && <Check className="ml-auto h-4 w-4" />}
                                {isPending && responsavelId === null && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                            </CommandItem>
                            {usuarios.map((usuario) => (
                                <CommandItem
                                    key={usuario.id}
                                    value={usuario.nomeExibicao} // Buscando pelo nome
                                    onSelect={() => handleSelect(usuario.id.toString())}
                                    className="gap-2"
                                >
                                    <Avatar size="sm">
                                        <AvatarImage src={usuario.avatarUrl || undefined} alt={usuario.nomeExibicao} />
                                        <AvatarFallback className="text-[10px]">
                                            {getInitials(usuario.nomeExibicao)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>{usuario.nomeExibicao}</span>
                                    {responsavelId === usuario.id && <Check className="ml-auto h-4 w-4" />}
                                    {isPending && responsavelId === usuario.id && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
