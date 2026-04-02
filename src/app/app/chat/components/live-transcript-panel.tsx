import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { X, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TranscriptSegment } from "../hooks/use-transcription";

interface LiveTranscriptPanelProps {
  transcripts: TranscriptSegment[];
  isVisible: boolean;
  onClose: () => void;
}

export function LiveTranscriptPanel({ transcripts, isVisible, onClose }: LiveTranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (isVisible && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcripts, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="absolute right-2 top-16 bottom-20 w-[calc(100%-1rem)] sm:right-4 sm:top-20 sm:bottom-24 sm:w-80 bg-black/80 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl flex flex-col z-50 transition-all duration-300 animate-in slide-in-from-right-10">
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2 text-white">
          <MessageSquareText className="w-4 h-4" />
          <h3 className="font-semibold text-sm">Transcrição em Tempo Real</h3>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-gray-400 hover:text-white" 
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="flex flex-col gap-3">
          {transcripts.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              Aguardando fala...
            </div>
          ) : (
            transcripts.map((segment) => (
              <div key={segment.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-blue-400 truncate max-w-37.5">
                    {segment.participantName}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(segment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className={cn(
                  "text-sm leading-relaxed wrap-break-word",
                  segment.isFinal ? "text-white" : "text-gray-400 italic"
                )}>
                  {segment.text}
                </p>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
