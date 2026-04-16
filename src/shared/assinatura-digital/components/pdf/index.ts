// PdfPreview não é exportado diretamente porque importa react-pdf estaticamente,
// causando erro DOMMatrix no SSR. Use sempre PdfPreviewDynamic.
export { default as PdfPreviewDynamic } from './PdfPreviewDynamic';