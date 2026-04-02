'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { actionAlterarSenhaComVerificacao } from '@/app/app/usuarios';

interface AlterarSenhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AlterarSenhaDialog({
  open,
  onOpenChange,
  onSuccess,
}: AlterarSenhaDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Form state
  const [senhaAtual, setSenhaAtual] = React.useState('');
  const [novaSenha, setNovaSenha] = React.useState('');
  const [confirmarSenha, setConfirmarSenha] = React.useState('');

  // Show/hide password
  const [showSenhaAtual, setShowSenhaAtual] = React.useState(false);
  const [showNovaSenha, setShowNovaSenha] = React.useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = React.useState(false);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setError(null);
      setSuccessMessage(null);
      setShowSenhaAtual(false);
      setShowNovaSenha(false);
      setShowConfirmarSenha(false);
    }
  }, [open]);

  const validateForm = (): string | null => {
    if (!senhaAtual) {
      return 'Senha atual é obrigatória';
    }
    if (!novaSenha) {
      return 'Nova senha é obrigatória';
    }

    if (novaSenha.length < 8) {
      return 'Senha deve ter no mínimo 8 caracteres';
    }

    if (novaSenha.length > 72) {
      return 'Senha deve ter no máximo 72 caracteres';
    }

    if (novaSenha !== confirmarSenha) {
      return 'As senhas não coincidem';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validar formulário
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Verificar e atualizar senha via server action
      const result = await actionAlterarSenhaComVerificacao(senhaAtual, novaSenha);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao alterar senha');
      }

      setSuccessMessage('Senha alterada com sucesso!');

      // Aguardar 1.5s para mostrar mensagem de sucesso
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao alterar senha';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Digite sua nova senha. Ela deve ter no mínimo 8 caracteres.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-700 dark:text-green-400 border border-green-500/20">
                {successMessage}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="senhaAtual">Senha Atual *</Label>
              <div className="relative">
                <Input
                  id="senhaAtual"
                  type={showSenhaAtual ? 'text' : 'password'}
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                  required
                  disabled={isLoading || !!successMessage}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading || !!successMessage}
                >
                  {showSenhaAtual ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="novaSenha"
                  type={showNovaSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                  disabled={isLoading || !!successMessage}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNovaSenha(!showNovaSenha)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading || !!successMessage}
                >
                  {showNovaSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mínimo de 8 caracteres, máximo de 72
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={showConfirmarSenha ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Digite novamente sua nova senha"
                  required
                  disabled={isLoading || !!successMessage}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading || !!successMessage}
                >
                  {showConfirmarSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading || !!successMessage}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !!successMessage}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar Senha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
