'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';

export interface CapturaResultData {
    total?: number;
    processos?: unknown[];
    audiencias?: unknown[];
    persistencia?: {
      total: number;
      atualizados: number;
      erros: number;
      orgaosJulgadoresCriados?: number;
    };
    dataInicio?: string;
    dataFim?: string;
    filtroPrazo?: string;
    credenciais_processadas?: number;
    message?: string;
    total_processos?: number;
    total_partes?: number;
    clientes?: number;
    partes_contrarias?: number;
    terceiros?: number;
    representantes?: number;
    vinculos?: number;
    erros?: Array<{ processo_id: number; numero_processo: string; erro: string }>;
    duracao_ms?: number;
    timeline?: unknown[];
    totalItens?: number;
    totalDocumentos?: number;
    totalMovimentos?: number;
    documentosBaixados?: Array<{
      detalhes: unknown;
      pdfTamanho?: number;
      erro?: string;
    }>;
    totalBaixadosSucesso?: number;
    totalErros?: number;
    mongoId?: string;
  }

interface CapturaResultProps {
  success: boolean | null;
  error?: string;
  data?: CapturaResultData;
  captureId?: number | null;
}

/**
 * Componente para exibir resultados de captura
 */
export function CapturaResult({ success, error, data, captureId }: CapturaResultProps) {
  if (success === null) {
    return null;
  }

  if (!success) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Erro na Captura</AlertTitle>
        <AlertDescription>{error || 'Erro desconhecido'}</AlertDescription>
      </Alert>
    );
  }

  // Verificar se é resposta assíncrona (captura em progresso)
  const isAsync = data?.message?.includes('background') || data?.credenciais_processadas !== undefined;

  return (
    <Alert className={isAsync ? "border-info bg-info dark:bg-info" : "border-success bg-success dark:bg-success"}>
      <CheckCircle2 className={`h-4 w-4 ${isAsync ? "text-info dark:text-info" : "text-success dark:text-success"}`} />
      <AlertTitle className={isAsync ? "text-info dark:text-info" : "text-success dark:text-success"}>
        {isAsync ? 'Captura Iniciada com Sucesso' : 'Captura Realizada com Sucesso'}
      </AlertTitle>
      <AlertDescription className={isAsync ? "text-info dark:text-info" : "text-success dark:text-success"}>
        <div className="mt-2 space-y-2">
          {isAsync ? (
            <>
              <p>{data?.message || 'A captura está sendo processada em background.'}</p>
              {data?.credenciais_processadas !== undefined && (
                <p>
                  <strong>Credenciais processadas:</strong> {data.credenciais_processadas}
                </p>
              )}
              {captureId && (
                <p className="text-sm mt-2">
                  <strong>ID da captura:</strong> {captureId} (consulte o histórico para acompanhar o progresso)
                </p>
              )}
            </>
          ) : (
            <>
              {data?.total !== undefined && (
                <p>
                  <strong>Total capturado:</strong> {data.total}
                </p>
              )}
            </>
          )}
          {data?.persistencia && (
            <div className="mt-3 space-y-1 text-sm">
              <p>
                <strong>Persistência:</strong>
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>Total processado: {data.persistencia.total}</li>
                <li>Atualizados: {data.persistencia.atualizados}</li>
                {data.persistencia.erros > 0 && (
                  <li className="text-warning dark:text-warning">
                    Erros: {data.persistencia.erros}
                  </li>
                )}
                {data.persistencia.orgaosJulgadoresCriados !== undefined && (
                  <li>Órgãos julgadores criados: {data.persistencia.orgaosJulgadoresCriados}</li>
                )}
              </ul>
            </div>
          )}
          {data?.dataInicio && data?.dataFim && (
            <p className="mt-2 text-sm">
              <strong>Período:</strong> {new Date(data.dataInicio).toLocaleDateString('pt-BR')} até{' '}
              {new Date(data.dataFim).toLocaleDateString('pt-BR')}
            </p>
          )}
          {data?.filtroPrazo && (
            <p className="mt-2 text-sm">
              <strong>Filtro de prazo:</strong> {data.filtroPrazo === 'no_prazo' ? 'No Prazo' : 'Sem Prazo'}
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
