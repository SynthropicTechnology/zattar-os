'use client';

// Componente de diálogo para criar nova audiência

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Loader2 } from 'lucide-react';
import { Typography } from '@/components/ui/typography';
import { actionListarAcervoPaginado } from '@/app/app/acervo';
import { actionListarUsuarios } from '@/app/app/usuarios';
import {
  actionCriarAudienciaPayload,
  actionListarTiposAudiencia,
  actionListarSalasAudiencia,
} from '@/app/app/audiencias/actions';
import { localToISO } from '@/app/app/audiencias/lib/date-utils';

interface NovaAudienciaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Processo {
  id: number;
  numero_processo: string;
  polo_ativo_nome: string;
  polo_passivo_nome: string;
  trt: string;
  grau: string;
  orgao_julgador_id: number;
}

interface TipoAudiencia {
  id: number;
  descricao: string;
  is_virtual: boolean;
}

interface SalaAudiencia {
  id: number;
  nome: string;
}

interface Usuario {
  id: number;
  nome_exibicao: string;
  email_corporativo: string;
}

// Opções de TRT (TRT1 a TRT24)
const TRTS = Array.from({ length: 24 }, (_, i) => {
  const num = i + 1;
  return {
    value: `TRT${num}`,
    label: `TRT${num}`,
  };
});

// Opções de Grau
const GRAUS = [
  { value: 'primeiro_grau', label: '1º Grau' },
  { value: 'segundo_grau', label: '2º Grau' },
];

export function NovaAudienciaDialog({ open, onOpenChange, onSuccess }: NovaAudienciaDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Estados de dados
  const [processos, setProcessos] = React.useState<Processo[]>([]);
  const [tiposAudiencia, setTiposAudiencia] = React.useState<TipoAudiencia[]>([]);
  const [salas, setSalas] = React.useState<SalaAudiencia[]>([]);
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);

  // Estados de loading
  const [loadingProcessos, setLoadingProcessos] = React.useState(false);
  const [loadingTipos, setLoadingTipos] = React.useState(false);
  const [loadingSalas, setLoadingSalas] = React.useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = React.useState(false);

  // Form state
  const [trt, setTrt] = React.useState<string>('');
  const [grau, setGrau] = React.useState<string>('');
  const [processoId, setProcessoId] = React.useState<string[]>([]);
  const [dataInicio, setDataInicio] = React.useState('');
  const [horaInicio, setHoraInicio] = React.useState('');
  const [dataFim, setDataFim] = React.useState('');
  const [horaFim, setHoraFim] = React.useState('');
  const [tipoAudienciaId, setTipoAudienciaId] = React.useState<string>('');
  const [salaAudienciaId, setSalaAudienciaId] = React.useState<string>('');
  const [urlVirtual, setUrlVirtual] = React.useState('');
  const [responsavelId, setResponsavelId] = React.useState<string>('');
  const [observacoes, setObservacoes] = React.useState('');

  // Campos de endereço presencial
  const [logradouro, setLogradouro] = React.useState('');
  const [numero, setNumero] = React.useState('');
  const [complemento, setComplemento] = React.useState('');
  const [bairro, setBairro] = React.useState('');
  const [cidade, setCidade] = React.useState('');
  const [estado, setEstado] = React.useState('');
  const [cep, setCep] = React.useState('');

  // Processo selecionado
  const processoSelecionado = React.useMemo(() => {
    if (processoId.length === 0) return null;
    return processos.find((p) => p.id.toString() === processoId[0]) || null;
  }, [processoId, processos]);

  // Tipo selecionado
  const tipoSelecionado = React.useMemo(() => {
    if (!tipoAudienciaId) return null;
    return tiposAudiencia.find((t) => t.id.toString() === tipoAudienciaId) || null;
  }, [tipoAudienciaId, tiposAudiencia]);

  const buscarProcessos = React.useCallback(async (trtParam: string, grauParam: string) => {
    setLoadingProcessos(true);
    try {
      const result = await actionListarAcervoPaginado({
        trt: trtParam,
        grau: grauParam as 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior',
        limite: 2000,
        ordenar_por: 'numero_processo',
        ordem: 'asc',
      });

      if (!result.success) throw new Error(result.error || 'Erro ao buscar processos');

      const processosResponse = result.data as { processos?: Processo[] } | undefined;
      setProcessos(processosResponse?.processos ?? []);
    } catch (err) {
      console.error('Erro ao buscar processos:', err);
      setError('Erro ao carregar processos');
    } finally {
      setLoadingProcessos(false);
    }
  }, []);

  const buscarTiposAudiencia = React.useCallback(async (_trt: string, _grau: string) => {
    setLoadingTipos(true);
    try {
      const result = await actionListarTiposAudiencia();
      if (!result.success) throw new Error(result.error || 'Erro ao buscar tipos de audiência');
      setTiposAudiencia((result.data as unknown as TipoAudiencia[]) || []);
    } catch (err) {
      console.error('Erro ao buscar tipos de audiência:', err);
      setError('Erro ao carregar tipos de audiência');
    } finally {
      setLoadingTipos(false);
    }
  }, []);

  const buscarSalas = React.useCallback(async (trt: string, grau: string, orgaoJulgadorId: number) => {
    setLoadingSalas(true);
    try {
      const result = await actionListarSalasAudiencia({ trt, grau, orgao_julgador_id: orgaoJulgadorId });
      if (!result.success) throw new Error(result.error || 'Erro ao buscar salas de audiência');
      setSalas((result.data as unknown as SalaAudiencia[]) || []);
    } catch (err) {
      console.error('Erro ao buscar salas de audiência:', err);
      setError('Erro ao carregar salas de audiência');
    } finally {
      setLoadingSalas(false);
    }
  }, []);

  const buscarUsuarios = React.useCallback(async () => {
    setLoadingUsuarios(true);
    try {
      const result = await actionListarUsuarios({ ativo: true, limite: 1000 });
      if (!result.success) throw new Error(result.error || 'Erro ao buscar usuários');

      const usuariosPayload = result.data as { usuarios?: Usuario[] } | Usuario[] | undefined;
      if (Array.isArray(usuariosPayload)) {
        setUsuarios(usuariosPayload);
      } else {
        setUsuarios(usuariosPayload?.usuarios ?? []);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError('Erro ao carregar usuários');
    } finally {
      setLoadingUsuarios(false);
    }
  }, []);

  // Buscar processos quando TRT e Grau forem selecionados
  React.useEffect(() => {
    if (trt && grau) {
      buscarProcessos(trt, grau);
    } else {
      setProcessos([]);
      setProcessoId([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trt, grau]);

  // Buscar usuários quando o dialog abrir
  React.useEffect(() => {
    if (open && usuarios.length === 0) {
      buscarUsuarios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, usuarios.length]);

  // Buscar tipos de audiência quando TRT e Grau forem selecionados
  React.useEffect(() => {
    if (trt && grau) {
      buscarTiposAudiencia(trt, grau);
    } else {
      setTiposAudiencia([]);
      setTipoAudienciaId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trt, grau]);

  // Buscar salas quando processo for selecionado (precisa do orgao_julgador_id)
  React.useEffect(() => {
    if (processoSelecionado) {
      buscarSalas(processoSelecionado.trt, processoSelecionado.grau, processoSelecionado.orgao_julgador_id);
    } else {
      setSalas([]);
      setSalaAudienciaId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processoSelecionado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!trt) {
      setError('Selecione o TRT');
      return;
    }

    if (!grau) {
      setError('Selecione o grau');
      return;
    }

    if (processoId.length === 0) {
      setError('Selecione um processo');
      return;
    }

    if (!dataInicio || !horaInicio) {
      setError('Data e hora de início são obrigatórias');
      return;
    }

    if (!dataFim || !horaFim) {
      setError('Data e hora de fim são obrigatórias');
      return;
    }

    // Converter para ISO timestamps usando utilitário de timezone
    const dataInicioISO = localToISO(dataInicio, horaInicio);
    const dataFimISO = localToISO(dataFim, horaFim);

    // Montar endereço presencial se aplicável
    let enderecoPresencial: {
      cep: string;
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      uf: string;
    } | null = null;
    if (tipoSelecionado && !tipoSelecionado.is_virtual) {
      if (logradouro && numero && bairro && cidade && estado && cep) {
        enderecoPresencial = {
          cep,
          logradouro,
          numero,
          complemento: complemento || undefined,
          bairro,
          cidade,
          uf: estado,
        };
      }
    }

    setIsLoading(true);

    try {
      // Find sala name from salaAudienciaId
      const salaSelecionada = salas.find((s) => s.id.toString() === salaAudienciaId);
      const salaAudienciaNome = salaSelecionada?.nome || undefined;

      const result = await actionCriarAudienciaPayload({
        processoId: parseInt(processoId[0]),
        dataInicio: dataInicioISO,
        dataFim: dataFimISO,
        tipoAudienciaId: tipoAudienciaId ? parseInt(tipoAudienciaId) : undefined,
        salaAudienciaNome,
        urlAudienciaVirtual: urlVirtual || undefined,
        enderecoPresencial,
        observacoes: observacoes || undefined,
        responsavelId: responsavelId ? parseInt(responsavelId) : undefined,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar audiência');
      }

      // Resetar form
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao criar audiência:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar audiência');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTrt('');
    setGrau('');
    setProcessoId([]);
    setDataInicio('');
    setHoraInicio('');
    setDataFim('');
    setHoraFim('');
    setTipoAudienciaId('');
    setSalaAudienciaId('');
    setUrlVirtual('');
    setResponsavelId('');
    setObservacoes('');
    setLogradouro('');
    setNumero('');
    setComplemento('');
    setBairro('');
    setCidade('');
    setEstado('');
    setCep('');
    setError(null);
  };
  const parseLocalDate = (dateString: string): Date => { const [year, month, day] = dateString.split('-').map(Number); return new Date(year, month - 1, day); };
  const formatYYYYMMDD = (d: Date): string => { const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const da = String(d.getDate()).padStart(2, '0'); return `${y}-${m}-${da}`; };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Opções para o combobox de processos
  const processosOptions: ComboboxOption[] = React.useMemo(() => {
    return processos.map((p) => ({
      value: p.id.toString(),
      label: `${p.numero_processo} - ${p.polo_ativo_nome} vs ${p.polo_passivo_nome}`,
      searchText: `${p.numero_processo} ${p.polo_ativo_nome} ${p.polo_passivo_nome}`,
    }));
  }, [processos]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Audiência</DialogTitle>
          <DialogDescription>
            Adicione uma nova audiência manualmente ao sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* TRT e Grau */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trt">Tribunal (TRT) *</Label>
              <Select value={trt} onValueChange={setTrt}>
                <SelectTrigger id="trt">
                  <SelectValue placeholder="Selecione o TRT" />
                </SelectTrigger>
                <SelectContent>
                  {TRTS.map((tribunal) => (
                    <SelectItem key={tribunal.value} value={tribunal.value}>
                      {tribunal.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grau">Grau *</Label>
              <Select value={grau} onValueChange={setGrau}>
                <SelectTrigger id="grau">
                  <SelectValue placeholder="Selecione o grau" />
                </SelectTrigger>
                <SelectContent>
                  {GRAUS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Processo - Combobox com busca */}
          <div className="space-y-2">
            <Label htmlFor="processo">Processo *</Label>
            {!trt || !grau ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                <Typography.Muted as="span">Selecione o TRT e Grau primeiro</Typography.Muted>
              </div>
            ) : loadingProcessos ? (
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <Typography.Muted as="span">Carregando processos...</Typography.Muted>
              </div>
            ) : (
              <Combobox
                options={processosOptions}
                value={processoId}
                onValueChange={setProcessoId}
                placeholder="Buscar por número ou nome das partes..."
                searchPlaceholder="Buscar processo..."
                emptyText="Nenhum processo encontrado."
                multiple={false}
              />
            )}
          </div>

          {/* Data e Hora de Início */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início *</Label>
              <DatePicker
                value={dataInicio ? parseLocalDate(dataInicio) : null}
                onChange={(d) => setDataInicio(d ? formatYYYYMMDD(d) : '')}
                placeholder="Selecionar data"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaInicio">Hora de Início *</Label>
              <Input
                id="horaInicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Data e Hora de Fim */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data de Fim *</Label>
              <DatePicker
                value={dataFim ? parseLocalDate(dataFim) : null}
                onChange={(d) => setDataFim(d ? formatYYYYMMDD(d) : '')}
                placeholder="Selecionar data"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaFim">Hora de Fim *</Label>
              <Input
                id="horaFim"
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Tipo de Audiência */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Audiência</Label>
            {loadingTipos ? (
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <Typography.Muted as="span">Carregando tipos...</Typography.Muted>
              </div>
            ) : !trt || !grau ? (
              <Select disabled>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione TRT e Grau primeiro" />
                </SelectTrigger>
              </Select>
            ) : (
              <Select value={tipoAudienciaId} onValueChange={setTipoAudienciaId}>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione o tipo de audiência" />
                </SelectTrigger>
                <SelectContent>
                  {tiposAudiencia.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id.toString()}>
                      {tipo.descricao} {tipo.is_virtual && '(Virtual)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Sala de Audiência */}
          <div className="space-y-2">
            <Label htmlFor="sala">Sala de Audiência</Label>
            {loadingSalas ? (
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <Typography.Muted as="span">Carregando salas...</Typography.Muted>
              </div>
            ) : !processoSelecionado ? (
              <Select disabled>
                <SelectTrigger id="sala">
                  <SelectValue placeholder="Selecione um processo primeiro" />
                </SelectTrigger>
              </Select>
            ) : (
              <Select value={salaAudienciaId} onValueChange={setSalaAudienciaId}>
                <SelectTrigger id="sala">
                  <SelectValue placeholder="Selecione a sala de audiência" />
                </SelectTrigger>
                <SelectContent>
                  {salas.map((sala) => (
                    <SelectItem key={sala.id} value={sala.id.toString()}>
                      {sala.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Condicional: Virtual ou Presencial */}
          {tipoSelecionado && (
            <>
              {tipoSelecionado.is_virtual ? (
                // Audiência Virtual - Campo URL
                <div className="space-y-2">
                  <Label htmlFor="urlVirtual">URL da Audiência Virtual</Label>
                  <Input
                    id="urlVirtual"
                    type="url"
                    placeholder="https://zoom.us/..."
                    value={urlVirtual}
                    onChange={(e) => setUrlVirtual(e.target.value)}
                  />
                </div>
              ) : (
                // Audiência Presencial - Campos de Endereço
                <>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Endereço da Audiência Presencial</Label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="logradouro">Logradouro</Label>
                      <Input
                        id="logradouro"
                        placeholder="Rua, Avenida, etc."
                        value={logradouro}
                        onChange={(e) => setLogradouro(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numero">Número</Label>
                      <Input
                        id="numero"
                        placeholder="123"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input
                        id="complemento"
                        placeholder="Sala, Bloco, etc."
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Input
                        id="estado"
                        placeholder="UF"
                        maxLength={2}
                        value={estado}
                        onChange={(e) => setEstado(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Responsável */}
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável (opcional)</Label>
            {loadingUsuarios ? (
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <Typography.Muted as="span">Carregando usuários...</Typography.Muted>
              </div>
            ) : (
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger id="responsavel">
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nome_exibicao} ({usuario.email_corporativo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Anotações adicionais sobre a audiência..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
