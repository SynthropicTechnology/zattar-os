"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";

interface RecordingConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent: () => void;
  participantNames: string[];
}

export function RecordingConsentDialog({
  open,
  onOpenChange,
  onConsent,
  participantNames,
}: RecordingConsentDialogProps) {
  const [agreed, setAgreed] = useState(false);

  const handleConsent = () => {
    if (!agreed) return;
    onConsent();
    onOpenChange(false);
    setAgreed(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Consentimento para Gravação
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>
              Você está prestes a iniciar a gravação desta chamada. De acordo com a{" "}
              <strong>Lei Geral de Proteção de Dados (LGPD)</strong>, é necessário o
              consentimento de todos os participantes.
            </p>
            
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium mb-1">Participantes atuais:</p>
              <ul className="text-sm list-disc list-inside">
                {participantNames.map((name, idx) => (
                  <li key={idx}>{name}</li>
                ))}
              </ul>
            </div>

            <p className="text-sm">
              A gravação será armazenada de forma segura e ficará disponível por{" "}
              <strong>7 dias</strong> no servidor do Dyte. Após esse período, será
              automaticamente excluída.
            </p>

            <div className="flex items-start gap-2 pt-2">
              <Checkbox
                id="consent"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
              />
              <label
                htmlFor="consent"
                className="text-sm leading-tight cursor-pointer"
              >
                Confirmo que todos os participantes foram informados e consentiram com a
                gravação desta chamada.
              </label>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setAgreed(false);
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleConsent} disabled={!agreed}>
            Iniciar Gravação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
