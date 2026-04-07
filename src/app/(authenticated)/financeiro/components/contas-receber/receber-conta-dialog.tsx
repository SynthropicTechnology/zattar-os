'use client';

/**
 * Dialog para Recebimento de Conta a Receber
 */

import * as React from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, CreditCard, Building2, AlertCircle, Upload, X, FileText, Loader2 } from 'lucide-react';
import { actionUploadComprovante } from '../../actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { actionAtualizarLancamento } from '../../actions/lancamentos';
import type {
  ContaReceberComDetalhes,
  FormaRecebimentoContaReceber,
  AnexoLancamento,
  Lancamento,
} from '../../types/lancamentos';
import {
  COMPROVANTE_ALLOWED_MIME_TYPES,
  COMPROVANTE_MAX_SIZE_BYTES,
  COMPROVANTE_INVALID_TYPE_MESSAGE,
  COMPROVANTE_SIZE_EXCEEDED_MESSAGE,
  COMPROVANTE_HELP_TEXT,
} from '@/lib/constants/comprovante-validation';

interface ReceberContaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: ContaReceberComDetalhes | null;
  contasBancarias: Array<{ id: number; nome: string; banco?: string | null }>;
  onSuccess: () => void;
}

const FORMAS_RECEBIMENTO: Array<{ value: FormaRecebimentoContaReceber; label: string }> = [
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia_bancaria', label: 'Transferência Bancária' },
  { value: 'ted', label: 'TED' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'deposito_judicial', label: 'Depósito Judicial' },
];

/**
 * Formata valor em reais
 */
const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};


export function ReceberContaDialog({
  open,
  onOpenChange,
  conta,
  contasBancarias,
  onSuccess,
}: ReceberContaDialogProps) {
  const [formaRecebimento, setFormaRecebimento] = React.useState<FormaRecebimentoContaReceber | ''>('');
  const [contaBancariaId, setContaBancariaId] = React.useState<string>('');
  const [dataEfetivacao, setDataEfetivacao] = React.useState<Date | undefined>(new Date());
  const [observacoes, setObservacoes] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Estados para comprovante
  const [comprovanteFile, setComprovanteFile] = React.useState<File | null>(null);
  const [comprovanteUploading, setComprovanteUploading] = React.useState(false);
  const [comprovanteError, setComprovanteError] = React.useState<string | null>(null);

  // Reset form quando dialog abre
  React.useEffect(() => {
    if (open) {
      setFormaRecebimento('');
      setContaBancariaId('');
      setDataEfetivacao(new Date());
      setObservacoes('');
      setComprovanteFile(null);
      setComprovanteError(null);
    }
  }, [open]);

  /**
   * Valida o arquivo de comprovante
   */
  const validateComprovanteFile = (file: File): string | null => {
    if (!COMPROVANTE_ALLOWED_MIME_TYPES.includes(file.type as typeof COMPROVANTE_ALLOWED_MIME_TYPES[number])) {
      return COMPROVANTE_INVALID_TYPE_MESSAGE;
    }
    if (file.size > COMPROVANTE_MAX_SIZE_BYTES) {
      return COMPROVANTE_SIZE_EXCEEDED_MESSAGE;
    }
    return null;
  };

  /**
   * Faz upload do comprovante via server action
   */
  const uploadComprovante = async (file: File): Promise<AnexoLancamento | null> => {
    setComprovanteUploading(true);
    setComprovanteError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pasta', 'comprovantes-recebimento');

      const result = await actionUploadComprovante(formData);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao fazer upload');
      }

      return result.data || null;
    } catch (error) {
      console.error('Erro ao fazer upload do comprovante:', error);
      setComprovanteError(error instanceof Error ? error.message : 'Erro ao fazer upload do comprovante');
      return null;
    } finally {
      setComprovanteUploading(false);
    }
  };

  /**
   * Handler para seleção de arquivo
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateComprovanteFile(file);
    if (validationError) {
      setComprovanteError(validationError);
      return;
    }

    setComprovanteFile(file);
    setComprovanteError(null);
    e.target.value = ''; // Reset input
  };

  /**
   * Remove o arquivo selecionado
   */
  const handleRemoveFile = () => {
    setComprovanteFile(null);
    setComprovanteError(null);
  };

  /**
   * Formata tamanho de arquivo
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!conta || !formaRecebimento || !contaBancariaId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload do comprovante se houver
      let comprovante: AnexoLancamento | undefined;
      if (comprovanteFile) {
        const uploadedComprovante = await uploadComprovante(comprovanteFile);
        if (uploadedComprovante) {
          comprovante = uploadedComprovante;
        }
        // Se houver erro no upload, não continua
        if (comprovanteError) {
          setIsSubmitting(false);
          return;
        }
      }

      // Preparar payload de atualização
      const payload: Partial<Lancamento> = {
        status: 'confirmado',
        formaPagamento: formaRecebimento,
        contaBancariaId: parseInt(contaBancariaId, 10),
        dataEfetivacao: dataEfetivacao?.toISOString(),
        observacoes: observacoes.trim() || undefined,
      };

      if (comprovante) {
        payload.anexos = [...(conta.anexos || []), comprovante];
      }

      const resultado = await actionAtualizarLancamento(conta.id, payload);

      if (!resultado.success) {
        throw new Error(resultado.error || 'Erro ao confirmar recebimento');
      }

      toast.success('Recebimento confirmado com sucesso!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao confirmar recebimento';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!conta) {
    return null;
  }

  const isVencida = conta.dataVencimento && new Date(conta.dataVencimento) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Confirmar Recebimento
            </DialogTitle>
            <DialogDescription>
              Confirme os dados do recebimento para esta conta a receber.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Resumo da conta */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{conta.descricao}</p>
                  {conta.cliente && (
                    <p className="text-xs text-muted-foreground">
                      {conta.cliente.nomeFantasia || conta.cliente.razaoSocial}
                    </p>
                  )}
                  {conta.contrato && (
                    <p className="text-xs text-muted-foreground">
                      Contrato: {conta.contrato.numero}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-success">{formatarValor(conta.valor)}</p>
                  {conta.dataVencimento && (
                    <p className={cn('text-xs', isVencida ? 'text-destructive' : 'text-muted-foreground')}>
                      Venc: {format(new Date(conta.dataVencimento), 'dd/MM/yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isVencida && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Esta conta está vencida. O recebimento será registrado com a data selecionada abaixo.
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Forma de Recebimento */}
            <div className="space-y-2">
              <Label htmlFor="formaRecebimento">
                Forma de Recebimento <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formaRecebimento}
                onValueChange={(value) => setFormaRecebimento(value as FormaRecebimentoContaReceber)}
              >
                <SelectTrigger id="formaRecebimento">
                  <SelectValue placeholder="Selecione a forma de recebimento" />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_RECEBIMENTO.map((forma) => (
                    <SelectItem key={forma.value} value={forma.value}>
                      {forma.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conta Bancária */}
            <div className="space-y-2">
              <Label htmlFor="contaBancaria">
                Conta Bancária <span className="text-destructive">*</span>
              </Label>
              <Select value={contaBancariaId} onValueChange={setContaBancariaId}>
                <SelectTrigger id="contaBancaria">
                  <SelectValue placeholder="Selecione a conta bancária" />
                </SelectTrigger>
                <SelectContent>
                  {contasBancarias.map((cb) => (
                    <SelectItem key={cb.id} value={cb.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {cb.nome}
                        {cb.banco && (
                          <span className="text-xs text-muted-foreground">({cb.banco})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data de Efetivação */}
            <div className="space-y-2">
              <Label>Data de Efetivação</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dataEfetivacao && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataEfetivacao
                      ? format(dataEfetivacao, 'dd/MM/yyyy', { locale: ptBR })
                      : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataEfetivacao}
                    onSelect={setDataEfetivacao}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações sobre o recebimento..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Comprovante de Recebimento */}
            <div className="space-y-2">
              <Label htmlFor="comprovante">Comprovante de Recebimento</Label>

              {comprovanteFile ? (
                <div className="flex items-center justify-between rounded-md border bg-muted/50 p-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="overflow-hidden">
                      <p className="truncate text-sm font-medium">{comprovanteFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(comprovanteFile.size)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon" aria-label="Remover arquivo"
                    className="h-8 w-8 shrink-0"
                    onClick={handleRemoveFile}
                    disabled={comprovanteUploading}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remover arquivo</span>
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    id="comprovante"
                    accept={COMPROVANTE_ALLOWED_MIME_TYPES.join(',')}
                    onChange={handleFileSelect}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    disabled={comprovanteUploading}
                    aria-label="Anexar comprovante de recebimento"
                    title="Anexar comprovante de recebimento"
                    aria-describedby="comprovante-help"
                  />
                  <div className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    {comprovanteUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Clique para anexar comprovante</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {comprovanteError && (
                <p className="text-xs text-destructive">{comprovanteError}</p>
              )}

              <p id="comprovante-help" className="text-xs text-muted-foreground">
                {COMPROVANTE_HELP_TEXT}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formaRecebimento || !contaBancariaId}
            >
              {isSubmitting ? 'Processando...' : 'Confirmar Recebimento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
