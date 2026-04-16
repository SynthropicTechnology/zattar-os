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
import type { AssinaturaDigitalFormulario } from '@/shared/assinatura-digital/types/types';

export interface FormularioSelectProps {
  value: number | null;
  onChange: (id: number | null) => void;
  segmentoId?: number;
  disabled?: boolean;
  placeholder?: string;
  showInactive?: boolean;
}

export function FormularioSelect({
  value,
  onChange,
  segmentoId,
  disabled = false,
  placeholder = "Selecione um formulário",
  showInactive = false,
}: FormularioSelectProps) {
  const [formularios, setFormularios] = useState<AssinaturaDigitalFormulario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFormularios = useCallback(async () => {
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
      const response = await fetch(`/api/assinatura-digital/formularios?${params.toString()}`);
      const result = await response.json();
      if (result.success && result.data) {
        setFormularios(result.data);
      } else {
        setError(result.error || "Erro ao carregar formulários");
      }
    } catch {
      setError("Erro de conexão ao carregar formulários");
    } finally {
      setLoading(false);
    }
  }, [segmentoId, showInactive]);

  useEffect(() => {
    fetchFormularios();
  }, [fetchFormularios]);

  // Reset value when segmentoId changes and current value is not in filtered list
  useEffect(() => {
    if (value && formularios.length > 0) {
      const exists = formularios.some((f) => f.id === value);
      if (!exists) {
        onChange(null);
      }
    }
  }, [segmentoId, formularios, value, onChange]);

  if (loading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        {error}
        <button
          type="button"
          onClick={fetchFormularios}
          className="ml-2 text-primary underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <Select
      value={value !== null ? String(value) : ""}
      onValueChange={(val) => onChange(val ? Number(val) : null)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Formulários</SelectLabel>
          {formularios.length === 0 ? (
            <SelectItem value="__empty__" disabled>
              {segmentoId
                ? "Nenhum formulário para este segmento"
                : "Nenhum formulário disponível"}
            </SelectItem>
          ) : (
            formularios.map((formulario) => (
              <SelectItem key={formulario.id} value={String(formulario.id)}>
                <div className="flex items-center gap-2">
                  <span>{formulario.nome}</span>
                  {formulario.descricao && (
                    <span className="text-xs text-muted-foreground truncate max-w-50">
                      {formulario.descricao}
                    </span>
                  )}
                  {!formulario.ativo && (
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
