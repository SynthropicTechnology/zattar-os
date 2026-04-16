import { render, screen } from "@testing-library/react";
import { EditarDocumentoClient } from "../client-page";
import { useDocumentEditor } from "@/app/(authenticated)/assinatura-digital/components/editor/hooks/use-document-editor";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock("@/app/(authenticated)/assinatura-digital/components/flow", () => ({
  DocumentFlowShell: ({
    children,
    fullHeight,
  }: {
    children: React.ReactNode;
    fullHeight?: boolean;
  }) => (
    <div data-testid="flow-shell" data-full-height={fullHeight}>
      {children}
    </div>
  ),
}));

jest.mock(
  "@/app/(authenticated)/assinatura-digital/components/editor/hooks/use-document-editor",
  () => ({
    useDocumentEditor: jest.fn(),
  }),
);

jest.mock("@/shared/assinatura-digital/types/pdf-preview.types", () => ({
  PDF_CANVAS_SIZE: { width: 800, height: 1100 },
}));

jest.mock(
  "@/app/(authenticated)/assinatura-digital/components/editor/components/EditorCanvas",
  () => {
    return function MockEditorCanvas() {
      return <div data-testid="editor-canvas">Editor Canvas</div>;
    };
  },
);

jest.mock(
  "@/app/(authenticated)/assinatura-digital/components/editor/components/FloatingSidebar",
  () => {
    return function MockFloatingSidebar(props: Record<string, unknown>) {
      return (
        <div data-testid="floating-sidebar" data-title={props.documentTitle}>
          Sidebar
        </div>
      );
    };
  },
);

jest.mock("lucide-react", () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader-icon" className={className} />
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockActions = {
  setCurrentPage: jest.fn(),
  setTotalPages: jest.fn(),
  setFields: jest.fn(),
  handleZoomIn: jest.fn(),
  handleZoomOut: jest.fn(),
  handleResetZoom: jest.fn(),
  setActiveSigner: jest.fn(),
  handleAddSigner: jest.fn(),
  handleDeleteSigner: jest.fn(),
  handleUpdateSigner: jest.fn(),
  getSignerById: jest.fn(),
  getSignerColor: jest.fn(),
  handleFieldClick: jest.fn(),
  handleCanvasClick: jest.fn(),
  handleFieldMouseDown: jest.fn(),
  handleResizeMouseDown: jest.fn(),
  handleFieldKeyboard: jest.fn(),
  duplicateField: jest.fn(),
  deleteField: jest.fn(),
  handleCanvasDragOver: jest.fn(),
  handleCanvasDrop: jest.fn(),
  handleUpdateSettings: jest.fn(),
  handleSaveAndReview: jest.fn(),
};

const createMockState = (overrides: Record<string, unknown> = {}) => ({
  state: {
    documento: {
      id: 1,
      documento_uuid: "test-uuid",
      titulo: "Contrato de Teste",
      selfie_habilitada: false,
      status: "rascunho",
    },
    isLoading: false,
    isSaving: false,
    pdfUrl: "https://example.com/test.pdf",
    currentPage: 1,
    totalPages: 3,
    fields: [],
    selectedField: null,
    zoom: 1,
    signers: [],
    activeSigner: null,
    dragState: { isDragging: false },
    ...overrides,
  },
  actions: mockActions,
  refs: { canvasRef: { current: null } },
});

const mockedUseDocumentEditor = useDocumentEditor as jest.Mock;

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("EditarDocumentoClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- Estado de carregamento ----

  describe("Estado de carregamento", () => {
    it("deve renderizar loading spinner quando isLoading é true", () => {
      mockedUseDocumentEditor.mockReturnValue(
        createMockState({ isLoading: true }),
      );

      render(<EditarDocumentoClient uuid="test-uuid" />);

      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
      expect(screen.getByText("Carregando documento...")).toBeInTheDocument();
    });

    it("deve renderizar loading spinner quando documento é null", () => {
      mockedUseDocumentEditor.mockReturnValue(
        createMockState({ documento: null, isLoading: false }),
      );

      render(<EditarDocumentoClient uuid="test-uuid" />);

      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
      expect(screen.getByText("Carregando documento...")).toBeInTheDocument();
    });

    it("deve renderizar FlowShell com fullHeight mesmo no loading", () => {
      mockedUseDocumentEditor.mockReturnValue(
        createMockState({ isLoading: true }),
      );

      render(<EditarDocumentoClient uuid="test-uuid" />);

      const shell = screen.getByTestId("flow-shell");
      expect(shell).toHaveAttribute("data-full-height", "true");
    });
  });

  // ---- Renderização com documento carregado ----

  describe("Renderização com documento carregado", () => {
    beforeEach(() => {
      mockedUseDocumentEditor.mockReturnValue(createMockState());
    });

    it("deve renderizar o FlowShell com fullHeight", () => {
      render(<EditarDocumentoClient uuid="test-uuid" />);

      const shell = screen.getByTestId("flow-shell");
      expect(shell).toBeInTheDocument();
      expect(shell).toHaveAttribute("data-full-height", "true");
    });

    it("deve renderizar o EditorCanvas", () => {
      render(<EditarDocumentoClient uuid="test-uuid" />);

      expect(screen.getByTestId("editor-canvas")).toBeInTheDocument();
    });

    it("deve renderizar o FloatingSidebar", () => {
      render(<EditarDocumentoClient uuid="test-uuid" />);

      expect(screen.getByTestId("floating-sidebar")).toBeInTheDocument();
    });

    it("deve passar o titulo do documento para o FloatingSidebar", () => {
      render(<EditarDocumentoClient uuid="test-uuid" />);

      const sidebar = screen.getByTestId("floating-sidebar");
      expect(sidebar).toHaveAttribute("data-title", "Contrato de Teste");
    });
  });

  // ---- Indicador de salvamento ----

  describe("Indicador de salvamento", () => {
    it('deve mostrar "Salvando..." quando isSaving é true', () => {
      mockedUseDocumentEditor.mockReturnValue(
        createMockState({ isSaving: true }),
      );

      render(<EditarDocumentoClient uuid="test-uuid" />);

      expect(screen.getByText("Salvando...")).toBeInTheDocument();
    });

    it('deve não mostrar "Salvando..." quando isSaving é false', () => {
      mockedUseDocumentEditor.mockReturnValue(
        createMockState({ isSaving: false }),
      );

      render(<EditarDocumentoClient uuid="test-uuid" />);

      expect(screen.queryByText("Salvando...")).not.toBeInTheDocument();
    });
  });

  // ---- Layout ----

  describe("Layout", () => {
    beforeEach(() => {
      mockedUseDocumentEditor.mockReturnValue(createMockState());
    });

    it("deve ter layout flex com canvas e sidebar", () => {
      render(<EditarDocumentoClient uuid="test-uuid" />);

      expect(screen.getByTestId("editor-canvas")).toBeInTheDocument();
      expect(screen.getByTestId("floating-sidebar")).toBeInTheDocument();
    });

    it("sidebar deve ter classe lg:flex (hidden no mobile)", () => {
      const { container } = render(
        <EditarDocumentoClient uuid="test-uuid" />,
      );

      const sidebarWrapper = container.querySelector(".lg\\:flex.hidden");
      expect(sidebarWrapper).toBeInTheDocument();
    });
  });
});
