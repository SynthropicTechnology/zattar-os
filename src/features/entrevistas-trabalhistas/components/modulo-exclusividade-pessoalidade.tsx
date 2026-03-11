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
import { Label } from '@/components/ui/label';
import {
  PROIBICAO_OUTROS_OPTIONS,
  DURACAO_RELACAO_OPTIONS,
} from '../domain';
import type {
  RespostasExclusividadePessoalidade,
  ProibicaoOutrosClientes,
  DuracaoRelacao,
} from '../domain';
import { OperadorAlert } from './operador-alert';

interface ModuloExclusividadePessoalidadeProps {
  data: RespostasExclusividadePessoalidade;
  onChange: (data: RespostasExclusividadePessoalidade) => void;
}

export function ModuloExclusividadePessoalidade({ data, onChange }: ModuloExclusividadePessoalidadeProps) {
  const forteIndicioVinculo = data.atende_exclusivamente === true && data.pode_enviar_substituto === false;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Só Você Serve</h3>
        <p className="text-sm text-muted-foreground">
          Avaliar exclusividade e pessoalidade — indícios fortes de vínculo disfarçado
        </p>
      </div>

      {/* C.3.1: Exclusividade */}
      <div className="space-y-3">
        <Label>Atendia exclusivamente esta empresa (não tinha outros clientes PJ)?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="exclus-sim"
              checked={data.atende_exclusivamente === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, atende_exclusivamente: checked === true })
              }
            />
            <Label htmlFor="exclus-sim" className="cursor-pointer text-sm font-normal">Sim, apenas esta empresa</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="exclus-nao"
              checked={data.atende_exclusivamente === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, atende_exclusivamente: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="exclus-nao" className="cursor-pointer text-sm font-normal">Não, tinha outros clientes</Label>
          </div>
        </div>
      </div>

      {/* C.3.2: Pessoalidade */}
      <div className="space-y-3">
        <Label>Poderia enviar outra pessoa no seu lugar para fazer o trabalho?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="substituto-sim"
              checked={data.pode_enviar_substituto === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, pode_enviar_substituto: checked === true })
              }
            />
            <Label htmlFor="substituto-sim" className="cursor-pointer text-sm font-normal">Sim, poderia mandar qualquer um</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="substituto-nao"
              checked={data.pode_enviar_substituto === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, pode_enviar_substituto: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="substituto-nao" className="cursor-pointer text-sm font-normal">Não, tinha que ser eu pessoalmente</Label>
          </div>
        </div>
      </div>

      {forteIndicioVinculo && (
        <OperadorAlert tipo="aviso">
          <strong>Exclusividade + pessoalidade = forte indício de vínculo!</strong> Se o trabalhador atendia apenas uma empresa e não podia se fazer substituir, a relação é de emprego, não de prestação de serviços. A jurisprudência do TST é consolidada nesse sentido.
        </OperadorAlert>
      )}

      {/* C.3.3: Proibição de outros clientes */}
      <div className="space-y-2">
        <Label htmlFor="proibicao">A empresa proibia (formal ou informalmente) que atendesse outros clientes?</Label>
        <Select
          value={data.proibicao_outros_clientes ?? ''}
          onValueChange={(v) => onChange({ ...data, proibicao_outros_clientes: v as ProibicaoOutrosClientes })}
        >
          <SelectTrigger id="proibicao">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {PROIBICAO_OUTROS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* C.3.4: Liberdade de recusar tarefas */}
      <div className="space-y-3">
        <Label>Tinha liberdade para recusar tarefas ou projetos da empresa?</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="recusar-sim"
              checked={data.liberdade_recusar_tarefas === true}
              onCheckedChange={(checked) =>
                onChange({ ...data, liberdade_recusar_tarefas: checked === true })
              }
            />
            <Label htmlFor="recusar-sim" className="cursor-pointer text-sm font-normal">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="recusar-nao"
              checked={data.liberdade_recusar_tarefas === false}
              onCheckedChange={(checked) =>
                onChange({ ...data, liberdade_recusar_tarefas: checked === true ? false : undefined })
              }
            />
            <Label htmlFor="recusar-nao" className="cursor-pointer text-sm font-normal">Não</Label>
          </div>
        </div>
      </div>

      {/* C.3.5: Duração da relação */}
      <div className="space-y-2">
        <Label htmlFor="duracao">Quanto tempo durou sua relação com esta empresa?</Label>
        <Select
          value={data.duracao_relacao ?? ''}
          onValueChange={(v) => onChange({ ...data, duracao_relacao: v as DuracaoRelacao })}
        >
          <SelectTrigger id="duracao">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {DURACAO_RELACAO_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(data.duracao_relacao === '1a_3a' || data.duracao_relacao === 'mais_3a') && (
          <OperadorAlert tipo="info">
            Relação de longa duração com um único tomador reforça a habitualidade (não-eventualidade), outro requisito do art. 3° CLT para reconhecimento de vínculo.
          </OperadorAlert>
        )}
      </div>
    </div>
  );
}
