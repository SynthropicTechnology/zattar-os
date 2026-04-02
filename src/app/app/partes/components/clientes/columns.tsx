'use client';

import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import type { Cliente, ProcessoRelacionado } from '../../types';
import { ProcessosRelacionadosCell, CopyButton, MapButton, ContatoCell } from '../shared';
import {
  formatarCpf,

  formatarCnpj,
  formatarNome,
  formatarEnderecoCompleto,
  calcularIdade,
} from '../../utils';

// Types
type ClienteEndereco = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  estado_sigla?: string | null;
};

export type ClienteComProcessos = Cliente & {
  processos_relacionados?: ProcessoRelacionado[];
  endereco?: ClienteEndereco | null;
  // Compat: alguns repositories mapeiam snake_case -> camelCase
  tipoPessoa?: string;
  razaoSocial?: string | null;
  nomeFantasia?: string | null;
  nomeCompleto?: string | null;
  dataNascimento?: string | null;
  dddCelular?: string | null;
  numeroCelular?: string | null;
  dddComercial?: string | null;
  numeroComercial?: string | null;
  dddResidencial?: string | null;
  numeroResidencial?: string | null;
  processosRelacionados?: ProcessoRelacionado[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function firstString(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === 'string') return v;
  }
  return null;
}

function getStringProp(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string') return v;
  }
  return null;
}

function normalizeEmails(value: unknown): string[] | null {
  // JSONB pode chegar como string JSON em alguns cenários
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .map((v) => (typeof v === 'string' ? v.trim() : ''))
            .filter((v) => Boolean(v));
          return normalized.length > 0 ? normalized : null;
        }
      } catch {
        // fall through
      }
    }

    return [trimmed];
  }

  if (Array.isArray(value)) {
    const normalized = value
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter((v) => Boolean(v));
    return normalized.length > 0 ? normalized : null;
  }

  return null;
}

function normalizeTipoPessoa(cliente: ClienteComProcessos): 'pf' | 'pj' | null {
  const record = asRecord(cliente) ?? {};
  const raw = getStringProp(record, 'tipo_pessoa', 'tipoPessoa');
  if (!raw) return null;
  const lower = raw.trim().toLowerCase();
  if (lower === 'pf') return 'pf';
  if (lower === 'pj') return 'pj';
  return null;
}

function normalizeEndereco(endereco: unknown): ClienteEndereco | null {
  const record = asRecord(endereco);
  if (!record) return null;

  // Aceita tanto estado_sigla quanto estadoSigla
  const estadoSigla = firstString(record.estado_sigla, record.estadoSigla);

  return {
    ...record,
    estado_sigla: estadoSigla,
  } as ClienteEndereco;
}

// Actions Component
function ClienteActions({
  cliente,
  onEdit,
  onDelete,
}: {
  cliente: ClienteComProcessos;
  onEdit: (cliente: ClienteComProcessos) => void;
  onDelete: (cliente: ClienteComProcessos) => void;
}) {
  return (
    <ButtonGroup>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            asChild
          >
            <Link href={`/app/partes/clientes/${cliente.id}`}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">Visualizar cliente</span>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Visualizar</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(cliente)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar cliente</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>

      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Desativar cliente</span>
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Desativar</TooltipContent>
        </Tooltip>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso é um soft delete. O cliente ficará como inativo e não aparecerá nas listagens padrão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(cliente)}>
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ButtonGroup>
  );
}

// Helpers
function formatarData(dataISO: string | null): string {
  if (!dataISO) return '';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

// Define Columns
export const getClientesColumns = (
  onEdit: (cliente: ClienteComProcessos) => void,
  onDelete: (cliente: ClienteComProcessos) => void
): ColumnDef<ClienteComProcessos>[] => [

    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Identificação" />
      ),
      meta: { align: 'left' },
      size: 280,
      cell: ({ row }) => {
        const cliente = row.original;
        const record = asRecord(cliente) ?? {};
        const tipoPessoa = normalizeTipoPessoa(cliente);
        const isPF = tipoPessoa === 'pf';

        const cpf = getStringProp(record, 'cpf');
        const cnpj = getStringProp(record, 'cnpj');
        const documento = isPF ? formatarCpf(cpf) : formatarCnpj(cnpj);
        const documentoRaw = isPF ? cpf : cnpj;

        const dataNascimento = isPF
          ? getStringProp(record, 'data_nascimento', 'dataNascimento')
          : null;
        const idade = calcularIdade(dataNascimento);

        // Identificação: para PJ, priorizar razão social/nome completo; para PF, usar nome
        const labelPrimario = formatarNome(
          firstString(
            isPF ? getStringProp(record, 'nome') : null,
            getStringProp(record, 'razao_social', 'razaoSocial'),
            getStringProp(record, 'nome_completo', 'nomeCompleto'),
            getStringProp(record, 'nome')
          ) || ''
        );
        const labelSecundario = getStringProp(record, 'nome_social_fantasia', 'nomeSocialFantasia', 'nomeFantasia');

        return (
          <div className="flex flex-col items-start gap-0.5 max-w-full overflow-hidden">
            <div className="flex items-center gap-1 max-w-full">
              <span className="text-sm font-medium wrap-break-word whitespace-normal">
                {labelPrimario}
              </span>
              <CopyButton text={labelPrimario} label="Copiar nome" />
            </div>
            {labelSecundario && (
              <div className="flex items-center gap-1 max-w-full">
                <span className="text-xs text-muted-foreground wrap-break-word whitespace-normal">
                  {labelSecundario}
                </span>
                <CopyButton text={labelSecundario} label="Copiar nome fantasia" />
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {documento}
              </span>
              {documentoRaw && (
                <CopyButton text={documentoRaw} label={isPF ? 'Copiar CPF' : 'Copiar CNPJ'} />
              )}
            </div>
            {isPF && dataNascimento && (
              <span className="text-xs text-muted-foreground text-left">
                {formatarData(dataNascimento)}
                {idade !== null && ` - ${idade} anos`}
              </span>
            )}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      id: 'contato',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Contato" />,
      meta: { align: 'left' },
      size: 240,
      cell: ({ row }) => {
        const cliente = row.original;
        const record = asRecord(cliente) ?? {};

        const email = getStringProp(record, 'email');
        const emails = normalizeEmails(record.emails);

        const dddCelular = getStringProp(record, 'ddd_celular', 'dddCelular');
        const numeroCelular = getStringProp(record, 'numero_celular', 'numeroCelular');
        const dddComercial = getStringProp(record, 'ddd_comercial', 'dddComercial');
        const numeroComercial = getStringProp(record, 'numero_comercial', 'numeroComercial');
        const dddResidencial = getStringProp(record, 'ddd_residencial', 'dddResidencial');
        const numeroResidencial = getStringProp(record, 'numero_residencial', 'numeroResidencial');
        return (
          <ContatoCell
            telefones={[
              {
                ddd: dddCelular,
                numero: numeroCelular,
              },
              {
                ddd: dddComercial,
                numero: numeroComercial,
              },
              {
                ddd: dddResidencial,
                numero: numeroResidencial,
              },
            ]}
            email={email}
            emails={emails}
          />
        );
      },
    },
    {
      id: 'endereco',
      header: 'Endereço',
      meta: { align: 'left' },
      size: 280,
      cell: ({ row }) => {
        const cliente = row.original;
        const record = asRecord(cliente) ?? {};
        const enderecoFormatado = formatarEnderecoCompleto(normalizeEndereco(record.endereco));
        const hasEndereco = enderecoFormatado && enderecoFormatado !== '-';

        return (
          <div className="flex items-start gap-1 max-w-full overflow-hidden">
            <span
              className="text-sm whitespace-normal wrap-break-word flex-1"
              title={enderecoFormatado}
            >
              {enderecoFormatado || '-'}
            </span>
            {hasEndereco && (
              <>
                <CopyButton text={enderecoFormatado} label="Copiar endereço" />
                <MapButton address={enderecoFormatado} />
              </>
            )}
          </div>
        );
      },
    },
    {
      id: 'processos',
      header: 'Processos',
      meta: { align: 'left' },
      size: 200,
      cell: ({ row }) => {
        const cliente = row.original;
        const record = asRecord(cliente) ?? {};
        const processosRaw = record.processos_relacionados ?? record.processosRelacionados;
        const processos = Array.isArray(processosRaw) ? (processosRaw as ProcessoRelacionado[]) : [];
        return (
          <div className="flex items-center min-w-0">
            <ProcessosRelacionadosCell
              processos={processos}
            />
          </div>
        );
      },
    },
    {
      id: 'actions',

      header: 'Ações',
      meta: { align: 'left' },
      size: 120,
      cell: ({ row }) => (
        <div className="flex items-center">
          <ClienteActions cliente={row.original} onEdit={onEdit} onDelete={onDelete} />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
