"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  actionGetDocumento,
  actionSetDocumentoAnchors,
  actionAddDocumentoSigner,
  actionRemoveDocumentoSigner,
  actionUpdateDocumentoSettings,
} from "../../../actions/documentos-actions";
import { PDF_CANVAS_SIZE } from "../../../types/pdf-preview.types";
import {
  useFieldSelection,
  useFieldDrag,
  useZoomPan,
  usePaletteDrag,
  useSigners,
} from "."; // Import from index in same folder
import { SIGNER_COLORS, type EditorField, type Signatario } from "../types";
import type {
  AssinaturaDigitalDocumentoCompleto,
  UpsertAssinaturaDigitalDocumentoAncoraInput,
} from "../../../domain";

interface UseDocumentEditorProps {
  uuid: string;
}

export function useDocumentEditor({ uuid }: UseDocumentEditorProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [documento, setDocumento] =
    useState<AssinaturaDigitalDocumentoCompleto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fields, setFields] = useState<EditorField[]>([]);
  const [selectedField, setSelectedField] = useState<EditorField | null>(null);

  // --- HOOKS ---
  const { zoom, handleZoomIn, handleZoomOut, handleResetZoom } = useZoomPan({
    canvasSize: PDF_CANVAS_SIZE,
  });

  // Map signers for Editor
  const initialSigners = useMemo<Signatario[]>(() => {
    if (!documento) return [];
    return documento.assinantes.map((a, index) => ({
      id: String(a.id),
      nome:
        (a.dados_snapshot.nome_completo as string) ||
        (a.dados_snapshot.nome as string) ||
        `Assinante ${index + 1}`,
      email: (a.dados_snapshot.email as string) || "",
      cor: SIGNER_COLORS[index % SIGNER_COLORS.length],
      ordem: index,
    }));
  }, [documento]);

  const {
    signers,
    activeSigner,
    setActiveSigner,
    getSignerById,
    getSignerColor,
  } = useSigners({ initialSigners });

  // Field Selection
  const {
    selectField,
    deleteField,
    duplicateField,
    handleFieldClick,
    handleFieldKeyboard,
  } = useFieldSelection({
    fields,
    setFields,
    selectedField,
    setSelectedField,
    currentPage,
    markDirty: () => {},
    canvasSize: PDF_CANVAS_SIZE,
  });

  const handleCanvasClick = useCallback(() => {
    if (selectedField) {
      setFields((prev) => prev.map((f) => ({ ...f, isSelected: false })));
      setSelectedField(null);
    }
  }, [selectedField]);

  // Field Drag
  const {
    dragState,
    handleMouseDown: handleFieldMouseDown,
    handleResizeMouseDown,
  } = useFieldDrag({
    fields,
    setFields,
    zoom,
    canvasRef,
    canvasWidth: PDF_CANVAS_SIZE.width,
    canvasHeight: PDF_CANVAS_SIZE.height,
    editorMode: "select",
    setSelectedField,
    selectField,
    markDirty: () => {},
  });

  // Palette Drag
  const { handleCanvasDragOver, handleCanvasDrop } = usePaletteDrag({
    canvasRef,
    zoom,
    templateId: documento ? documento.documento_uuid : "",
    currentPage,
    fieldsLength: fields.length,
    setFields,
    setSelectedField,
    markDirty: () => {},
  });

  // --- LOADING LOGIC ---
  const loadDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await actionGetDocumento({ uuid });

      if (!res.success) {
        toast.error(res.error || "Erro ao carregar documento.");
        router.push("/app/assinatura-digital/documentos");
        return;
      }

      const docData = res.data;

      if (docData.documento.status === "concluido") {
        toast.error("Este documento já foi concluído.");
        router.push("/app/assinatura-digital/documentos");
        return;
      }

      setDocumento({
        ...docData.documento,
        assinantes: docData.assinantes,
        ancoras: docData.ancoras,
      } as AssinaturaDigitalDocumentoCompleto);

      // Load PDF URL via proxy route (avoids CORS with Backblaze presigned URLs)
      if (docData.documento.pdf_original_url) {
        setPdfUrl(`/api/assinatura-digital/documentos/${uuid}/pdf`);
      }

      // Convert Anchors to Fields
      if (docData.ancoras) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type AncoraDB = any; // Avoid complex circular type inference
        const initialFields: EditorField[] = (
          docData.ancoras as AncoraDB[]
        ).map((a) => ({
          id: String(a.id),
          tipo: a.tipo as EditorField["tipo"],
          nome: a.tipo === "assinatura" ? "Assinatura" : "Rubrica",
          posicao: {
            x: a.x_norm * PDF_CANVAS_SIZE.width,
            y: a.y_norm * PDF_CANVAS_SIZE.height,
            width: a.w_norm * PDF_CANVAS_SIZE.width,
            height: a.h_norm * PDF_CANVAS_SIZE.height,
            pagina: a.pagina,
          },
          isSelected: false,
          isDragging: false,
          signatario_id: String(a.documento_assinante_id),
        }));
        setFields(initialFields);
      }
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar o documento.");
      router.push("/app/assinatura-digital/documentos");
    } finally {
      setIsLoading(false);
    }
  }, [uuid, router]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // --- HANDLERS ---
  const handleAddSigner = async (nome: string, email: string) => {
    if (!documento) return;
    try {
      const res = await actionAddDocumentoSigner({
        documento_uuid: documento.documento_uuid,
        signer: {
          assinante_tipo: "terceiro",
          assinante_entidade_id: null,
          dados_snapshot: { nome, email },
        },
      });
      if (res.success) {
        await loadDocument();
        toast.success("Signatário adicionado com sucesso.");
      } else {
        toast.error(res.error || "Erro ao adicionar signatário.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao adicionar signatário.");
    }
  };

  const handleDeleteSigner = async (id: string) => {
    if (!documento) return;
    const dbId = parseInt(id, 10);

    if (isNaN(dbId)) {
      toast.error("ID inválido.");
      return;
    }

    try {
      const res = await actionRemoveDocumentoSigner({
        documento_uuid: documento.documento_uuid,
        signer_id: dbId,
      });
      if (res?.success) {
        toast.success("Signatário removido.");
        await loadDocument();
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover signatário.");
    }
  };

  const handleUpdateSigner = async (
    _id: string,
    _updates: { nome?: string; email?: string },
  ) => {
    toast.info(
      "Edição direta de assinante não suportada, remova e adicione novamente.",
    );
  };

  const handleUpdateSettings = async (updates: {
    titulo?: string;
    selfie_habilitada?: boolean;
  }) => {
    if (!documento) return;
    try {
      const res = await actionUpdateDocumentoSettings({
        documento_uuid: documento.documento_uuid,
        ...updates,
      });
      if (res.success) {
        setDocumento((prev) =>
          prev
            ? {
                ...prev,
                ...(updates.titulo !== undefined && { titulo: updates.titulo }),
                ...(updates.selfie_habilitada !== undefined && {
                  selfie_habilitada: updates.selfie_habilitada,
                }),
              }
            : prev
        );
      }
    } catch (_error) {
      toast.error("Erro ao atualizar configurações.");
    }
  };

  const handleSaveAndReview = async () => {
    if (!documento) return;

    if (fields.length === 0) {
      toast.warning("Adicione pelo menos um campo de assinatura ao documento.");
      return;
    }

    setIsSaving(true);
    try {
      const ancorasPayload = fields.map((f) => {
        const sId = f.signatario_id ? parseInt(f.signatario_id, 10) : null;
        if (!sId)
          throw new Error(
            `O campo "${f.nome}" (pag ${f.posicao.pagina}) não tem signatário atribuído.`,
          );

        let tipoAncora = "assinatura";
        const fType = f.tipo as string;
        if (fType === "initials") tipoAncora = "rubrica";
        else if (fType === "signature") tipoAncora = "assinatura";

        return {
          documento_auth_id: documento.created_by,
          documento_assinante_id: sId,
          tipo: tipoAncora,
          pagina: f.posicao.pagina,
          x_norm: f.posicao.x / PDF_CANVAS_SIZE.width,
          y_norm: f.posicao.y / PDF_CANVAS_SIZE.height,
          w_norm: f.posicao.width / PDF_CANVAS_SIZE.width,
          h_norm: f.posicao.height / PDF_CANVAS_SIZE.height,
        };
      });

      const ancorasValidas = ancorasPayload.filter((a) =>
        ["assinatura", "rubrica"].includes(a.tipo as string),
      ) as UpsertAssinaturaDigitalDocumentoAncoraInput[];

      await actionSetDocumentoAnchors({
        documento_uuid: documento.documento_uuid,
        ancoras: ancorasValidas,
      });

      toast.success("Configuração salva com sucesso!");
      router.push(
        `/app/assinatura-digital/documentos/revisar/${documento.documento_uuid}`,
      );
    } catch (error: unknown) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao salvar configurações.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    state: {
      documento,
      isLoading,
      isSaving,
      pdfUrl,
      currentPage,
      totalPages,
      fields,
      selectedField,
      zoom,
      signers,
      activeSigner,
      dragState,
    },
    refs: {
      canvasRef,
    },
    actions: {
      setCurrentPage,
      setTotalPages,
      setFields,
      setSelectedField,

      // Zoom
      handleZoomIn,
      handleZoomOut,
      handleResetZoom,

      // Signers
      setActiveSigner,
      handleAddSigner,
      handleDeleteSigner,
      handleUpdateSigner,
      getSignerById,
      getSignerColor,

      // Fields
      handleFieldClick,
      handleCanvasClick,
      handleFieldMouseDown,
      handleResizeMouseDown,
      handleFieldKeyboard,
      duplicateField,
      deleteField,

      // Drag
      handleCanvasDragOver,
      handleCanvasDrop,

      // Settings
      handleUpdateSettings,

      // Save
      handleSaveAndReview,
    },
  };
}
