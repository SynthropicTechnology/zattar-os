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
import { Label } from "@/components/ui/label";
import { AppBadge as Badge } from "@/components/ui/app-badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

import { generateSlug, type AssinaturaDigitalFormulario } from "../../feature";

const duplicateSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  slug: z.string().min(3, "Slug deve ter pelo menos 3 caracteres"),
  descricao: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
});

type DuplicateFormData = z.infer<typeof duplicateSchema>;

interface FormularioDuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formulario: AssinaturaDigitalFormulario;
  onSuccess: () => void;
}

export function FormularioDuplicateDialog({
  open,
  onOpenChange,
  formulario,
  onSuccess,
}: FormularioDuplicateDialogProps) {
  const form = useForm<DuplicateFormData>({
    resolver: zodResolver(duplicateSchema),
    defaultValues: {
      nome: "",
      slug: "",
      descricao: "",
    },
  });

  const watchedNome = form.watch("nome");

  useEffect(() => {
    if (formulario) {
      const defaultNome = `${formulario.nome} (Cópia)`;
      form.reset({
        nome: defaultNome,
        slug: generateSlug(defaultNome),
        descricao: formulario.descricao || "",
      });
    }
  }, [formulario, form]);

  useEffect(() => {
    if (watchedNome) {
      form.setValue("slug", generateSlug(watchedNome));
    }
  }, [watchedNome, form]);

  const onSubmit = async (data: DuplicateFormData) => {
    try {
      // Omitimos ordem para que o backend aplique o default
      const payload: Record<string, unknown> = {
        nome: data.nome,
        slug: data.slug,
        descricao: data.descricao,
        segmento_id: formulario.segmento_id,
        form_schema: formulario.form_schema,
        schema_version: formulario.schema_version,
        template_ids: formulario.template_ids,
        foto_necessaria: formulario.foto_necessaria,
        geolocation_necessaria: formulario.geolocation_necessaria,
        ativo: true,
      };

      const response = await fetch("/api/assinatura-digital/formularios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao duplicar formulário");
      }

      toast.success("Formulário duplicado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao duplicar formulário:", error);
      toast.error(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Duplicar Formulário</DialogTitle>
          <DialogDescription>
            Crie uma cópia do formulário &ldquo;{formulario.nome}&rdquo;.
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Segmento:</Label>
                <Badge variant="outline">{formulario.segmento?.nome || "N/A"}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Templates:</Label>
                <Badge variant="outline">{formulario.template_ids?.length || 0}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Foto necessária:</Label>
                <Badge variant={formulario.foto_necessaria ? "default" : "secondary"}>
                  {formulario.foto_necessaria ? "Sim" : "Não"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Geolocalização necessária:</Label>
                <Badge variant={formulario.geolocation_necessaria ? "default" : "secondary"}>
                  {formulario.geolocation_necessaria ? "Sim" : "Não"}
                </Badge>
              </div>
            </div>
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
                    <Input placeholder="Nome do formulário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="Slug gerado automaticamente" {...field} readOnly />
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