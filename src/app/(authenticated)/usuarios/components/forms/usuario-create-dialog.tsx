
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCargos } from '@/app/(authenticated)/cargos';
import { actionCriarUsuario } from '../../actions/usuarios-actions';
import type { UsuarioDados, GeneroUsuario, Endereco } from '../../domain';
import { DialogFormShell } from '@/components/shared/dialog-shell';

interface UsuarioCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UsuarioCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: UsuarioCreateDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { cargos, isLoading: isLoadingCargos } = useCargos();

  // Form state
  // Nota: senha é obrigatória na criação pela interface
  const [formData, setFormData] = React.useState<
    Partial<UsuarioDados & { senha?: string }>
  >({
    ativo: true,
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
    },
  });

  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (!open) {
      setFormData({
        ativo: true,
        endereco: {
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          cep: '',
        },
      });
      setError(null);
    }
  }, [open]);

  const handleEnderecoChange = (campo: keyof Endereco, valor: string) => {
    setFormData((prev) => ({
      ...prev,
      endereco: {
        ...(prev.endereco || {}),
        [campo]: valor,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      if (
        !formData.nomeCompleto ||
        !formData.nomeExibicao ||
        !formData.cpf ||
        !formData.emailCorporativo ||
        !formData.senha
      ) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      // Casting para passar os dados requeridos, omitindo authUserId que vem do action se necessário
      const payload = {
         nomeCompleto: formData.nomeCompleto,
         nomeExibicao: formData.nomeExibicao,
         cpf: formData.cpf,
         emailCorporativo: formData.emailCorporativo,
         senha: formData.senha,
         rg: formData.rg,
         dataNascimento: formData.dataNascimento,
         genero: formData.genero,
         oab: formData.oab,
         ufOab: formData.ufOab,
         emailPessoal: formData.emailPessoal,
         telefone: formData.telefone,
         ramal: formData.ramal,
         endereco: formData.endereco && Object.values(formData.endereco).some((v) => Boolean(v))
           ? formData.endereco
           : null,
         cargoId: formData.cargoId,
         ativo: formData.ativo,
      };

      const result = await actionCriarUsuario(payload);

      // Verificar se é OperacaoUsuarioResult (português) ou formato padrão (inglês)
      const sucesso = 'sucesso' in result ? result.sucesso : ('success' in result ? result.success : false);
      const erro = 'erro' in result ? result.erro : ('error' in result ? result.error : undefined);

      if (!sucesso) {
        throw new Error(erro || 'Erro ao criar usuário');
      }

      toast.success('Usuário criado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao criar usuário';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof UsuarioDados | 'senha', value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Novo Usuário"
      maxWidth="2xl"
      footer={
        <>
            <Button
              type="submit"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Usuário
            </Button>
        </>
      }
    >
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nomeCompleto"
                  value={formData.nomeCompleto || ''}
                  onChange={(e) => handleChange('nomeCompleto', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomeExibicao">
                  Nome de Exibição <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nomeExibicao"
                  value={formData.nomeExibicao || ''}
                  onChange={(e) => handleChange('nomeExibicao', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">
                  CPF <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cpf"
                  value={formData.cpf || ''}
                  onChange={(e) => handleChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={formData.rg || ''}
                  onChange={(e) => handleChange('rg', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emailCorporativo">
                  E-mail Corporativo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="emailCorporativo"
                  type="email"
                  value={formData.emailCorporativo || ''}
                  onChange={(e) =>
                    handleChange('emailCorporativo', e.target.value)
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailPessoal">E-mail Pessoal</Label>
                <Input
                  id="emailPessoal"
                  type="email"
                  value={formData.emailPessoal || ''}
                  onChange={(e) => handleChange('emailPessoal', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="senha">
                  Senha <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha || ''}
                  onChange={(e) => handleChange('senha', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone || ''}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <FormDatePicker
                  id="dataNascimento"
                  value={formData.dataNascimento || undefined}
                  onChange={(v) => handleChange('dataNascimento', v)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genero">Gênero</Label>
                <select
                  id="genero"
                  aria-label="Gênero"
                  value={formData.genero || ''}
                  onChange={(e) =>
                    handleChange('genero', e.target.value as GeneroUsuario)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                >
                  <option value="">Selecione...</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                  <option value="prefiro_nao_informar">
                    Prefiro não informar
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="oab">OAB</Label>
                <Input
                  id="oab"
                  value={formData.oab || ''}
                  onChange={(e) => handleChange('oab', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ufOab">UF OAB</Label>
                <Input
                  id="ufOab"
                  value={formData.ufOab || ''}
                  onChange={(e) =>
                    handleChange('ufOab', e.target.value.toUpperCase())
                  }
                  maxLength={2}
                  placeholder="Ex: SP"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ramal">Ramal</Label>
                <Input
                  id="ramal"
                  value={formData.ramal || ''}
                  onChange={(e) => handleChange('ramal', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargoId">Cargo</Label>
                <Select
                  value={formData.cargoId?.toString() || 'none'}
                  onValueChange={(value) =>
                    handleChange('cargoId', value === 'none' ? null : parseInt(value, 10))
                  }
                  disabled={isLoading || isLoadingCargos}
                >
                  <SelectTrigger>
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
            </div>

            <div className="space-y-4 pt-2 border-t">
              <Label className="text-sm font-medium">Endereço</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={formData.endereco?.logradouro || ''}
                    onChange={(e) => handleEnderecoChange('logradouro', e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.endereco?.numero || ''}
                    onChange={(e) => handleEnderecoChange('numero', e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.endereco?.complemento || ''}
                    onChange={(e) => handleEnderecoChange('complemento', e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.endereco?.bairro || ''}
                    onChange={(e) => handleEnderecoChange('bairro', e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.endereco?.cidade || ''}
                    onChange={(e) => handleEnderecoChange('cidade', e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">UF</Label>
                  <Input
                    id="estado"
                    value={formData.endereco?.estado || ''}
                    onChange={(e) => handleEnderecoChange('estado', e.target.value.toUpperCase())}
                    maxLength={2}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.endereco?.cep || ''}
                    onChange={(e) => handleEnderecoChange('cep', e.target.value)}
                    placeholder="00000-000"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="ativo"
                checked={formData.ativo ?? true}
                onCheckedChange={(checked) =>
                  handleChange('ativo', !!checked)
                }
                disabled={isLoading}
              />
              <Label htmlFor="ativo" className="cursor-pointer">
                Usuário ativo
              </Label>
            </div>
          </div>
        </form>
    </DialogFormShell>
  );
}
