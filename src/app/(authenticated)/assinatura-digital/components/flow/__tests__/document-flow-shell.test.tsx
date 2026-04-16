import { render, screen, fireEvent } from "@testing-library/react";
import { DocumentFlowShell } from "../document-flow-shell";

// ─── Mocks ────────────────────────────────────────────────────────────

const mockPush = jest.fn();
let mockPathname = "/app/assinatura-digital/documentos/novo";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock("@/components/ui/progress", () => ({
  Progress: ({
    value,
    className,
    "aria-label": ariaLabel,
  }: {
    value: number;
    className?: string;
    "aria-label"?: string;
  }) => (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-label={ariaLabel}
      className={className}
      data-testid="progress-bar"
    />
  ),
}));

// ─── Helpers ──────────────────────────────────────────────────────────

function renderShell(
  props: {
    fullHeight?: boolean;
    children?: React.ReactNode;
    primaryAction?: React.ReactNode;
  } = {},
) {
  const { children = <div data-testid="child-content">Conteudo</div>, ...rest } =
    props;
  return render(<DocumentFlowShell {...rest}>{children}</DocumentFlowShell>);
}

// ─── Tests ────────────────────────────────────────────────────────────

describe("DocumentFlowShell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/app/assinatura-digital/documentos/novo";
  });

  describe("Renderizacao", () => {
    it("deve renderizar os filhos corretamente", () => {
      renderShell();
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
      expect(screen.getByText("Conteudo")).toBeInTheDocument();
    });

    it("deve renderizar o stepper com as 3 etapas", () => {
      renderShell();
      expect(screen.getAllByText("Enviar").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Configurar").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Revisar").length).toBeGreaterThanOrEqual(1);
    });

    it("deve exibir o botao Voltar", () => {
      renderShell();
      expect(screen.getByText("Voltar")).toBeInTheDocument();
    });

    it("deve renderizar conectores entre os steps", () => {
      renderShell();
      const connectors = document.querySelectorAll(
        "div.h-px[aria-hidden='true']",
      );
      // 2 conectores entre 3 steps
      expect(connectors.length).toBe(2);
    });

    it("deve renderizar breadcrumb com etapa atual", () => {
      renderShell();
      expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
      expect(screen.getByText("Novo documento")).toBeInTheDocument();
    });

    it("deve renderizar primaryAction quando fornecida", () => {
      renderShell({
        primaryAction: <button data-testid="primary-action">Continuar</button>,
      });
      expect(screen.getByTestId("primary-action")).toBeInTheDocument();
    });
  });

  describe("Deteccao de etapa pela rota", () => {
    it("deve detectar etapa 0 (Upload) quando a URL contem /novo", () => {
      mockPathname = "/app/assinatura-digital/documentos/novo";
      renderShell();

      const stepDots = document.querySelectorAll('[aria-current="step"]');
      expect(stepDots).toHaveLength(1);

      const srOnly = document.querySelector("[aria-live='polite']");
      expect(srOnly).toHaveTextContent("Etapa 1 de 3");
      expect(srOnly).toHaveTextContent("Enviar");
    });

    it("deve detectar etapa 1 (Configurar) quando a URL contem /editar", () => {
      mockPathname = "/app/assinatura-digital/documentos/editar/some-uuid";
      renderShell();

      const stepDots = document.querySelectorAll('[aria-current="step"]');
      expect(stepDots).toHaveLength(1);

      const srOnly = document.querySelector("[aria-live='polite']");
      expect(srOnly).toHaveTextContent("Etapa 2 de 3");
      expect(srOnly).toHaveTextContent("Configurar");
    });

    it("deve detectar etapa 2 (Revisar) quando a URL contem /revisar", () => {
      mockPathname = "/app/assinatura-digital/documentos/revisar/some-uuid";
      renderShell();

      const stepDots = document.querySelectorAll('[aria-current="step"]');
      expect(stepDots).toHaveLength(1);

      const srOnly = document.querySelector("[aria-live='polite']");
      expect(srOnly).toHaveTextContent("Etapa 3 de 3");
      expect(srOnly).toHaveTextContent("Revisar");
    });

    it("deve usar etapa 0 como padrao para caminhos desconhecidos", () => {
      mockPathname = "/app/assinatura-digital/documentos/outro";
      renderShell();

      const srOnly = document.querySelector("[aria-live='polite']");
      expect(srOnly).toHaveTextContent("Etapa 1 de 3");
    });
  });

  describe("Estados visuais dos steps", () => {
    it("deve marcar o step atual com aria-current=step", () => {
      mockPathname = "/app/assinatura-digital/documentos/editar/uuid";
      renderShell();

      const currentSteps = document.querySelectorAll('[aria-current="step"]');
      expect(currentSteps).toHaveLength(1);
    });

    it("deve aplicar classe glass-kpi no step atual", () => {
      mockPathname = "/app/assinatura-digital/documentos/novo";
      renderShell();

      const currentStep = document.querySelector('[aria-current="step"]');
      expect(currentStep).toHaveClass("glass-kpi");
    });

    it("deve marcar steps anteriores como concluidos (com icone check)", () => {
      mockPathname = "/app/assinatura-digital/documentos/revisar/uuid";
      renderShell();

      // Quando na etapa 3, steps 0 e 1 devem ter badge success
      const successBadges = document.querySelectorAll(
        "span.bg-success\\/15",
      );
      expect(successBadges.length).toBe(2);
    });

    it("deve colorir conector done com gradient success", () => {
      mockPathname = "/app/assinatura-digital/documentos/revisar/uuid";
      renderShell();

      const connectors = document.querySelectorAll(
        "div.h-px[aria-hidden='true']",
      );
      expect(connectors[0].className).toContain("from-success/40");
      expect(connectors[1].className).toContain("from-success/40");
    });

    it("deve colorir conectores pendentes com border", () => {
      mockPathname = "/app/assinatura-digital/documentos/novo";
      renderShell();

      const connectors = document.querySelectorAll(
        "div.h-px[aria-hidden='true']",
      );
      expect(connectors[0].className).toContain("via-border/60");
      expect(connectors[1].className).toContain("via-border/60");
    });
  });

  describe("Navegacao", () => {
    it("deve navegar para a lista ao clicar no botao Voltar", () => {
      renderShell();

      const voltarButton = screen.getByText("Voltar").closest("button")!;
      fireEvent.click(voltarButton);

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith(
        "/app/assinatura-digital/documentos/lista",
      );
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter aria-label correto no stepper", () => {
      renderShell();

      const nav = screen.getByLabelText("Progresso do fluxo de assinatura");
      expect(nav).toBeInTheDocument();
      expect(nav.tagName).toBe("NAV");
    });

    it("deve exibir texto para leitores de tela com a etapa atual", () => {
      mockPathname = "/app/assinatura-digital/documentos/editar/uuid";
      renderShell();

      const srOnly = document.querySelector("[aria-live='polite']");
      expect(srOnly).toBeInTheDocument();
      expect(srOnly).toHaveTextContent("Etapa 2 de 3");
      expect(srOnly).toHaveAttribute("aria-live", "polite");
      expect(srOnly).toHaveAttribute("aria-atomic", "true");
    });

    it("deve incluir o label do step atual no texto para leitores de tela", () => {
      mockPathname = "/app/assinatura-digital/documentos/editar/uuid";
      renderShell();

      const srContainer = document.querySelector("[aria-live='polite']");
      expect(srContainer).toHaveTextContent("Etapa 2 de 3:");
      expect(srContainer).toHaveTextContent("Configurar");
    });

    it("deve ter o botao Voltar acessivel", () => {
      renderShell();

      const button = screen.getByText("Voltar").closest("button");
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  describe("Props", () => {
    it("deve remover padding quando fullHeight=true", () => {
      renderShell({ fullHeight: true });

      const content = screen.getByTestId("child-content").parentElement!;
      expect(content).not.toHaveClass("p-6");
    });

    it("deve aplicar padding quando fullHeight=false (padrao)", () => {
      renderShell({ fullHeight: false });

      const content = screen.getByTestId("child-content").parentElement!;
      expect(content).toHaveClass("p-6");
    });

    it("deve aplicar layout full-height com -m-6", () => {
      const { container } = renderShell();

      const wrapper = container.firstElementChild!;
      expect(wrapper).toHaveClass("-m-6");
      expect(wrapper).toHaveClass("flex");
      expect(wrapper).toHaveClass("flex-col");
    });
  });

  describe("Mobile progress bar", () => {
    it("deve renderizar a barra de progresso mobile", () => {
      renderShell();

      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toBeInTheDocument();
    });

    it("deve mostrar 0% de progresso na etapa de upload", () => {
      mockPathname = "/app/assinatura-digital/documentos/novo";
      renderShell();

      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "0");
    });

    it("deve mostrar 50% de progresso na etapa de configuracao", () => {
      mockPathname = "/app/assinatura-digital/documentos/editar/uuid";
      renderShell();

      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    });

    it("deve mostrar 100% de progresso na etapa de revisao", () => {
      mockPathname = "/app/assinatura-digital/documentos/revisar/uuid";
      renderShell();

      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "100");
    });

    it("deve exibir o label da etapa atual na barra mobile", () => {
      mockPathname = "/app/assinatura-digital/documentos/editar/uuid";
      renderShell();

      const labels = screen.getAllByText("Configurar");
      expect(labels.length).toBeGreaterThanOrEqual(1);
    });
  });
});
