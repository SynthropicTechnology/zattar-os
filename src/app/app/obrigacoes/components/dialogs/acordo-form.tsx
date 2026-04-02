
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';
import { actionCriarAcordoComParcelas, actionAtualizarAcordo } from '../../actions/acordos';
import {
  CriarAcordoComParcelasParams,
  TipoObrigacao,
  DirecaoPagamento,
  FormaDistribuicao,
  FormaPagamento,
  Parcela
} from '../../types';

interface AcordoFormProps {
  processoId?: number;
  acordoId?: number;
  initialData?: Partial<CriarAcordoComParcelasParams> & { id?: number };
  /**
   * Callback executado após criação/edição bem-sucedida
   * @param data - Objeto contendo: { id, acordo, parcelas }
   *               - id: ID do acordo na raiz para facilitar navegação
   *               - acordo: Objeto completo do acordo
   *               - parcelas: Array de parcelas (apenas na criação)
   */
  onSuccess?: (data?: { id: number; acordo?: unknown; parcelas?: Parcela[] }) => void;
  onCancel?: () => void;
}

export function AcordoForm({
  processoId,
  acordoId,
  initialData,
  onSuccess,
  onCancel,
}: AcordoFormProps) {
  const isEditMode = !!acordoId;

  const [tipo, setTipo] = useState<TipoObrigacao | ''>(initialData?.tipo || '');
  const [direcao, setDirecao] = useState<DirecaoPagamento | ''>(initialData?.direcao || '');
  const [valorTotal, setValorTotal] = useState<string>(initialData?.valorTotal?.toString() || '');
  const [dataVencimento, setDataVencimento] = useState<string>(initialData?.dataVencimentoPrimeiraParcela || '');
  const [numeroParcelas, setNumeroParcelas] = useState<number>(initialData?.numeroParcelas || 1);
  const [formaDistribuicao, setFormaDistribuicao] = useState<FormaDistribuicao | ''>(initialData?.formaDistribuicao || '');
  const [percentualEscritorio, setPercentualEscritorio] = useState<number>(initialData?.percentualEscritorio || 30);
  const [honorariosSucumbenciais, setHonorariosSucumbenciais] = useState<string>(initialData?.honorariosSucumbenciaisTotal?.toString() || '0');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | ''>(initialData?.formaPagamentoPadrao || '');
  const [intervaloEntreParcelas, setIntervaloEntreParcelas] = useState<number>(initialData?.intervaloEntreParcelas || 30);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean | null; error?: string }>({ success: null });

  useEffect(() => {
    if (tipo === 'custas_processuais') {
      setDirecao('pagamento');
      setNumeroParcelas(1);
      setFormaDistribuicao('');
    }
    if (direcao === 'pagamento') setFormaDistribuicao('');
  }, [tipo, direcao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult({ success: null });

    // Client-side validations
    if (!tipo || !direcao || !valorTotal || !dataVencimento || !formaPagamento) {
      setResult({ success: false, error: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    setIsLoading(true);

    try {
      let response;
      if (isEditMode && acordoId) {
        response = await actionAtualizarAcordo(acordoId, {
          valorTotal: parseFloat(valorTotal),
          dataVencimentoPrimeiraParcela: dataVencimento,
          percentualEscritorio,
          honorariosSucumbenciaisTotal: parseFloat(honorariosSucumbenciais),
          formaDistribuicao: formaDistribuicao || null
        });
      } else {
        response = await actionCriarAcordoComParcelas({
          processoId: processoId || initialData?.processoId || 0,
          tipo: tipo as TipoObrigacao,
          direcao: direcao as DirecaoPagamento,
          valorTotal: parseFloat(valorTotal),
          dataVencimentoPrimeiraParcela: dataVencimento,
          numeroParcelas,
          formaDistribuicao: formaDistribuicao || null,
          percentualEscritorio,
          honorariosSucumbenciaisTotal: parseFloat(honorariosSucumbenciais),
          formaPagamentoPadrao: formaPagamento as FormaPagamento,
          intervaloEntreParcelas
        });
      }

      if (response.success && response.data) {
        setResult({ success: true });
        if (onSuccess) setTimeout(() => onSuccess(response.data!), 1500);
      } else {
        setResult({ success: false, error: response.error });
      }
    } catch {
      setResult({ success: false, error: 'Erro inesperado.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {result.success !== null && (
        <Alert variant={result.success ? 'default' : 'destructive'}>
          {result.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertDescription>
            {result.success
              ? (isEditMode ? 'Atualizado com sucesso!' : 'Criado com sucesso!')
              : result.error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo *</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as TipoObrigacao)} disabled={isEditMode}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="acordo">Acordo</SelectItem>
              <SelectItem value="condenacao">Condenação</SelectItem>
              <SelectItem value="custas_processuais">Custas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Direção *</Label>
          <Select value={direcao} onValueChange={(v) => setDirecao(v as DirecaoPagamento)} disabled={isEditMode || tipo === 'custas_processuais'}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recebimento">Recebimento</SelectItem>
              <SelectItem value="pagamento">Pagamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Valor Total (R$) *</Label>
          <Input type="number" step="0.01" value={valorTotal} onChange={e => setValorTotal(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Data Vencimento (1ª) *</Label>
          <FormDatePicker
            value={dataVencimento}
            onChange={d => setDataVencimento(d || '')}
          />
        </div>
      </div>

      {!isEditMode && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Parcelas *</Label>
            <Input type="number" min="1" value={numeroParcelas} onChange={e => setNumeroParcelas(Number(e.target.value))} disabled={tipo === 'custas_processuais'} />
          </div>
          <div className="space-y-2">
            <Label>Intervalo (dias)</Label>
            <Input type="number" min="1" value={intervaloEntreParcelas} onChange={e => setIntervaloEntreParcelas(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Pagamento *</Label>
            <Select value={formaPagamento} onValueChange={v => setFormaPagamento(v as FormaPagamento)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="transferencia_direta">Transferência</SelectItem>
                <SelectItem value="deposito_judicial">Depósito Judicial</SelectItem>
                <SelectItem value="deposito_recursal">Depósito Recursal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {direcao === 'recebimento' && tipo !== 'custas_processuais' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Distribuição *</Label>
            <Select value={formaDistribuicao} onValueChange={v => setFormaDistribuicao(v as FormaDistribuicao)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="integral">Integral</SelectItem>
                <SelectItem value="dividido">Dividido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Perc. Escritório (%)</Label>
            <Input type="number" min="0" max="100" value={percentualEscritorio} onChange={e => setPercentualEscritorio(Number(e.target.value))} />
          </div>
        </div>
      )}

      {tipo !== 'custas_processuais' && (
        <div className="space-y-2">
          <Label>Honorários Sucumbenciais (R$)</Label>
          <Input type="number" step="0.01" value={honorariosSucumbenciais} onChange={e => setHonorariosSucumbenciais(e.target.value)} />
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
}
