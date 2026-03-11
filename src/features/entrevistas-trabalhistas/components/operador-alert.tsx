'use client';

import { Info, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OperadorAlertProps {
  tipo?: 'info' | 'aviso';
  children: React.ReactNode;
}

export function OperadorAlert({ tipo = 'info', children }: OperadorAlertProps) {
  const Icon = tipo === 'aviso' ? AlertTriangle : Info;

  return (
    <Alert variant={tipo === 'aviso' ? 'destructive' : 'default'} className="mt-3">
      <Icon className="h-4 w-4" />
      <AlertDescription className="text-sm">{children}</AlertDescription>
    </Alert>
  );
}
