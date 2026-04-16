"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Edit, CheckCircle } from "lucide-react";

interface PreviewAssinaturaProps {
  assinaturaBase64: string;
  fotoBase64: string;
  onEdit: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function PreviewAssinatura({
  assinaturaBase64,
  fotoBase64,
  onEdit,
  onConfirm,
  isLoading = false,
}: PreviewAssinaturaProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleConfirmClick = () => {
    setShowConfirmDialog(true);
  };

  const handleFinalConfirm = () => {
    setShowConfirmDialog(false);
    onConfirm();
  };

  return (
    <>
      <Card className="w-full max-w-[800px]">
        <CardHeader>
          <CardTitle>Revise sua Assinatura</CardTitle>
          <CardDescription>Confira os dados antes de finalizar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Foto Preview */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Foto do Cliente</p>
              <div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-md border border-input">
                { }
                <img src={fotoBase64} alt="Foto do cliente" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Assinatura Preview */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Assinatura Manuscrita</p>
              <div className="relative w-full max-w-[400px] aspect-[2/1] overflow-hidden rounded-md border border-input bg-white">
                { }
                <img src={assinaturaBase64} alt="Assinatura" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={onEdit} disabled={isLoading} className="w-full sm:w-auto">
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button onClick={handleConfirmClick} disabled={isLoading} className="w-full sm:flex-1">
            <CheckCircle className="mr-2 h-4 w-4" />
            {isLoading ? "Finalizando..." : "Confirmar e Finalizar"}
          </Button>
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Assinatura</DialogTitle>
            <DialogDescription>
              Ao confirmar, você concorda com os termos do contrato. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleFinalConfirm} className="w-full sm:w-auto">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}