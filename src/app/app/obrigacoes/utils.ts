
import { formatDate as formatDateDS } from "@/lib/design-system";
import { DirecaoPagamento, FormaPagamento, StatusAcordo, StatusRepasse, TipoObrigacao } from "./types";
import { TIPO_LABELS, DIRECAO_LABELS, STATUS_LABELS, FORMA_PAGAMENTO_LABELS } from "./domain";

export function formatarTipo(tipo: TipoObrigacao): string {
  return TIPO_LABELS[tipo] || tipo;
}

export function formatarDirecao(direcao: DirecaoPagamento): string {
  return DIRECAO_LABELS[direcao] || direcao;
}

export function formatarStatus(status: StatusAcordo): string {
  return STATUS_LABELS[status] || status;
}

export function formatarFormaPagamento(forma: FormaPagamento | null): string {
  if (!forma) return '-';
  return FORMA_PAGAMENTO_LABELS[forma] || forma;
}

export function formatarStatusRepasse(status: StatusRepasse): string {
  const map: Record<StatusRepasse, string> = {
    nao_aplicavel: 'N/A',
    pendente_declaracao: 'Declaração Pendente',
    pendente_transferencia: 'Repasse Pendente',
    repassado: 'Repassado'
  };
  return map[status] || status;
}

export function getTipoColorClass(tipo: TipoObrigacao): string {
  switch (tipo) {
    case 'acordo': return 'bg-blue-100/50 text-blue-600';
    case 'condenacao': return 'bg-red-100/50 text-red-600';
    case 'custas_processuais': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function getDirecaoColorClass(direcao: DirecaoPagamento): string {
  return direcao === 'recebimento' ? 'text-green-600' : 'text-red-600';
}

export function getStatusColorClass(status: StatusAcordo): string {
  switch (status) {
    case 'pendente': return 'bg-orange-100/50 text-orange-600';
    case 'pago_parcial': return 'bg-orange-100/50 text-orange-600';
    case 'pago_total': return 'bg-green-100/50 text-green-600';
    case 'atrasado': return 'bg-red-100/50 text-red-600';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function calcularDataVencimento(dataBase: string | Date, numeroParcela: number, intervalo: number = 30): string {
  // Converter dataBase para Date se for string
  let data: Date;
  if (typeof dataBase === 'string') {
    const [ano, mes, dia] = dataBase.split('-').map(Number);
    data = new Date(ano, mes - 1, dia);
  } else {
    data = new Date(dataBase);
  }

  // dataBase is assumed to be the date of the first installment (numeroParcela 1)
  // Logic: parcela 1 = dataBase, parcela 2 = dataBase + intervalo, etc.
  const diasAdicionar = (numeroParcela - 1) * intervalo;

  // Adicionar dias
  data.setDate(data.getDate() + diasAdicionar);

  const yyyy = data.getFullYear();
  const mm = String(data.getMonth() + 1).padStart(2, '0');
  const dd = String(data.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

export function calcularValorParcela(
  valorTotal: number, 
  numeroParcelas: number, 
  indiceZeroBased: number
): number {
  const valorBase = valorTotal / numeroParcelas;
  
  if (indiceZeroBased === numeroParcelas - 1) {
    // Última parcela absorve diferença de arredondamento
    const somaAnteriores = parseFloat((valorBase * (numeroParcelas - 1)).toFixed(2));
    const resto = valorTotal - somaAnteriores;
    return parseFloat(resto.toFixed(2));
  }
  
  return parseFloat(valorBase.toFixed(2));
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateISO: string | Date | null | undefined): string => {
  return formatDateDS(dateISO);
};

/**
 * Normaliza um CPF removendo pontuação e validando formato
 */
export function normalizarCPF(cpf: string): string {
  if (!cpf) return '';

  // Remove tudo que não é dígito
  const apenasDigitos = cpf.replace(/\D/g, '');

  // Valida se tem 11 dígitos
  if (apenasDigitos.length !== 11) {
    throw new Error('CPF deve conter 11 dígitos');
  }

  // Valida se não são todos dígitos iguais
  if (/^(\d)\1+$/.test(apenasDigitos)) {
    throw new Error('CPF inválido');
  }

  return apenasDigitos;
}

/**
 * Valida se o percentual do escritório está entre 0 e 100
 */
export function validarPercentualEscritorio(percentual: number): boolean {
  if (typeof percentual !== 'number') return false;
  if (isNaN(percentual)) return false;
  if (percentual < 0 || percentual > 100) return false;
  return true;
}
