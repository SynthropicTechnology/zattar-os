'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFormShell } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Task, TaskLabel, TaskPriority, TaskStatus } from '@/app/(authenticated)/tarefas/domain';
import {
  actionCriarTarefa,
  actionMarcarComoDone,
  actionMarcarComoTodo,
} from '@/app/(authenticated)/tarefas/actions/tarefas-actions';

const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'A fazer',
  'in progress': 'Em andamento',
  done: 'Concluída',
  canceled: 'Cancelada',
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

const LABEL_LABEL: Record<TaskLabel, string> = {
  bug: 'Bug',
  feature: 'Funcionalidade',
  documentation: 'Documentação',
  audiencia: 'Audiência',
  expediente: 'Expediente',
  obrigacao: 'Obrigação',
  pericia: 'Perícia',
};

interface TarefasWidgetProps {
  initialTasks: Task[];
}

export function TarefasWidget({ initialTasks }: TarefasWidgetProps) {
  const router = useRouter();
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  const [open, setOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const [form, setForm] = React.useState<{
    title: string;
    status: TaskStatus;
    label: TaskLabel;
    priority: TaskPriority;
  }>({
    title: '',
    status: 'todo',
    label: 'feature',
    priority: 'medium',
  });

  const handleToggleDone = (task: Task) => {
    const willBeDone = task.status !== 'done';
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: willBeDone ? 'done' : 'todo' } : t))
    );

    startTransition(async () => {
      const result = willBeDone
        ? await actionMarcarComoDone({ id: task.id })
        : await actionMarcarComoTodo({ id: task.id });

      if (!result.success) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        setErrorMessage(result.message || result.error || 'Não foi possível atualizar a tarefa.');
        return;
      }
      router.refresh();
    });
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
        setErrorMessage(result.message || result.error || 'Não foi possível criar a tarefa.');
        return;
      }

      setOpen(false);
      setForm({ title: '', status: 'todo', label: 'feature', priority: 'medium' });
      router.refresh();
    });
  };

  return (
    <Card className="h-full glass-widget bg-transparent transition-all duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="size-5" />
          Tarefas
        </CardTitle>
        <CardAction>
          <Button
            size="icon" aria-label="Nova tarefa"
            variant="ghost"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(true)}
          >
            <PlusCircle className="size-5" />
            <span className="sr-only">Nova tarefa</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckSquare className="size-12 text-muted-foreground/55" />
            <p className="mt-4 text-sm text-muted-foreground">Nenhuma tarefa por aqui!</p>
            <p className="text-sm text-muted-foreground">
              Clique no <span className="font-medium text-primary">+</span> para criar uma.
            </p>
          </div>
        ) : (
          tasks.map((task) => {
            const done = task.status === 'done';
            return (
              <div
                key={task.id}
                className={cn(
                  'flex items-start gap-3 rounded-md border bg-background p-3 transition-colors',
                  done && 'bg-muted/50'
                )}
              >
                <Checkbox checked={done} onCheckedChange={() => handleToggleDone(task)} className="mt-1" />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className={cn('text-sm font-medium leading-none', done && 'text-muted-foreground line-through')}>
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{STATUS_LABEL[task.status]}</Badge>
                    <Badge variant="outline">{LABEL_LABEL[task.label]}</Badge>
                    <Badge variant="outline">Prioridade: {PRIORITY_LABEL[task.priority]}</Badge>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <DialogFormShell
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setErrorMessage(null);
        }}
        title="Nova tarefa"
        footer={
          <Button type="submit" form="dashboard-nova-tarefa-form" disabled={isPending}>
            {isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        }
      >
        <form id="dashboard-nova-tarefa-form" onSubmit={handleCreate} className="px-6 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="dashboard-task-title">Título</Label>
              <Input
                id="dashboard-task-title"
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="Ex: Revisar documento"
                className="mt-2 bg-background"
                required
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((s) => ({ ...s, status: value as TaskStatus }))}>
                <SelectTrigger className="mt-2 bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">A fazer</SelectItem>
                  <SelectItem value="in progress">Em andamento</SelectItem>
                  <SelectItem value="done">Concluída</SelectItem>
                  <SelectItem value="canceled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(value) => setForm((s) => ({ ...s, priority: value as TaskPriority }))}>
                <SelectTrigger className="mt-2 bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Etiqueta</Label>
              <Select value={form.label} onValueChange={(value) => setForm((s) => ({ ...s, label: value as TaskLabel }))}>
                <SelectTrigger className="mt-2 bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature">Funcionalidade</SelectItem>
                  <SelectItem value="documentation">Documentação</SelectItem>
                  <SelectItem value="audiencia">Audiência</SelectItem>
                  <SelectItem value="expediente">Expediente</SelectItem>
                  <SelectItem value="obrigacao">Obrigação</SelectItem>
                  <SelectItem value="pericia">Perícia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {errorMessage && (
            <p className="mt-4 text-sm text-destructive" role="alert">{errorMessage}</p>
          )}
        </form>
      </DialogFormShell>
    </Card>
  );
}
