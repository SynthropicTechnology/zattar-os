
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Loader2, User, Shield, Camera, Calendar, Clock, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Typography } from '@/components/ui/typography';
import { toast } from 'sonner';

// Feature Components & Hooks
import {
  useUsuario,
  useUsuarioPermissoes,
  AvatarEditDialog,
  UsuarioEditDialog,
  RedefinirSenhaDialog,
  PermissoesMatriz,
  AuthLogsTimeline,
  AtividadesCards,
  AtividadesRecentes,
  formatarCpf,
  formatarTelefone,
  formatarData,
  formatarGenero,
  formatarEnderecoCompleto,
  getAvatarUrl,
  type Usuario,
  actionAtualizarUsuario,
} from '@/app/(authenticated)/usuarios';
import { actionObterPerfil } from '@/app/(authenticated)/perfil';

function DataField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm">{value || '-'}</p>
    </div>
  );
}

// Extended Usuario type with permission flag
interface UsuarioComPermissao extends Usuario {
  podeGerenciarPermissoes?: boolean;
}

interface UsuarioDetalhesProps {
  id: number;
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatarDataCadastro(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function UsuarioDetalhes({ id }: UsuarioDetalhesProps) {
  const router = useRouter();

  // Usuario Data Hook
  const { usuario, isLoading: isLoadingUsuario, error: errorUsuario, refetch: refetchUsuario } = useUsuario(id);

  // Permissoes Hook
  const {
    matriz,
    isLoading: isLoadingPermissoes,
    isSaving: isSavingPermissoes,
    togglePermissao,
    save: savePermissoes,
    resetar,
    hasChanges
  } = useUsuarioPermissoes(id);

  // States for UI
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioComPermissao | null>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [redefinirSenhaOpen, setRedefinirSenhaOpen] = useState(false);
  const [isSavingSuperAdmin, setIsSavingSuperAdmin] = useState(false);

  // Fetch logged user profile
  useEffect(() => {
    actionObterPerfil().then((res) => {
      if (res.success && res.data) {
        setUsuarioLogado(res.data as UsuarioComPermissao);
      }
    });
  }, []);

  const salvarSuperAdmin = async (novoValor: boolean) => {
    if (!usuario || !usuarioLogado) return;

    if (usuario.id === usuarioLogado.id && !novoValor) {
      toast.error('Você não pode remover seu próprio status de Super Admin');
      return;
    }

    try {
      setIsSavingSuperAdmin(true);

      const result = await actionAtualizarUsuario(id, { isSuperAdmin: novoValor });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao alterar status de Super Admin');
      }

      toast.success(`Status de Super Admin ${novoValor ? 'ativado' : 'desativado'}`);
      refetchUsuario();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setIsSavingSuperAdmin(false);
    }
  };

  const handleSavePermissoes = async () => {
    const success = await savePermissoes();
    if (success) {
      toast.success('Permissões atualizadas com sucesso');
    } else {
       toast.error('Erro ao salvar permissões');
    }
    return success;
  };

  const isLoading = isLoadingUsuario;
  const error = errorUsuario;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-400">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/app/usuarios')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        </div>
        <Card className="p-12">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-base font-medium">Carregando dados do usuário...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !usuario) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-400">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/app/usuarios')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Typography.H1>Usuário</Typography.H1>
        </div>
        <Card className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar usuário</AlertTitle>
            <AlertDescription>
              {error || 'Usuário não encontrado ou você não tem permissão para acessá-lo.'}
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button onClick={() => router.push('/app/usuarios')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Usuários
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-400">
      {/* Header do Perfil */}
      <Card className="p-6">
        <div className="flex items-start gap-5">
          {/* Botão voltar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/app/usuarios')}
            className="shrink-0 -ml-2 -mt-1"
            title="Voltar para Usuários"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Avatar */}
          <div
            className="relative group cursor-pointer shrink-0"
            onClick={() => setAvatarDialogOpen(true)}
          >
            <Avatar className="h-20 w-20 border-2 border-muted">
              <AvatarImage src={getAvatarUrl(usuario.avatarUrl) || undefined} alt={usuario.nomeExibicao} />
              <AvatarFallback className="text-xl font-medium">
                {getInitials(usuario.nomeExibicao)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </div>

          {/* Info Principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Typography.H2 className="truncate">{usuario.nomeCompleto}</Typography.H2>
                <p className="text-sm text-muted-foreground mt-0.5">{usuario.emailCorporativo}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-2"
                onClick={() => setEditDialogOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {usuario.cargo && (
                <Badge variant="outline">{usuario.cargo.nome}</Badge>
              )}
              {usuario.isSuperAdmin && (
                <Badge variant="destructive" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Super Admin
                </Badge>
              )}
              <Badge variant={usuario.ativo ? 'success' : 'outline'}>
                {usuario.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>

            {/* Metadados */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Cadastro: {formatarDataCadastro(usuario.createdAt)}</span>
              </div>
              {usuario.updatedAt && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Atualizado: {formatarDataCadastro(usuario.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs com conteúdo organizado */}
      <Tabs defaultValue="visao-geral" className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="dados">Dados Cadastrais</TabsTrigger>
          <TabsTrigger value="atividades">Atividades</TabsTrigger>
          <TabsTrigger value="permissoes">Permissões</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="visao-geral" className="space-y-6">
          <AtividadesCards usuarioId={usuario.id} />
        </TabsContent>

        {/* Tab: Dados Cadastrais */}
        <TabsContent value="dados" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                <DataField label="Nome Completo" value={usuario.nomeCompleto} />
                <DataField label="Nome de Exibição" value={usuario.nomeExibicao} />
                <DataField label="CPF" value={formatarCpf(usuario.cpf)} />
                <DataField label="RG" value={usuario.rg} />
                <DataField label="Data de Nascimento" value={formatarData(usuario.dataNascimento)} />
                <DataField label="Gênero" value={formatarGenero(usuario.genero)} />
                <DataField label="E-mail Corporativo" value={usuario.emailCorporativo} />
                <DataField label="E-mail Pessoal" value={usuario.emailPessoal} />
                <DataField label="Telefone" value={formatarTelefone(usuario.telefone)} />
                <DataField label="Ramal" value={usuario.ramal} />
                <DataField label="OAB" value={usuario.oab && usuario.ufOab ? `${usuario.oab} / ${usuario.ufOab}` : null} />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cargo</p>
                  <p className="text-sm">{usuario.cargo ? usuario.cargo.nome : '-'}</p>
                  {usuario.cargo?.descricao && (
                    <p className="text-xs text-muted-foreground">{usuario.cargo.descricao}</p>
                  )}
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <DataField label="Endereço" value={formatarEnderecoCompleto(usuario.endereco)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Atividades */}
        <TabsContent value="atividades" className="space-y-6">
          <AtividadesCards usuarioId={usuario.id} />
          <AtividadesRecentes usuarioId={usuario.id} />
        </TabsContent>

        {/* Tab: Permissões */}
        <TabsContent value="permissoes" className="space-y-6">
          <PermissoesMatriz
            matriz={matriz}
            isSuperAdmin={usuario.isSuperAdmin}
            hasChanges={hasChanges}
            isSaving={isSavingPermissoes}
            isLoading={isLoadingPermissoes}
            canEdit={!usuario.isSuperAdmin && (usuarioLogado?.isSuperAdmin || usuarioLogado?.podeGerenciarPermissoes || false)}
            onTogglePermissao={togglePermissao}
            onSalvar={handleSavePermissoes}
            onResetar={resetar}
          />
        </TabsContent>

        {/* Tab: Segurança */}
        <TabsContent value="seguranca" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credenciais de Acesso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Redefinir Senha</div>
                  <div className="text-sm text-muted-foreground">
                    Define uma nova senha para o usuário selecionado.
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRedefinirSenhaOpen(true)}
                >
                  Redefinir Senha
                </Button>
              </div>
            </CardContent>
          </Card>

          <AuthLogsTimeline usuarioId={usuario.id} />

          {usuarioLogado?.isSuperAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Configurações de Segurança
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Super Administrador</div>
                    <div className="text-sm text-muted-foreground">
                      Super Admins possuem acesso total ao sistema e bypassam todas as permissões.
                    </div>
                    {usuario.id === usuarioLogado.id && (
                      <div className="text-xs text-orange-600 dark:text-orange-500 mt-2">
                        Você não pode remover seu próprio status de Super Admin
                      </div>
                    )}
                  </div>
                  <Switch
                    checked={usuario.isSuperAdmin}
                    onCheckedChange={salvarSuperAdmin}
                    disabled={isSavingSuperAdmin || usuario.id === usuarioLogado.id}
                    aria-label="Marcar como Super Administrador"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AvatarEditDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        usuarioId={usuario.id}
        avatarUrl={getAvatarUrl(usuario.avatarUrl)}
        nomeExibicao={usuario.nomeExibicao}
        onSuccess={() => refetchUsuario()}
      />

      <UsuarioEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        usuario={usuario}
        onSuccess={() => refetchUsuario()}
      />

      <RedefinirSenhaDialog
        open={redefinirSenhaOpen}
        onOpenChange={setRedefinirSenhaOpen}
        usuario={usuario}
        onSuccess={() => undefined}
      />
    </div>
  );
}
