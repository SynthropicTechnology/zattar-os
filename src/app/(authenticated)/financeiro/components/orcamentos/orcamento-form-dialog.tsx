'use client';

/**
 * Dialog para criar/editar orçamentos
 * Usa Server Actions de features/financeiro/actions/orcamentos
 */

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { actionCriarOrcamento, actionAtualizarOrcamento } from '../../actions/orcamentos';
import type {
    OrcamentoComItens,
    PeriodoOrcamento,
    CriarOrcamentoDTO,
    AtualizarOrcamentoDTO,
} from '@/app/(authenticated)/financeiro/domain/orcamentos';

// ============================================================================
// Tipos
// ============================================================================

interface OrcamentoFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orcamento?: OrcamentoComItens | null;
    usuarioId?: string; // Optional when editing existing orcamento
    onSuccess?: () => void;
}

export type { OrcamentoFormDialogProps };

interface FormData {
    nome: string;
    descricao: string;
    ano: number;
    periodo: PeriodoOrcamento;
    dataInicio: Date | undefined;
    dataFim: Date | undefined;
    observacoes: string;
}

// ============================================================================
// Constantes
// ============================================================================

const PERIODO_OPTIONS: { value: PeriodoOrcamento; label: string }[] = [
    { value: 'mensal', label: 'Mensal' },
    { value: 'trimestral', label: 'Trimestral' },
    { value: 'semestral', label: 'Semestral' },
    { value: 'anual', label: 'Anual' },
];

const getCurrentYear = (): number => new Date().getFullYear();

// ============================================================================
// Componente
// ============================================================================

export function OrcamentoFormDialog({
    open,
    onOpenChange,
    orcamento,
    usuarioId,
    onSuccess,
}: OrcamentoFormDialogProps) {
    const isEditing = !!orcamento;
    const [isLoading, setIsLoading] = React.useState(false);

    const [formData, setFormData] = React.useState<FormData>({
        nome: '',
        descricao: '',
        ano: getCurrentYear(),
        periodo: 'anual',
        dataInicio: undefined,
        dataFim: undefined,
        observacoes: '',
    });

    // Preencher formulário ao editar
    React.useEffect(() => {
        if (orcamento) {
            setFormData({
                nome: orcamento.nome,
                descricao: orcamento.descricao || '',
                ano: orcamento.ano,
                periodo: orcamento.periodo,
                dataInicio: orcamento.dataInicio ? new Date(orcamento.dataInicio) : undefined,
                dataFim: orcamento.dataFim ? new Date(orcamento.dataFim) : undefined,
                observacoes: orcamento.observacoes || '',
            });
        } else {
            // Reset para valores padrão
            setFormData({
                nome: '',
                descricao: '',
                ano: getCurrentYear(),
                periodo: 'anual',
                dataInicio: undefined,
                dataFim: undefined,
                observacoes: '',
            });
        }
    }, [orcamento, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validação básica
        if (!formData.nome.trim()) {
            toast.error('Nome é obrigatório');
            return;
        }
        if (!formData.dataInicio) {
            toast.error('Data de início é obrigatória');
            return;
        }
        if (!formData.dataFim) {
            toast.error('Data de fim é obrigatória');
            return;
        }
        if (formData.dataFim <= formData.dataInicio) {
            toast.error('Data de fim deve ser maior que data de início');
            return;
        }

        setIsLoading(true);

        try {
            if (isEditing && orcamento) {
                const dados: AtualizarOrcamentoDTO = {
                    nome: formData.nome,
                    descricao: formData.descricao || undefined,
                    dataInicio: format(formData.dataInicio, 'yyyy-MM-dd'),
                    dataFim: format(formData.dataFim, 'yyyy-MM-dd'),
                    observacoes: formData.observacoes || undefined,
                };

                const resultado = await actionAtualizarOrcamento(orcamento.id, dados);
                if (!resultado.success) {
                    throw new Error(resultado.error);
                }
                toast.success('Orçamento atualizado com sucesso');
            } else {
                const dados: CriarOrcamentoDTO = {
                    nome: formData.nome,
                    descricao: formData.descricao || undefined,
                    ano: formData.ano,
                    periodo: formData.periodo,
                    dataInicio: format(formData.dataInicio, 'yyyy-MM-dd'),
                    dataFim: format(formData.dataFim, 'yyyy-MM-dd'),
                    observacoes: formData.observacoes || undefined,
                };

                if (!usuarioId) {
                    throw new Error('Usuário não identificado para criar orçamento');
                }
                const resultado = await actionCriarOrcamento(dados, usuarioId);
                if (!resultado.success) {
                    throw new Error(resultado.error);
                }
                toast.success('Orçamento criado com sucesso');
            }

            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao salvar orçamento';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const yearOptions = React.useMemo(() => {
        const currentYear = getCurrentYear();
        const years: number[] = [];
        for (let y = currentYear + 2; y >= currentYear - 3; y--) {
            years.push(y);
        }
        return years;
    }, []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? 'Editar Orçamento' : 'Novo Orçamento'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? 'Atualize as informações do orçamento.'
                                : 'Preencha as informações para criar um novo orçamento.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Nome */}
                        <div className="grid gap-2">
                            <Label htmlFor="nome">Nome *</Label>
                            <Input
                                id="nome"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                placeholder="Ex: Orçamento Anual 2024"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Descrição */}
                        <div className="grid gap-2">
                            <Label htmlFor="descricao">Descrição</Label>
                            <Textarea
                                id="descricao"
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                placeholder="Descrição detalhada do orçamento"
                                rows={3}
                                disabled={isLoading}
                            />
                        </div>

                        {/* Ano e Período */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="ano">Ano *</Label>
                                <Select
                                    value={formData.ano.toString()}
                                    onValueChange={(value) => setFormData({ ...formData, ano: parseInt(value, 10) })}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="ano">
                                        <SelectValue placeholder="Selecione o ano" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {yearOptions.map((ano) => (
                                            <SelectItem key={ano} value={ano.toString()}>
                                                {ano}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="periodo">Período *</Label>
                                <Select
                                    value={formData.periodo}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, periodo: value as PeriodoOrcamento })
                                    }
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="periodo">
                                        <SelectValue placeholder="Selecione o período" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PERIODO_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Datas */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Data Início *</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'justify-start text-left font-normal',
                                                !formData.dataInicio && 'text-muted-foreground'
                                            )}
                                            disabled={isLoading}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.dataInicio
                                                ? format(formData.dataInicio, 'dd/MM/yyyy', { locale: ptBR })
                                                : 'Selecione'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formData.dataInicio}
                                            onSelect={(date) => setFormData({ ...formData, dataInicio: date })}
                                            locale={ptBR}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="grid gap-2">
                                <Label>Data Fim *</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'justify-start text-left font-normal',
                                                !formData.dataFim && 'text-muted-foreground'
                                            )}
                                            disabled={isLoading}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.dataFim
                                                ? format(formData.dataFim, 'dd/MM/yyyy', { locale: ptBR })
                                                : 'Selecione'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formData.dataFim}
                                            onSelect={(date) => setFormData({ ...formData, dataFim: date })}
                                            locale={ptBR}
                                            disabled={(date) =>
                                                formData.dataInicio ? date <= formData.dataInicio : false
                                            }
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Observações */}
                        <div className="grid gap-2">
                            <Label htmlFor="observacoes">Observações</Label>
                            <Textarea
                                id="observacoes"
                                value={formData.observacoes}
                                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                placeholder="Observações adicionais"
                                rows={2}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Orçamento'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
