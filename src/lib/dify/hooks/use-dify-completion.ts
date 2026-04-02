import { useState, useCallback, useRef } from 'react';

interface UseDifyCompletionOptions {
  appId?: string;
  user?: string;
  onFinish?: (answer: string) => void;
  onError?: (error: Error) => void;
}

export function useDifyCompletion({
  appId,
  user = 'user',
  onFinish,
  onError,
}: UseDifyCompletionOptions = {}) {
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (inputs: Record<string, unknown>) => {
    setAnswer('');
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      let fullResponse = '';

      const response = await fetch('/api/dify/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs, user, app_id: appId }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.statusText}`);
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

              if (data.event === 'message' || data.event === 'agent_message') {
                const delta = data.answer || '';
                fullResponse += delta;
                setAnswer(fullResponse);
              } else if (data.event === 'message_end') {
                if (onFinish) onFinish(fullResponse);
              } else if (data.event === 'error') {
                throw new Error(data.message || 'Erro desconhecido do Dify');
              }
            } catch (e) {
              if (e instanceof Error && e.message.includes('Erro')) throw e;
              console.error('Erro ao parsing SSE JSON:', e);
            }
          }
        }
      }

      // Se terminou sem evento message_end, chama onFinish mesmo assim
      if (fullResponse && onFinish) onFinish(fullResponse);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.name !== 'AbortError') {
        setError(err);
        if (onError) onError(err);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [appId, user, onFinish, onError]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, []);

  const reset = useCallback(() => {
    setAnswer('');
    setError(null);
  }, []);

  return {
    answer,
    generate,
    stop,
    reset,
    isLoading,
    isStreaming,
    error,
  };
}
