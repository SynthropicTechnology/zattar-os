
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, Search, AlertCircle, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useCargos } from '@/app/(authenticated)/cargos';
import { actionAtualizarUsuario } from '../../actions/usuarios-actions';
import type { Usuario, Endereco, GeneroUsuario } from '../../domain';
import { getAvatarUrl } from '../../utils';
import { AvatarEditDialog } from '../avatar/avatar-edit-dialog';
import { buscarEnderecoPorCep, limparCep } from '@/lib/utils/viacep';
import { Typography } from '@/components/ui/typography';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { GlassPanel } from '@/components/shared/glass-panel';

interface UsuarioEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario;
  onSuccess?: () => void;
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UsuarioEditDialog({
  open,
  onOpenChange,
  usuario,
  onSuccess,
}: UsuarioEditDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isBuscandoCep, setIsBuscandoCep] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    nomeExibicao: '',
    cpf: '',
    rg: '',
    dataNascimento: '',
    genero: '' as GeneroUsuario | '',
    oab: '',
    ufOab: '',
    cargoId: null as number | null,
    emailPessoal: '',
    emailCorporativo: '',
    telefone: '',
    ramal: '',
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
    } as Endereco,
    ativo: true,
  });

  // Buscar lista de cargos
  const { cargos, isLoading: isLoadingCargos } = useCargos();
  const formRef = useRef<HTMLFormElement>(null);

  // Preencher formulário quando usuário mudar
  useEffect(() => {
    if (usuario) {
      setFormData({
        nomeCompleto: usuario.nomeCompleto || '',
        nomeExibicao: usuario.nomeExibicao || '',
        cpf: usuario.cpf || '',
        rg: usuario.rg || '',
        dataNascimento: usuario.dataNascimento || '',
        genero: usuario.genero || '',
        oab: usuario.oab || '',
        ufOab: usuario.ufOab || '',
        cargoId: usuario.cargoId || null,
        emailPessoal: usuario.emailPessoal || '',
        emailCorporativo: usuario.emailCorporativo || '',
        telefone: usuario.telefone || '',
        ramal: usuario.ramal || '',
        endereco: {
          logradouro: usuario.endereco?.logradouro || '',
          numero: usuario.endereco?.numero || '',
          complemento: usuario.endereco?.complemento || '',
          bairro: usuario.endereco?.bairro || '',
          cidade: usuario.endereco?.cidade || '',
          estado: usuario.endereco?.estado || '',
          cep: usuario.endereco?.cep || '',
        },
        ativo: usuario.ativo,
      });
      setCurrentAvatarUrl(getAvatarUrl(usuario.avatarUrl));
    }
  }, [usuario]);

  // Função para buscar endereço por CEP
  const handleBuscarCep = async () => {
    if (!formData.endereco.cep) {
      toast.error('Digite um CEP primeiro');
      return;
    }

    const cep = limparCep(formData.endereco.cep);

    if (cep.length !== 8) {
      toast.error('CEP deve conter 8 dígitos');
      return;
    }

    setIsBuscandoCep(true);

    try {
      const endereco = await buscarEnderecoPorCep(cep);

      if (!endereco) {
        toast.error('CEP não encontrado');
        return;
      }

      setFormData({
        ...formData,
        endereco: {
          ...formData.endereco,
          cep: endereco.cep,
          logradouro: endereco.logradouro,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          estado: endereco.estado,
          complemento: endereco.complemento || formData.endereco.complemento || '',
        },
      });

      toast.success('Endereço encontrado!');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao buscar CEP. Tente novamente.'
      );
    } finally {
      setIsBuscandoCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        ...formData,
        genero: formData.genero || null,
        cargoId: formData.cargoId || null,
        endereco: Object.values(formData.endereco).some((v) => v)
          ? formData.endereco
          : null,
      };

      const result = await actionAtualizarUsuario(usuario.id, payload);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar usuário');
      }

      // Detectar desativação e mostrar feedback detalhado
      if (result.itensDesatribuidos && typeof result.itensDesatribuidos === 'object' && result.itensDesatribuidos !== null) {
        const itens = result.itensDesatribuidos as Record<string, unknown>;
        const total = typeof itens.total === 'number' ? itens.total : 0;
        const processos = typeof itens.processos === 'number' ? itens.processos : 0;
        const audiencias = typeof itens.audiencias === 'number' ? itens.audiencias : 0;
        const pendentes = typeof itens.pendentes === 'number' ? itens.pendentes : 0;
        const expedientes_manuais = typeof itens.expedientes_manuais === 'number' ? itens.expedientes_manuais : 0;
        const contratos = typeof itens.contratos === 'number' ? itens.contratos : 0;

        if (total > 0 && typeof total === 'number') {
          const itens = [];
          if (processos > 0) itens.push(`${processos} processo(s)`);
          if (audiencias > 0) itens.push(`${audiencias} audiência(s)`);
          if (pendentes > 0) itens.push(`${pendentes} pendente(s)`);
          if (expedientes_manuais > 0) itens.push(`${expedientes_manuais} expediente(s)`);
          if (contratos > 0) itens.push(`${contratos} contrato(s)`);

          toast.success(
            `Usuário desativado e desatribuído de ${total} ${total === 1 ? 'item' : 'itens'}`,
            {
              description: itens.join(', '),
              duration: 6000,
            }
          );
        } else {
          toast.success('Usuário desativado com sucesso!');
        }
      } else {
        toast.success('Usuário atualizado com sucesso!');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar usuário. Tente novamente.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Usuário"
      maxWidth="4xl"
      footer={
        <Button
          type="submit"
          onClick={() => formRef.current?.requestSubmit()}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </>
          )}
        </Button>
      }
    >
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <div
              className="relative group cursor-pointer"
              onClick={() => setAvatarDialogOpen(true)}
            >
              <Avatar size="2xl" className="border-2 border-muted">
                <AvatarImage src={currentAvatarUrl || undefined} alt={formData.nomeExibicao || usuario.nomeExibicao} />
                <AvatarFallback className="text-lg font-medium">
                  {getInitials(formData.nomeExibicao || usuario.nomeExibicao)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <Typography.Small className="font-medium">Foto de Perfil</Typography.Small>
              <p className="text-xs text-muted-foreground">
                Clique na imagem para alterar o avatar do usuário
              </p>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="grid gap-4">
            <Typography.Small className="font-medium text-muted-foreground">Dados Pessoais</Typography.Small>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nomeCompleto">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={(e) =>
                    setFormData({ ...formData, nomeCompleto: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nomeExibicao">
                  Nome de Exibição <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nomeExibicao"
                  value={formData.nomeExibicao}
                  onChange={(e) =>
                    setFormData({ ...formData, nomeExibicao: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <FormDatePicker
                  id="dataNascimento"
                  value={formData.dataNascimento || undefined}
                  onChange={(v) => setFormData({ ...formData, dataNascimento: v || '' })}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) =>
                    setFormData({ ...formData, cpf: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={formData.rg}
                  onChange={(e) =>
                    setFormData({ ...formData, rg: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="genero">Gênero</Label>
                <Select
                  value={formData.genero || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, genero: value as GeneroUsuario })
                  }
                >
                  <SelectTrigger id="genero">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                    <SelectItem value="prefiro_nao_informar">
                      Prefiro não informar
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contato */}
          <GlassPanel depth={1} className="p-4 grid gap-4">
            <Typography.Small className="font-medium text-muted-foreground">Contato</Typography.Small>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="emailCorporativo">
                  E-mail Corporativo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="emailCorporativo"
                  type="email"
                  value={formData.emailCorporativo}
                  onChange={(e) =>
                    setFormData({ ...formData, emailCorporativo: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emailPessoal">E-mail Pessoal</Label>
                <Input
                  id="emailPessoal"
                  type="email"
                  value={formData.emailPessoal}
                  onChange={(e) =>
                    setFormData({ ...formData, emailPessoal: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({ ...formData, telefone: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ramal">Ramal</Label>
                <Input
                  id="ramal"
                  value={formData.ramal}
                  onChange={(e) =>
                    setFormData({ ...formData, ramal: e.target.value })
                  }
                />
              </div>
            </div>
          </GlassPanel>

          {/* Profissional */}
          <GlassPanel depth={1} className="p-4 grid gap-4">
            <Typography.Small className="font-medium text-muted-foreground">Profissional</Typography.Small>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Select
                  value={formData.cargoId?.toString() || 'none'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      cargoId: value === 'none' ? null : parseInt(value, 10),
                    })
                  }
                  disabled={isLoadingCargos}
                >
                  <SelectTrigger id="cargo">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {cargos.map((cargo) => (
                      <SelectItem key={cargo.id} value={cargo.id.toString()}>
                        {cargo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="oab">OAB</Label>
                <Input
                  id="oab"
                  value={formData.oab}
                  onChange={(e) =>
                    setFormData({ ...formData, oab: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ufOab">UF OAB</Label>
                <Input
                  id="ufOab"
                  value={formData.ufOab}
                  maxLength={2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ufOab: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
            </div>
          </GlassPanel>

          {/* Endereço */}
          <GlassPanel depth={1} className="p-4 grid gap-4">
            <Typography.Small className="font-medium text-muted-foreground">Endereço</Typography.Small>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="flex gap-2">
                  <Input
                    id="cep"
                    value={formData.endereco.cep}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endereco: { ...formData.endereco, cep: e.target.value },
                      })
                    }
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleBuscarCep}
                    disabled={isBuscandoCep}
                    title="Buscar CEP"
                  >
                    {isBuscandoCep ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                  id="logradouro"
                  value={formData.endereco.logradouro}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endereco: {
                        ...formData.endereco,
                        logradouro: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.endereco.numero}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endereco: { ...formData.endereco, numero: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.endereco.complemento}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endereco: {
                        ...formData.endereco,
                        complemento: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.endereco.bairro}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endereco: { ...formData.endereco, bairro: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.endereco.cidade}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endereco: { ...formData.endereco, cidade: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="estado">UF</Label>
                <Input
                  id="estado"
                  maxLength={2}
                  value={formData.endereco.estado}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endereco: {
                        ...formData.endereco,
                        estado: e.target.value.toUpperCase(),
                      },
                    })
                  }
                />
              </div>
            </div>
          </GlassPanel>

          {/* Status */}
          <GlassPanel depth={1} className="p-4 grid gap-4">
            <Typography.Small className="font-medium text-muted-foreground">Status do Usuário</Typography.Small>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ativo: !!checked })
                  }
                />
                <Label htmlFor="ativo" className="cursor-pointer font-normal">
                  Usuário ativo
                </Label>
              </div>

              {!formData.ativo && usuario.ativo && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Atenção:</strong> Desativar este usuário irá desatribuí-lo
                    automaticamente de todos os processos, audiências, pendentes,
                    expedientes e contratos atribuídos a ele. Você receberá um relatório
                    detalhado dos itens desatribuídos.
                  </AlertDescription>
                </Alert>
              )}

              {formData.ativo && !usuario.ativo && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Este usuário será reativado e poderá acessar o sistema normalmente.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </GlassPanel>
        </div>
      </form>

      {/* Avatar Edit Dialog */}
      <AvatarEditDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        usuarioId={usuario.id}
        avatarUrl={currentAvatarUrl}
        nomeExibicao={formData.nomeExibicao || usuario.nomeExibicao}
        onSuccess={() => {
          // Atualiza o avatar localmente após sucesso
          setCurrentAvatarUrl(getAvatarUrl(usuario.avatarUrl) + `?t=${Date.now()}`);
          onSuccess?.();
        }}
      />
    </DialogFormShell>
  );
}
