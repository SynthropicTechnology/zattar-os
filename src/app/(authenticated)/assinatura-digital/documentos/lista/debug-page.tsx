"use client";

/**
 * Página de debug para verificar o erro de validação
 */

import { useEffect, useState } from "react";
import { actionListDocumentos } from "../../feature";
import { Heading } from "@/components/ui/typography";

export function DebugPage() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const hasResult = typeof result === "object" && result !== null;
  const resultObject = hasResult ? (result as Record<string, unknown>) : null;

  useEffect(() => {
    async function load() {
      try {
        console.log("🔍 Chamando actionListDocumentos...");
        const res = await actionListDocumentos({
          page: 1,
          pageSize: 10,
        });
        
        console.log("✅ Resultado:", res);
        setResult(res);
        
        if (!res.success) {
          setError(res.error || "Erro desconhecido");
        }
      } catch (err) {
        console.error("❌ Erro:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    
    load();
  }, []);

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-8 space-y-4">
      <Heading level="page" className="text-2xl">Debug - Lista de Documentos</Heading>
      
      {error && (
        <div className="p-4 bg-destructive text-destructive rounded">
          <Heading level="section">Erro:</Heading>
          <pre className="mt-2 text-sm">{error}</pre>
        </div>
      )}
      
      {hasResult ? (
        <div className="space-y-4">
          <div className="p-4 bg-info rounded">
            <Heading level="section">Success:</Heading>
            <p>{resultObject?.success ? "✅ true" : "❌ false"}</p>
          </div>

          {Boolean(resultObject?.data) && (
            <div className="p-4 bg-success rounded">
              <Heading level="section">Data:</Heading>
              <pre className="mt-2 text-xs overflow-auto max-h-96">
                {JSON.stringify(resultObject?.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
