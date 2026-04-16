"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PublicDocumentCardProps {
  fileName: string;
  sender?: string;
  date?: string;
  className?: string;
}

export function PublicDocumentCard({
  fileName,
  sender,
  date,
  className,
}: PublicDocumentCardProps) {
  return (
    <div
      className={cn(
        "bg-muted dark:bg-muted/50 border border-border rounded-lg p-3 sm:p-4 flex gap-3 sm:gap-4 items-center",
        className
      )}
    >
      {/* PDF Icon */}
      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-card rounded-lg flex items-center justify-center shrink-0 border border-border">
        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" aria-hidden="true" />
      </div>

      {/* Document Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-xs sm:text-sm font-medium text-foreground truncate"
          title={fileName}
        >
          {fileName}
        </p>
        {(sender || date) && (
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
            {sender && (
              <span className="text-xs text-muted-foreground">
                De: {sender}
              </span>
            )}
            {sender && date && (
              <span
                className="text-xs text-muted-foreground/50"
                aria-hidden="true"
              >
                &bull;
              </span>
            )}
            {date && (
              <span className="text-xs text-muted-foreground">
                {date}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
