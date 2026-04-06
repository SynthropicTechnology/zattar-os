'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Square,
  RotateCcw,
  Copy,
  Check,
  FileText,
} from 'lucide-react';
import { useDifyCompletion } from '../../hooks/use-dify-completion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SaveAsDocumentDialog } from '../save-as-document-dialog';

interface CompletionPanelProps {
  appId?: string;
  inputs?: Record<string, unknown>;
  placeholder?: string;
  className?: string;
}

export function CompletionPanel({
  appId,
  inputs,
  placeholder = 'Digite seu prompt aqui...',
  className,
}: CompletionPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const {
    answer,
    isStreaming,
    isLoading,
    error,
    generate,
    stop,
    reset,
  } = useDifyCompletion({ appId });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;
    await generate({ ...inputs, query: inputValue });
  };

  const handleCopy = async () => {
    if (!answer) return;
    await navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    reset();
    setInputValue('');
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Input */}
      <form onSubmit={handleSubmit} className="border-b p-4 space-y-3">
        <Textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          disabled={isStreaming}
          className="min-h-25 resize-none"
        />
        <div className="flex gap-2">
          {isStreaming ? (
            <Button type="button" variant="outline" onClick={stop}>
              <Square className="h-4 w-4 mr-2" />
              Parar
            </Button>
          ) : (
            <Button type="submit" disabled={!inputValue.trim() || isLoading}>
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar
            </Button>
          )}
          {answer && (
            <Button type="button" variant="ghost" onClick={handleReset} title="Limpar">
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-sm text-destructive bg-destructive/10 border-b">
          {error.message}
        </div>
      )}

      {/* Result */}
      {answer && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="text-xs font-medium text-muted-foreground">Resultado</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon" aria-label="Salvar como documento"
                onClick={() => setSaveDialogOpen(true)}
                title="Salvar como Documento"
              >
                <FileText className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCopy} title="Copiar">
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 px-4">
            <div className="py-4 prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {answer}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-foreground/50 animate-pulse ml-0.5" />
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Empty state */}
      {!answer && !error && !isLoading && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Digite um prompt e clique em Gerar
        </div>
      )}

      {/* Loading without answer yet */}
      {isLoading && !answer && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-1 text-muted-foreground text-sm">
            <span className="animate-bounce [animation-delay:0ms]">.</span>
            <span className="animate-bounce [animation-delay:150ms]">.</span>
            <span className="animate-bounce [animation-delay:300ms]">.</span>
            <span className="ml-1">Gerando...</span>
          </div>
        </div>
      )}
      <SaveAsDocumentDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        content={answer || ''}
      />
    </div>
  );
}
