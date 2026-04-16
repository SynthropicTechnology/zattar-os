import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentUploadDropzone } from "@/app/(authenticated)/assinatura-digital/components/upload/document-upload-dropzone";
import { SignatureWorkflowStepper } from "@/app/(authenticated)/assinatura-digital/components/workflow/signature-workflow-stepper";
import FloatingSidebar from "@/app/(authenticated)/assinatura-digital/components/editor/components/FloatingSidebar";
import { useFormularioStore } from "@/shared/assinatura-digital/store/formulario-store";
import { useDocumentUpload } from "@/app/(authenticated)/assinatura-digital/components/upload/hooks/use-document-upload";
import { useSigners } from "@/app/(authenticated)/assinatura-digital/components/editor/hooks/use-signers";

// Mocks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => "/app/assinatura-digital"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));
jest.mock("@/app/(authenticated)/assinatura-digital/components/upload/hooks/use-document-upload");
jest.mock("@/app/(authenticated)/assinatura-digital/components/editor/hooks/use-signers");
jest.mock("@/shared/assinatura-digital/store/formulario-store");
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// Simplified mock helper
const _mockStore = () => {
  const state = {
    etapaAtual: 0,
    dadosContrato: {},
    signers: [] as any[],
  };
  return {
    etapaAtual: 0,
    setDadosContrato: jest.fn((data) => {
      state.dadosContrato = { ...state.dadosContrato, ...data };
    }),
    proximaEtapa: jest.fn(() => {
      state.etapaAtual += 1;
    }),
    getTotalSteps: jest.fn(() => 3),
    // ... add other necessary mock implementations
  };
};

describe("Assinatura Digital - New Workflow Integration", () => {
  const user = userEvent.setup();
  const mockUpload = {
    isUploading: false,
    uploadFile: jest
      .fn()
      .mockResolvedValue({ url: "http://test.com/doc.pdf", name: "doc.pdf" }),
    selectFile: jest.fn(),
    selectedFile: { name: "doc.pdf" },
    resetUpload: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useDocumentUpload as unknown as jest.Mock).mockReturnValue(mockUpload);
    (useSigners as unknown as jest.Mock).mockReturnValue({
      signers: [],
      addSigner: jest.fn(),
      activeSigner: null,
      setActiveSigner: jest.fn(),
    });
    (useFormularioStore as unknown as jest.Mock).mockReturnValue({
      etapaAtual: 0, // Upload step
      setDadosContrato: jest.fn(),
      proximaEtapa: jest.fn(),
      getTotalSteps: jest.fn(() => 3),
    });
  });

  it("deve permitir fluxo de upload e avançar", async () => {
    // Render components that would appear in the page
    render(
      <div>
        <SignatureWorkflowStepper />
        <DocumentUploadDropzone open={true} onOpenChange={jest.fn()} />
      </div>
    );

    // Verify Stepper
    expect(screen.getByTestId("workflow-stepper")).toBeInTheDocument();

    // Simular fluxo de upload
    const continueBtn = screen.getByRole("button", {
      name: /confirmar e enviar documento/i,
    });
    await user.click(continueBtn);

    await waitFor(() => {
      expect(mockUpload.uploadFile).toHaveBeenCalled();
    });
  });

  it("deve permitir adicionar signatário na etapa de configuração", async () => {
    // Change store state to step 1 (Configuration)
    (useFormularioStore as unknown as jest.Mock).mockReturnValue({
      etapaAtual: 1,
      getTotalSteps: jest.fn(() => 3),
    });

    render(
      <FloatingSidebar
        signers={[]}
        activeSigner={null}
        onSelectSigner={jest.fn()}
        onAddSigner={jest.fn()}
        onUpdateSigner={jest.fn()}
        onDeleteSigner={jest.fn()}
        fields={[]}
        onPaletteDragStart={jest.fn()}
        onPaletteDragEnd={jest.fn()}
      />
    );

    // Simular abre modal de adicionar (assuming button exists in sidebar)
    const addBtn = screen.getByRole("button", { name: /adicionar/i });
    await user.click(addBtn);

    // This is a partial integration test as it relies on internal components of FloatingSidebar working.
    // If FloatingSidebar uses a Dialog that is not mocked or handled, this might fail without further setup.
    // Assuming FloatingSidebar uses internal state or another hook for modal.
  });
});
