'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, RefreshCw, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getDifyConfigAction, saveDifyConfigAction, checkDifyConnectionAction } from '../actions';
import { toast } from 'sonner';

export function DifyConfigForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [connectionMessage, setConnectionMessage] = useState('');

    const [formData, setFormData] = useState({
        api_url: 'https://api.dify.ai/v1',
        api_key: '',
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setIsLoading(true);
        try {
            const config = await getDifyConfigAction();
            if (config) {
                setFormData({
                    api_url: config.api_url as string,
                    api_key: config.api_key as string,
                });
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            toast.error('Erro ao carregar configurações do Dify.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.api_key) {
            toast.error('API Key é obrigatória.');
            return;
        }

        setIsSaving(true);
        try {
            await saveDifyConfigAction(formData);
            toast.success('Configurações salvas com sucesso!');
            setConnectionStatus('idle'); // Reseta status para forçar novo teste se quiser
        } catch (error: unknown) {
            console.error('Erro ao salvar:', error);
            const message = error instanceof Error ? error.message : String(error);
            toast.error(`Erro ao salvar: ${message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCheckConnection = async () => {
        // Primeiro salva (ou avisa que precisa salvar?)
        // Idealmente, testamos com os dados do form, mas a action lê do banco.
        // Vamos salvar primeiro automaticamente? Ou avisar.
        // Vamos salvar primeiro.
        await handleSave();

        setIsLoading(true);
        setConnectionStatus('idle');
        setConnectionMessage('');

        try {
            const result = await checkDifyConnectionAction();
            if (result.success) {
                setConnectionStatus('success');
                setConnectionMessage('Conexão estabelecida com sucesso!');
                toast.success('Conexão verificada com sucesso!');
            } else {
                setConnectionStatus('error');
                setConnectionMessage(result.message || 'Falha na conexão.');
                toast.error('Falha na conexão com Dify.');
            }
        } catch (error: unknown) {
            setConnectionStatus('error');
            const message = error instanceof Error ? error.message : String(error);
            setConnectionMessage(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Configuração Dify</CardTitle>
                <CardDescription>Gerencie as credenciais de conexão com a API do Dify.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="api_url">API URL</Label>
                    <Input
                        id="api_url"
                        placeholder="https://api.dify.ai/v1"
                        value={formData.api_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, api_url: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">URL base da API do Dify.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="api_key">API Key (App Key)</Label>
                    <Input
                        id="api_key"
                        type="password"
                        placeholder="app-..."
                        value={formData.api_key}
                        onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Chave de API do seu aplicativo no Dify.</p>
                </div>

                {connectionStatus === 'error' && (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Erro de Conexão</AlertTitle>
                        <AlertDescription>{connectionMessage}</AlertDescription>
                    </Alert>
                )}
                {connectionStatus === 'success' && (
                    <Alert className="bg-green-50 text-green-800 border-green-200">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Conectado</AlertTitle>
                        <AlertDescription>{connectionMessage}</AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-end space-x-4 pt-4">
                    <Button variant="outline" onClick={handleCheckConnection} disabled={isLoading || isSaving}>
                        {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Salvar e Testar Conexão
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || isLoading}>
                        {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar Alterações
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
