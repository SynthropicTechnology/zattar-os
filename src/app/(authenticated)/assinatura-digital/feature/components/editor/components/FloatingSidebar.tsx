'use client';

import { useState, useCallback, useRef } from 'react';
import {
  PenTool,
  BadgeIcon,
  Plus,
  Settings,
  ArrowRight,
  Camera,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { EditorField, Signatario, SignatureFieldType } from '../types';
import SignerCard from './SignerCard';
import SignerDialog from './SignerDialog';
import { SectionHeader } from './SectionHeader';

interface FloatingSidebarProps {
  signers: Signatario[];
  activeSigner: Signatario | null;
  onSelectSigner: (signer: Signatario | null) => void;
  onAddSigner: (nome: string, email: string) => void;
  onUpdateSigner: (id: string, updates: { nome?: string; email?: string }) => void;
  onDeleteSigner: (id: string) => void;
  currentUserEmail?: string;
  fields: EditorField[];
  onPaletteDragStart: (fieldType: SignatureFieldType) => void;
  onPaletteDragEnd: () => void;
  onReviewAndSend?: () => void;
  className?: string;
  // Configurações do documento
  documentTitle?: string;
  selfieEnabled?: boolean;
  onUpdateSettings?: (updates: { titulo?: string; selfie_habilitada?: boolean }) => void;
}

// --- FIELD PALETTE CARD ---

interface FieldPaletteCardProps {
  type: SignatureFieldType;
  icon: React.ElementType;
  label: string;
  onDragStart: (type: SignatureFieldType) => void;
  onDragEnd: () => void;
}

function FieldPaletteCard({
  type,
  icon: Icon,
  label,
  onDragStart,
  onDragEnd
}: FieldPaletteCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('field-type', type);
        e.dataTransfer.effectAllowed = 'copy';
        onDragStart(type);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-4 border rounded-xl',
        'cursor-grab active:cursor-grabbing select-none',
        'bg-background hover:bg-muted/50 hover:border-primary/50 hover:shadow-sm',
        'transition-all duration-200 group'
      )}
    >
      <div className="p-2.5 rounded-full bg-muted group-hover:bg-background group-hover:text-primary transition-colors">
        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
      </div>
      <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">{label}</span>
    </div>
  );
}

// --- SIDEBAR CONTENT ---

function SidebarContent(props: FloatingSidebarProps) {
  const {
    signers,
    activeSigner,
    onSelectSigner,
    onAddSigner,
    onUpdateSigner,
    onDeleteSigner,
    onPaletteDragStart,
    onPaletteDragEnd,
    onReviewAndSend,
    documentTitle,
    selfieEnabled,
    onUpdateSettings,
  } = props;

  const [isAddSignerOpen, setIsAddSignerOpen] = useState(false);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleTitleChange = useCallback((value: string) => {
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(() => {
      onUpdateSettings?.({ titulo: value });
    }, 600);
  }, [onUpdateSettings]);

  const FIELD_TYPES = [
    { type: 'signature' as const, label: 'Assinatura', icon: PenTool },
    { type: 'initials' as const, label: 'Rubrica', icon: BadgeIcon },
  ];

  const hasFieldsAndSigners = signers.length > 0 && props.fields.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 space-y-6 overflow-y-auto px-6 py-6">
        {/* Document Settings Section */}
        <div className="space-y-4">
          <SectionHeader title="Configurações" />

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="doc-titulo" className="flex items-center gap-1.5">
                <FileText className="size-3.5" />
                Título
              </Label>
              <Input
                id="doc-titulo"
                placeholder="Ex: Contrato de Prestação de Serviços"
                defaultValue={documentTitle ?? ''}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-background p-3">
              <div className="flex items-center gap-2 min-w-0">
                <Camera className="size-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Selfie de verificação</p>
                  <p className="text-xs text-muted-foreground">
                    Exigir foto do assinante
                  </p>
                </div>
              </div>
              <Switch
                checked={selfieEnabled ?? false}
                onCheckedChange={(checked) =>
                  onUpdateSettings?.({ selfie_habilitada: checked })
                }
                aria-label="Exigir selfie de verificação"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Signers Section */}
        <div className="space-y-4">
          <SectionHeader title="Quem vai assinar?" />

          <div className="space-y-3">
            {signers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-background/50 hover:bg-background transition-colors text-center">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Nenhum assinante
                </p>
                <p className="text-xs text-muted-foreground mb-4 max-w-45">
                  Adicione as pessoas que precisam assinar este documento.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsAddSignerOpen(true)}
                >
                  <Plus className="size-3.5 mr-2" />
                  Adicionar Assinante
                </Button>
              </div>
            ) : (
              <>
                {signers.map(signer => (
                  <SignerCard
                    key={signer.id}
                    signer={signer}
                    isActive={activeSigner?.id === signer.id}
                    onSelect={() => onSelectSigner(signer)}
                    onDelete={() => onDeleteSigner(signer.id)}
                    onEdit={() => onUpdateSigner(signer.id, {})}
                    isCurrentUser={false}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => setIsAddSignerOpen(true)}
                >
                  <Plus className="size-3.5 mr-2" />
                  Adicionar Outro
                </Button>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Fields Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <SectionHeader title="Campos de Assinatura" />
            <p className="text-xs text-muted-foreground">
              Arraste os campos para o documento e solte onde deseja que o assinante assine.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FIELD_TYPES.map(ft => (
              <FieldPaletteCard
                key={ft.type}
                type={ft.type}
                label={ft.label}
                icon={ft.icon}
                onDragStart={onPaletteDragStart}
                onDragEnd={onPaletteDragEnd}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t p-6">
        <Button
          className="w-full h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-all"
          onClick={onReviewAndSend}
          disabled={!hasFieldsAndSigners}
        >
          Salvar e Revisar
          <ArrowRight className="ml-2 size-5" />
        </Button>
      </div>

      <SignerDialog
        open={isAddSignerOpen}
        onOpenChange={setIsAddSignerOpen}
        onSave={onAddSigner}
        mode="add"
      />
    </div>
  );
}

/**
 * FloatingSidebar - Responsive sidebar for document configuration and field palette
 *
 * Sections:
 * - Document settings (title, selfie)
 * - Signers management
 * - Field palette (signature, initials)
 * - CTA button (save & review)
 *
 * Desktop: Renders inside a card container provided by parent
 * Mobile: Sheet (drawer) triggered by FAB
 */
export default function FloatingSidebar(props: FloatingSidebarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <div className={cn('hidden h-full min-h-0 flex-col lg:flex', props.className)}>
        <SidebarContent {...props} />
      </div>

      <div className="lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className={cn(
                'fixed bottom-6 right-6 z-50',
                'size-14 rounded-full shadow-lg',
                'bg-primary hover:bg-primary/90',
                'hover:scale-110 active:scale-95 transition-transform duration-200'
              )}
              aria-label="Abrir configurações do documento"
            >
              <Settings className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-xl">
            <SidebarContent {...props} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
