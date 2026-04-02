'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Bot, User, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface DifyMessageProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    datasetName: string;
    documentName: string;
    content: string;
    score: number;
  }>;
  feedback?: 'like' | 'dislike' | null;
  isStreaming?: boolean;
  onFeedback?: (rating: 'like' | 'dislike') => void;
}

export function DifyMessage({
  role,
  content,
  sources,
  feedback,
  isStreaming,
  onFeedback,
}: DifyMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className={cn('flex flex-col gap-1 max-w-[80%]', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-lg px-3 py-2 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap wrap-break-word">{content}</div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none wrap-break-word">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              {isStreaming && <span className="inline-block w-1.5 h-4 bg-current animate-pulse ml-0.5" />}
            </div>
          )}
        </div>

        {/* Sources */}
        {!isUser && sources && sources.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground">
                <FileText className="h-3 w-3 mr-1" />
                {sources.length} fonte{sources.length > 1 ? 's' : ''}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1 space-y-1">
                {sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="rounded border bg-card p-2 text-xs text-muted-foreground"
                  >
                    <div className="font-medium">
                      {source.documentName}
                      <span className="ml-1 text-[10px] opacity-60">
                        ({(source.score * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="mt-1 line-clamp-2">{source.content}</div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Feedback */}
        {!isUser && content && !isStreaming && onFeedback && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-6 w-6',
                feedback === 'like' && 'text-green-500'
              )}
              onClick={() => onFeedback('like')}
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-6 w-6',
                feedback === 'dislike' && 'text-red-500'
              )}
              onClick={() => onFeedback('dislike')}
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
