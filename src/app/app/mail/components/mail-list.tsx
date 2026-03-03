import { useRef, useCallback, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import type { MailMessagePreview } from "@/lib/mail/types";
import { useMailStore } from "../use-mail";
import { useMailMessages, useMailActions } from "../hooks/use-mail-api";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface MailListProps {
  items: MailMessagePreview[];
}

export function MailList({ items }: MailListProps) {
  const { selectedMail, setSelectedMail, isLoading, isLoadingMore, hasMore, error, setError } =
    useMailStore();
  const { refetchMessages } = useMailMessages();
  const { loadMoreMessages } = useMailActions();
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreMessages();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMoreMessages]);

  // Keyboard navigation (↑↓) within the list
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "ArrowDown" && index < items.length - 1) {
        e.preventDefault();
        const next = listRef.current?.querySelector(
          `[data-mail-index="${index + 1}"]`
        ) as HTMLElement;
        next?.focus();
        setSelectedMail(items[index + 1]);
      } else if (e.key === "ArrowUp" && index > 0) {
        e.preventDefault();
        const prev = listRef.current?.querySelector(
          `[data-mail-index="${index - 1}"]`
        ) as HTMLElement;
        prev?.focus();
        setSelectedMail(items[index - 1]);
      }
    },
    [items, setSelectedMail]
  );

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertCircle className="text-destructive h-8 w-8" />
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setError(null);
            refetchMessages();
          }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <div className="ml-auto flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-8 text-sm">
        Nenhum e-mail encontrado
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div
        ref={listRef}
        role="listbox"
        aria-label="Lista de e-mails"
        className="flex flex-col gap-2 p-4">
        {items.map((item, index) => (
          <button
            key={item.uid}
            role="option"
            aria-selected={selectedMail?.uid === item.uid}
            aria-label={`${!item.read ? "Não lido: " : ""}${item.from.name || item.from.address} — ${item.subject}`}
            data-mail-index={index}
            tabIndex={selectedMail?.uid === item.uid ? 0 : -1}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-colors duration-200",
              selectedMail?.uid === item.uid
                ? "bg-accent"
                : "hover:bg-muted/50"
            )}
            onClick={() => setSelectedMail(item)}
            onKeyDown={(e) => handleKeyDown(e, index)}>
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">
                    {item.from.name || item.from.address}
                  </div>
                  {!item.read && (
                    <span
                      className="flex h-2 w-2 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div
                  className={cn(
                    "ml-auto text-xs",
                    selectedMail?.uid === item.uid
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}>
                  {formatDistanceToNow(new Date(item.date), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </div>
              </div>
              <div className="text-xs font-medium">{item.subject}</div>
            </div>
            <div className="text-muted-foreground line-clamp-2 text-xs">
              {item.preview || item.subject}
            </div>
          </button>
        ))}

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div ref={sentinelRef} className="flex items-center justify-center py-4">
            {isLoadingMore && <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
