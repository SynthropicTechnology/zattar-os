export * from "./domain";
// export * from './domain'; // Already exported above
export * from "./utils";

// Components
export { DocumentList } from "./components/document-list";
export { DocumentListSkeleton } from "./components/document-list-skeleton";
export { DocumentEditor } from "./components/document-editor";
export { FolderTree } from "./components/folder-tree";
export { ShareDocumentDialog } from "./components/share-document-dialog";
export { VersionHistoryDialog } from "./components/version-history-dialog";
export { UploadDialog } from "./components/upload-dialog";
export { TemplateLibraryDialog } from "./components/template-library-dialog";
export { FileManager } from "./components/file-manager";
export { FileUploadDialogUnified } from "./components/file-upload-dialog-unified";
export { CreateFolderDialog } from "./components/create-folder-dialog";

// Hooks (Optional, usually imported directly to tree shake)
export { useDocument } from "./hooks/use-document";
export { useDocumentsList } from "./hooks/use-documents-list";
export { useDocumentSharing } from "./hooks/use-document-sharing";
export { useDocumentVersions } from "./hooks/use-document-versions";
export { useFolders } from "./hooks/use-folders";
export { useTemplates } from "./hooks/use-templates";
export { useDocumentUploads } from "./hooks/use-document-uploads";

// Server Actions - Uploads
export {
  actionUploadArquivo,
  actionListarUploads,
  actionGerarPresignedUrl,
  actionGerarUrlDownload,
} from "./actions/uploads-actions";

// Server Actions - Lixeira
export {
  actionListarLixeira,
  actionRestaurarDaLixeira,
  actionDeletarPermanentemente,
} from "./actions/lixeira-actions";

// Server Actions - Arquivos genéricos
export {
  actionUploadArquivoGenerico,
  actionListarItensUnificados,
  actionMoverArquivo,
  actionDeletarArquivo,
} from "./actions/arquivos-actions";

// Server Actions - Documentos (Plate)
export {
  actionListarDocumentos,
  actionBuscarDocumento,
  actionCriarDocumento,
  actionAtualizarDocumento,
  actionDeletarDocumento,
} from "./actions/documentos-actions";

