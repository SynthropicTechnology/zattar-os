"use client";

/**
 * Hook para gerenciar grupos 2FAuth
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  TwoFAuthGroup,
  CreateGroupParams,
  UpdateGroupParams,
} from "@/lib/integrations/twofauth/types";

export type { TwoFAuthGroup };

interface UseTwoFAuthGroupsState {
  groups: TwoFAuthGroup[];
  isLoading: boolean;
  error: string | null;
}

interface UseTwoFAuthGroupsReturn extends UseTwoFAuthGroupsState {
  fetchGroups: () => Promise<void>;
  createGroup: (data: CreateGroupParams) => Promise<TwoFAuthGroup | null>;
  updateGroup: (id: number, data: UpdateGroupParams) => Promise<TwoFAuthGroup | null>;
  deleteGroup: (id: number) => Promise<boolean>;
  refresh: () => Promise<void>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useTwoFAuthGroups(): UseTwoFAuthGroupsReturn {
  const [groups, setGroups] = useState<TwoFAuthGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/twofauth/groups");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar grupos");
      }

      if (isMountedRef.current) {
        setGroups(data.data || []);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const createGroup = useCallback(
    async (groupData: CreateGroupParams): Promise<TwoFAuthGroup | null> => {
      try {
        const response = await fetch("/api/twofauth/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(groupData),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao criar grupo");
        }

        if (isMountedRef.current) {
          setGroups((prev) => [...prev, data.data]);
        }

        return data.data;
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : "Erro ao criar grupo");
        }
        return null;
      }
    },
    []
  );

  const updateGroup = useCallback(
    async (id: number, groupData: UpdateGroupParams): Promise<TwoFAuthGroup | null> => {
      try {
        const response = await fetch(`/api/twofauth/groups/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(groupData),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao atualizar grupo");
        }

        if (isMountedRef.current) {
          setGroups((prev) =>
            prev.map((group) => (group.id === id ? data.data : group))
          );
        }

        return data.data;
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : "Erro ao atualizar grupo");
        }
        return null;
      }
    },
    []
  );

  const deleteGroup = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/twofauth/groups/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao excluir grupo");
      }

      if (isMountedRef.current) {
        setGroups((prev) => prev.filter((group) => group.id !== id));
      }

      return true;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Erro ao excluir grupo");
      }
      return false;
    }
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    groups,
    isLoading,
    error,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    refresh: fetchGroups,
  };
}

export default useTwoFAuthGroups;
