'use client';

import React, { useState } from 'react';
import { useDifyWorkflow } from '../hooks/use-dify-workflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Play, StopCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowRunnerProps {
    inputsSchema?: Record<string, 'string' | 'number' | 'boolean' | 'file'>; // Schema simplificado para gerar form
    onFinish?: (outputs: Record<string, unknown>) => void;
    className?: string;
    title?: string;
    description?: string;
    user?: string;
}

export function WorkflowRunner({
    inputsSchema = {}, // Se vazio, assume inputs genéricos ou permite adicionar chave-valor dinamicamente?
    // Por simplicidade, vou fazer um campo JSON ou Key-Value dinâmico se schema não fornecido.
    // Mas assumindo que o dev integra isso sabendo os inputs.
    onFinish,
    className,
    title = 'Executar Workflow',
    description = 'Preencha os dados e execute o processo.',
    user,
}: WorkflowRunnerProps) {
    const { state, execute, stop } = useDifyWorkflow({
        onFinish,
        user
    });

    const [inputs, setInputs] = useState<Record<string, unknown>>({});

    const handleInputChange = (key: string, value: unknown) => {
        setInputs(prev => ({ ...prev, [key]: value }));
    };

    const handleRun = async () => {
        await execute(inputs);
    };

    // Se não houver schema definido, renderizar um editor JSON simples ou avisar
    const hasSchema = Object.keys(inputsSchema).length > 0;

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {hasSchema ? (
                    Object.entries(inputsSchema).map(([key, type]) => (
                        <div key={key} className="space-y-2">
                            <Label htmlFor={key} className="capitalize">{key}</Label>
                            {type === 'string' && (
                                <Input
                                    id={key}
                                    value={(inputs[key] as string) || ''}
                                    onChange={e => handleInputChange(key, e.target.value)}
                                    disabled={state.status === 'running'}
                                />
                            )}
                            {type === 'number' && (
                                <Input
                                    id={key}
                                    type="number"
                                    value={(inputs[key] as number) || ''}
                                    onChange={e => handleInputChange(key, Number(e.target.value))}
                                    disabled={state.status === 'running'}
                                />
                            )}
                            {type === 'boolean' && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id={key}
                                        checked={!!inputs[key]}
                                        onChange={e => handleInputChange(key, e.target.checked)}
                                        disabled={state.status === 'running'}
                                    />
                                    <Label htmlFor={key}>Habilitar</Label>
                                </div>
                            )}
                            {/* TODO: Implement File input support */}
                        </div>
                    ))
                ) : (
                    <div className="space-y-2">
                        <Label>Inputs (JSON)</Label>
                        <Textarea
                            value={JSON.stringify(inputs, null, 2)}
                            onChange={e => {
                                try {
                                    setInputs(JSON.parse(e.target.value));
                                } catch (_err) {
                                    // ignore parse error while typing
                                }
                            }}
                            placeholder='{"field": "value"}'
                            disabled={state.status === 'running'}
                            className="font-mono text-sm"
                            rows={5}
                        />
                    </div>
                )}

                {/* Logs Area */}
                {state.logs.length > 0 && (
                    <div className="bg-muted p-4 rounded-md text-xs font-mono max-h-40 overflow-y-auto space-y-1">
                        {state.logs.map((log, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="text-muted-foreground">[{i + 1}]</span>
                                <span>{log}</span>
                            </div>
                        ))}
                        {state.status === 'running' && (
                            <div className="animate-pulse">Processing...</div>
                        )}
                    </div>
                )}

                {/* Output/Error */}
                {state.status === 'succeeded' && state.outputs && (
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900 p-4 rounded-md">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
                            <CheckCircle className="h-4 w-4" /> Sucesso
                        </div>
                        <pre className="text-xs overflow-auto max-h-60">
                            {JSON.stringify(state.outputs, null, 2)}
                        </pre>
                    </div>
                )}

                {state.status === 'failed' && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 p-4 rounded-md">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium">
                            <AlertCircle className="h-4 w-4" /> Erro
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-300 mt-1">{state.error}</p>
                    </div>
                )}

            </CardContent>
            <CardFooter className="flex justify-between">
                <div className="text-xs text-muted-foreground">
                    {state.status === 'running' ? 'Executando...' : state.status === 'idle' ? 'Pronto para iniciar' : `Finalizado (${state.status})`}
                </div>
                {state.status === 'running' ? (
                    <Button variant="destructive" onClick={stop}>
                        <StopCircle className="mr-2 h-4 w-4" /> Parar
                    </Button>
                ) : (
                    <Button onClick={handleRun}>
                        <Play className="mr-2 h-4 w-4" /> Executar
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
