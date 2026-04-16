/**
 * Workflow Components - Barrel Export
 *
 * Componentes de indicação de progresso do fluxo de assinatura digital.
 */

// Main component
export { SignatureWorkflowStepper } from './signature-workflow-stepper';

// Sub-components (for advanced customization)
export { DesktopStepper } from './components/desktop-stepper';
export { MobileProgress } from './components/mobile-progress';
export { StepIndicator } from './components/step-indicator';

// Hook and constants
export { useWorkflowNavigation, WORKFLOW_STEP_IDS } from './hooks/use-workflow-navigation';

// Types
export type {
  SignatureWorkflowStepperProps,
  WorkflowStep,
  WorkflowNavigationState,
} from './types';
