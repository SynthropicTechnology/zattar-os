"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle } from "lucide-react";

interface RecordingPlayerProps {
  recordingUrl: string;
  chamadaId: number;
  titulo?: string;
}

export function RecordingPlayer({ recordingUrl, chamadaId, titulo }: RecordingPlayerProps) {
  const [error, setError] = useState<string | null>(null);

  const handleDownload = () => {
    window.open(recordingUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {titulo || `Gravação da Chamada #${chamadaId}`}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Baixar
        </Button>
      </div>

      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video
          controls
          className="w-full h-full"
          onError={() => setError("Erro ao carregar gravação")}
        >
          <source src={recordingUrl} type="video/mp4" />
          Seu navegador não suporta reprodução de vídeo.
        </video>
      </div>

      {error && (
        <div className="text-sm text-red-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Esta gravação ficará disponível por 7 dias a partir da data da chamada.
      </p>
    </div>
  );
}
