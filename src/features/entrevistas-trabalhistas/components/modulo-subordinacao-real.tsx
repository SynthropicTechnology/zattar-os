'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LOCAL_TRABALHO_OPTIONS } from '../domain';
import type { RespostasSubordinacaoReal, LocalTrabalho } from '../domain';
import { OperadorAlert } from './operador-alert';
import { SimNaoRadio } from './sim-nao-radio';

interface ModuloSubordinacaoRealProps {
  data: RespostasSubordinacaoReal;
  onChange: (data: RespostasSubordinacaoReal) => void;
}

export function ModuloSubordinacaoReal({ data, onChange }: ModuloSubordinacaoRealProps) {
  const temSubordinacao = data.cumpre_horario_fixo === true ||
    data.recebe_ordens_superior === true ||
    data.reunioes_obrigatorias === true;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">CLT Disfarçada</h3>
        <p className="text-sm text-muted-foreground">
          Investigar se havia subordinação real típica de emprego, mesmo com contrato PJ
        </p>
      </div>

      {/* C.2.1: Horário fixo */}
      <div className="space-y-3">
        <Label>Cumpria horário fixo definido pela empresa?</Label>
        <SimNaoRadio
          id="cumpre-horario"
          value={data.cumpre_horario_fixo}
          onValueChange={(value) => onChange({ ...data, cumpre_horario_fixo: value })}
        />
      </div>

      {/* C.2.2: Ordens de superior */}
      <div className="space-y-3">
        <Label>Recebia ordens de um superior/gestor na empresa?</Label>
        <SimNaoRadio
          id="recebe-ordens"
          value={data.recebe_ordens_superior}
          onValueChange={(value) => onChange({ ...data, recebe_ordens_superior: value })}
        />
      </div>

      {/* C.2.3: Reuniões obrigatórias */}
      <div className="space-y-3">
        <Label>Participava de reuniões obrigatórias da empresa?</Label>
        <SimNaoRadio
          id="reunioes-obrigatorias"
          value={data.reunioes_obrigatorias}
          onValueChange={(value) => onChange({ ...data, reunioes_obrigatorias: value })}
        />
      </div>

      {temSubordinacao && (
        <OperadorAlert tipo="aviso">
          <strong>Forte indício de vínculo!</strong> Os elementos do art. 3° da CLT (subordinação, habitualidade, pessoalidade e onerosidade) estão sendo indicados. O contrato PJ pode ser declarado nulo (art. 9° CLT).
        </OperadorAlert>
      )}

      {/* C.2.4: Autorização para faltar */}
      <div className="space-y-3">
        <Label>Tinha que pedir autorização para faltar ou tirar folga?</Label>
        <SimNaoRadio
          id="autorizacao-falta"
          value={data.pede_autorizacao_falta}
          onValueChange={(value) => onChange({ ...data, pede_autorizacao_falta: value })}
        />
      </div>

      {/* C.2.5: Crachá/e-mail/uniforme */}
      <div className="space-y-3">
        <Label>Usava crachá, e-mail corporativo ou uniforme da empresa?</Label>
        <SimNaoRadio
          id="cracha-email-uniforme"
          value={data.usa_cracha_email_uniforme}
          onValueChange={(value) => onChange({ ...data, usa_cracha_email_uniforme: value })}
        />
      </div>

      {/* C.2.6: Local de trabalho */}
      <div className="space-y-2">
        <Label htmlFor="local-trabalho">Onde realizava o trabalho?</Label>
        <Select
          value={data.local_trabalho ?? ''}
          onValueChange={(v) => onChange({ ...data, local_trabalho: v as LocalTrabalho })}
        >
          <SelectTrigger id="local-trabalho">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {LOCAL_TRABALHO_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* C.2.7: Narrativa */}
      <div className="space-y-2">
        <Label htmlFor="narrativa-rotina">Descreva como era sua rotina de trabalho na empresa</Label>
        <Textarea
          id="narrativa-rotina"
          placeholder="Narre o dia a dia: a que horas chegava, quem dava ordens, como eram as cobranças, se batia ponto..."
          value={data.narrativa_rotina ?? ''}
          onChange={(e) => onChange({ ...data, narrativa_rotina: e.target.value })}
          rows={5}
        />
        <OperadorAlert tipo="info">
          Solicite prints de e-mails corporativos, mensagens de WhatsApp com ordens do gestor, fotos do crachá/uniforme. Esses são os melhores elementos probatórios de subordinação real.
        </OperadorAlert>
      </div>
    </div>
  );
}
