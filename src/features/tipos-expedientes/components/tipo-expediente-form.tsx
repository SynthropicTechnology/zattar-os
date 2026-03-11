'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import {
    TipoExpediente,
    createTipoExpedienteSchema,
    CreateTipoExpedienteInput,
} from '../domain';
import {
    actionCriarTipoExpediente,
    actionAtualizarTipoExpediente,
} from '../actions/tipos-expedientes-actions';

interface TipoExpedienteFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tipoExpediente?: TipoExpediente | null; // Se null, é criação
    onSuccess: () => void;
}

export function TipoExpedienteForm({
    open,
    onOpenChange,
    tipoExpediente,
    onSuccess,
}: TipoExpedienteFormProps) {
    const isEditing = !!tipoExpediente;
    const [isPending, startTransition] = React.useTransition();

    const form = useForm<CreateTipoExpedienteInput>({
        resolver: zodResolver(createTipoExpedienteSchema),
        defaultValues: {
            tipoExpediente: tipoExpediente?.tipoExpediente || '',
        },
    });

    // Reset form when opening/changing filtered item
    React.useEffect(() => {
        if (open) {
            form.reset({
                tipoExpediente: tipoExpediente?.tipoExpediente || '',
            });
        }
    }, [open, tipoExpediente, form]);

    const onSubmit = async (values: CreateTipoExpedienteInput) => {
        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append('tipoExpediente', values.tipoExpediente);

                const result = isEditing
                    ? await actionAtualizarTipoExpediente(tipoExpediente.id, formData)
                    : await actionCriarTipoExpediente(formData);

                if (result.success) {
                    toast.success(
                        isEditing
                            ? 'Tipo de expediente atualizado com sucesso'
                            : 'Tipo de expediente criado com sucesso'
                    );
                    onSuccess();
                    onOpenChange(false);
                } else {
                    toast.error(result.error || 'Ocorreu um erro ao salvar');
                }
            } catch (error) {
                toast.error('Erro inesperado');
                console.error(error);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Editar Tipo de Expediente' : 'Novo Tipo de Expediente'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="tipoExpediente"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Tipo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Citação" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
