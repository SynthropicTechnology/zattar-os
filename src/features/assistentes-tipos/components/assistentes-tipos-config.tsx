'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2, Check, X, Settings } from 'lucide-react';
import {
  listarAssistentesTiposAction,
  criarAssistenteTipoAction,
  deletarAssistenteTipoAction,
  ativarAssistenteTipoAction,
} from '../actions';
import type { AssistenteTipoComRelacoes } from '../domain';

interface AssistentesTiposConfigProps {
  assistentes: Array<{ id: string; nome: string; tipo: string }>;
  tiposExpedientes: Array<{ id: string; nome: string }>;
}

export function AssistentesTiposConfig({
  assistentes,
  tiposExpedientes,
}: AssistentesTiposConfigProps) {
  const [relacoes, setRelacoes] = useState<AssistenteTipoComRelacoes[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Formulário
  const [assistenteId, setAssistenteId] = useState<string>('');
  const [tipoExpedienteId, setTipoExpedienteId] = useState<string>('');

  useEffect(() => {
    carregarRelacoes();
  }, []);

  const carregarRelacoes = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await listarAssistentesTiposAction({});

      if (result.success && result.data) {
        setRelacoes(result.data.data);
      } else if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao carregar configurações');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCriar = async () => {
    if (!assistenteId || !tipoExpedienteId) {
      setError('Selecione um assistente e um tipo de expediente');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await criarAssistenteTipoAction({
        assistente_id: Number(assistenteId),
        tipo_expediente_id: Number(tipoExpedienteId),
      });

      if (result.success && result.data) {
        setSuccess('Configuração criada com sucesso!');
        setAssistenteId('');
        setTipoExpedienteId('');
        await carregarRelacoes();
      } else if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao criar configuração');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletar = async (id: number) => {
    if (!confirm('Deseja realmente deletar esta configuração?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await deletarAssistenteTipoAction({ id });

      if (result.success) {
        setSuccess('Configuração deletada com sucesso!');
        await carregarRelacoes();
      } else if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao deletar configuração');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (id: number, ativo: boolean) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await ativarAssistenteTipoAction({ id });

      if (result.success && result.data) {
        setSuccess(`Configuração ${ativo ? 'ativada' : 'desativada'} com sucesso!`);
        await carregarRelacoes();
      } else if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao atualizar configuração');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const assistentesFiltrados = assistentes.filter(
    (a) => !relacoes.some((r) => r.assistente_id === Number(a.id))
  );

  const tiposExpedientesFiltrados = tiposExpedientes.filter(
    (t) => !relacoes.some((r) => r.tipo_expediente_id === Number(t.id) && r.ativo)
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensagens */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Formulário de Criação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Nova Configuração
          </CardTitle>
          <CardDescription>
            Configure qual assistente será usado para gerar automaticamente peças de um
            tipo de expediente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assistente</label>
              <Select value={assistenteId} onValueChange={setAssistenteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o assistente" />
                </SelectTrigger>
                <SelectContent>
                  {assistentesFiltrados.map((assistente) => (
                    <SelectItem key={assistente.id} value={String(assistente.id)}>
                      <span className="flex items-center gap-2">
                        {assistente.nome}
                        <span className="text-xs text-muted-foreground">({assistente.tipo})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Expediente</label>
              <Select value={tipoExpedienteId} onValueChange={setTipoExpedienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposExpedientesFiltrados.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleCriar}
                disabled={saving || !assistenteId || !tipoExpedienteId}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Configuração
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Existentes</CardTitle>
          <CardDescription>
            {relacoes.length === 0
              ? 'Nenhuma configuração criada ainda'
              : `${relacoes.length} configuração(ões)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {relacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma configuração encontrada.</p>
              <p className="text-sm mt-2">
                Crie uma configuração para habilitar a geração automática de peças.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {relacoes.map((relacao) => (
                <div
                  key={relacao.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{relacao.assistente_nome}</span>
                      {relacao.ativo ? (
                        <SemanticBadge category="status" value="success">
                          <Check className="h-3 w-3 mr-1" />
                          Ativo
                        </SemanticBadge>
                      ) : (
                        <SemanticBadge category="status" value="inactive">
                          <X className="h-3 w-3 mr-1" />
                          Inativo
                        </SemanticBadge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tipo de Expediente: <strong>{relacao.tipo_expediente_nome}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Criado em {new Date(relacao.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={relacao.ativo ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleToggleAtivo(relacao.id, !relacao.ativo)}
                      disabled={saving}
                    >
                      {relacao.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletar(relacao.id)}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
