'use client';

import { useState, useCallback } from 'react';
import {
  DifyChatPanel,
  WorkflowRunner,
  CompletionPanel,
  DifyInputForm,
  type DifyAppParameters,
} from '@/lib/dify';

interface AssistenteNativoViewProps {
  appId: string;
  appType: string;
  metadata: Record<string, unknown> | null;
}

export function AssistenteNativoView({ appId, appType, metadata }: AssistenteNativoViewProps) {
  const parameters = metadata?.parameters as DifyAppParameters | undefined;
  const userInputForm = parameters?.user_input_form ?? [];
  const openingStatement = parameters?.opening_statement;
  const hasInputForm = userInputForm.length > 0;

  const [step, setStep] = useState<'form' | 'app'>(hasInputForm ? 'form' : 'app');
  const [submittedInputs, setSubmittedInputs] = useState<Record<string, unknown>>({});

  const handleFormSubmit = useCallback((inputs: Record<string, unknown>) => {
    setSubmittedInputs(inputs);
    setStep('app');
  }, []);

  if (step === 'form') {
    return (
      <DifyInputForm
        appId={appId}
        userInputForm={userInputForm}
        openingStatement={openingStatement}
        onSubmit={handleFormSubmit}
        className="h-full"
      />
    );
  }

  switch (appType) {
    case 'chat':
    case 'chatflow':
    case 'agent':
      return <DifyChatPanel appId={appId} inputs={submittedInputs} className="h-full" />;

    case 'workflow':
      return (
        <div className="h-full overflow-auto p-4">
          <WorkflowRunner appId={appId} defaultInputs={submittedInputs} className="max-w-3xl mx-auto" />
        </div>
      );

    case 'completion':
      return <CompletionPanel appId={appId} inputs={submittedInputs} className="h-full" />;

    default:
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Tipo de app não suportado: {appType}
        </div>
      );
  }
}
