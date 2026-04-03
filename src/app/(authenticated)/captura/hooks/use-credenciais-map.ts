'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CodigoTRT } from '@/app/(authenticated)/captura';

type CredencialInfo = { tribunal: CodigoTRT; grau: string };

interface UseCredenciaisMapResult {
  credenciaisMap: Map<number, CredencialInfo>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook leve para buscar credenciais e montar o mapa id → {tribunal, grau}.
 * Usa fetch() (Route Handler) em vez de Server Action para permitir
 * paralelismo real com outros fetches do componente.
 */
export const useCredenciaisMap = (): UseCredenciaisMapResult => {
  const [credenciaisMap, setCredenciaisMap] = useState<Map<number, CredencialInfo>>(
    () => new Map()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const buscar = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/captura/credenciais-mapa');

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();

      if (!json.success) {
        throw new Error('Resposta da API indicou falha');
      }

      const map = new Map<number, CredencialInfo>();
      for (const item of json.data) {
        if (item.id && item.tribunal) {
          map.set(item.id, {
            tribunal: item.tribunal as CodigoTRT,
            grau: item.grau || '1',
          });
        }
      }
      setCredenciaisMap(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar credenciais');
      setCredenciaisMap(new Map());
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    buscar();
  }, [buscar]);

  return { credenciaisMap, isLoading, error };
};
