'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Play, Square, RotateCcw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useDifyWorkflow } from '../../hooks/use-dify-workflow';
import { STATUS_EXECUCAO_LABELS, StatusExecucaoDify } from '../../domain';

interface WorkflowRunnerProps {
  appId?: string;
  title?: string;
  description?: string;
  defaultInputs?: Record<string, unknown>;
  className?: string;
}

export function WorkflowRunner({
  appId,
  title = 'Executar Workflow',
  description,
  defaultInputs,
  className,
}: WorkflowRunnerProps) {
  const [inputJson, setInputJson] = useState(
    defaultInputs ? JSON.stringify(defaultInputs, null, 2) : '{}'
  );

  const { result, isRunning, error, runWorkflow, reset, state } = useDifyWorkflow({ appId });

  const handleRun = async () => {
    try {
      const inputs = JSON.parse(inputJson);
      await runWorkflow(inputs);
    } catch {
      // JSON parse error handled by workflow hook
    }
  };

  const statusIcon = {
    [StatusExecucaoDify.RUNNING]: <Loader2 className="h-4 w-4 animate-spin" />,
    [StatusExecucaoDify.SUCCEEDED]: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    [StatusExecucaoDify.FAILED]: <XCircle className="h-4 w-4 text-red-500" />,
    [StatusExecucaoDify.STOPPED]: <Square className="h-4 w-4 text-yellow-500" />,
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Parâmetros de entrada (JSON)
          </label>
          <Textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            className="font-mono text-xs min-h-25"
            disabled={isRunning}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleRun} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Executar
              </>
            )}
          </Button>
          {result && (
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error.message}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {statusIcon[state.status as StatusExecucaoDify] || statusIcon[StatusExecucaoDify.SUCCEEDED]}
              <SemanticBadge
                category="status"
                value={state.status}
                variantOverride="outline"
              >
                {STATUS_EXECUCAO_LABELS[state.status as StatusExecucaoDify] || 'Concluído'}
              </SemanticBadge>
            </div>

            {state.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {state.error}
              </div>
            )}

            {result && Object.keys(result).length > 0 && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Resultado</label>
                <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-auto max-h-75">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
