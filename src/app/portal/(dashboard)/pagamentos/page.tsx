import { EditorialHeader } from "@/app/website";
import type { ReactNode } from "react";
import { CreditCard, Landmark, Smartphone, Receipt } from "lucide-react";

interface Pagamento {
  id: string;
  descricao: string;
  data: string;
  valor: number;
  status: "Confirmado" | "Pendente";
  metodo: "Pix" | "Boleto" | "Cartão" | "Transferência";
}

const mockPagamentos: Pagamento[] = [
  {
    id: "1",
    descricao: "Honorários — Processo 0012345-67",
    data: "18 Mar 2026",
    valor: 3500.0,
    status: "Confirmado",
    metodo: "Pix",
  },
  {
    id: "2",
    descricao: "Custas Processuais — Foro Central",
    data: "10 Mar 2026",
    valor: 420.5,
    status: "Confirmado",
    metodo: "Boleto",
  },
  {
    id: "3",
    descricao: "Honorários — Processo 0098765-43",
    data: "28 Mar 2026",
    valor: 5200.0,
    status: "Pendente",
    metodo: "Transferência",
  },
  {
    id: "4",
    descricao: "Perícia Técnica — Laudo de Avaliação",
    data: "05 Abr 2026",
    valor: 1800.0,
    status: "Pendente",
    metodo: "Boleto",
  },
  {
    id: "5",
    descricao: "Retainer Mensal — Março 2026",
    data: "01 Mar 2026",
    valor: 2000.0,
    status: "Confirmado",
    metodo: "Cartão",
  },
  {
    id: "6",
    descricao: "Retainer Mensal — Fevereiro 2026",
    data: "01 Fev 2026",
    valor: 2000.0,
    status: "Confirmado",
    metodo: "Cartão",
  },
];

const statusConfig = {
  Confirmado: {
    className: "bg-emerald-500/10 text-emerald-400",
  },
  Pendente: {
    className: "bg-amber-500/10 text-amber-500",
  },
} satisfies Record<Pagamento["status"], { className: string }>;

const metodoIcon: Record<Pagamento["metodo"], ReactNode> = {
  Pix: <Smartphone className="w-4 h-4" />,
  Boleto: <Receipt className="w-4 h-4" />,
  Cartão: <CreditCard className="w-4 h-4" />,
  Transferência: <Landmark className="w-4 h-4" />,
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function PagamentosPage() {
  return (
    <>
      <EditorialHeader kicker="PAGAMENTOS" title="Pagamentos." />

      <div className="bg-surface-container rounded-xl border border-white/5 overflow-hidden">
        {/* Table header */}
        <div className="bg-surface-container-low px-6 py-3 grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center border-b border-white/5">
          <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase">
            Descrição
          </span>
          <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase w-28 text-right">
            Data
          </span>
          <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase w-32 text-right">
            Valor
          </span>
          <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase w-28 text-center">
            Método
          </span>
          <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase w-24 text-center">
            Status
          </span>
        </div>

        {/* Table rows */}
        <div className="divide-y divide-white/5">
          {mockPagamentos.map((pagamento) => {
            const status = statusConfig[pagamento.status];
            return (
              <div
                key={pagamento.id}
                className="px-6 py-4 grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center hover:bg-white/5 transition-colors"
              >
                <p className="text-sm font-medium text-on-surface truncate">
                  {pagamento.descricao}
                </p>

                <p className="text-sm text-on-surface-variant w-28 text-right shrink-0">
                  {pagamento.data}
                </p>

                <p className="text-sm font-semibold text-on-surface w-32 text-right shrink-0 tabular-nums">
                  {formatCurrency(pagamento.valor)}
                </p>

                <div className="w-28 flex items-center justify-center gap-1.5 shrink-0">
                  <span className="text-on-surface-variant">
                    {metodoIcon[pagamento.metodo]}
                  </span>
                  <span className="text-sm text-on-surface-variant">
                    {pagamento.metodo}
                  </span>
                </div>

                <div className="w-24 flex justify-center shrink-0">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${status.className}`}
                  >
                    {pagamento.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer summary */}
        <div className="bg-surface-container-low px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">
            {mockPagamentos.length} registros encontrados
          </p>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-on-surface-variant">Confirmado</p>
              <p className="text-sm font-semibold text-emerald-400 tabular-nums">
                {formatCurrency(
                  mockPagamentos
                    .filter((p) => p.status === "Confirmado")
                    .reduce((acc, p) => acc + p.valor, 0)
                )}
              </p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-right">
              <p className="text-xs text-on-surface-variant">Pendente</p>
              <p className="text-sm font-semibold text-amber-500 tabular-nums">
                {formatCurrency(
                  mockPagamentos
                    .filter((p) => p.status === "Pendente")
                    .reduce((acc, p) => acc + p.valor, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
