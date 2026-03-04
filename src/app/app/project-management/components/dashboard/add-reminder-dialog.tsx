"use client";

import React, { useTransition } from "react";
import { PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DateTimePicker } from "@/components/layout/pickers/date-time-picker";
import { actionCriarLembrete } from "../../lib/actions";
import type { Prioridade } from "../../lib/domain";

export function AddReminderDialog() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date>();
  const [texto, setTexto] = React.useState("");
  const [prioridade, setPrioridade] = React.useState<Prioridade>("media");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!texto.trim() || !date) return;

    startTransition(async () => {
      const result = await actionCriarLembrete({
        texto: texto.trim(),
        dataHora: date.toISOString(),
        prioridade,
      });
      if (result.success) {
        setTexto("");
        setDate(undefined);
        setPrioridade("media");
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircleIcon />
          Novo Lembrete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Adicionar Lembrete</DialogTitle>
        </DialogHeader>
        <div className="mt-4 grid space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="texto">Nota</Label>
            <Input
              id="texto"
              placeholder="Descreva o lembrete..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Data e Hora</Label>
            <DateTimePicker date={date} setDate={setDate} />
          </div>
          <div className="grid gap-3">
            <Label>Prioridade</Label>
            <RadioGroup
              value={prioridade}
              onValueChange={(v) => setPrioridade(v as Prioridade)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="baixa" id="baixa" />
                <Label htmlFor="baixa" className="cursor-pointer">
                  Baixa
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="media" id="media" />
                <Label htmlFor="media" className="cursor-pointer">
                  Média
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alta" id="alta" />
                <Label htmlFor="alta" className="cursor-pointer">
                  Alta
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="urgente" id="urgente" />
                <Label htmlFor="urgente" className="cursor-pointer">
                  Urgente
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleAdd}
            disabled={isPending || !texto.trim() || !date}
          >
            {isPending ? "Salvando..." : "Adicionar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
