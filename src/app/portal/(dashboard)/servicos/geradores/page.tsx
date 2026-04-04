"use client";

import { ServiceIndexHeader, ServiceCard } from "@/app/portal/feature/servicos";
import { FileText, AlertOctagon, Scale, FileCheck, Receipt } from "lucide-react";

export default function GeradoresIndex() {
  return (
    <>
      <ServiceIndexHeader
        eyebrow="Documentos com IA"
        title="Geradores de"
        titleHighlight="Documentos."
        description="Gere documentos trabalhistas prontos para uso. Todos os modelos seguem as melhores praticas juridicas e podem ser baixados em PDF."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <ServiceCard
          title="Carta de Demissao"
          description="Carta formal de pedido de demissao com opcao de cumprimento de aviso previo."
          href="/portal/servicos/geradores/carta-demissao"
          icon={FileText}
        />
        <ServiceCard
          title="Notificacao Extrajudicial"
          description="Notificacao formal ao empregador sobre irregularidades trabalhistas."
          href="/portal/servicos/geradores/notificacao-extrajudicial"
          icon={AlertOctagon}
        />
        <ServiceCard
          title="Declaracao de Hipossuficiencia"
          description="Declaracao para solicitar justica gratuita em acoes trabalhistas."
          href="/portal/servicos/geradores/declaracao-hipossuficiencia"
          icon={FileCheck}
        />
        <ServiceCard
          title="Acordo Extrajudicial"
          description="Minuta de acordo extrajudicial (Art. 855-B CLT) para homologacao."
          href="/portal/servicos/geradores/acordo-extrajudicial"
          icon={Scale}
        />
        <ServiceCard
          title="Holerite"
          description="Recibo de pagamento detalhado com calculo automatico de INSS e IRRF."
          href="/portal/servicos/geradores/holerite"
          icon={Receipt}
        />
      </div>
    </>
  );
}
