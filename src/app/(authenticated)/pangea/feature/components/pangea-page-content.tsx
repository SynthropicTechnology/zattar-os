'use client';

import * as React from 'react';
import Image from 'next/image';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Loader2, Search, ChevronDown, Check, Info } from 'lucide-react';
import { Typography } from '@/components/ui/typography';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

import {
  actionBuscarPrecedentesPangea,
  actionListarOrgaosPangeaDisponiveis,
  PANGEA_ORDENACAO_VALUES,
  PANGEA_MAX_TAMANHO_PAGINA,
  PANGEA_TIPO_VALUES,
  type PangeaBuscaResponse,
  type PangeaOrgaoDisponivel,
  type PangeaTipo,
  type PangeaOrdenacao,
} from '@/app/(authenticated)/pangea/feature';
import { usePermissoes } from '@/providers/user-provider';
import { PangeaResults } from './pangea-results';

const formSchema = z.object({
  buscaGeral: z.string().optional(),
  todasPalavras: z.string().optional(),
  quaisquerPalavras: z.string().optional(),
  semPalavras: z.string().optional(),
  trechoExato: z.string().optional(),
  nr: z.string().optional(),
  ordenacao: z.enum(PANGEA_ORDENACAO_VALUES).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type PickerRange = { from?: Date; to?: Date } | undefined;

function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const PANGEA_TIPO_LABELS: Record<PangeaTipo, string> = {
  SUM: 'Súmula',
  SV: 'Súmula Vinculante',
  RG: 'Tema de Repercussão Geral',
  IAC: 'Incidente de Assunção de Competência',
  SIRDR: 'Suspensão Nacional em IRDR',
  RR: 'Recurso Especial Repetitivo',
  CT: 'Controvérsia',
  IRDR: 'Incidente de Resolução de Demandas Repetitivas',
  IRR: 'Incidente de Recurso Repetitivo',
  PUIL: 'Pedido de Uniformização de Interpretação de Lei',
  NT: 'Nota Técnica',
  OJ: 'Orientação Jurisprudencial',
};

const PANGEA_ORDENACAO_LABELS: Record<PangeaOrdenacao, string> = {
  Text: 'Textual',
  ChronologicalAsc: 'Cronológica Ascendente',
  ChronologicalDesc: 'Cronológica Descendente',
  NumericAsc: 'Numérica Ascendente',
  NumericDesc: 'Numérica Descendente',
};

export function PangeaPageContent() {
  const { temPermissao, isLoading: loadingPerms } = usePermissoes();
  const permsError = null;
  const canList = temPermissao('pangea', 'listar');

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<PangeaBuscaResponse | null>(null);
  const [advancedOpen, setAdvancedOpen] = React.useState(false);

  const [orgaos, setOrgaos] = React.useState<PangeaOrgaoDisponivel[]>([]);
  const [loadingOrgaos, setLoadingOrgaos] = React.useState(true);
  const [orgaosOpen, setOrgaosOpen] = React.useState(false);
  const [orgaosSearchTerm, setOrgaosSearchTerm] = React.useState('');

  const [selectedOrgaos, setSelectedOrgaos] = React.useState<string[]>([]);
  const [selectedTipos, setSelectedTipos] = React.useState<PangeaTipo[]>([]);
  const [dateRange, setDateRange] = React.useState<PickerRange>();
  const [cancelados, setCancelados] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ordenacao: 'Text',
    },
  });

  React.useEffect(() => {
    const loadOrgaos = async () => {
      setLoadingOrgaos(true);
      try {
        const result = await actionListarOrgaosPangeaDisponiveis();
        if (result.success) {
          setOrgaos(result.data);
        } else {
          // Se não tem permissão, não tratar como erro fatal aqui.
          if (result.error?.toLowerCase().includes('permissão')) {
            setOrgaos([]);
          } else {
            console.error(result.error);
          }
        }
      } finally {
        setLoadingOrgaos(false);
      }
    };

    if (canList) {
      loadOrgaos().catch(() => setLoadingOrgaos(false));
    } else {
      setLoadingOrgaos(false);
    }
  }, [canList]);

  const filteredOrgaos = React.useMemo(() => {
    if (!orgaosSearchTerm.trim()) return orgaos;
    const q = orgaosSearchTerm.toLowerCase();
    return orgaos.filter(
      (o) => o.codigo.toLowerCase().includes(q) || o.nome.toLowerCase().includes(q)
    );
  }, [orgaos, orgaosSearchTerm]);

  const handleToggleOrgao = (codigo: string) => {
    setSelectedOrgaos((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]
    );
  };

  const handleToggleTipo = (tipo: PangeaTipo) => {
    setSelectedTipos((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  const handleReset = () => {
    form.reset({ ordenacao: 'Text', buscaGeral: '' });
    setSelectedOrgaos([]);
    setSelectedTipos([]);
    setDateRange(undefined);
    setCancelados(false);
    setError(null);
    setData(null);
  };

  const runSearch = async (values: FormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      const hasAnyFilter =
        Boolean(values.buscaGeral?.trim()) ||
        Boolean(values.todasPalavras?.trim()) ||
        Boolean(values.quaisquerPalavras?.trim()) ||
        Boolean(values.semPalavras?.trim()) ||
        Boolean(values.trechoExato?.trim()) ||
        Boolean(values.nr?.trim()) ||
        selectedOrgaos.length > 0 ||
        selectedTipos.length > 0 ||
        Boolean(dateRange?.from);

      if (!hasAnyFilter) {
        setError('Preencha pelo menos um campo de busca (ou use filtros de órgãos/espécies/data).');
        setData(null);
        return;
      }

      const result = await actionBuscarPrecedentesPangea({
        buscaGeral: values.buscaGeral ?? '',
        todasPalavras: values.todasPalavras ?? '',
        quaisquerPalavras: values.quaisquerPalavras ?? '',
        semPalavras: values.semPalavras ?? '',
        trechoExato: values.trechoExato ?? '',
        nr: values.nr ?? '',
        ordenacao: (values.ordenacao ?? 'Text') as PangeaOrdenacao,
        pagina: 1,
        tamanhoPagina: PANGEA_MAX_TAMANHO_PAGINA,
        orgaos: selectedOrgaos,
        tipos: selectedTipos,
        cancelados,
        atualizacaoDesde: dateRange?.from ? formatDateToISO(dateRange.from) : undefined,
        atualizacaoAte: dateRange?.to ? formatDateToISO(dateRange.to) : undefined,
      });

      if (!result.success) {
        setError(result.error ?? 'Erro ao buscar no Pangea');
        setData(null);
        return;
      }

      setData(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar no Pangea');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    await runSearch(values);
  };

  // Guard: permissões
  if (loadingPerms) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando permissões…</span>
      </div>
    );
  }

  if (permsError) {
    return (
      <Typography.Muted>Erro ao carregar permissões: {permsError}</Typography.Muted>
    );
  }

  if (!canList) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <Typography.H3>Acesso negado</Typography.H3>
        <Typography.Muted className="mt-2">
          Você não tem permissão para acessar o módulo Pangea.
        </Typography.Muted>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Hero minimalista */}
        <div className="flex flex-col items-center text-center gap-8 py-10">
          <Image
            src="/assets/pangea.png"
            alt="Pangea — Banco Nacional de Precedentes"
            width={420}
            height={160}
            priority
            className="h-auto w-65 md:w-[320px]"
          />

          <div className="w-full max-w-3xl">
            <div className="relative">
              <Input
                {...form.register('buscaGeral')}
                placeholder="Pesquisar precedentes"
                aria-label="Pesquisar precedentes"
                className={cn(
                  'h-12 md:h-14 rounded-full pr-14 md:pr-16 text-base md:text-lg bg-card'
                )}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full"
                disabled={isLoading}
                aria-label="Buscar"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </Button>
            </div>

            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                aria-controls="pangea-advanced-filters"
                aria-expanded={advancedOpen}
                onClick={() => setAdvancedOpen((v) => !v)}
              >
                Filtros avançados
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', advancedOpen && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>

              <Separator orientation="vertical" className="h-4" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Dica de pesquisa"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Info className="h-4 w-4" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>
                  Use <strong>+</strong> para palavras obrigatórias, <strong>aspas</strong> para termos exatos e <strong>-</strong> para excluir.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Filtros avançados (painel) */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleContent id="pangea-advanced-filters" className="mt-2">
            <div className="rounded-xl border bg-card p-4 md:p-6 space-y-6">
              <div className="flex items-center justify-between">
                <Typography.Muted className="text-sm">Ajuste os filtros para refinar a busca</Typography.Muted>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 disabled:opacity-50"
                >
                  Limpar filtros
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Trecho exato</Label>
                  <Input
                    placeholder='Use aspas ou ";" para múltiplos trechos'
                    {...form.register('trechoExato')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Número (nr)</Label>
                  <Input {...form.register('nr')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Todas as palavras</Label>
                  <Input {...form.register('todasPalavras')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Quaisquer palavras</Label>
                  <Input {...form.register('quaisquerPalavras')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Sem as palavras</Label>
                  <Input {...form.register('semPalavras')} />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="space-y-1.5 md:col-span-4">
                  <Label>Órgãos</Label>
                  <Popover open={orgaosOpen} onOpenChange={setOrgaosOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                        disabled={loadingOrgaos}
                      >
                        {loadingOrgaos ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Carregando…
                          </span>
                        ) : selectedOrgaos.length > 0 ? (
                          <span className="truncate text-left">{selectedOrgaos.join(', ')}</span>
                        ) : (
                          <span className="text-muted-foreground">Selecione um ou mais</span>
                        )}
                        <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-105" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Buscar órgão…"
                          value={orgaosSearchTerm}
                          onValueChange={setOrgaosSearchTerm}
                          className="h-9"
                        />
                        <CommandList className="max-h-75">
                          <CommandEmpty>Nenhum órgão encontrado</CommandEmpty>
                          <CommandGroup heading="Órgãos">
                            {filteredOrgaos.map((o) => {
                              const checked = selectedOrgaos.includes(o.codigo);
                              return (
                                <CommandItem
                                  key={o.codigo}
                                  value={`${o.codigo} ${o.nome}`}
                                  onSelect={() => handleToggleOrgao(o.codigo)}
                                  className="py-1.5"
                                >
                                  <Check
                                    className={cn(
                                      'mr-1.5 h-3 w-3',
                                      checked ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  <span className="font-medium text-sm shrink-0">{o.codigo}</span>
                                  <span className="ml-1.5 text-muted-foreground text-sm truncate">
                                    {o.nome}
                                  </span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5 md:col-span-4">
                  <Label>Espécies</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between font-normal"
                      >
                        {selectedTipos.length > 0 ? (
                          <span className="truncate text-left">{selectedTipos.map((t) => t).join(', ')}</span>
                        ) : (
                          <span className="text-muted-foreground">Selecione uma ou mais</span>
                        )}
                        <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-105" align="start">
                      <Command>
                        <CommandInput placeholder="Filtrar espécies…" className="h-9" />
                        <CommandList className="max-h-75">
                          <CommandEmpty>Nenhuma espécie encontrada</CommandEmpty>
                          <CommandGroup heading="Espécies">
                            {PANGEA_TIPO_VALUES.map((tipo) => {
                              const checked = selectedTipos.includes(tipo);
                              return (
                                <CommandItem
                                  key={tipo}
                                  value={`${tipo} ${PANGEA_TIPO_LABELS[tipo]}`}
                                  onSelect={() => handleToggleTipo(tipo)}
                                  className="py-1.5"
                                >
                                  <Check
                                    className={cn(
                                      'mr-1.5 h-3 w-3',
                                      checked ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  <span className="font-medium text-sm shrink-0">{tipo}</span>
                                  <span className="ml-1.5 text-muted-foreground text-sm truncate">
                                    {PANGEA_TIPO_LABELS[tipo]}
                                  </span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5 md:col-span-4">
                  <Label>Data de atualização</Label>
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder="Selecione o período"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-4">
                  <Label>Ordenação</Label>
                  <Select
                    value={form.watch('ordenacao') ?? 'Text'}
                    onValueChange={(val) => form.setValue('ordenacao', val as PangeaOrdenacao)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {PANGEA_ORDENACAO_VALUES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {PANGEA_ORDENACAO_LABELS[v]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 md:col-span-4 pt-7">
                  <Switch checked={cancelados} onCheckedChange={setCancelados} id="cancelados" />
                  <Label htmlFor="cancelados">Exibir cancelados</Label>
                </div>
              </div>

              {error && (
                <Typography.Muted className="text-destructive">
                  {error}
                </Typography.Muted>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </form>

      {data && <PangeaResults data={data} />}
    </div>
  );
}


