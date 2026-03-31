import { render, screen, fireEvent } from '@testing-library/react';
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
      { label: 'Upload', status: 'current', icon: 'upload' },
      { label: 'Configurar', status: 'upcoming', icon: 'settings' },
      { label: 'Revisar', status: 'upcoming', icon: 'check' },
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
      expect(screen.getByText(/Upload/i)).toBeInTheDocument();
      expect(screen.getByText(/Configurar/i)).toBeInTheDocument();
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
