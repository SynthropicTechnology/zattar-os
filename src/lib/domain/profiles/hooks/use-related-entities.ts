"use client";

import { useState, useEffect, useCallback } from "react";
// We import actions locally; it is fine for client side to call them if they are Server Actions 'use server'
import {
  actionBuscarProcessosPorEntidade,
  actionBuscarRepresentantesPorCliente,
  actionBuscarClientesPorRepresentante,
} from "@/app/app/partes/actions/processo-partes-actions";

export function useRelatedEntities(
  entityType: string,
  entityId: number,
  relationType: string
) {
  const [data, setData] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRelations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (
        relationType === "processos" &&
        ["cliente", "parte_contraria", "terceiro"].includes(entityType)
      ) {
        const res = await actionBuscarProcessosPorEntidade(
          entityType as "cliente" | "parte_contraria" | "terceiro",
          entityId
        );
        if (res.success && Array.isArray(res.data)) {
          setData(res.data);
        } else {
          setData([]);
        }
      } else if (
        entityType === "cliente" &&
        relationType === "representantes"
      ) {
        const res = await actionBuscarRepresentantesPorCliente(entityId);
        if (res.success && Array.isArray(res.data)) {
          setData(res.data);
        } else {
          setData([]);
        }
      } else if (
        entityType === "representante" &&
        relationType === "clientes"
      ) {
        const res = await actionBuscarClientesPorRepresentante(entityId);
        if (res.success && Array.isArray(res.data)) {
          setData(res.data);
        } else {
          setData([]);
        }
      } else {
        console.log(
          `Fetching ${relationType} for ${entityType} ${entityId} - Handler not found`
        );
        setData([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, relationType]);

  useEffect(() => {
    if (entityId && relationType) {
      fetchRelations();
    }
  }, [fetchRelations, entityId, relationType]);

  return { data, isLoading, error, refetch: fetchRelations };
}
