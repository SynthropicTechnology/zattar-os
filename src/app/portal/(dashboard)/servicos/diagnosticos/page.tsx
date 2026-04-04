"use client";

import { ServiceIndexHeader, ServiceCard } from "@/app/portal/feature/servicos";
import { ClipboardCheck, Clock, BarChart3, Award, Scale } from "lucide-react";

export default function DiagnosticosIndex() {
  return (
    <>
      <ServiceIndexHeader
        eyebrow="Ferramentas de Analise"
        title="Diagnosticos"
        titleHighlight="Trabalhistas."
        description="Ferramentas interativas para analisar sua situacao trabalhista. Identifique direitos, prazos e oportunidades."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <ServiceCard
          title="Direitos na Demissao"
          description="Wizard interativo que analisa seu tipo de desligamento e identifica todos os direitos aplicaveis."
          href="/portal/servicos/diagnosticos/direitos-demissao"
          icon={ClipboardCheck}
        />
        <ServiceCard
          title="Verificador de Prazos"
          description="Verifique se ainda esta dentro do prazo para reclamar seus direitos trabalhistas."
          href="/portal/servicos/diagnosticos/verificador-prazos"
          icon={Clock}
        />
        <ServiceCard
          title="Analise de Jornada"
          description="Detecte horas extras nao pagas e intervalos suprimidos na sua jornada de trabalho."
          href="/portal/servicos/diagnosticos/analise-jornada"
          icon={BarChart3}
        />
        <ServiceCard
          title="Elegibilidade Beneficios"
          description="Verifique elegibilidade para seguro-desemprego, PIS/PASEP e saque FGTS."
          href="/portal/servicos/diagnosticos/elegibilidade-beneficios"
          icon={Award}
        />
        <ServiceCard
          title="Simulador de Acao"
          description="Estime o valor aproximado de uma reclamacao trabalhista com base nas suas verbas."
          href="/portal/servicos/diagnosticos/simulador-acao"
          icon={Scale}
        />
      </div>
    </>
  );
}
