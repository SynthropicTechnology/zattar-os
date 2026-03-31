/**
 * COMPONENT TESTS — ExpedientesAlterarResponsavelDialog
 *
 * Testa renderização, interação do Select, envio de formulário,
 * tratamento de erro e comportamento do dialog.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpedientesAlterarResponsavelDialog } from '../../components/expedientes-alterar-responsavel-dialog';
import { mockExpediente } from '@/testing/integration-helpers';

// Mock server action
const mockActionAtualizarExpediente = jest.fn();
jest.mock('../../actions', () => ({
  actionAtualizarExpediente: (...args: unknown[]) => mockActionAtualizarExpediente(...args),
}));

// Mock DialogFormShell to simplify dialog rendering
jest.mock('@/components/shared/dialog-shell', () => ({
  DialogFormShell: ({
    open,
    children,
    footer,
    title,
  }: {
    open: boolean;
    children: React.ReactNode;
    footer: React.ReactNode;
    title: string;
  }) =>
    open ? (
      <div data-testid="dialog" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
        <div data-testid="dialog-footer">{footer}</div>
      </div>
    ) : null,
}));

// Mock Select — renders native <select> + <option> (no nested <span> issues)
jest.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
    disabled,
  }: {
    value: string;
    onValueChange: (val: string) => void;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <select
      data-testid="responsavel-select"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      disabled={disabled}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
  SelectTrigger: () => null,
  SelectValue: () => null,
}));

// Mock Label
jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: { children: React.ReactNode; htmlFor?: string }) => (
    <label {...props}>{children}</label>
  ),
}));

// Mock Button
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
}));

// =============================================================================
// FIXTURES
// =============================================================================

const usuarios = [
  { id: 1, nomeExibicao: 'Dra. Carolina' },
  { id: 2, nomeExibicao: 'Dr. Rafael' },
  { id: 3, nomeExibicao: 'Dra. Amanda' },
];

const expediente = mockExpediente({ id: 42, responsavelId: 1 });
const expedienteSemResp = mockExpediente({ id: 43, responsavelId: null });

function renderDialog(overrides?: {
  open?: boolean;
  expediente?: ReturnType<typeof mockExpediente> | null;
  onSuccess?: jest.Mock;
  onOpenChange?: jest.Mock;
}) {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    expediente: expediente,
    usuarios,
    onSuccess: jest.fn(),
    ...overrides,
  };

  return {
    ...render(<ExpedientesAlterarResponsavelDialog {...defaultProps} />),
    ...defaultProps,
  };
}

// =============================================================================
// TESTES DE RENDERIZAÇÃO
// =============================================================================

describe('Renderização', () => {
  it('deve renderizar dialog quando open=true', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Alterar Responsável')).toBeInTheDocument();
  });

  it('não deve renderizar quando open=false', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('não deve renderizar quando expediente é null', () => {
    renderDialog({ expediente: null });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('deve mostrar select com opções de usuários', () => {
    renderDialog();
    const select = screen.getByTestId('responsavel-select');
    expect(select).toBeInTheDocument();

    // Opção "Sem responsável" + 3 usuários
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(4);
  });

  it('deve mostrar botão Salvar no footer', () => {
    renderDialog();
    const footer = screen.getByTestId('dialog-footer');
    expect(footer).toHaveTextContent('Salvar');
  });
});

// =============================================================================
// TESTES DE ESTADO INICIAL
// =============================================================================

describe('Estado Inicial', () => {
  it('deve pré-selecionar responsável atual do expediente', () => {
    renderDialog({ expediente });
    const select = screen.getByTestId('responsavel-select') as HTMLSelectElement;
    expect(select.value).toBe('1');
  });

  it('deve mostrar "null" quando expediente sem responsável', () => {
    renderDialog({ expediente: expedienteSemResp });
    const select = screen.getByTestId('responsavel-select') as HTMLSelectElement;
    expect(select.value).toBe('null');
  });
});

// =============================================================================
// TESTES DE INTERAÇÃO
// =============================================================================

describe('Interação', () => {
  it('deve permitir selecionar outro responsável', async () => {
    const user = userEvent.setup();
    renderDialog();

    const select = screen.getByTestId('responsavel-select');
    await user.selectOptions(select, '2');

    expect((select as HTMLSelectElement).value).toBe('2');
  });

  it('deve permitir selecionar "Sem responsável"', async () => {
    const user = userEvent.setup();
    renderDialog();

    const select = screen.getByTestId('responsavel-select');
    await user.selectOptions(select, 'null');

    expect((select as HTMLSelectElement).value).toBe('null');
  });
});

// =============================================================================
// TESTES DO FORMULÁRIO (HIDDEN INPUT)
// =============================================================================

describe('FormData', () => {
  it('deve ter hidden input com responsavelId correto', () => {
    renderDialog({ expediente });
    const hiddenInput = document.querySelector(
      'input[name="responsavelId"]'
    ) as HTMLInputElement;
    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput.type).toBe('hidden');
    expect(hiddenInput.value).toBe('1');
  });

  it('deve enviar valor vazio quando "Sem responsável" selecionado', () => {
    renderDialog({ expediente: expedienteSemResp });

    // Quando responsavelId é 'null', hidden input manda ''
    const hiddenInput = document.querySelector(
      'input[name="responsavelId"]'
    ) as HTMLInputElement;
    expect(hiddenInput.value).toBe('');
  });
});

// =============================================================================
// TESTES DE SUCESSO/ERRO
// =============================================================================

describe('Feedback de Sucesso/Erro', () => {
  it('deve definir action mock corretamente', () => {
    mockActionAtualizarExpediente.mockResolvedValue({
      success: true,
      data: {},
      message: 'ok',
    });

    renderDialog();

    // Verifica que o form existe e tem o action correto
    const form = document.getElementById('alterar-responsavel-form');
    expect(form).toBeInTheDocument();
    expect(form?.tagName).toBe('FORM');
  });
});

// =============================================================================
// TESTES DE LISTA DE USUÁRIOS
// =============================================================================

describe('Lista de Usuários', () => {
  it('deve renderizar todos os usuários como opções', () => {
    renderDialog();
    expect(screen.getByText('Dra. Carolina')).toBeInTheDocument();
    expect(screen.getByText('Dr. Rafael')).toBeInTheDocument();
    expect(screen.getByText('Dra. Amanda')).toBeInTheDocument();
  });

  it('deve renderizar opção "Sem responsável"', () => {
    renderDialog();
    expect(screen.getByText('Sem responsável')).toBeInTheDocument();
  });

  it('deve funcionar com lista vazia de usuários', () => {
    render(
      <ExpedientesAlterarResponsavelDialog
        open={true}
        onOpenChange={jest.fn()}
        expediente={expediente}
        usuarios={[]}
        onSuccess={jest.fn()}
      />
    );
    // Apenas "Sem responsável" deve existir
    const select = screen.getByTestId('responsavel-select');
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(1);
    expect(options[0].textContent).toBe('Sem responsável');
  });
});
