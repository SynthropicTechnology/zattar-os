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
  documentTitle?: string;
  selfieEnabled?: boolean;
  onUpdateSettings?: (updates: { titulo?: string; selfie_habilitada?: boolean }) => void;
}

// ─── Ambient divider ──────────────────────────────────────────────────

function AmbientDivider() {
  return (
    <div
      aria-hidden="true"
      className="h-px bg-linear-to-r from-transparent via-border/50 to-transparent"
    />
  );
}

// ─── Field palette (glass chip alinhado ao POC) ───────────────────────

interface FieldPaletteCardProps {
  type: SignatureFieldType;
  icon: React.ElementType;
  label: string;
  tone: 'primary' | 'info';
  onDragStart: (type: SignatureFieldType) => void;
  onDragEnd: () => void;
}

function FieldPaletteCard({
  type,
  icon: Icon,
  label,
  tone,
  onDragStart,
  onDragEnd,
}: FieldPaletteCardProps) {
  const tile =
    tone === 'primary'
      ? 'bg-primary/8 text-primary/75'
      : 'bg-info/10 text-info/75';
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
        'flex items-center gap-3 p-3 rounded-xl border backdrop-blur-md select-none',
        'glass-kpi border-border/40 bg-card/55',
        'cursor-grab active:cursor-grabbing',
        'hover:border-primary/40 hover:-translate-y-px hover:shadow-sm',
        'transition-all duration-200',
      )}
    >
      <span
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-lg shrink-0',
          tile,
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </div>
  );
}

// ─── Sidebar content ──────────────────────────────────────────────────

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

  const handleTitleChange = useCallback(
    (value: string) => {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
      titleDebounceRef.current = setTimeout(() => {
        onUpdateSettings?.({ titulo: value });
      }, 600);
    },
    [onUpdateSettings],
  );

  const FIELD_TYPES: Array<{
    type: SignatureFieldType;
    label: string;
    icon: React.ElementType;
    tone: 'primary' | 'info';
  }> = [
    { type: 'signature', label: 'Assinatura', icon: PenTool, tone: 'primary' },
    { type: 'initials', label: 'Rubrica', icon: BadgeIcon, tone: 'info' },
  ];

  const hasFieldsAndSigners = signers.length > 0 && props.fields.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-card/40 backdrop-blur-xl">
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-5 py-5">
        {/* ── Configurações ───────────────────────── */}
        <section className="space-y-3">
          <SectionHeader title="Configurações" />

          <div className="space-y-2.5">
            <div className="space-y-1.5">
              <Label htmlFor="doc-titulo" className="flex items-center gap-1.5 text-xs">
                <FileText className="size-3.5" />
                Título
              </Label>
              <Input
                id="doc-titulo"
                placeholder="Ex: Contrato de Prestação de Serviços"
                defaultValue={documentTitle ?? ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-card/55 backdrop-blur-md p-3 glass-kpi">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-info/10 shrink-0">
                  <Camera className="size-3.5 text-info/70" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium">Selfie de verificação</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
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
        </section>

        <AmbientDivider />

        {/* ── Signatários ─────────────────────────── */}
        <section className="space-y-3">
          <SectionHeader
            title="Quem vai assinar?"
            action={
              signers.length > 0 ? (
                <span className="text-[11px] tabular-nums px-1.5 py-0.5 rounded-full bg-foreground/8 text-muted-foreground">
                  {signers.length}
                </span>
              ) : null
            }
          />

          <div className="space-y-2">
            {signers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-border/60 rounded-xl bg-card/30 text-center">
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-foreground/5">
                  <Settings className="size-4 text-muted-foreground" />
                </span>
                <p className="text-xs font-medium text-foreground">
                  Nenhum assinante
                </p>
                <p className="text-[11px] text-muted-foreground max-w-45 leading-relaxed">
                  Adicione as pessoas que precisam assinar este documento.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-1 gap-1.5"
                  onClick={() => setIsAddSignerOpen(true)}
                >
                  <Plus className="size-3.5" />
                  Adicionar Assinante
                </Button>
              </div>
            ) : (
              <>
                {signers.map((signer) => (
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
                  className="w-full border-dashed gap-1.5"
                  onClick={() => setIsAddSignerOpen(true)}
                >
                  <Plus className="size-3.5" />
                  Adicionar Outro
                </Button>
              </>
            )}
          </div>
        </section>

        <AmbientDivider />

        {/* ── Campos ─────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex flex-col gap-1">
            <SectionHeader title="Campos" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Arraste para o documento e solte onde deseja que o assinante
              assine.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {FIELD_TYPES.map((ft) => (
              <FieldPaletteCard
                key={ft.type}
                type={ft.type}
                label={ft.label}
                icon={ft.icon}
                tone={ft.tone}
                onDragStart={onPaletteDragStart}
                onDragEnd={onPaletteDragEnd}
              />
            ))}
          </div>
        </section>
      </div>

      {/* ── Footer CTA ─────────────────────────────── */}
      <div className="shrink-0 border-t border-border/30 p-4 bg-background/50 backdrop-blur-md">
        <Button
          className="w-full h-11 text-sm font-semibold shadow-sm gap-2"
          onClick={onReviewAndSend}
          disabled={!hasFieldsAndSigners}
        >
          Salvar e Revisar
          <ArrowRight className="size-4" />
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
 * FloatingSidebar — Sidebar de configuracao e paleta de campos.
 *
 * Desktop: renderiza dentro de container glass (parent provê bg/border).
 * Mobile: Sheet (bottom drawer) acionado por FAB.
 *
 * Alinhado ao Design System Glass Briefing:
 * - Seções separadas por ambient-divider (sem Separator hard)
 * - SignerCard com dot colorido + avatar (não mais bg inteiro colorido)
 * - FieldPaletteCard como glass chip com icon-tile tonalizado
 */
export default function FloatingSidebar(props: FloatingSidebarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <div
        className={cn('hidden h-full min-h-0 flex-col lg:flex', props.className)}
      >
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
                'hover:scale-105 active:scale-95 transition-transform duration-200',
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
