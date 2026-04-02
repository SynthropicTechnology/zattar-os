import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, Download, RefreshCw, FileText, ListVideo } from "lucide-react";
import { ChamadaComParticipantes } from "../domain";
import { actionGerarResumo } from "../actions/chamadas-actions";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface CallTranscriptViewerProps {
  chamada: ChamadaComParticipantes;
}

export function CallTranscriptViewer({ chamada }: CallTranscriptViewerProps) {
  const [resumo, setResumo] = useState(chamada.resumo);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGerarResumo = async () => {
    setIsGenerating(true);
    try {
      const result = await actionGerarResumo(chamada.id);
      if (result.success) {
        setResumo(result.data);
        toast.success("Resumo gerado com sucesso!");
      } else {
        toast.error("Erro ao gerar resumo: " + result.error);
      }
    } catch {
      toast.error("Erro inesperado ao gerar resumo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyTranscript = () => {
    if (chamada.transcricao) {
      navigator.clipboard.writeText(chamada.transcricao);
      toast.success("Transcrição copiada!");
    }
  };

  const handleDownloadTranscript = () => {
    if (!chamada.transcricao) return;
    const blob = new Blob([chamada.transcricao], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcricao-chamada-${chamada.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!chamada.transcricao) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500 border border-dashed rounded-lg">
        <FileText className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">Nenhuma transcrição disponível para esta chamada.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
      <Tabs defaultValue={resumo ? "resumo" : "transcricao"} className="flex flex-col h-full">
        <div className="p-4 border-b bg-muted/30">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resumo" className="gap-2">
              <ListVideo className="w-4 h-4" />
              Resumo IA
            </TabsTrigger>
            <TabsTrigger value="transcricao" className="gap-2">
              <FileText className="w-4 h-4" />
              Transcrição Completa
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <TabsContent value="resumo" className="h-full m-0 p-0">
            <div className="h-full flex flex-col">
              <ScrollArea className="flex-1 p-6">
                {resumo ? (
                  <div className="prose dark:prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{resumo}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                    <p className="mb-4">Nenhum resumo gerado ainda.</p>
                  </div>
                )}
              </ScrollArea>
              
              <div className="p-4 border-t bg-muted/10 flex justify-end">
                <Button 
                  onClick={handleGerarResumo} 
                  disabled={isGenerating}
                  variant={resumo ? "outline" : "default"}
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  {resumo ? "Regenerar Resumo" : "Gerar Resumo com IA"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transcricao" className="h-full m-0 p-0">
             <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-2 border-b text-xs text-muted-foreground bg-muted/20 px-4">
                 <span>{chamada.transcricao.length} caracteres</span>
                 <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyTranscript} title="Copiar">
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDownloadTranscript} title="Baixar TXT">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                 </div>
              </div>
              <ScrollArea className="flex-1 p-4 font-mono text-sm leading-relaxed">
                <div className="whitespace-pre-wrap text-foreground/90">
                  {chamada.transcricao}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
