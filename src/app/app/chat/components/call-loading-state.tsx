import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type LoadingStage = 'connecting' | 'initializing' | 'joining' | 'reconnecting';

interface CallLoadingStateProps {
  stage: LoadingStage;
  message?: string;
  onCancel?: () => void;
  className?: string;
}

export function CallLoadingState({ 
  stage, 
  message, 
  onCancel,
  className 
}: CallLoadingStateProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let targetProgress = 0;
    
    switch (stage) {
      case 'connecting':
        targetProgress = 30;
        break;
      case 'initializing':
        targetProgress = 60;
        break;
      case 'joining':
        targetProgress = 90;
        break;
      case 'reconnecting':
        targetProgress = 45;
        break;
    }

    // Smooth progress animation
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= targetProgress) return targetProgress;
        return prev + Math.random() * 5; // Random increment for "real" feel
      });
    }, 200);

    return () => clearInterval(timer);
  }, [stage]);

  const defaultMessages = {
    connecting: "Conectando ao servidor...",
    initializing: "Preparando dispositivos...",
    joining: "Entrando na sala...",
    reconnecting: "Tentando reconectar..."
  };

  return (
    <div className={cn("flex flex-col items-center justify-center h-full w-full bg-gray-950 text-white p-6", className)}>
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
          <Loader2 className="w-16 h-16 animate-spin text-blue-500 relative z-10" />
        </div>
        
        <div className="text-center space-y-2 w-full">
          <h3 className="text-xl font-semibold tracking-tight">
            {message || defaultMessages[stage]}
          </h3>
          <p className="text-sm text-gray-400">
            Aguarde um momento...
          </p>
        </div>

        <div className="w-full space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-right text-gray-500">{Math.round(progress)}%</p>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 text-sm text-gray-400 hover:text-white transition-colors underline decoration-dotted"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
