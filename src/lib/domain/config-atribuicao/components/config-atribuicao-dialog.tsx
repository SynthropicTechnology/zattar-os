"use client";

/**
 * ConfigAtribuicaoDialog - Dialog para gerenciar configurações de atribuição automática
 */

import * as React from "react";
import { Plus, Pencil, Trash2, AlertTriangle, Power, PowerOff } from "lucide-react";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { SemanticBadge } from "@/components/ui/semantic-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { RegiaoAtribuicao } from "../domain";
import {
  METODO_BALANCEAMENTO_LABELS,
  formatTrts,
} from "../domain";
import {
  actionListarRegioesAtribuicao,
  actionExcluirRegiaoAtribuicao,
  actionAlternarStatusRegiao,
} from "../actions/config-atribuicao-actions";
import { RegiaoFormDialog } from "./regiao-form-dialog";

interface UsuarioOption {
  id: number;
  nomeExibicao: string;
}

interface ConfigAtribuicaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuarios: UsuarioOption[];
}

export function ConfigAtribuicaoDialog({
  open,
  onOpenChange,
  usuarios,
}: ConfigAtribuicaoDialogProps) {
  const [regioes, setRegioes] = React.useState<RegiaoAtribuicao[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Estados para dialogs
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingRegiao, setEditingRegiao] = React.useState<RegiaoAtribuicao | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingRegiaoId, setDeletingRegiaoId] = React.useState<number | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Carregar regiões
  const loadRegioes = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarRegioesAtribuicao();
      if (result.success) {
        setRegioes(result.data);
      } else {
        setError(result.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar regiões");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar regiões quando o dialog abre
  React.useEffect(() => {
    if (open) {
      loadRegioes();
    }
  }, [open, loadRegioes]);

  // Abrir form para nova região
  const handleNovaRegiao = () => {
    setEditingRegiao(null);
    setFormDialogOpen(true);
  };

  // Abrir form para editar região
  const handleEditarRegiao = (regiao: RegiaoAtribuicao) => {
    setEditingRegiao(regiao);
    setFormDialogOpen(true);
  };

  // Confirmar exclusão
  const handleConfirmarExclusao = (id: number) => {
    setDeletingRegiaoId(id);
    setDeleteDialogOpen(true);
  };

  // Executar exclusão
  const handleExcluir = async () => {
    if (!deletingRegiaoId) return;

    setIsDeleting(true);
    try {
      const result = await actionExcluirRegiaoAtribuicao(deletingRegiaoId);
      if (result.success) {
        await loadRegioes();
      } else {
        setError(result.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir região");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingRegiaoId(null);
    }
  };

  // Alternar status ativo
  const handleAlternarStatus = async (regiao: RegiaoAtribuicao) => {
    try {
      const result = await actionAlternarStatusRegiao(regiao.id, !regiao.ativo);
      if (result.success) {
        await loadRegioes();
      } else {
        setError(result.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar status");
    }
  };

  // Callback de sucesso do form
  const handleFormSuccess = () => {
    setFormDialogOpen(false);
    setEditingRegiao(null);
    loadRegioes();
  };

  return (
    <>
      <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent
          showCloseButton={true}
          className="sm:max-w-2xl bg-background p-0 gap-0"
        >
          <ResponsiveDialogHeader className="px-6 pt-6 pb-4 border-b shrink-0 space-y-2">
            <ResponsiveDialogTitle className="text-xl">
              Configuração de Atribuição Automática
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Gerencie as regiões e regras de atribuição automática de responsáveis aos processos
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <ResponsiveDialogBody className="bg-background max-h-[60vh] overflow-y-auto">
            {/* Botão Nova Região */}
            <div className="p-4 border-b">
              <Button onClick={handleNovaRegiao} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Nova Região
              </Button>
            </div>

            {/* Erro */}
            {error && (
              <div className="mx-4 mt-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="p-8 text-center text-muted-foreground">
                Carregando regiões...
              </div>
            )}

            {/* Lista vazia */}
            {!isLoading && regioes.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Nenhuma região configurada.
                <br />
                Clique em &quot;Nova Região&quot; para começar.
              </div>
            )}

            {/* Lista de Regiões */}
            {!isLoading && regioes.length > 0 && (
              <div className="p-4 space-y-4">
                {regioes.map((regiao) => (
                  <RegiaoCard
                    key={regiao.id}
                    regiao={regiao}
                    onEditar={() => handleEditarRegiao(regiao)}
                    onExcluir={() => handleConfirmarExclusao(regiao.id)}
                    onAlternarStatus={() => handleAlternarStatus(regiao)}
                  />
                ))}
              </div>
            )}
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter className="px-6 py-4 border-t shrink-0 bg-muted/50">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Dialog de Formulário */}
      <RegiaoFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        regiao={editingRegiao}
        usuarios={usuarios}
        onSuccess={handleFormSuccess}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Região</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta região?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================================
// COMPONENTE DO CARD DE REGIÃO
// ============================================================================

interface RegiaoCardProps {
  regiao: RegiaoAtribuicao;
  onEditar: () => void;
  onExcluir: () => void;
  onAlternarStatus: () => void;
}

function RegiaoCard({ regiao, onEditar, onExcluir, onAlternarStatus }: RegiaoCardProps) {
  const responsaveisNomes =
    regiao.responsaveis?.map((r) => r.nomeExibicao).join(", ") ||
    regiao.responsaveisIds.map((id) => `ID ${id}`).join(", ");

  return (
    <div
      className={`border rounded-lg p-4 ${
        regiao.ativo
          ? "bg-card border-border"
          : "bg-muted/50 border-muted-foreground/20"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg truncate">{regiao.nome}</h3>
            {!regiao.ativo && (
              <SemanticBadge
                category="status"
                value="INATIVO"
                variantOverride="secondary"
                className="text-xs"
              >
                Inativo
              </SemanticBadge>
            )}
            <SemanticBadge
              category="status"
              value={`prioridade_${regiao.prioridade}`}
              variantOverride="outline"
              className="text-xs"
            >
              Prioridade: {regiao.prioridade}
            </SemanticBadge>
          </div>

          {/* Descrição */}
          {regiao.descricao && (
            <p className="text-sm text-muted-foreground mb-2">{regiao.descricao}</p>
          )}

          {/* TRTs */}
          <div className="text-sm mb-1">
            <span className="font-medium">TRTs:</span>{" "}
            <span className="text-muted-foreground">
              {formatTrts(regiao.trts, 8)}
            </span>
          </div>

          {/* Responsáveis */}
          <div className="text-sm mb-1">
            <span className="font-medium">Responsáveis:</span>{" "}
            <span className="text-muted-foreground">{responsaveisNomes}</span>
          </div>

          {/* Método */}
          <div className="text-sm">
            <span className="font-medium">Método:</span>{" "}
            <span className="text-muted-foreground">
              {METODO_BALANCEAMENTO_LABELS[regiao.metodoBalanceamento]}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onAlternarStatus}
            title={regiao.ativo ? "Desativar" : "Ativar"}
          >
            {regiao.ativo ? (
              <PowerOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Power className="h-4 w-4 text-success" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onEditar} title="Editar">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onExcluir}
            title="Excluir"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
