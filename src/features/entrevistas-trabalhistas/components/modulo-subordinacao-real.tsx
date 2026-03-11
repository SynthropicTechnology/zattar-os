'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LOCAL_TRABALHO_OPTIONS } from '../domain';
import type { RespostasSubordinacaoReal, LocalTrabalho } from '../domain';
import { OperadorAlert } from './operador-alert';

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
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="horario-sim"
              checked={data.cumpre_horario_fixo === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, cumpre_horario_fixo: checked === true })
              }
            />
            <Label htmlFor="horario-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="horario-nao"
              checked={data.cumpre_horario_fixo === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, cumpre_horario_fixo: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="horario-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
      </div>

      {/* C.2.2: Ordens de superior */}
      <div className="space-y-3">
        <Label>Recebia ordens de um superior/gestor na empresa?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="ordens-sim"
              checked={data.recebe_ordens_superior === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, recebe_ordens_superior: checked === true })
              }
            />
            <Label htmlFor="ordens-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="ordens-nao"
              checked={data.recebe_ordens_superior === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, recebe_ordens_superior: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="ordens-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
      </div>

      {/* C.2.3: Reuniões obrigatórias */}
      <div className="space-y-3">
        <Label>Participava de reuniões obrigatórias da empresa?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="reuniao-sim"
              checked={data.reunioes_obrigatorias === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, reunioes_obrigatorias: checked === true })
              }
            />
            <Label htmlFor="reuniao-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="reuniao-nao"
              checked={data.reunioes_obrigatorias === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, reunioes_obrigatorias: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="reuniao-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
      </div>

      {temSubordinacao && (
        <OperadorAlert tipo="aviso">
          <strong>Forte indício de vínculo!</strong> Os elementos do art. 3° da CLT (subordinação, habitualidade, pessoalidade e onerosidade) estão sendo indicados. O contrato PJ pode ser declarado nulo (art. 9° CLT).
        </OperadorAlert>
      )}

      {/* C.2.4: Autorização para faltar */}
      <div className="space-y-3">
        <Label>Tinha que pedir autorização para faltar ou tirar folga?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="falta-sim"
              checked={data.pede_autorizacao_falta === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, pede_autorizacao_falta: checked === true })
              }
            />
            <Label htmlFor="falta-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="falta-nao"
              checked={data.pede_autorizacao_falta === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, pede_autorizacao_falta: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="falta-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
      </div>

      {/* C.2.5: Crachá/e-mail/uniforme */}
      <div className="space-y-3">
        <Label>Usava crachá, e-mail corporativo ou uniforme da empresa?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="cracha-sim"
              checked={data.usa_cracha_email_uniforme === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, usa_cracha_email_uniforme: checked === true })
              }
            />
            <Label htmlFor="cracha-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="cracha-nao"
              checked={data.usa_cracha_email_uniforme === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, usa_cracha_email_uniforme: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="cracha-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
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
