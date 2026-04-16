"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AppBadge as Badge } from "@/components/ui/app-badge";

interface Template {
  id: number;
  template_uuid: string;
  nome: string;
  tipo_template?: "pdf" | "markdown";
  ativo: boolean;
  segmento_id?: number;
}

export interface TemplateSelectProps {
  value: string | null;
  onChange: (id: string | null) => void;
  segmentoId?: number;
  disabled?: boolean;
  placeholder?: string;
  showInactive?: boolean;
}

export function TemplateSelect({
  value,
  onChange,
  segmentoId,
  disabled = false,
  placeholder = "Selecione um template",
  showInactive = false,
}: TemplateSelectProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (segmentoId) {
        params.set('segmento_id', String(segmentoId));
      }
      if (!showInactive) {
        params.set('ativo', 'true');
      }
      const response = await fetch(`/api/assinatura-digital/templates?${params.toString()}`);
      const result = await response.json();
      if (result.success && result.data) {
        setTemplates(result.data as Template[]);
      } else {
        setError(result.error || "Erro ao carregar templates");
      }
    } catch {
      setError("Erro de conexão ao carregar templates");
    } finally {
      setLoading(false);
    }
  }, [segmentoId, showInactive]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Reset value when segmentoId changes and current value is not in filtered list
  useEffect(() => {
    if (value && templates.length > 0) {
      const exists = templates.some(
        (t) => t.template_uuid === value || String(t.id) === value
      );
      if (!exists) {
        onChange(null);
      }
    }
  }, [segmentoId, templates, value, onChange]);

  if (loading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        {error}
        <button
          type="button"
          onClick={fetchTemplates}
          className="ml-2 text-primary underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <Select
      value={value || ""}
      onValueChange={(val) => onChange(val || null)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Templates</SelectLabel>
          {templates.length === 0 ? (
            <SelectItem value="__empty__" disabled>
              Nenhum template disponível
            </SelectItem>
          ) : (
            templates.map((template) => (
              <SelectItem
                key={template.template_uuid || template.id}
                value={template.template_uuid || String(template.id)}
              >
                <div className="flex items-center gap-2">
                  <span>{template.nome}</span>
                  {template.tipo_template && (
                    <Badge
                      variant={
                        template.tipo_template === "pdf" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {template.tipo_template.toUpperCase()}
                    </Badge>
                  )}
                  {!template.ativo && (
                    <span className="text-xs text-muted-foreground">(Inativo)</span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
