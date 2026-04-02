import { useState, useEffect } from 'react';
import type DyteClient from '@dytesdk/web-core';

export interface TranscriptSegment {
  participantId: string;
  participantName: string;
  text: string;
  timestamp: number; // Date.now()
  isFinal: boolean;
  id: string; // Unique ID for key
}

interface DyteTranscript {
  id?: string;
  peerId?: string;
  user_id?: string;
  participant_id?: string;
  name?: string;
  transcript?: string;
  text?: string;
  date?: Date | string;
  timestamp?: string;
  isFinal?: boolean;
  is_final?: boolean;
}

export function useTranscription(meeting: DyteClient | null) {
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!meeting) return;

    const handleTranscript = (transcript: unknown) => {
      // Dyte transcript object structure might vary, adapting to common interface
      // Documentation says: 
      // {
      //   id: string,
      //   participant_id: string,
      //   name: string,
      //   text: string,
      //   timestamp: string, // ISO string
      //   is_final: boolean
      // }
      
      // Type narrowing for transcript object
      const t = transcript as DyteTranscript;
      
      const dateValue = t.date instanceof Date 
        ? t.date 
        : t.date 
          ? new Date(t.date) 
          : null;
      
      const newSegment: TranscriptSegment = {
        id: t.id || `ts-${Date.now()}-${Math.random()}`,
        participantId: t.peerId || t.user_id || t.participant_id || 'unknown',
        participantName: t.name || 'Unknown',
        text: t.transcript || t.text || '',
        timestamp: dateValue ? dateValue.getTime() : Date.now(),
        isFinal: t.isFinal ?? t.is_final ?? false,
      };

      setTranscripts((prev) => {
        // Optimization: If the last segment is from the same person and not final, update it?
        // Or if we receive an update for a non-final segment.
        // Dyte usually sends updates for the current sentence.
        
        // Strategy: 
        // If we receive a non-final transcript, we might want to update the last entry if it matches the user
        // OR just append. 
        // Usually, libraries send "isFinal: false" for partial results.
        // We should replace the last partial result from this user or append if it's new.
        
        // Simple approach for now: Append everything, filter in UI?
        // Better: Maintain a list where we update partials.
        
        // Let's assume we just append for now to keep history, but we might get spam of partials.
        // If isFinal is true, we commit it.
        // If isFinal is false, we ideally want to show it as "typing/speaking".
        
        // Refined Strategy:
        // We only store "isFinal: true" segments in the history.
        // For "isFinal: false", we store them in a separate "live" state or just update the last one.
        // But the requirement says "Live Transcript".
        
        // Let's append if it's final. If it's not final, we replace the last segment IF it matches the ID and was not final.
        // Otherwise append.
        
        const last = prev[prev.length - 1];
        if (last && !last.isFinal && last.participantId === newSegment.participantId && !newSegment.isFinal) {
           return [...prev.slice(0, -1), newSegment];
        }
        
        // Also if the new one is final, and the last one was the same partial segment, replace it.
        if (last && !last.isFinal && last.participantId === newSegment.participantId && newSegment.isFinal) {
           return [...prev.slice(0, -1), newSegment];
        }

        return [...prev, newSegment];
      });
    };

    // Subscribing to transcript events
    // Note: Dyte API v2 Web Core might use meeting.ai.on('transcript', ...)
    // or meeting.transcripts.on(...)
    // Let's check available properties on meeting object if possible or assume standard.
    // Based on recent Dyte docs: meeting.ai.on('transcript', cb)
    
    if (meeting.ai) {
      meeting.ai.on('transcript', handleTranscript);
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setIsTranscribing(true);
      }, 0);
    } else {
        // Fallback or older SDK version check
        console.warn('Dyte AI module not found on meeting object');
        setTimeout(() => {
          setError('Transcription not supported in this client version');
        }, 0);
    }

    return () => {
      if (meeting.ai) {
        meeting.ai.removeListener('transcript', handleTranscript);
      }
    };
  }, [meeting]);

  return { transcripts, isTranscribing, error };
}
