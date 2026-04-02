'use client';

import { useState, useCallback, useRef } from 'react';

export interface WorkflowRunState {
  workflowRunId?: string;
  taskId?: string;
  status: 'idle' | 'running' | 'succeeded' | 'failed' | 'stopped';
  outputs?: Record<string, unknown>;
  error?: string;
  logs: string[];
}

interface UseDifyWorkflowOptions {
  appId?: string;
  onFinish?: (result: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
  user?: string;
}

export function useDifyWorkflow({
  appId,
  onFinish,
  onError,
  user = 'user',
}: UseDifyWorkflowOptions = {}) {
  const [state, setState] = useState<WorkflowRunState>({
    status: 'idle',
    logs: [],
  });
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const isRunning = state.status === 'running';

  const execute = useCallback(async (inputs: Record<string, unknown>, files?: unknown[]) => {
    setState({
      status: 'running',
      logs: [],
      outputs: undefined,
      error: undefined
    });
    setError(null);
    setResult(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/dify/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs,
          files,
          user,
          app_id: appId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Erro na execução do workflow: ${response.statusText}`);
      }

      if (!response.body) throw new Error('Response body is null');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);

              // Workflow events: workflow_started, node_started, node_finished, workflow_finished
              if (data.event === 'workflow_started') {
                setState(s => ({ ...s, workflowRunId: data.workflow_run_id, taskId: data.task_id }));
              } else if (data.event === 'node_started') {
                setState(s => ({ ...s, logs: [...s.logs, `Iniciando nó: ${data.data.title}`] }));
              } else if (data.event === 'node_finished') {
                // Logs opcionais
              } else if (data.event === 'workflow_finished') {
                setState(s => ({
                  ...s,
                  status: 'succeeded',
                  outputs: data.data.outputs,
                  logs: [...s.logs, 'Workflow finalizado com sucesso.']
                }));
                setResult(data.data.outputs);
                if (onFinish) onFinish(data.data.outputs);
              } else if (data.event === 'error' || (data.status === 'failed')) {
                throw new Error(data.message || 'Falha no workflow');
              }

            } catch (e) {
              console.error('Erro parse SSE Workflow:', e);
            }
          }
        }
      }

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.name !== 'AbortError') {
        setState(s => ({ ...s, status: 'failed', error: err.message }));
        setError(err);
        if (onError) onError(err);
      }
      abortControllerRef.current = null;
    }
  }, [appId, user, onFinish, onError]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setState(s => ({ ...s, status: 'stopped', logs: [...s.logs, 'Execução parada pelo usuário.'] }));
    }
  }, []);

  const runWorkflow = useCallback(async (inputs: Record<string, unknown>) => {
    await execute(inputs);
  }, [execute]);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      logs: [],
      outputs: undefined,
      error: undefined,
    });
    setResult(null);
    setError(null);
  }, []);

  return {
    state,
    execute,
    stop,
    result,
    isRunning,
    error,
    runWorkflow,
    reset,
  };
}
