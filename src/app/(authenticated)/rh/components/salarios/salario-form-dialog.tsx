'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, History, ExternalLink } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUsuarios, type Usuario } from '@/app/(authenticated)/usuarios';
import { useCargos } from '@/app/(authenticated)/cargos';
import { actionCriarSalario, actionAtualizarSalario, actionBuscarSalariosDoUsuario } from '../../actions/salarios-actions';
import type { SalarioComDetalhes } from '../../types';
import { toast } from 'sonner';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { useRouter } from 'next/navigation';

const schema = z.object({
  usuarioId: z.coerce.number().positive('Selecione um funcionário'),
  cargoId: z.coerce.number().positive().nullable().optional(),
  salarioBruto: z.coerce.number().positive('Salário deve ser maior que zero'),
  dataInicioVigencia: z.string().min(8, 'Informe a data de início da vigência'),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface SalarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salario: SalarioComDetalhes | null;
  onSuccess?: () => void;
}

export function SalarioFormDialog({
  open,
  onOpenChange,
  salario,
  onSuccess,
}: SalarioFormDialogProps) {
  const router = useRouter();
  const { usuarios } = useUsuarios({ ativo: true });
  const { cargos } = useCargos({ ativo: true });
  const formRef = React.useRef<HTMLFormElement>(null);

  const [salariosUsuario, setSalariosUsuario] = React.useState<SalarioComDetalhes[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      usuarioId: salario?.usuarioId ?? undefined,
      cargoId: salario?.cargoId ?? undefined,
      salarioBruto: salario?.salarioBruto ?? undefined,
      dataInicioVigencia: salario?.dataInicioVigencia ?? '',
      observacoes: salario?.observacoes ?? '',
    },
    values: salario
      ? {
          usuarioId: salario.usuarioId,
          cargoId: salario.cargoId,
          salarioBruto: salario.salarioBruto,
          dataInicioVigencia: salario.dataInicioVigencia,
          observacoes: salario.observacoes || '',
        }
      : undefined,
  });

  const usuarioIdSelecionado = form.watch('usuarioId');

  // Buscar salários quando usuário for selecionado
  React.useEffect(() => {
    if (!usuarioIdSelecionado || salario) return;

    const fetchSalarios = async () => {
      try {
        const result = await actionBuscarSalariosDoUsuario(usuarioIdSelecionado);
        if (result.success && result.data) {
          setSalariosUsuario(result.data);
        }
      } catch (error) {
        console.error('Erro ao buscar salários:', error);
      }
    };

    fetchSalarios();
  }, [usuarioIdSelecionado, salario]);

  const salarioVigente = salariosUsuario.find(
    (s) => s.ativo && !s.dataFimVigencia
  );

  const handleVerHistorico = () => {
    if (usuarioIdSelecionado) {
      router.push(`/rh/salarios/usuario/${usuarioIdSelecionado}`);
      onOpenChange(false);
    }
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    const formData = new FormData();
    formData.append('usuarioId', values.usuarioId.toString());
    if (values.cargoId) formData.append('cargoId', values.cargoId.toString());
    formData.append('salarioBruto', values.salarioBruto.toString());
    formData.append('dataInicioVigencia', values.dataInicioVigencia);
    if (values.observacoes) formData.append('observacoes', values.observacoes);

    let result;
    if (salario) {
        result = await actionAtualizarSalario(salario.id, formData);
    } else {
        result = await actionCriarSalario(formData);
    }

    if (!result.success) {
      toast.error(result.error || 'Erro ao salvar salário');
      return;
    }

    toast.success(salario ? 'Salário atualizado' : 'Salário criado');
    onOpenChange(false);
    form.reset();
    setSalariosUsuario([]);
    onSuccess?.();
  });

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={salario ? 'Editar Salário' : 'Novo Salário'}
      footer={
        <Button
          type="submit"
          onClick={() => formRef.current?.requestSubmit()}
          disabled={form.formState.isSubmitting}
          className="ml-auto"
        >
          {salario ? 'Salvar alterações' : 'Criar salário'}
        </Button>
      }
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Funcionário</Label>
          <Controller
            control={form.control}
            name="usuarioId"
            render={({ field }) => (
              <Select
                value={field.value?.toString() ?? ''}
                onValueChange={(value) => field.onChange(Number(value))}
                disabled={!!salario}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario: Usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nomeExibicao || usuario.nomeCompleto || usuario.emailCorporativo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.usuarioId && (
            <p className="text-sm text-destructive">{form.formState.errors.usuarioId.message}</p>
          )}
        </div>

        {/* Alerta de Salário Vigente */}
        {!salario && salarioVigente && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção: Salário Vigente Existente</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Este funcionário já possui um salário vigente de{' '}
                <strong>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(salarioVigente.salarioBruto)}
                </strong>{' '}
                desde{' '}
                {new Date(salarioVigente.dataInicioVigencia).toLocaleDateString('pt-BR')}.
              </p>
              <p className="text-sm">
                Para criar um novo salário, você deve primeiro <strong>encerrar a vigência</strong> do salário atual.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleVerHistorico}
                className="mt-2"
              >
                <History className="mr-2 h-4 w-4" />
                Ver Histórico Completo
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Info sobre histórico quando houver salários anteriores */}
        {!salario && salariosUsuario.length > 0 && !salarioVigente && (
          <Alert>
            <History className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Este funcionário possui {salariosUsuario.length} registro(s) de salário anterior.</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleVerHistorico}
              >
                Ver Histórico
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Cargo (Opcional)</Label>
          <Controller
            control={form.control}
            name="cargoId"
            render={({ field }) => (
              <Select
                value={field.value?.toString()}
                onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {cargos.map((cargo) => (
                    <SelectItem key={cargo.id} value={cargo.id.toString()}>
                      {cargo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Salário Bruto (R$)</Label>
          <Input
            type="number"
            step="0.01"
            {...form.register('salarioBruto', { valueAsNumber: true })}
          />
          {form.formState.errors.salarioBruto && (
            <p className="text-sm text-destructive">
              {form.formState.errors.salarioBruto.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Data de Início da Vigência</Label>
          <Input type="date" {...form.register('dataInicioVigencia')} />
          {form.formState.errors.dataInicioVigencia && (
            <p className="text-sm text-destructive">
              {form.formState.errors.dataInicioVigencia.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Observações</Label>
          <Textarea rows={3} {...form.register('observacoes')} placeholder="Ex: Promoção, Ajuste anual, etc." />
        </div>
      </form>
    </DialogFormShell>
  );
}
