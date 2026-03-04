"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import {
  STATUS_TAREFA_LABELS,
  STATUS_TAREFA_VALUES,
  PRIORIDADE_LABELS,
  PRIORIDADE_VALUES,
  type Tarefa,
  type StatusTarefa,
  type Prioridade,
} from "../../lib/domain";
import {
  actionCriarTarefa,
  actionAtualizarTarefa,
} from "../../lib/actions";
import { toast } from "sonner";

const formSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório").max(255),
  descricao: z.string().max(5000).optional(),
  status: z.enum(STATUS_TAREFA_VALUES),
  prioridade: z.enum(PRIORIDADE_VALUES),
  responsavelId: z.string().optional(),
  dataPrazo: z.string().optional(),
  estimativaHoras: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TaskFormProps {
  projetoId: string;
  tarefa?: Tarefa;
  membros: ComboboxOption[];
  usuarioAtualId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TaskFormDialog({
  projetoId,
  tarefa,
  membros,
  usuarioAtualId,
  open,
  onOpenChange,
  onSuccess,
}: TaskFormProps) {
  const [isPending, startTransition] = React.useTransition();
  const isEditing = !!tarefa;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: tarefa?.titulo ?? "",
      descricao: tarefa?.descricao ?? "",
      status: tarefa?.status ?? "a_fazer",
      prioridade: tarefa?.prioridade ?? "media",
      responsavelId: tarefa?.responsavelId?.toString() ?? "",
      dataPrazo: tarefa?.dataPrazo ?? "",
      estimativaHoras: tarefa?.estimativaHoras?.toString() ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        titulo: tarefa?.titulo ?? "",
        descricao: tarefa?.descricao ?? "",
        status: tarefa?.status ?? "a_fazer",
        prioridade: tarefa?.prioridade ?? "media",
        responsavelId: tarefa?.responsavelId?.toString() ?? "",
        dataPrazo: tarefa?.dataPrazo ?? "",
        estimativaHoras: tarefa?.estimativaHoras?.toString() ?? "",
      });
    }
  }, [open, tarefa, form]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const payload = {
        titulo: values.titulo,
        descricao: values.descricao || null,
        status: values.status as StatusTarefa,
        prioridade: values.prioridade as Prioridade,
        responsavelId: values.responsavelId
          ? Number(values.responsavelId)
          : null,
        dataPrazo: values.dataPrazo || null,
        estimativaHoras: values.estimativaHoras
          ? Number(values.estimativaHoras)
          : null,
      };

      let result;
      if (isEditing) {
        result = await actionAtualizarTarefa(
          tarefa.id,
          payload,
          projetoId
        );
      } else {
        result = await actionCriarTarefa(
          { ...payload, projetoId },
          usuarioAtualId
        );
      }

      if (result.success) {
        toast.success(
          isEditing ? "Tarefa atualizada com sucesso!" : "Tarefa criada com sucesso!"
        );
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error?.message ?? "Erro ao salvar tarefa. Tente novamente.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Tarefa" : "Nova Tarefa"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Título <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Título da tarefa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a tarefa..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_TAREFA_VALUES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_TAREFA_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORIDADE_VALUES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {PRIORIDADE_LABELS[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="responsavelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <FormControl>
                    <Combobox
                      options={membros}
                      value={field.value ? [field.value] : []}
                      onValueChange={(vals) =>
                        field.onChange(vals[0] ?? "")
                      }
                      placeholder="Selecione o responsável..."
                      searchPlaceholder="Buscar membro..."
                      emptyText="Nenhum membro encontrado."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataPrazo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimativaHoras"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimativa (horas)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Salvar" : "Criar Tarefa"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
