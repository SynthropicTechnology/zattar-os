'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Check, ChevronDown, ChevronsUpDown, Loader2, Search, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdvogados } from '@/features/advogados';
import { formatOabs, formatOab, getPrimaryOab } from '@/features/advogados/domain';
import { actionListarTribunaisDisponiveis } from '../../actions/comunica-cnj-actions';
import type { TribunalInfo } from '../../comunica-cnj/domain';

// Ordem de prioridade dos grupos de tribunais
const TRIBUNAL_GROUP_ORDER = ['TRT', 'TRF', 'TRE', 'STJ', 'STF', 'TST', 'TSE', 'STM', 'CNJ', 'TJ', 'TJMM', 'TJMMG'];

const extractTribunalNumber = (sigla: string): number => {
  const match = sigla.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
};

const getTribunalGroup = (sigla: string): string => {
  if (/^TRT\d+$/i.test(sigla)) return 'TRT';
  if (/^TRF\d+$/i.test(sigla)) return 'TRF';
  if (/^TRE-?[A-Z]{2}$/i.test(sigla)) return 'TRE';
  if (/^TJM+/i.test(sigla)) return 'TJMM';
  if (/^TJ[A-Z]{0,2}$/i.test(sigla)) return 'TJ';
  if (sigla === 'STJ') return 'STJ';
  if (sigla === 'STF') return 'STF';
  if (sigla === 'TST') return 'TST';
  if (sigla === 'TSE') return 'TSE';
  if (sigla === 'STM') return 'STM';
  if (sigla === 'CNJ') return 'CNJ';
  return 'OUTROS';
};

const GROUP_LABELS: Record<string, string> = {
  TRT: 'Tribunais Regionais do Trabalho',
  TRF: 'Tribunais Regionais Federais',
  TRE: 'Tribunais Regionais Eleitorais',
  TJ: 'Tribunais de Justiça Estaduais',
  TJMM: 'Tribunais de Justiça Militar',
  STJ: 'Superior Tribunal de Justiça',
  STF: 'Supremo Tribunal Federal',
  TST: 'Tribunal Superior do Trabalho',
  TSE: 'Tribunal Superior Eleitoral',
  STM: 'Superior Tribunal Militar',
  CNJ: 'Conselho Nacional de Justiça',
  OUTROS: 'Outros Tribunais',
};

const searchSchema = z
  .object({
    siglaTribunal: z.string().optional(),
    texto: z.string().optional(),
    nomeParte: z.string().optional(),
    numeroOab: z.string().optional(),
    ufOab: z.string().optional(),
    numeroProcesso: z.string().optional(),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
    meio: z.string().optional(),
    itensPorPagina: z.number().optional(),
  })
  .refine(
    (data) => {
      const hasFilter =
        data.siglaTribunal ||
        data.texto ||
        data.nomeParte ||
        data.numeroOab ||
        data.numeroProcesso ||
        data.dataInicio;
      return hasFilter;
    },
    { message: 'Pelo menos um filtro deve ser preenchido', path: ['root'] }
  );

type SearchFormData = z.infer<typeof searchSchema>;

interface ComunicaCNJSearchFormProps {
  onSearch: (filters: Record<string, unknown>) => Promise<void>;
  isLoading: boolean;
}

const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formulário de busca de comunicações no Diário Oficial (CNJ)
 * Campos principais sempre visíveis, filtros avançados em seção colapsável
 */
export function ComunicaCNJSearchForm({ onSearch, isLoading }: ComunicaCNJSearchFormProps) {
  const [tribunais, setTribunais] = useState<TribunalInfo[]>([]);
  const [loadingTribunais, setLoadingTribunais] = useState(true);
  const [tribunalSearchOpen, setTribunalSearchOpen] = useState(false);
  const [tribunalSearchTerm, setTribunalSearchTerm] = useState('');
  const [advogadoSearchOpen, setAdvogadoSearchOpen] = useState(false);
  const [selectedAdvogadoId, setSelectedAdvogadoId] = useState<number | null>(null);
  const [selectedOabIndex, setSelectedOabIndex] = useState<number>(0);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>();
  const [selectedMeio, setSelectedMeio] = useState<string>('');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const { advogados, isLoading: loadingAdvogados } = useAdvogados();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      itensPorPagina: 100,
    },
  });

  const selectedTribunal = watch('siglaTribunal');

  useEffect(() => {
    const fetchTribunais = async () => {
      try {
        const result = await actionListarTribunaisDisponiveis();
        if (result.success && result.data) {
          const uniqueTribunais = (result.data as TribunalInfo[]).reduce<TribunalInfo[]>((acc, tribunal) => {
            if (!acc.find((t) => t.sigla === tribunal.sigla)) {
              acc.push(tribunal);
            }
            return acc;
          }, []);
          setTribunais(uniqueTribunais);
        }
      } catch (error) {
        console.error('Erro ao carregar tribunais:', error);
      } finally {
        setLoadingTribunais(false);
      }
    };
    fetchTribunais();
  }, []);

  const groupedTribunais = useMemo(() => {
    let filtered = tribunais;
    if (tribunalSearchTerm) {
      const searchLower = tribunalSearchTerm.toLowerCase();
      filtered = tribunais.filter(
        (t) =>
          t.sigla.toLowerCase().includes(searchLower) ||
          t.nome.toLowerCase().includes(searchLower)
      );
    }

    const groups: Record<string, TribunalInfo[]> = {};
    filtered.forEach((tribunal) => {
      const group = getTribunalGroup(tribunal.sigla);
      if (!groups[group]) groups[group] = [];
      groups[group].push(tribunal);
    });

    Object.keys(groups).forEach((group) => {
      groups[group].sort((a, b) => {
        if (group === 'TRT' || group === 'TRF') {
          return extractTribunalNumber(a.sigla) - extractTribunalNumber(b.sigla);
        }
        return a.sigla.localeCompare(b.sigla);
      });
    });

    const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
      const indexA = TRIBUNAL_GROUP_ORDER.indexOf(a);
      const indexB = TRIBUNAL_GROUP_ORDER.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return sortedGroups;
  }, [tribunais, tribunalSearchTerm]);

  const selectedTribunalData = tribunais.find((t) => t.sigla === selectedTribunal);
  const selectedAdvogado = advogados?.find((a) => a.id === selectedAdvogadoId);

  // Contar filtros avançados ativos
  const advancedFilterCount = [
    watch('nomeParte'),
    watch('texto'),
    selectedMeio && selectedMeio !== 'all' ? selectedMeio : undefined,
    dateRange?.from,
  ].filter(Boolean).length;

  const onSubmit = async (data: SearchFormData) => {
    const selectedOab = selectedAdvogado?.oabs[selectedOabIndex];

    await onSearch({
      ...data,
      dataInicio: dateRange?.from ? formatDateToYYYYMMDD(dateRange.from) : undefined,
      dataFim: dateRange?.to ? formatDateToYYYYMMDD(dateRange.to) : undefined,
      meio: selectedMeio && selectedMeio !== 'all' ? selectedMeio : undefined,
      ...(selectedOab && {
        numeroOab: selectedOab.numero,
        ufOab: selectedOab.uf,
      }),
    });
  };

  const handleReset = () => {
    reset();
    setSelectedAdvogadoId(null);
    setSelectedOabIndex(0);
    setDateRange(undefined);
    setSelectedMeio('');
    setAdvancedOpen(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 p-4 border rounded-lg bg-card">
      {/* Linha principal: Tribunal, Processo, Advogado + Botões */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
        {/* Tribunal */}
        <div className="space-y-1.5 lg:col-span-4">
          <Label className="text-xs">Tribunal</Label>
          <Popover open={tribunalSearchOpen} onOpenChange={setTribunalSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={tribunalSearchOpen}
                aria-label="Selecionar tribunal"
                className="w-full justify-between font-normal h-9 text-sm"
                disabled={loadingTribunais}
              >
                {loadingTribunais ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Carregando...
                  </span>
                ) : selectedTribunalData ? (
                  <span className="truncate text-left">
                    {selectedTribunalData.sigla} - {selectedTribunalData.nome}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Selecione o tribunal</span>
                )}
                <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[calc(100vw-2rem)] max-w-lg p-0"
              align="start"
            >
              <Command>
                <CommandInput
                  placeholder="Buscar tribunal..."
                  value={tribunalSearchTerm}
                  onValueChange={setTribunalSearchTerm}
                  className="h-9"
                />
                <CommandList className="max-h-75">
                  <CommandEmpty>Nenhum tribunal encontrado</CommandEmpty>
                  {groupedTribunais.map(([groupKey, tribunaisDoGrupo]) => (
                    <CommandGroup key={groupKey} heading={GROUP_LABELS[groupKey] || groupKey}>
                      {tribunaisDoGrupo.map((tribunal) => (
                        <CommandItem
                          key={tribunal.sigla}
                          value={`${tribunal.sigla} ${tribunal.nome}`}
                          onSelect={() => {
                            setValue('siglaTribunal', tribunal.sigla);
                            setTribunalSearchOpen(false);
                            setTribunalSearchTerm('');
                          }}
                          className="py-1.5"
                        >
                          <Check
                            className={cn(
                              'mr-1.5 h-3 w-3 shrink-0',
                              selectedTribunal === tribunal.sigla ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <span className="font-medium text-sm shrink-0">{tribunal.sigla}</span>
                          <span className="ml-1.5 text-muted-foreground text-sm truncate">
                            {tribunal.nome}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Processo */}
        <div className="space-y-1.5 lg:col-span-3">
          <Label className="text-xs">Processo</Label>
          <Input
            {...register('numeroProcesso')}
            placeholder="0000000-00.0000.0.00.0000"
            className="h-9 text-sm"
          />
        </div>

        {/* Advogado (OAB) */}
        <div className="space-y-1.5 lg:col-span-3">
          <Label className="text-xs">Advogado</Label>
          <Popover open={advogadoSearchOpen} onOpenChange={setAdvogadoSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={advogadoSearchOpen}
                aria-label="Selecionar advogado"
                className="w-full justify-between font-normal h-9 text-sm"
                disabled={loadingAdvogados}
              >
                {loadingAdvogados ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </span>
                ) : selectedAdvogado ? (
                  <span className="truncate text-left">
                    {selectedAdvogado.nome_completo} - {formatOab(selectedAdvogado.oabs[selectedOabIndex] || getPrimaryOab(selectedAdvogado)!)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Selecione</span>
                )}
                <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] max-w-md p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar advogado..." className="h-9" />
                <CommandList>
                  <CommandEmpty>Nenhum advogado encontrado</CommandEmpty>
                  <CommandGroup>
                    {advogados?.map((advogado) => {
                      const oabsSearch = advogado.oabs.map((oab) => `${oab.numero} ${oab.uf}`).join(' ');
                      return (
                        <CommandItem
                          key={advogado.id}
                          value={`${advogado.nome_completo} ${oabsSearch}`}
                          onSelect={() => {
                            setSelectedAdvogadoId(advogado.id);
                            setSelectedOabIndex(0);
                            setAdvogadoSearchOpen(false);
                          }}
                          className="py-1.5"
                        >
                          <Check
                            className={cn(
                              'mr-1.5 h-3 w-3 shrink-0',
                              selectedAdvogadoId === advogado.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm truncate">{advogado.nome_completo}</span>
                            <span className="text-xs text-muted-foreground">
                              OAB {formatOabs(advogado.oabs)}
                            </span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Botões */}
        <div className="space-y-1.5 lg:col-span-2">
          <Label className="text-xs invisible" aria-hidden="true">Ações</Label>
          <div className="flex w-full gap-2 justify-stretch sm:justify-end">
            <Button type="submit" disabled={isLoading} className="h-9 flex-1 sm:flex-none">
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Search className="h-3 w-3" />
              )}
              <span className="hidden sm:inline ml-1.5">
                {isLoading ? 'Buscando...' : 'Buscar'}
              </span>
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} className="h-9 shrink-0" aria-label="Limpar filtros">
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Seletor de OAB - aparece quando advogado tem múltiplas OABs */}
      {selectedAdvogado && selectedAdvogado.oabs.length > 1 && (
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            Advogado com múltiplas OABs:
          </span>
          <Select
            value={selectedOabIndex.toString()}
            onValueChange={(v) => setSelectedOabIndex(parseInt(v, 10))}
          >
            <SelectTrigger className="h-9 text-sm w-45">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {selectedAdvogado.oabs.map((oab, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {oab.numero}/{oab.uf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Filtros avançados (colapsável) */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <ChevronsUpDown className="h-3 w-3" />
            Filtros avançados
            {advancedFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 leading-none">
                {advancedFilterCount}
              </span>
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Parte */}
            <div className="space-y-1.5 lg:col-span-4">
              <Label className="text-xs">Parte</Label>
              <Input {...register('nomeParte')} placeholder="Nome da parte" className="h-9 text-sm" />
            </div>

            {/* Texto */}
            <div className="space-y-1.5 lg:col-span-4">
              <Label className="text-xs">Texto</Label>
              <Input {...register('texto')} placeholder="Busca textual" className="h-9 text-sm" />
            </div>

            {/* Meio */}
            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-xs">Meio</Label>
              <Select
                value={selectedMeio}
                onValueChange={setSelectedMeio}
              >
                <SelectTrigger className="h-9 text-sm w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="min-w-40">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="E">Edital</SelectItem>
                  <SelectItem value="D">Diário Eletrônico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-xs">Período</Label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="Selecione"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Erro de validação */}
      {errors.root && (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      )}
    </form>
  );
}
