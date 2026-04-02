
'use client';

import { useEffect, useState } from 'react';
import { actionObterPerfil } from '../actions/perfil-actions';
import type { Usuario } from '@/app/app/usuarios';

export function usePerfil() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerfil = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionObterPerfil();

      if (!result.success) {
        setError(result.error || 'Erro ao carregar perfil');
        setUsuario(null);
      } else {
        setUsuario(result.data as Usuario);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setUsuario(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerfil();
  }, []);

  return {
    usuario,
    isLoading,
    error,
    refetch: fetchPerfil,
  };
}
