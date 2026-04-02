'use client';

/**
 * Dialog para compartilhar documentos com outros usuários
 */

import * as React from 'react';
import { Loader2, Search, UserPlus, X, Users, Mail, Trash2, Shield } from 'lucide-react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
} from '@/components/ui/responsive-dialog';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useDocumentSharing } from '../hooks/use-document-sharing';

interface ShareDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentoId: number;
  documentoTitulo?: string;
}

interface Usuario {
  id: number;
  nomeCompleto: string;
  nomeExibicao: string | null;
  emailCorporativo: string | null;
}

type PermissaoTipo = 'visualizar' | 'editar';

export function ShareDocumentDialog({
  open,
  onOpenChange,
  documentoId,
  documentoTitulo,
}: ShareDocumentDialogProps) {
  const { 
    shares: compartilhamentos, 
    shareDocument, 
    updatePermission, 
    updateDeletePermission, 
    removeShare 
  } = useDocumentSharing(documentoId);
  
  const [loading, setLoading] = React.useState(false);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<Usuario[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<Usuario | null>(null);
  const [permissao, setPermissao] = React.useState<PermissaoTipo>('visualizar');
  const [podeDeletar, setPodeDeletar] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<number | null>(null);

  // Buscar usuários para compartilhar
  const searchUsers = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/usuarios/buscar?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        // Filtrar usuários que já têm compartilhamento
        const usuariosCompartilhados = new Set(compartilhamentos.map(c => c.usuario_id));
        setSearchResults(data.data.filter((u: Usuario) => !usuariosCompartilhados.has(u.id)));
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [compartilhamentos]);

  // Debounce para busca
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  // Compartilhar com usuário
  const handleShare = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      await shareDocument({
        documento_id: documentoId,
        usuario_id: selectedUser.id,
        permissao,
        pode_deletar: podeDeletar,
      });

      toast.success(`Documento compartilhado com ${selectedUser.nomeCompleto}`);
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      setPodeDeletar(false);
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao compartilhar documento');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar permissão
  const handleUpdatePermissao = async (compartilhamentoId: number, novaPermissao: PermissaoTipo) => {
    setActionLoading(compartilhamentoId);
    try {
      await updatePermission(compartilhamentoId, novaPermissao);
      toast.success('Permissão atualizada');
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar permissão');
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle permissão de deletar
  const handleTogglePodeDeletar = async (compartilhamentoId: number, novoPodeDeletar: boolean) => {
    setActionLoading(compartilhamentoId);
    try {
      await updateDeletePermission(compartilhamentoId, novoPodeDeletar);
      toast.success(novoPodeDeletar ? 'Permissão de deleção concedida' : 'Permissão de deleção removida');
    } catch (error) {
      console.error('Erro ao atualizar permissão de deleção:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar permissão de deleção');
    } finally {
      setActionLoading(null);
    }
  };

  // Remover compartilhamento
  const handleRemove = async (compartilhamentoId: number, nomeUsuario: string) => {
    setActionLoading(compartilhamentoId);
    try {
      await removeShare(compartilhamentoId);

      toast.success(`Acesso de ${nomeUsuario} removido`);
    } catch (error) {
      console.error('Erro ao remover compartilhamento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao remover compartilhamento');
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Compartilhar documento
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {documentoTitulo ? `Compartilhe "${documentoTitulo}" com outros usuários` : 'Adicione pessoas que podem acessar este documento'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody>
          <div className="space-y-4">
            {/* Busca de usuários */}
            <div className="space-y-2">
              <Label>Adicionar pessoas</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedUser(null);
                    }}
                    className="pl-9"
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                <Select value={permissao} onValueChange={(v) => setPermissao(v as PermissaoTipo)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visualizar">Visualizar</SelectItem>
                    <SelectItem value="editar">Editar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Opção de permissão de deleção */}
              <div className="flex items-center gap-2 mt-2">
                <Checkbox
                  id="pode-deletar"
                  checked={podeDeletar}
                  onCheckedChange={(checked) => setPodeDeletar(checked === true)}
                />
                <Label htmlFor="pode-deletar" className="text-sm text-muted-foreground cursor-pointer">
                  Permitir mover para lixeira
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Shield className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Quando ativado, o usuário poderá mover este documento para a lixeira.
                        Apenas o proprietário pode excluir permanentemente.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Resultados da busca */}
              {searchResults.length > 0 && !selectedUser && (
                <div className="mt-2 rounded-md border bg-background">
                  <ScrollArea className="max-h-40">
                    {searchResults.map((usuario) => (
                      <button
                        key={usuario.id}
                        type="button"
                        className="flex w-full items-center gap-3 p-2 hover:bg-accent text-left"
                        onClick={() => {
                          setSelectedUser(usuario);
                          setSearchResults([]);
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(usuario.nomeCompleto)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {usuario.nomeExibicao || usuario.nomeCompleto}
                          </p>
                          {usuario.emailCorporativo && (
                            <p className="text-xs text-muted-foreground truncate">
                              {usuario.emailCorporativo}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </ScrollArea>
                </div>
              )}

              {/* Usuário selecionado */}
              {selectedUser && (
                <div className="mt-2 flex items-center justify-between rounded-md border bg-muted/50 p-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(selectedUser.nomeCompleto)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {selectedUser.nomeExibicao || selectedUser.nomeCompleto}
                      </p>
                      {selectedUser.emailCorporativo && (
                        <p className="text-xs text-muted-foreground">
                          {selectedUser.emailCorporativo}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedUser(null);
                        setSearchQuery('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleShare} disabled={loading} size="sm">
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Lista de compartilhamentos */}
            <div className="space-y-2">
              <Label>Pessoas com acesso</Label>
              {compartilhamentos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Este documento ainda não foi compartilhado
                </p>
              ) : (
                <ScrollArea className="max-h-60">
                  <div className="space-y-2">
                    {compartilhamentos.map((compartilhamento) => (
                      <div
                        key={compartilhamento.id}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs">
                              {getInitials(compartilhamento.usuario.nomeCompleto)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {compartilhamento.usuario.nomeExibicao || compartilhamento.usuario.nomeCompleto}
                            </p>
                            {compartilhamento.usuario.emailCorporativo && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {compartilhamento.usuario.emailCorporativo}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={compartilhamento.permissao}
                            onValueChange={(v) =>
                              handleUpdatePermissao(compartilhamento.id, v as PermissaoTipo)
                            }
                            disabled={actionLoading === compartilhamento.id}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="visualizar">Visualizar</SelectItem>
                              <SelectItem value="editar">Editar</SelectItem>
                            </SelectContent>
                          </Select>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-8 w-8 ${compartilhamento.pode_deletar
                                    ? 'text-orange-500 hover:text-orange-600'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                  onClick={() =>
                                    handleTogglePodeDeletar(
                                      compartilhamento.id,
                                      !compartilhamento.pode_deletar
                                    )
                                  }
                                  disabled={actionLoading === compartilhamento.id}
                                >
                                  <Shield className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {compartilhamento.pode_deletar
                                    ? 'Pode mover para lixeira (clique para revogar)'
                                    : 'Não pode mover para lixeira (clique para permitir)'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() =>
                              handleRemove(compartilhamento.id, compartilhamento.usuario.nomeCompleto)
                            }
                            disabled={actionLoading === compartilhamento.id}
                          >
                            {actionLoading === compartilhamento.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
