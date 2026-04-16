/**
 * Tipos para o componente SignatureWorkflowStepper
 */

/**
 * Representação de uma etapa do workflow com seu status calculado
 */
export interface WorkflowStep {
  /** Identificador único da etapa (ex: 'cpf', 'dados-pessoais') */
  id: string;
  /** Índice da etapa (0-indexed) */
  index: number;
  /** Label amigável para exibição */
  label: string;
  /** Status calculado baseado na etapa atual */
  status: 'completed' | 'current' | 'pending';
}

/**
 * Props do componente SignatureWorkflowStepper
 */
export interface SignatureWorkflowStepperProps {
  /** Classes CSS adicionais */
  className?: string;
  /** Callback quando um step é clicado */
  onStepClick?: (stepIndex: number) => void;
  /** Permite navegação para steps anteriores ao clicar */
  allowNavigation?: boolean;
}

/**
 * Retorno do hook useWorkflowNavigation
 */
export interface WorkflowNavigationState {
  /** Lista de steps com status calculado */
  steps: WorkflowStep[];
  /** Índice do step atual */
  currentStep: number;
  /** Total de steps */
  totalSteps: number;
  /** Pode voltar para step anterior */
  canGoBack: boolean;
  /** Pode avançar para próximo step */
  canGoForward: boolean;
  /** Navega para um step específico */
  goToStep: (index: number) => void;
  /** Avança para o próximo step */
  nextStep: () => void;
  /** Volta para o step anterior */
  previousStep: () => void;
  /** Porcentagem de progresso (0-100) */
  progressPercentage: number;
}
