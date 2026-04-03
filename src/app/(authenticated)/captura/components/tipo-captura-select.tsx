'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Database, Archive, Calendar, AlertCircle, FileText, Users, Layers, Microscope } from 'lucide-react';
import { TipoCaptura } from '@/app/(authenticated)/captura/types';

interface TipoCapturaSelectProps {
  value: TipoCaptura;
  onValueChange: (value: TipoCaptura) => void;
  disabled?: boolean;
  /**
   * Filtrar apenas tipos agendáveis (acervo-geral, arquivados, audiencias, pendentes)
   * @default false
   */
  apenasAgendaveis?: boolean;
}

const tiposCaptura = [
  {
    value: 'acervo_geral' as TipoCaptura,
    label: 'Acervo Geral',
    description: 'Capturar processos ativos do acervo',
    icon: Database,
  },
  {
    value: 'arquivados' as TipoCaptura,
    label: 'Arquivados',
    description: 'Capturar processos arquivados',
    icon: Archive,
  },
  {
    value: 'audiencias' as TipoCaptura,
    label: 'Audiências',
    description: 'Capturar audiências agendadas',
    icon: Calendar,
  },
  {
    value: 'pendentes' as TipoCaptura,
    label: 'Expedientes',
    description: 'Capturar pendências de manifestação',
    icon: AlertCircle,
  },
  {
    value: 'pericias' as TipoCaptura,
    label: 'Perícias',
    description: 'Capturar perícias judiciais',
    icon: Microscope,
  },
  {
    value: 'timeline' as TipoCaptura,
    label: 'Timeline do Processo',
    description: 'Capturar movimentos e documentos do processo',
    icon: FileText,
  },
  {
    value: 'partes' as TipoCaptura,
    label: 'Partes do Processo',
    description: 'Capturar partes, representantes e vínculos',
    icon: Users,
  },
  {
    value: 'combinada' as TipoCaptura,
    label: 'Captura Unificada',
    description: 'Captura completa: audiências, expedientes, processos, partes e timeline',
    icon: Layers,
  },
];

export function TipoCapturaSelect({
  value,
  onValueChange,
  disabled,
  apenasAgendaveis = false,
}: TipoCapturaSelectProps) {
  // Filtrar tipos agendáveis se necessário
  const tiposAgendaveis: TipoCaptura[] = ['acervo_geral', 'arquivados', 'audiencias', 'pendentes', 'pericias', 'combinada'];
  const tiposFiltrados = apenasAgendaveis
    ? tiposCaptura.filter((tipo) => tiposAgendaveis.includes(tipo.value))
    : tiposCaptura;

  const selectedTipo = tiposFiltrados.find((tipo) => tipo.value === value);
  const Icon = selectedTipo?.icon || Database;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span>{selectedTipo?.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {tiposFiltrados.map((tipo) => {
          const TipoIcon = tipo.icon;
          return (
            <SelectItem key={tipo.value} value={tipo.value}>
              <div className="flex items-center gap-3">
                <TipoIcon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{tipo.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {tipo.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export { tiposCaptura };
