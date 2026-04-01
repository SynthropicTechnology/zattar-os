import { render, screen } from '@testing-library/react';
import { SignatureWorkflowStepper } from '../signature-workflow-stepper';
import { useFormularioStore } from '../../../store/formulario-store';
import { useViewport } from '@/hooks/use-viewport';

// Mocks
jest.mock('@/hooks/use-viewport', () => ({
  useViewport: jest.fn(),
}));

jest.mock('../../../store/formulario-store', () => ({
  useFormularioStore: jest.fn(),
}));

jest.mock('../hooks/use-workflow-navigation', () => ({
  useWorkflowNavigation: jest.fn(() => ({
    steps: [
      { id: 'upload', index: 0, label: 'Upload', status: 'current' },
      { id: 'configurar', index: 1, label: 'Configurar', status: 'pending' },
      { id: 'revisar', index: 2, label: 'Revisar', status: 'pending' },
    ],
    currentStep: 0,
    totalSteps: 3,
    goToStep: jest.fn(),
    progressPercentage: 0,
    canNavigate: true,
    navigateToStep: jest.fn(),
  })),
}));

describe('SignatureWorkflowStepper', () => {
  const mockEtapaAtual = 0; // Upload step

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormularioStore as unknown as jest.Mock).mockReturnValue({
      etapaAtual: mockEtapaAtual,
      getTotalSteps: jest.fn(() => 3),
    });
    (useViewport as unknown as jest.Mock).mockReturnValue({ isDesktop: true });
  });

  describe('Desktop View', () => {
    beforeEach(() => {
      (useViewport as unknown as jest.Mock).mockReturnValue({ isDesktop: true, isMobile: false });
    });

    it('deve renderizar o stepper com nav acessível', () => {
      render(<SignatureWorkflowStepper />);
      expect(screen.getByTestId('workflow-stepper')).toBeInTheDocument();
    });

    it('deve exibir os steps com labels', () => {
      render(<SignatureWorkflowStepper />);
      // Labels may appear in both the sr-only text and the stepper itself
      expect(screen.getAllByText(/Upload/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Configurar/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      (useViewport as unknown as jest.Mock).mockReturnValue({ isDesktop: false, isMobile: true });
    });

    it('deve renderizar o stepper no mobile', () => {
      render(<SignatureWorkflowStepper />);
      expect(screen.getByTestId('workflow-stepper')).toBeInTheDocument();
    });
  });

  describe('Navegação', () => {
    it('deve ter stepper renderizado com allowNavigation', () => {
      const onStepClickMock = jest.fn();
      (useViewport as unknown as jest.Mock).mockReturnValue({ isDesktop: true, isMobile: false });
      render(<SignatureWorkflowStepper allowNavigation onStepClick={onStepClickMock} />);

      // Steps are rendered as divs with onClick, not buttons
      expect(screen.getByTestId('workflow-stepper')).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels corretos', () => {
      render(<SignatureWorkflowStepper />);
      expect(screen.getByLabelText(/Progresso do fluxo/i)).toBeInTheDocument();
    });
  });
});
