"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DialogFormShell } from "@/components/shared";
import { actionCriarTarefa } from "../actions/tarefas-actions";
import { priorities, statuses } from "../constants";
import type { TaskStatus, TaskLabel, TaskPriority } from "../domain";

interface TaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TaskDialog({ open, onOpenChange }: TaskDialogProps) {
    const router = useRouter();
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [isPending, startTransition] = React.useTransition();

    const [form, setForm] = React.useState<{
        title: string;
        status: TaskStatus;
        label: TaskLabel;
        priority: TaskPriority;
    }>({
        title: "",
        status: "todo",
        label: "feature",
        priority: "medium",
    });

    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
            setErrorMessage(null);
        }
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        startTransition(async () => {
            const result = await actionCriarTarefa({
                title: form.title,
                status: form.status,
                label: form.label,
                priority: form.priority,
            });

            if (!result.success) {
                setErrorMessage(result.message || result.error || "Não foi possível criar a tarefa.");
                return;
            }

            onOpenChange(false);
            setForm({ title: "", status: "todo", label: "feature", priority: "medium" });
            router.refresh();
        });
    };

    return (
        <DialogFormShell
            open={open}
            onOpenChange={handleOpenChange}
            title="Nova tarefa"
            footer={
                <Button type="submit" form="nova-tarefa-form" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar"}
                </Button>
            }
        >
            <form id="nova-tarefa-form" onSubmit={handleCreate}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            variant="glass"
                            value={form.title}
                            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                            placeholder="Ex: Revisar documento"
                            className="mt-2 bg-card"
                            required
                        />
                    </div>

                    <div>
                        <Label>Status</Label>
                        <Select
                            value={form.status}
                            onValueChange={(value) => setForm((s) => ({ ...s, status: value as TaskStatus }))}
                        >
                            <SelectTrigger className="mt-2 bg-card">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                                {statuses.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Prioridade</Label>
                        <Select
                            value={form.priority}
                            onValueChange={(value) => setForm((s) => ({ ...s, priority: value as TaskPriority }))}
                        >
                            <SelectTrigger className="mt-2 bg-card">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                                {priorities.map((p) => (
                                    <SelectItem key={p.value} value={p.value}>
                                        {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="md:col-span-2">
                        <Label>Etiqueta</Label>
                        <Select
                            value={form.label}
                            onValueChange={(value) => setForm((s) => ({ ...s, label: value as TaskLabel }))}
                        >
                            <SelectTrigger className="mt-2 bg-card">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                                <SelectItem value="bug">Bug</SelectItem>
                                <SelectItem value="feature">Funcionalidade</SelectItem>
                                <SelectItem value="documentation">Documentação</SelectItem>
                                <SelectItem value="audiencia">Audiência</SelectItem>
                                <SelectItem value="expediente">Expediente</SelectItem>
                                <SelectItem value="pericia">Perícia</SelectItem>
                                <SelectItem value="obrigacao">Obrigação</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {errorMessage && (
                    <p className="mt-4 text-sm text-destructive" role="alert">
                        {errorMessage}
                    </p>
                )}
            </form>
        </DialogFormShell>
    );
}
