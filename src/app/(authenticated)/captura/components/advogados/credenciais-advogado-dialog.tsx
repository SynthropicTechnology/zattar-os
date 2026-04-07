'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Power, Loader2, Eye, EyeOff, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TribunalBadge } from '@/components/ui/tribunal-badge';
import { toast } from 'sonner';

import {
  actionListarCredenciais,
  actionCriarCredencial,
  actionAtualizarCredencial,
  actionCriarCredenciaisEmLote,
  type Advogado,
  type CredencialComAdvogado,
  type CriarCredencialParams,
  type ResumoCriacaoEmLote,
  TRIBUNAIS_ATIVOS,
  TRIBUNAIS_LABELS,
  GRAUS_LABELS,
} from '@/app/(authenticated)/advogados';
import { GRAU_LABELS } from '@/lib/design-system';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Props = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  advogado: Advogado | null;
  onRefreshAction?: () => void;
};

type CredencialFormData = {
  tribunal: string;
  grau: '1' | '2';
  usuario: string;
  senha: string;
};

// Form data para criação em lote
type CredencialLoteFormData = {
  tribunais: string[];
  graus: ('1' | '2')[];
  senha: string;
  modoDuplicata: 'pular' | 'sobrescrever';
};

const GRAUS = [
  { value: '1', label: '1° Grau' },
  { value: '2', label: '2° Grau' },
] as const;

export function CredenciaisAdvogadoDialog({ open, onOpenChangeAction, advogado, onRefreshAction }: Props) {
  const [credenciais, setCredenciais] = useState<CredencialComAdvogado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state for new/edit credential
  const [showForm, setShowForm] = useState(false);
  const [editingCredencial, setEditingCredencial] = useState<CredencialComAdvogado | null>(null);
  const [formData, setFormData] = useState<CredencialFormData>({
    tribunal: '',
    grau: '1',
    usuario: '',
    senha: '',
  });

  // State para modo lote (nova credencial)
  const [modoLote, setModoLote] = useState(true); // Padrão é lote para novas credenciais
  const [loteFormData, setLoteFormData] = useState<CredencialLoteFormData>({
    tribunais: [],
    graus: ['1', '2'],
    senha: '',
    modoDuplicata: 'pular',
  });
  const [loteResultado, setLoteResultado] = useState<ResumoCriacaoEmLote | null>(null);

  // Toggle confirmation dialog
  const [toggleDialog, setToggleDialog] = useState<{
    open: boolean;
    credencial: CredencialComAdvogado | null;
  }>({
    open: false,
    credencial: null,
  });

  // Fetch credentials for this advogado
  const buscarCredenciais = useCallback(async () => {
    if (!advogado) return;

    setIsLoading(true);
    try {
      const result = await actionListarCredenciais({ advogado_id: advogado.id });
      if (result.success && result.data) {
        setCredenciais(result.data as CredencialComAdvogado[]);
      } else {
        toast.error(result.error || 'Erro ao buscar credenciais');
      }
    } catch (_error) {
      toast.error('Erro ao buscar credenciais');
    } finally {
      setIsLoading(false);
    }
  }, [advogado]);

  useEffect(() => {
    if (open && advogado) {
      buscarCredenciais();
      setShowForm(false);
      setEditingCredencial(null);
    }
  }, [open, advogado, buscarCredenciais]);

  // Reset form
  const resetForm = () => {
    setFormData({
      tribunal: '',
      grau: '1',
      usuario: '',
      senha: '',
    });
    setLoteFormData({
      tribunais: [],
      graus: ['1', '2'],
      senha: '',
      modoDuplicata: 'pular',
    });
    setLoteResultado(null);
    setShowForm(false);
    setEditingCredencial(null);
    setShowPassword(false);
    setModoLote(true);
  };

  // Handle add new credential
  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  // Handle edit credential
  const handleEdit = (credencial: CredencialComAdvogado) => {
    setEditingCredencial(credencial);
    setModoLote(false); // Edição sempre é individual
    setFormData({
      tribunal: credencial.tribunal,
      grau: credencial.grau as '1' | '2',
      usuario: credencial.usuario || '',
      senha: '', // Don't show existing password
    });
    setShowForm(true);
  };

  // Handle save credential (individual ou lote)
  const handleSave = async () => {
    if (!advogado) return;

    setIsSaving(true);
    try {
      if (editingCredencial) {
        // Update existing (sempre individual)
        if (!formData.tribunal) {
          toast.error('Selecione o tribunal');
          return;
        }

        const updateData: Record<string, unknown> = {
          tribunal: formData.tribunal,
          grau: formData.grau,
          usuario: formData.usuario || null,
        };
        if (formData.senha) {
          updateData.senha = formData.senha;
        }

        const result = await actionAtualizarCredencial(editingCredencial.id, updateData);
        if (!result.success) {
          throw new Error(result.error || 'Erro ao atualizar credencial');
        }
        toast.success('Credencial atualizada com sucesso!');
        resetForm();
        await buscarCredenciais();
        onRefreshAction?.();
      } else if (modoLote) {
        // Create new - MODO LOTE
        if (loteFormData.tribunais.length === 0) {
          toast.error('Selecione pelo menos um tribunal');
          return;
        }
        if (loteFormData.graus.length === 0) {
          toast.error('Selecione pelo menos um grau');
          return;
        }
        if (!loteFormData.senha) {
          toast.error('Informe a senha');
          return;
        }

        const result = await actionCriarCredenciaisEmLote({
          advogado_id: advogado.id,
          tribunais: loteFormData.tribunais,
          graus: loteFormData.graus,
          senha: loteFormData.senha,
          modo_duplicata: loteFormData.modoDuplicata,
        });

        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar credenciais');
        }

        const resumo = result.data as ResumoCriacaoEmLote;
        setLoteResultado(resumo);

        if (resumo.criadas > 0 || resumo.atualizadas > 0) {
          toast.success(`${resumo.criadas} credencial(is) criada(s), ${resumo.atualizadas} atualizada(s)`);
        }
        if (resumo.erros > 0) {
          toast.error(`${resumo.erros} erro(s) ao criar credenciais`);
        }

        await buscarCredenciais();
        onRefreshAction?.();
      } else {
        // Create new - MODO INDIVIDUAL
        if (!formData.tribunal) {
          toast.error('Selecione o tribunal');
          return;
        }
        if (!formData.senha) {
          toast.error('Informe a senha');
          return;
        }

        const createData: CriarCredencialParams = {
          advogado_id: advogado.id,
          tribunal: formData.tribunal,
          grau: formData.grau,
          usuario: formData.usuario || undefined,
          senha: formData.senha,
        };

        const result = await actionCriarCredencial(createData);
        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar credencial');
        }
        toast.success('Credencial cadastrada com sucesso!');
        resetForm();
        await buscarCredenciais();
        onRefreshAction?.();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar credencial');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async () => {
    if (!toggleDialog.credencial) return;

    try {
      const result = await actionAtualizarCredencial(toggleDialog.credencial.id, {
        active: !toggleDialog.credencial.active,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar status');
      }

      toast.success(
        `Credencial ${toggleDialog.credencial.active ? 'desativada' : 'ativada'} com sucesso!`
      );

      setToggleDialog({ open: false, credencial: null });
      await buscarCredenciais();
      onRefreshAction?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar status');
    }
  };

  // Get tribunals not yet configured
  const tribunaisDisponiveis = TRIBUNAIS_ATIVOS.filter((trt) => {
    // Allow all tribunals when editing
    if (editingCredencial?.tribunal === trt) return true;
    // Filter out tribunals that already have credentials for this grau
    return !credenciais.some((c) => c.tribunal === trt && c.grau === formData.grau && c.active);
  });

  if (!advogado) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChangeAction}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle>Credenciais de {advogado.nome_completo}</DialogTitle>
            <DialogDescription>
              Gerencie as credenciais de acesso aos tribunais (PJE) para este advogado.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Credentials list */}
            {!showForm && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium">Credenciais Cadastradas</h4>
                  <Button size="sm" onClick={handleAddNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : credenciais.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma credencial cadastrada.</p>
                    <p className="text-sm">Clique em &quot;Adicionar&quot; para cadastrar a primeira.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-75 pr-4">
                    <div className="space-y-3">
                      {credenciais.map((credencial) => (
                        <div
                          key={credencial.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${credencial.active ? 'bg-card' : 'bg-muted/50 opacity-60'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <TribunalBadge codigo={credencial.tribunal} />
                            <Badge variant="outline">
                              {GRAU_LABELS[credencial.grau] || credencial.grau}
                            </Badge>
                            {credencial.usuario && (
                              <span className="text-xs text-muted-foreground">
                                Login: {credencial.usuario}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant={credencial.active ? 'default' : 'secondary'}
                              className="mr-2"
                            >
                              {credencial.active ? 'Ativa' : 'Inativa'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon" aria-label="Editar"
                              onClick={() => handleEdit(credencial)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon" aria-label={credencial.active ? 'Desativar' : 'Ativar'}
                              onClick={() => setToggleDialog({ open: true, credencial })}
                              title={credencial.active ? 'Desativar' : 'Ativar'}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </>
            )}

            {/* Credential form */}
            {showForm && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium">
                    {editingCredencial ? 'Editar Credencial' : 'Nova Credencial'}
                  </h4>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    Voltar
                  </Button>
                </div>

                {/* Resultado do lote */}
                {loteResultado ? (
                  <div className="space-y-4">
                    <Alert variant={loteResultado.erros > 0 ? 'destructive' : 'default'}>
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Operação concluída</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside mt-2 text-sm">
                          <li><strong>{loteResultado.criadas}</strong> credencial(is) criada(s)</li>
                          <li><strong>{loteResultado.atualizadas}</strong> credencial(is) atualizada(s)</li>
                          <li><strong>{loteResultado.puladas}</strong> credencial(is) pulada(s)</li>
                          {loteResultado.erros > 0 && (
                            <li className="text-destructive"><strong>{loteResultado.erros}</strong> erro(s)</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>

                    <ScrollArea className="h-50 border rounded-md p-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Tribunal</th>
                            <th className="text-left py-2">Grau</th>
                            <th className="text-left py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loteResultado.detalhes.map((d, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2">{d.tribunal}</td>
                              <td className="py-2">{GRAUS_LABELS[d.grau]}</td>
                              <td className="py-2">
                                <span className={`flex items-center gap-1 ${d.status === 'criada' ? 'text-success' :
                                  d.status === 'atualizada' ? 'text-info' :
                                    d.status === 'pulada' ? 'text-warning' : 'text-destructive'
                                  }`}>
                                  {d.status === 'criada' && <CheckCircle className="h-3 w-3" />}
                                  {d.status === 'atualizada' && <CheckCircle className="h-3 w-3" />}
                                  {d.status === 'pulada' && <AlertCircle className="h-3 w-3" />}
                                  {d.status === 'erro' && <XCircle className="h-3 w-3" />}
                                  {d.status === 'criada' ? 'Criada' :
                                    d.status === 'atualizada' ? 'Atualizada' :
                                      d.status === 'pulada' ? 'Pulada' : 'Erro'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollArea>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button onClick={resetForm}>Fechar</Button>
                    </div>
                  </div>
                ) : editingCredencial ? (
                  // Formulário de edição (individual)
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="tribunal">Tribunal *</Label>
                        <Select
                          value={formData.tribunal}
                          onValueChange={(value) => setFormData({ ...formData, tribunal: value })}
                        >
                          <SelectTrigger id="tribunal">
                            <SelectValue placeholder="Selecione o TRT" />
                          </SelectTrigger>
                          <SelectContent>
                            {tribunaisDisponiveis.map((trt) => (
                              <SelectItem key={trt} value={trt}>
                                {trt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="grau">Grau *</Label>
                        <Select
                          value={formData.grau}
                          onValueChange={(value) =>
                            setFormData({ ...formData, grau: value as '1' | '2' })
                          }
                        >
                          <SelectTrigger id="grau">
                            <SelectValue placeholder="Selecione o grau" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRAUS.map((grau) => (
                              <SelectItem key={grau.value} value={grau.value}>
                                {grau.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="usuario">
                        Usuario (Login PJE)
                        <span className="text-xs text-muted-foreground ml-2">
                          Deixe em branco para usar o CPF
                        </span>
                      </Label>
                      <Input
                        id="usuario"
                        value={formData.usuario}
                        onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                        placeholder={advogado.cpf}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="senha">
                        Senha
                        <span className="text-xs text-muted-foreground ml-2">
                          Deixe em branco para manter a atual
                        </span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="senha"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.senha}
                          onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                          placeholder="********"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon" aria-label="Ocultar"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={resetForm} disabled={isSaving}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Formulário de criação em lote
                  <div className="space-y-4">
                    {/* Seleção de Tribunais */}
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label>
                          Tribunais <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setLoteFormData({ ...loteFormData, tribunais: [...TRIBUNAIS_ATIVOS] })}
                            disabled={isSaving}
                          >
                            Todos
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setLoteFormData({ ...loteFormData, tribunais: [] })}
                            disabled={isSaving}
                          >
                            Limpar
                          </Button>
                        </div>
                      </div>
                      <ScrollArea className="h-35 border rounded-md p-3">
                        <div className="grid grid-cols-4 gap-2">
                          {TRIBUNAIS_ATIVOS.map((trt) => (
                            <div key={trt} className="flex items-center space-x-2">
                              <Checkbox
                                id={`trt-${trt}`}
                                checked={loteFormData.tribunais.includes(trt)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setLoteFormData({ ...loteFormData, tribunais: [...loteFormData.tribunais, trt] });
                                  } else {
                                    setLoteFormData({ ...loteFormData, tribunais: loteFormData.tribunais.filter(t => t !== trt) });
                                  }
                                }}
                                disabled={isSaving}
                              />
                              <label
                                htmlFor={`trt-${trt}`}
                                className="text-sm cursor-pointer"
                                title={TRIBUNAIS_LABELS[trt]}
                              >
                                {trt}
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <p className="text-xs text-muted-foreground">
                        {loteFormData.tribunais.length} tribunal(is) selecionado(s)
                      </p>
                    </div>

                    {/* Seleção de Graus */}
                    <div className="grid gap-2">
                      <Label>
                        Graus <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-4">
                        {GRAUS.map((grau) => (
                          <label key={grau.value} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={loteFormData.graus.includes(grau.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setLoteFormData({ ...loteFormData, graus: [...loteFormData.graus, grau.value] });
                                } else if (loteFormData.graus.length > 1) {
                                  setLoteFormData({ ...loteFormData, graus: loteFormData.graus.filter(g => g !== grau.value) });
                                }
                              }}
                              disabled={isSaving}
                            />
                            <span className="text-sm">{grau.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Senha */}
                    <div className="grid gap-2">
                      <Label htmlFor="senha-lote">
                        Senha <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="senha-lote"
                          type={showPassword ? 'text' : 'password'}
                          value={loteFormData.senha}
                          onChange={(e) => setLoteFormData({ ...loteFormData, senha: e.target.value })}
                          placeholder="Senha única para todas as credenciais"
                          className="pr-10"
                          disabled={isSaving}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon" aria-label="Ocultar"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        O login (usuário) será o CPF do advogado para todas as credenciais.
                      </p>
                    </div>

                    {/* Modo duplicata */}
                    <div className="grid gap-2">
                      <Label>Se a credencial já existir</Label>
                      <RadioGroup
                        value={loteFormData.modoDuplicata}
                        onValueChange={(v) => setLoteFormData({ ...loteFormData, modoDuplicata: v as 'pular' | 'sobrescrever' })}
                        className="flex gap-4"
                        disabled={isSaving}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pular" id="modo-pular" />
                          <label htmlFor="modo-pular" className="text-sm cursor-pointer">
                            Pular
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sobrescrever" id="modo-sobrescrever" />
                          <label htmlFor="modo-sobrescrever" className="text-sm cursor-pointer">
                            Atualizar senha
                          </label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Preview */}
                    {loteFormData.tribunais.length > 0 && loteFormData.graus.length > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Resumo</AlertTitle>
                        <AlertDescription>
                          Serão criadas até <strong>{loteFormData.tribunais.length * loteFormData.graus.length}</strong> credenciais
                          ({loteFormData.tribunais.length} tribunal(is) × {loteFormData.graus.length} grau(s))
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={resetForm} disabled={isSaving}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving || loteFormData.tribunais.length === 0 || !loteFormData.senha}
                      >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Cadastrar {loteFormData.tribunais.length * loteFormData.graus.length} Credenciais
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChangeAction(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle status confirmation */}
      <AlertDialog
        open={toggleDialog.open}
        onOpenChange={(open) => setToggleDialog({ ...toggleDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleDialog.credencial?.active ? 'Desativar' : 'Ativar'} credencial?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleDialog.credencial?.active
                ? 'A credencial sera desativada e nao podera ser usada para capturas.'
                : 'A credencial sera ativada e podera ser usada para capturas.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus}>
              {toggleDialog.credencial?.active ? 'Desativar' : 'Ativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
