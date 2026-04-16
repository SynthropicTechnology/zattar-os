"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

import type { Template as AssinaturaDigitalTemplate } from '@/shared/assinatura-digital';

const duplicateSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  descricao: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
  status: z.enum(["ativo", "inativo", "rascunho"]),
});

type DuplicateFormData = z.infer<typeof duplicateSchema>;

interface TemplateDuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: AssinaturaDigitalTemplate;
  onSuccess: () => void;
}

export function TemplateDuplicateDialog({
  open,
  onOpenChange,
  template,
  onSuccess,
}: TemplateDuplicateDialogProps) {
  const form = useForm<DuplicateFormData>({
    resolver: zodResolver(duplicateSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      status: "rascunho",
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        nome: `Cópia de ${template.nome}`,
        descricao: template.descricao || "",
        status: "rascunho",
      });
    }
  }, [template, form]);

  const onSubmit = async (data: DuplicateFormData) => {
    try {
      const payload = {
        nome: data.nome,
        descricao: data.descricao,
        arquivo_original: template.arquivo_original,
        arquivo_nome: template.arquivo_nome,
        arquivo_tamanho: template.arquivo_tamanho,
        status: data.status,
        versao: 1,
        ativo: true,
        campos: JSON.stringify(template.campos),
        conteudo_markdown: template.conteudo_markdown,
      };

      const response = await fetch("/api/assinatura-digital/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao duplicar template");
      }

      toast.success("Template duplicado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao duplicar template:", error);
      toast.error(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Duplicar Template</DialogTitle>
          <DialogDescription>
            Crie uma cópia do template &ldquo;{template.nome}&rdquo;. Edite o nome e descrição se necessário.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do template" {...field} />
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
                    <Textarea placeholder="Descrição opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Duplicar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
