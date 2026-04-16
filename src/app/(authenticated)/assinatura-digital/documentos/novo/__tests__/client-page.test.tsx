import { render, screen } from "@testing-library/react";
import { NovoDocumentoClient } from "../client-page";

// Mocks
jest.mock("@/app/(authenticated)/assinatura-digital/components/flow", () => ({
  DocumentFlowShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="document-flow-shell">{children}</div>
  ),
}));

jest.mock("@/app/(authenticated)/assinatura-digital/components/upload", () => ({
  DocumentUploadDropzone: () => (
    <div data-testid="document-upload-dropzone">Upload Dropzone</div>
  ),
}));

describe("NovoDocumentoClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Renderizacao ──────────────────────────────────────────────────

  describe("renderizacao", () => {
    it("deve renderizar sem erros", () => {
      expect(() => render(<NovoDocumentoClient />)).not.toThrow();
    });

    it("deve renderizar o DocumentFlowShell como wrapper", () => {
      render(<NovoDocumentoClient />);
      expect(screen.getByTestId("document-flow-shell")).toBeInTheDocument();
    });

    it("deve renderizar o DocumentUploadDropzone", () => {
      render(<NovoDocumentoClient />);
      expect(
        screen.getByTestId("document-upload-dropzone")
      ).toBeInTheDocument();
    });
  });

  // ─── Painel de Contexto ────────────────────────────────────────────

  describe("painel de contexto", () => {
    it('deve exibir o titulo "Como funciona"', () => {
      render(<NovoDocumentoClient />);
      expect(
        screen.getByRole("heading", { name: /como funciona/i })
      ).toBeInTheDocument();
    });

    it("deve exibir o subtitulo descritivo", () => {
      render(<NovoDocumentoClient />);
      expect(
        screen.getByText(/envie, configure e compartilhe em 3 passos simples/i)
      ).toBeInTheDocument();
    });

    it.each([
      "Envie o PDF",
      "Adicione assinantes",
      "Compartilhe os links",
      "Validade jurídica",
    ])('deve exibir o titulo do passo "%s"', (title) => {
      render(<NovoDocumentoClient />);
      expect(screen.getByText(title)).toBeInTheDocument();
    });

    it.each([
      "Faça upload do documento que será assinado digitalmente.",
      "Defina quem vai assinar e posicione os campos de assinatura no PDF.",
      "Cada assinante recebe um link único e seguro para assinar.",
      "Assinaturas com hash SHA-256, geolocalização, IP e aceite de termos (MP 2.200-2).",
    ])('deve exibir a descricao "%s"', (description) => {
      render(<NovoDocumentoClient />);
      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it("deve exibir todos os 4 passos do fluxo", () => {
      render(<NovoDocumentoClient />);

      const titles = [
        "Envie o PDF",
        "Adicione assinantes",
        "Compartilhe os links",
        "Validade jurídica",
      ];

      titles.forEach((title) => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
    });
  });

  // ─── Layout ────────────────────────────────────────────────────────

  describe("layout", () => {
    it("deve ter layout flex responsivo (flex-col no mobile, flex-row no desktop)", () => {
      render(<NovoDocumentoClient />);

      const shell = screen.getByTestId("document-flow-shell");
      const layoutContainer = shell.firstChild as HTMLElement;

      expect(layoutContainer).toHaveClass("flex");
      expect(layoutContainer).toHaveClass("flex-col");
      expect(layoutContainer).toHaveClass("lg:flex-row");
    });

    it("deve renderizar o dropzone e o painel de contexto como filhos do layout", () => {
      render(<NovoDocumentoClient />);

      const shell = screen.getByTestId("document-flow-shell");
      const layoutContainer = shell.firstChild as HTMLElement;

      // Dropzone area (flex-1) e context panel (lg:w-80)
      expect(layoutContainer.children).toHaveLength(2);
    });
  });
});
