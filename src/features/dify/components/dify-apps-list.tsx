'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Edit2, Play, CheckCircle, XCircle, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { listDifyAppsAction, createDifyAppAction, updateDifyAppAction, deleteDifyAppAction, checkDifyAppConnectionAction, syncDifyAppMetadataAction } from '../actions';
import { toast } from 'sonner';

interface DifyApp {
    id: string;
    name: string;
    api_url: string;
    api_key: string;
    app_type: 'chat' | 'chatflow' | 'workflow' | 'completion' | 'agent';
    is_active: boolean;
    created_at: string;
}

const APP_TYPE_LABELS: Record<string, string> = {
    chat: 'Chatbot',
    chatflow: 'Chatflow',
    workflow: 'Workflow',
    agent: 'Agente',
    completion: 'Text Generator',
};

const APP_TYPE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
    chat: 'default',
    chatflow: 'secondary',
    workflow: 'outline',
    agent: 'default',
    completion: 'secondary',
};

export function DifyAppsList() {
    const router = useRouter();
    const [apps, setApps] = useState<DifyApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<DifyApp | null>(null);
    const [deletingAppId, setDeletingAppId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        api_url: 'https://api.dify.ai/v1',
        api_key: '',
        app_type: 'chat'
    });

    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [saving, setSaving] = useState(false);
    const [syncingAppId, setSyncingAppId] = useState<string | null>(null);

    useEffect(() => {
        loadApps();
    }, []);

    const loadApps = async () => {
        setLoading(true);
        try {
            const data = await listDifyAppsAction();
            setApps(data as Array<DifyApp>);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error('Erro ao listar apps: ' + message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            api_url: 'https://api.dify.ai/v1',
            api_key: '',
            app_type: 'chat'
        });
        setEditingApp(null);
        setTestStatus('idle');
    };

    const handleEdit = (app: DifyApp) => {
        setEditingApp(app);
        setFormData({
            name: app.name,
            api_url: app.api_url,
            api_key: app.api_key,
            app_type: app.app_type
        });
        setTestStatus('idle');
        setIsDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingAppId) return;
        try {
            await deleteDifyAppAction(deletingAppId);
            toast.success('App removido com sucesso.');
            loadApps();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error('Erro ao remover app: ' + message);
        } finally {
            setDeletingAppId(null);
        }
    };

    const handleTestConnection = async () => {
        setSaving(true);
        try {
            const result = await checkDifyAppConnectionAction(formData.api_url, formData.api_key);
            if (result.success) {
                setTestStatus('success');
                toast.success('Conexão bem sucedida!');
            } else {
                setTestStatus('error');
                toast.error('Falha na conexão: ' + result.message);
            }
        } catch (error: unknown) {
            setTestStatus('error');
            const message = error instanceof Error ? error.message : String(error);
            toast.error('Erro ao testar: ' + message);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.api_key || !formData.api_url) {
            toast.error('Preencha todos os campos obrigatórios.');
            return;
        }

        setSaving(true);
        try {
            if (editingApp) {
                await updateDifyAppAction(editingApp.id, formData);
                toast.success('App atualizado com sucesso.');
            } else {
                await createDifyAppAction(formData);
                toast.success('App criado com sucesso.');
            }
            setIsDialogOpen(false);
            loadApps();
            resetForm();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error('Erro ao salvar: ' + message);
        } finally {
            setSaving(false);
        }
    };

    const handleSyncMetadata = async (appId: string) => {
        setSyncingAppId(appId);
        try {
            const result = await syncDifyAppMetadataAction(appId);
            if (result.success) {
                toast.success('Metadata sincronizada com sucesso.');
            } else {
                toast.error('Erro ao sincronizar metadata: ' + result.message);
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error('Erro ao sincronizar metadata: ' + message);
        } finally {
            setSyncingAppId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold tracking-tight">Aplicativos IA</h1>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/app/configuracoes?tab=integracoes')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Configurações
                    </Button>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar App
                    </Button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : apps.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                    <p className="text-muted-foreground">Nenhum app configurado.</p>
                    <Button variant="link" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                        Adicionar o primeiro
                    </Button>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>API URL</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {apps.map(app => (
                                <TableRow key={app.id}>
                                    <TableCell className="font-medium">{app.name}</TableCell>
                                    <TableCell>
                                        <SemanticBadge 
                                            category="status" 
                                            value={app.app_type}
                                            variantOverride={APP_TYPE_VARIANTS[app.app_type] ?? 'secondary'}
                                        >
                                            {APP_TYPE_LABELS[app.app_type] ?? app.app_type}
                                        </SemanticBadge>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm text-muted-foreground max-w-75 truncate" title={app.api_url}>
                                        {app.api_url}
                                    </TableCell>
                                    <TableCell>
                                        <SemanticBadge 
                                            category="status" 
                                            value={app.is_active ? 'active' : 'inactive'}
                                            variantOverride={app.is_active ? 'default' : 'outline'}
                                        >
                                            {app.is_active ? 'Ativo' : 'Inativo'}
                                        </SemanticBadge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleSyncMetadata(app.id)}
                                                disabled={syncingAppId === app.id}
                                                title="Sincronizar metadata"
                                            >
                                                <RefreshCw className={syncingAppId === app.id ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(app)}
                                                title="Editar"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => setDeletingAppId(app.id)}
                                                title="Remover"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Dialog: Criar/Editar App */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                <DialogContent className="sm:max-w-125">
                    <DialogHeader>
                        <DialogTitle>{editingApp ? 'Editar App' : 'Novo App IA'}</DialogTitle>
                        <DialogDescription>Conecte um novo aplicativo de IA fornecendo a chave de API.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome do App</Label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Assistente Jurídico" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Select value={formData.app_type} onValueChange={v => setFormData({ ...formData, app_type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="chat">Chatbot</SelectItem>
                                        <SelectItem value="chatflow">Chatflow</SelectItem>
                                        <SelectItem value="workflow">Workflow</SelectItem>
                                        <SelectItem value="agent">Agente</SelectItem>
                                        <SelectItem value="completion">Text Generator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>API URL</Label>
                                <Input value={formData.api_url} onChange={e => setFormData({ ...formData, api_url: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>API Key</Label>
                            <div className="flex gap-2">
                                <Input type="password" value={formData.api_key} onChange={e => setFormData({ ...formData, api_key: e.target.value })} placeholder="app-..." />
                                <Button variant="outline" size="icon" onClick={handleTestConnection} disabled={saving} title="Testar Conexão">
                                    {testStatus === 'success' ? <CheckCircle className="text-green-500 h-4 w-4" /> :
                                        testStatus === 'error' ? <XCircle className="text-red-500 h-4 w-4" /> :
                                            <Play className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog: Confirmação de Deleção */}
            <AlertDialog open={!!deletingAppId} onOpenChange={(open) => !open && setDeletingAppId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover aplicativo</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover este app? O assistente vinculado também será removido. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
