import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { RevisarDocumentoClient } from "../client-page";

// ─── Mocks ────────────────────────────────────────────────────────────

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockActionGetDocumento = jest.fn();
const mockUsePresignedPdfUrl = jest.fn();
jest.mock("@/shared/assinatura-digital", () => ({
  actionGetDocumento: (...args: unknown[]) => mockActionGetDocumento(...args),
  usePresignedPdfUrl: (...args: unknown[]) => mockUsePresignedPdfUrl(...args),
  PdfPreviewDynamic: () => (
    <div data-testid="pdf-preview">PDF Preview Mock</div>
  ),
}));

const mockActionFinalizeDocumento = jest.fn();
jest.mock("@/shared/assinatura-digital/actions/documentos-actions", () => ({
  actionFinalizeDocumento: (...args: unknown[]) =>
    mockActionFinalizeDocumento(...args),
}));

jest.mock("@/app/(authenticated)/assinatura-digital/components/flow", () => ({
  DocumentFlowShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="document-flow-shell">{children}</div>
  ),
}));

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    get success() {
      return mockToastSuccess;
    },
    get error() {
      return mockToastError;
    },
  },
}));

// ─── Mock Data ────────────────────────────────────────────────────────

const mockDocumento = {
  documento: {
    id: 1,
    documento_uuid: "test-uuid-123",
    titulo: "Contrato de Prestação de Serviços",
    status: "pronto",
    selfie_habilitada: true,
    pdf_original_url: "https://storage.example.com/doc.pdf",
  },
  assinantes: [
    {
      id: 1,
      assinante_tipo: "cliente",
      dados_snapshot: { nome_completo: "João Silva" },
      token: "token-abc",
      public_link: "/assinar/token-abc",
      status: "pendente" as const,
    },
    {
      id: 2,
      assinante_tipo: "parte_contraria",
      dados_snapshot: { nome_completo: "Maria Santos" },
      token: "token-def",
      public_link: "/assinar/token-def",
      status: "concluido" as const,
    },
  ],
  ancoras: [
    {
      id: 1,
      documento_assinante_id: 1,
      tipo: "assinatura" as const,
      pagina: 1,
      x_norm: 0.1,
      y_norm: 0.8,
      w_norm: 0.3,
      h_norm: 0.05,
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────

function setupSuccessfulLoad() {
  mockActionGetDocumento.mockResolvedValue({
    success: true,
    data: mockDocumento,
  });
  mockUsePresignedPdfUrl.mockReturnValue({
    presignedUrl: "https://cdn.example.com/presigned-test.pdf",
  });
}

/**
 * Renderiza o componente e aguarda o carregamento do documento.
 * Não usa act() manual — React Testing Library 16 + React 19 já
 * faz act() internamente no render(). O await é feito via waitFor.
 */
async function renderAndWaitForLoad(uuid = "test-uuid-123") {
  render(<RevisarDocumentoClient uuid={uuid} />);

  await waitFor(() => {
    expect(
      screen.queryByText("Contrato de Prestação de Serviços")
    ).toBeInTheDocument();
  });
}

// ─── Tests ────────────────────────────────────────────────────────────

describe("RevisarDocumentoClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePresignedPdfUrl.mockReturnValue({ presignedUrl: null });

    // clipboard mock
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  // ── 1. Estado de carregamento ──────────────────────────────────────

  describe("Estado de carregamento", () => {
    it("deve renderizar loading spinner inicialmente", () => {
      // Nunca resolve para manter loading
      mockActionGetDocumento.mockReturnValue(new Promise(() => {}));

      render(<RevisarDocumentoClient uuid="test-uuid-123" />);

      expect(screen.getByTestId("document-flow-shell")).toBeInTheDocument();
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("deve renderizar FlowShell durante carregamento", () => {
      mockActionGetDocumento.mockReturnValue(new Promise(() => {}));

      render(<RevisarDocumentoClient uuid="test-uuid-123" />);

      expect(screen.getByTestId("document-flow-shell")).toBeInTheDocument();
    });
  });

  // ── 2. Renderização com documento carregado ────────────────────────

  describe("Renderização com documento carregado", () => {
    beforeEach(() => {
      setupSuccessfulLoad();
    });

    it("deve exibir o título do documento", async () => {
      await renderAndWaitForLoad();

      expect(
        screen.getByText("Contrato de Prestação de Serviços")
      ).toBeInTheDocument();
    });

    it("deve exibir badge de status 'Pronto'", async () => {
      await renderAndWaitForLoad();

      expect(screen.getByText("Pronto")).toBeInTheDocument();
    });

    it("deve renderizar stats row com contagens corretas", async () => {
      await renderAndWaitForLoad();

      // 2 assinantes
      expect(screen.getByText("Assinantes")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();

      // 1 âncora
      expect(screen.getByText("Âncoras")).toBeInTheDocument();

      // 1 pendente
      expect(screen.getByText("Pendentes")).toBeInTheDocument();

      // 1 concluído
      expect(screen.getByText("Concluídos")).toBeInTheDocument();
    });

    it("não deve mostrar 'Concluídos' quando nenhum assinante concluiu", async () => {
      const allPendentes = {
        ...mockDocumento,
        assinantes: mockDocumento.assinantes.map((a) => ({
          ...a,
          status: "pendente" as const,
        })),
      };
      mockActionGetDocumento.mockResolvedValue({
        success: true,
        data: allPendentes,
      });

      render(<RevisarDocumentoClient uuid="test-uuid-123" />);

      await waitFor(() => {
        expect(screen.getByText("Assinantes")).toBeInTheDocument();
      });

      expect(screen.queryByText("Concluídos")).not.toBeInTheDocument();
    });

    it("deve exibir banner de selfie habilitada", async () => {
      await renderAndWaitForLoad();

      expect(
        screen.getByText("Selfie de verificação")
      ).toBeInTheDocument();
      expect(
        screen.getByText("habilitada para este documento")
      ).toBeInTheDocument();
    });

    it("não deve mostrar o banner de selfie quando desabilitada", async () => {
      mockActionGetDocumento.mockResolvedValue({
        success: true,
        data: {
          ...mockDocumento,
          documento: {
            ...mockDocumento.documento,
            selfie_habilitada: false,
          },
        },
      });

      render(<RevisarDocumentoClient uuid="test-uuid-123" />);

      await waitFor(() => {
        expect(
          screen.queryByText("Contrato de Prestação de Serviços")
        ).toBeInTheDocument();
      });

      expect(
        screen.queryByText("Selfie de verificação")
      ).not.toBeInTheDocument();
    });

    it("deve renderizar cards dos assinantes com nomes corretos", async () => {
      await renderAndWaitForLoad();

      expect(screen.getByText("João Silva")).toBeInTheDocument();
      expect(screen.getByText("Maria Santos")).toBeInTheDocument();
    });

    it("deve renderizar PDF preview", async () => {
      await renderAndWaitForLoad();

      expect(screen.getByTestId("pdf-preview")).toBeInTheDocument();
    });

    it("deve mostrar botões de ação (Voltar/Finalizar)", async () => {
      await renderAndWaitForLoad();

      expect(
        screen.getByRole("button", { name: /voltar para edição/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /finalizar e enviar/i })
      ).toBeInTheDocument();
    });

    it("deve exibir 'Documento sem título' quando titulo é null", async () => {
      mockActionGetDocumento.mockResolvedValue({
        success: true,
        data: {
          ...mockDocumento,
          documento: { ...mockDocumento.documento, titulo: null },
        },
      });

      render(<RevisarDocumentoClient uuid="test-uuid-123" />);

      await waitFor(() => {
        expect(
          screen.getByText("Documento sem título")
        ).toBeInTheDocument();
      });
    });
  });

  // ── 3. Assinantes ──────────────────────────────────────────────────

  describe("Assinantes", () => {
    beforeEach(() => {
      setupSuccessfulLoad();
    });

    it("deve exibir nome do assinante do snapshot", async () => {
      await renderAndWaitForLoad();

      expect(screen.getByText("João Silva")).toBeInTheDocument();
      expect(screen.getByText("Maria Santos")).toBeInTheDocument();
    });

    it("deve exibir tipo do assinante", async () => {
      await renderAndWaitForLoad();

      expect(screen.getByText(/cliente/i)).toBeInTheDocument();
      expect(screen.getByText(/parte contrária/i)).toBeInTheDocument();
    });

    it("assinante concluído deve mostrar indicação 'Assinado'", async () => {
      await renderAndWaitForLoad();

      // Maria Santos tem status concluido — deve mostrar " · Assinado"
      expect(screen.getByText(/assinado/i)).toBeInTheDocument();
    });

    it("deve ter botões de copiar link e abrir link externo", async () => {
      await renderAndWaitForLoad();

      const copyButtons = screen.getAllByRole("button", {
        name: /copiar link/i,
      });
      expect(copyButtons).toHaveLength(2);

      const openLinks = screen.getAllByRole("link", { name: /abrir link/i });
      expect(openLinks).toHaveLength(2);
    });

    it("deve apontar link externo para o public_link correto", async () => {
      await renderAndWaitForLoad();

      const openLinks = screen.getAllByRole("link", { name: /abrir link/i });
      expect(openLinks[0]).toHaveAttribute("href", "/assinar/token-abc");
      expect(openLinks[1]).toHaveAttribute("href", "/assinar/token-def");
    });
  });

  // ── 4. Navegação ───────────────────────────────────────────────────

  describe("Navegação", () => {
    beforeEach(() => {
      setupSuccessfulLoad();
    });

    it("botão 'Voltar para Edição' deve navegar para rota de edição", async () => {
      await renderAndWaitForLoad();

      const backBtn = screen.getByRole("button", {
        name: /voltar para edição/i,
      });

      fireEvent.click(backBtn);

      expect(mockPush).toHaveBeenCalledWith(
        "/app/assinatura-digital/documentos/editar/test-uuid-123"
      );
    });
  });

  // ── 5. Finalização ────────────────────────────────────────────────

  describe("Finalização", () => {
    beforeEach(() => {
      setupSuccessfulLoad();
    });

    it("botão 'Finalizar e Enviar' deve chamar actionFinalizeDocumento", async () => {
      mockActionFinalizeDocumento.mockResolvedValue({ success: true });

      await renderAndWaitForLoad();

      const finalizeBtn = screen.getByRole("button", {
        name: /finalizar e enviar/i,
      });

      fireEvent.click(finalizeBtn);

      await waitFor(() => {
        expect(mockActionFinalizeDocumento).toHaveBeenCalledWith({
          uuid: "test-uuid-123",
        });
      });
    });

    it("deve exibir 'Finalizando...' durante processamento", async () => {
      mockActionFinalizeDocumento.mockReturnValue(new Promise(() => {}));

      await renderAndWaitForLoad();

      const finalizeBtn = screen.getByRole("button", {
        name: /finalizar e enviar/i,
      });

      fireEvent.click(finalizeBtn);

      await waitFor(() => {
        expect(screen.getByText("Finalizando...")).toBeInTheDocument();
      });
    });

    it("deve desabilitar botão durante processamento", async () => {
      mockActionFinalizeDocumento.mockReturnValue(new Promise(() => {}));

      await renderAndWaitForLoad();

      const finalizeBtn = screen.getByRole("button", {
        name: /finalizar e enviar/i,
      });

      fireEvent.click(finalizeBtn);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /finalizando/i })
        ).toBeDisabled();
      });
    });

    it("sucesso deve navegar para lista", async () => {
      mockActionFinalizeDocumento.mockResolvedValue({ success: true });

      await renderAndWaitForLoad();

      fireEvent.click(
        screen.getByRole("button", { name: /finalizar e enviar/i })
      );

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(
          "Documento pronto para assinatura! Os links foram gerados."
        );
        expect(mockPush).toHaveBeenCalledWith(
          "/app/assinatura-digital/documentos/lista"
        );
      });
    });

    it("erro deve exibir toast de erro", async () => {
      mockActionFinalizeDocumento.mockResolvedValue({
        success: false,
        error: "Documento inválido",
      });

      await renderAndWaitForLoad();

      fireEvent.click(
        screen.getByRole("button", { name: /finalizar e enviar/i })
      );

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Documento inválido");
      });
    });

    it("exceção deve exibir toast com mensagem do erro", async () => {
      mockActionFinalizeDocumento.mockRejectedValue(
        new Error("Network error")
      );

      await renderAndWaitForLoad();

      fireEvent.click(
        screen.getByRole("button", { name: /finalizar e enviar/i })
      );

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Network error");
      });
    });
  });

  // ── 6. Erro ao carregar ───────────────────────────────────────────

  describe("Erro ao carregar", () => {
    it("deve redirecionar para lista quando documento não é encontrado", async () => {
      mockActionGetDocumento.mockResolvedValue({
        success: true,
        data: { documento: null, assinantes: [], ancoras: [] },
      });

      render(<RevisarDocumentoClient uuid="test-uuid-123" />);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          "Documento não encontrado"
        );
        expect(mockPush).toHaveBeenCalledWith(
          "/app/assinatura-digital/documentos/lista"
        );
      });
    });

    it("deve exibir toast de erro quando actionGetDocumento falha com mensagem", async () => {
      mockActionGetDocumento.mockResolvedValue({
        success: false,
        error: "Não autorizado",
      });

      render(<RevisarDocumentoClient uuid="test-uuid-123" />);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Não autorizado");
        expect(mockPush).toHaveBeenCalledWith(
          "/app/assinatura-digital/documentos/lista"
        );
      });
    });

    it("deve exibir toast de erro padrão quando actionGetDocumento falha sem mensagem", async () => {
      mockActionGetDocumento.mockResolvedValue({
        success: false,
        error: undefined,
      });

      render(<RevisarDocumentoClient uuid="test-uuid-123" />);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          "Erro ao carregar documento"
        );
      });
    });

    it("deve redirecionar quando actionGetDocumento lança exceção", async () => {
      mockActionGetDocumento.mockRejectedValue(new Error("Server error"));

      render(<RevisarDocumentoClient uuid="test-uuid-123" />);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          "Erro ao carregar documento"
        );
        expect(mockPush).toHaveBeenCalledWith(
          "/app/assinatura-digital/documentos/lista"
        );
      });
    });
  });

  // ── 7. Layout ─────────────────────────────────────────────────────

  describe("Layout", () => {
    beforeEach(() => {
      setupSuccessfulLoad();
    });

    it("deve renderizar seção de links com header e botão 'Copiar Todos'", async () => {
      await renderAndWaitForLoad();

      expect(screen.getByText("Links de Assinatura")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /copiar todos/i })
      ).toBeInTheDocument();
    });

    it("deve renderizar seção de preview com header", async () => {
      await renderAndWaitForLoad();

      expect(screen.getByText("Preview do Documento")).toBeInTheDocument();
    });

    it("deve exibir info de segurança (SHA-256, MP 2.200-2)", async () => {
      await renderAndWaitForLoad();

      expect(screen.getByText(/SHA-256/)).toBeInTheDocument();
      expect(screen.getByText(/MP 2\.200-2/)).toBeInTheDocument();
    });

    it("deve exibir descrição sobre links únicos e seguros", async () => {
      await renderAndWaitForLoad();

      expect(
        screen.getByText(/Compartilhe o link com cada assinante/)
      ).toBeInTheDocument();
    });

    it("deve exibir subtítulo de confirmação", async () => {
      await renderAndWaitForLoad();

      expect(
        screen.getByText("Confira as configurações antes de compartilhar")
      ).toBeInTheDocument();
    });

    it("deve exibir controles de paginação do PDF", async () => {
      await renderAndWaitForLoad();

      expect(screen.getByText(/Página \d+ de \d+/)).toBeInTheDocument();
    });
  });

  // ── 8. Interações de cópia ─────────────────────────────────────────

  describe("Interações de cópia", () => {
    beforeEach(() => {
      setupSuccessfulLoad();
    });

    it("deve copiar link individual ao clicar no botão copiar", async () => {
      await renderAndWaitForLoad();

      const copyButtons = screen.getAllByRole("button", {
        name: /copiar link/i,
      });

      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          "http://localhost/assinar/token-abc"
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Link copiado para João Silva"
      );
    });

    it("deve copiar todos os links ao clicar em 'Copiar Todos'", async () => {
      await renderAndWaitForLoad();

      fireEvent.click(
        screen.getByRole("button", { name: /copiar todos/i })
      );

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining("João Silva")
        );
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining("Maria Santos")
        );
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining("http://localhost/assinar/token-abc")
        );
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining("http://localhost/assinar/token-def")
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Todos os links foram copiados!"
      );
    });

    it("deve exibir toast de erro quando copiar link individual falhar", async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(
        new Error("Clipboard error")
      );

      await renderAndWaitForLoad();

      const copyButtons = screen.getAllByRole("button", {
        name: /copiar link/i,
      });

      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Erro ao copiar link");
      });
    });

    it("deve exibir toast de erro quando copiar todos os links falhar", async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(
        new Error("Clipboard error")
      );

      await renderAndWaitForLoad();

      fireEvent.click(
        screen.getByRole("button", { name: /copiar todos/i })
      );

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Erro ao copiar links");
      });
    });
  });

  // ── 9. Acessibilidade ─────────────────────────────────────────────

  describe("Acessibilidade", () => {
    beforeEach(() => {
      setupSuccessfulLoad();
    });

    it("deve ter sr-only labels nos botões de copiar link", async () => {
      await renderAndWaitForLoad();

      const srOnlyLabels = screen.getAllByText("Copiar link");
      srOnlyLabels.forEach((label) => {
        expect(label).toHaveClass("sr-only");
      });
    });

    it("deve ter sr-only labels nos botões de abrir link", async () => {
      await renderAndWaitForLoad();

      const srOnlyLabels = screen.getAllByText("Abrir link");
      srOnlyLabels.forEach((label) => {
        expect(label).toHaveClass("sr-only");
      });
    });

    it('links externos devem ter rel="noopener noreferrer"', async () => {
      await renderAndWaitForLoad();

      const openLinks = screen.getAllByRole("link", { name: /abrir link/i });
      openLinks.forEach((link) => {
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      });
    });

    it('links externos devem ter target="_blank"', async () => {
      await renderAndWaitForLoad();

      const openLinks = screen.getAllByRole("link", { name: /abrir link/i });
      openLinks.forEach((link) => {
        expect(link).toHaveAttribute("target", "_blank");
      });
    });
  });
});
