"use client"

import { useState, useCallback, useEffect } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter, DragOverlay } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { toast } from 'sonner';
import { DynamicFormSchema, FormFieldSchema, FormSectionSchema, FormFieldType } from '@/shared/assinatura-digital';
import { validateFormSchema } from '@/shared/assinatura-digital/utils';
import DynamicFormRenderer from '@/app/(assinatura-digital)/_wizard/form/dynamic-form-renderer';
import FieldPalette from './FieldPalette';
import SchemaCanvas, { getFieldIcon } from './SchemaCanvas';
import FieldPropertiesPanel from './FieldPropertiesPanel';
import { Eye, Code, Save, X, AlertTriangle, Pencil } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Heading } from '@/components/ui/typography';

interface FormSchemaBuilderProps {
  initialSchema?: DynamicFormSchema;
  formularioNome: string;
  onSave: (schema: DynamicFormSchema) => Promise<void>;
  onCancel: () => void;
}

export function FormSchemaBuilder({
  initialSchema,
  formularioNome,
  onSave,
  onCancel
}: FormSchemaBuilderProps) {
  const [schema, setSchema] = useState<DynamicFormSchema>(
    initialSchema || {
      id: `form-${Date.now()}`,
      version: '1.0.0',
      sections: [],
      globalValidations: [],
    }
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showJsonView, setShowJsonView] = useState(false);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [showDeleteSectionDialog, setShowDeleteSectionDialog] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState({ title: '', description: '' });
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [jsonContent, setJsonContent] = useState('');

  useEffect(() => {
    if (initialSchema) {
      setSchema(initialSchema);
    }
  }, [initialSchema]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveFieldId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveFieldId(null);
    const { active, over } = event;

    if (!over) return;

    // Dragging from palette
    if (String(active.id).startsWith('palette-')) {
      // ID format: palette-{type}-{fieldName} or palette-{type} (legacy)
      const idParts = String(active.id).replace('palette-', '').split('-');
      const fieldType = idParts[0] as FormFieldType;
      const fieldNameFromId = idParts.length > 1 ? idParts.slice(1).join('-') : undefined;

      // Resolve target section ID
      let targetSectionId = over.data.current?.sectionId;

      // If dropping on a field, find its section
      if (!targetSectionId && over.id) {
        const section = schema.sections.find(s => s.fields.some(f => f.id === String(over.id)));
        targetSectionId = section?.id;
      }

      // Fallback to first section
      if (!targetSectionId) {
        targetSectionId = schema.sections[0]?.id;
      }

      if (!targetSectionId) {
        toast.error('Adicione uma seção antes de adicionar campos');
        return;
      }

      // Get field name and label from drag data if available (prioritize data.current over ID parsing)
      const entityFieldName = (active.data.current?.fieldName as string | undefined) || fieldNameFromId;
      const entityFieldLabel = (active.data.current?.label as string | undefined) || fieldNameFromId?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      const newField: FormFieldSchema = {
        id: `field-${Date.now()}`,
        name: entityFieldName || `field_${Date.now()}`,
        label: entityFieldLabel || String(active.data.current?.label || fieldType),
        type: fieldType,
        validation: {},
        gridColumns: 1,
      };

      // Find target position if dropping on a field
      setSchema(prev => ({
        ...prev,
        sections: prev.sections.map(section => {
          if (section.id === targetSectionId) {
            // If dropping on a specific field, insert at that position
            if (over.id && over.id !== section.id) {
              const targetIndex = section.fields.findIndex(f => f.id === over.id);
              if (targetIndex !== -1) {
                const newFields = [...section.fields];
                newFields.splice(targetIndex, 0, newField);
                return { ...section, fields: newFields };
              }
            }
            // Otherwise append to end
            return {
              ...section,
              fields: [...section.fields, newField]
            };
          }
          return section;
        })
      }));

      markDirty();
      setSelectedFieldId(newField.id);
      toast.success('Campo adicionado com sucesso');
    }
    // Reordering fields within section
    else if (active.id !== over.id) {
      setSchema(prev => {
        const newSections = [...prev.sections];

        // Find source and target sections
        let sourceSection: FormSectionSchema | null = null;
        let sourceSectionIndex = -1;
        let sourceFieldIndex = -1;

        for (let i = 0; i < newSections.length; i++) {
          const fieldIndex = newSections[i].fields.findIndex(f => f.id === active.id);
          if (fieldIndex !== -1) {
            sourceSection = newSections[i];
            sourceSectionIndex = i;
            sourceFieldIndex = fieldIndex;
            break;
          }
        }

        if (!sourceSection || sourceFieldIndex === -1) return prev;

        const field = sourceSection.fields[sourceFieldIndex];

        // Resolve target section ID
        let targetSectionId = over.data.current?.sectionId;

        // If not directly available, find section containing the target field
        if (!targetSectionId && over.id) {
          const section = newSections.find(s => s.fields.some(f => f.id === String(over.id)));
          targetSectionId = section?.id;
        }

        if (!targetSectionId) {
          toast.error('Não foi possível determinar a seção de destino');
          return prev;
        }

        const targetSectionIndex = newSections.findIndex(s => s.id === targetSectionId);

        if (targetSectionIndex === -1) return prev;

        // Remove from source
        newSections[sourceSectionIndex] = {
          ...newSections[sourceSectionIndex],
          fields: newSections[sourceSectionIndex].fields.filter((_, i) => i !== sourceFieldIndex)
        };

        // Add to target
        const targetFieldIndex = newSections[targetSectionIndex].fields.findIndex(f => f.id === over.id);
        const insertIndex = targetFieldIndex !== -1 ? targetFieldIndex : newSections[targetSectionIndex].fields.length;

        const newTargetFields = [...newSections[targetSectionIndex].fields];
        newTargetFields.splice(insertIndex, 0, field);

        newSections[targetSectionIndex] = {
          ...newSections[targetSectionIndex],
          fields: newTargetFields
        };

        // Update selected section
        setSelectedSectionId(targetSectionId);

        markDirty();
        return { ...prev, sections: newSections };
      });
    }
  }, [schema.sections, markDirty]);

  const handleFieldSelect = useCallback((fieldId: string) => {
    setSelectedFieldId(fieldId);
    // Find section containing field
    const section = schema.sections.find(s => s.fields.some(f => f.id === fieldId));
    if (section) {
      setSelectedSectionId(section.id);
    }
  }, [schema.sections]);

  const handleFieldUpdate = useCallback((updatedField: FormFieldSchema) => {
    setSchema(prev => ({
      ...prev,
      sections: prev.sections.map(section => ({
        ...section,
        fields: section.fields.map(field =>
          field.id === updatedField.id ? updatedField : field
        )
      }))
    }));
    markDirty();
    toast.success('Campo atualizado');
  }, [markDirty]);

  const handleFieldDelete = useCallback((fieldId: string) => {
    setSchema(prev => ({
      ...prev,
      sections: prev.sections.map(section => ({
        ...section,
        fields: section.fields.filter(field => field.id !== fieldId)
      }))
    }));
    setSelectedFieldId(null);
    markDirty();
    toast.success('Campo deletado');
  }, [markDirty]);

  const handleFieldDuplicate = useCallback((fieldId: string) => {
    setSchema(prev => {
      const newSections = prev.sections.map(section => {
        const fieldIndex = section.fields.findIndex(f => f.id === fieldId);
        if (fieldIndex !== -1) {
          const originalField = section.fields[fieldIndex];
          const duplicatedField: FormFieldSchema = {
            ...originalField,
            id: `${originalField.id}-copy-${Date.now()}`,
            name: `${originalField.name}_copy`,
            label: `${originalField.label} (cópia)`,
          };
          const newFields = [...section.fields];
          newFields.splice(fieldIndex + 1, 0, duplicatedField);
          return { ...section, fields: newFields };
        }
        return section;
      });
      return { ...prev, sections: newSections };
    });
    markDirty();
    toast.success('Campo duplicado');
  }, [markDirty]);

  const handleSectionAdd = useCallback(() => {
    setSectionForm({ title: 'Nova Seção', description: '' });
    setEditingSectionId(null);
    setShowSectionDialog(true);
  }, []);

  const handleSectionEdit = useCallback((sectionId: string) => {
    const section = schema.sections.find(s => s.id === sectionId);
    if (section) {
      setSectionForm({ title: section.title, description: section.description || '' });
      setEditingSectionId(sectionId);
      setShowSectionDialog(true);
    }
  }, [schema.sections]);

  const handleSectionSave = useCallback(() => {
    if (!sectionForm.title.trim()) {
      toast.error('Título da seção é obrigatório');
      return;
    }

    if (editingSectionId) {
      // Edit existing
      setSchema(prev => ({
        ...prev,
        sections: prev.sections.map(section =>
          section.id === editingSectionId
            ? { ...section, title: sectionForm.title, description: sectionForm.description }
            : section
        )
      }));
      toast.success('Seção atualizada');
    } else {
      // Add new
      const newSection: FormSectionSchema = {
        id: `section-${Date.now()}`,
        title: sectionForm.title,
        description: sectionForm.description || undefined,
        fields: [],
      };
      setSchema(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
      toast.success('Seção adicionada');
    }

    markDirty();
    setShowSectionDialog(false);
    setSectionForm({ title: '', description: '' });
    setEditingSectionId(null);
  }, [sectionForm, editingSectionId, markDirty]);

  const handleSectionDelete = useCallback((sectionId: string) => {
    const section = schema.sections.find(s => s.id === sectionId);
    if (section && section.fields.length > 0) {
      setDeletingSectionId(sectionId);
      setShowDeleteSectionDialog(true);
    } else {
      setSchema(prev => ({
        ...prev,
        sections: prev.sections.filter(s => s.id !== sectionId)
      }));
      markDirty();
      toast.success('Seção deletada');
    }
  }, [schema.sections, markDirty]);

  const confirmSectionDelete = useCallback(() => {
    if (deletingSectionId) {
      setSchema(prev => ({
        ...prev,
        sections: prev.sections.filter(s => s.id !== deletingSectionId)
      }));
      setSelectedFieldId(null);
      setSelectedSectionId(null);
      markDirty();
      toast.success('Seção deletada');
    }
    setShowDeleteSectionDialog(false);
    setDeletingSectionId(null);
  }, [deletingSectionId, markDirty]);

  const handleSave = async () => {
    const validation = validateFormSchema(schema);
    if (!validation.valid) {
      toast.error('Schema inválido', {
        description: validation.errors.join(', '),
      });
      return;
    }

    if (validation.warnings.length > 0) {
      toast.warning('Avisos no schema', {
        description: validation.warnings.join(', '),
      });
    }

    try {
      setIsSaving(true);
      await onSave(schema);
      setIsDirty(false);
      toast.success('Schema salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar schema', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowExitConfirmation(true);
    } else {
      onCancel();
    }
  };

  const handleToggleMode = () => {
    if (mode === 'edit') {
      const validation = validateFormSchema(schema);
      if (!validation.valid) {
        toast.error('Não é possível visualizar preview', {
          description: 'Schema possui erros de validação',
        });
        return;
      }
    }
    setMode(prev => prev === 'edit' ? 'preview' : 'edit');
  };

  const handleShowJson = () => {
    setJsonContent(JSON.stringify(schema, null, 2));
    setShowJsonView(true);
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      const validation = validateFormSchema(parsed);
      if (!validation.valid) {
        toast.error('JSON inválido', {
          description: validation.errors.join(', '),
        });
        return;
      }
      setSchema(parsed);
      markDirty();
      setShowJsonView(false);
      toast.success('Schema importado com sucesso');
    } catch (error) {
      toast.error('Erro ao importar JSON', {
        description: error instanceof Error ? error.message : 'JSON mal formatado',
      });
    }
  };

  const findFieldById = (fieldId: string): FormFieldSchema | null => {
    for (const section of schema.sections) {
      const field = section.fields.find(f => f.id === fieldId);
      if (field) return field;
    }
    return null;
  };

  const getAllFieldIds = (): string[] => {
    return schema.sections.flatMap(s => s.fields.map(f => f.id));
  };

  const getAllFieldNames = (): string[] => {
    return schema.sections.flatMap(s => s.fields.map(f => f.name));
  };

  const renderDragOverlay = (activeId: string) => {
    // Check if dragging from palette
    if (String(activeId).startsWith('palette-')) {
      // ID format: palette-{type}-{fieldName} or palette-{type} (legacy)
      const idParts = String(activeId).replace('palette-', '').split('-');
      const fieldType = idParts[0] as FormFieldType;
      const Icon = getFieldIcon(fieldType);
      // Try to get label from drag overlay data, fallback to parsing ID
      const label = idParts.length > 1 
        ? idParts.slice(1).join('-').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : fieldType;

      return (
        <div className="flex items-center gap-2 rounded-lg border border-primary bg-card px-3 py-2.5 shadow-lg opacity-90 w-56">
          <Icon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium capitalize">{label}</span>
        </div>
      );
    }

    // Dragging existing field
    const field = findFieldById(activeId);
    if (field) {
      const Icon = getFieldIcon(field.type);

      return (
        <div className="flex items-center gap-2 rounded-lg border border-primary bg-card px-3 py-2.5 shadow-lg opacity-90 w-56">
          <Icon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{field.label}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Heading level="section" className="text-sm">{formularioNome}</Heading>
          {isDirty && <Badge variant="outline" className="text-[10px]">Não salvo</Badge>}
        </div>

        <TooltipProvider delayDuration={0}>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleToggleMode}
                  disabled={isSaving}
                  aria-label={mode === 'edit' ? 'Preview' : 'Editar'}
                >
                  {mode === 'edit' ? <Eye className="size-4" /> : <Pencil className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{mode === 'edit' ? 'Preview' : 'Editar'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleShowJson}
                  disabled={isSaving}
                  aria-label="Ver JSON"
                >
                  <Code className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver JSON</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                  aria-label="Cancelar"
                >
                  <X className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cancelar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  onClick={handleSave}
                  disabled={isSaving || !isDirty}
                  aria-label={isSaving ? 'Salvando...' : 'Salvar'}
                >
                  <Save className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isSaving ? 'Salvando...' : 'Salvar'}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 pt-3">
        {mode === 'edit' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="h-full grid grid-cols-[280px_1fr_320px] gap-4">
              {/* Paleta */}
              <FieldPalette />

              {/* Canvas */}
              <ScrollArea className="h-full">
                <div className="p-4">
                  <SchemaCanvas
                    schema={schema}
                    selectedFieldId={selectedFieldId}
                    selectedSectionId={selectedSectionId}
                    onFieldSelect={handleFieldSelect}
                    onSectionSelect={setSelectedSectionId}
                    onFieldDelete={handleFieldDelete}
                    onFieldDuplicate={handleFieldDuplicate}
                    onSectionAdd={handleSectionAdd}
                    onSectionEdit={handleSectionEdit}
                    onSectionDelete={handleSectionDelete}
                  />
                </div>
              </ScrollArea>

              {/* Propriedades */}
              <FieldPropertiesPanel
                field={selectedFieldId ? findFieldById(selectedFieldId) : null}
                allFieldIds={getAllFieldIds()}
                allFieldNames={getAllFieldNames()}
                onChange={handleFieldUpdate}
                onDelete={() => selectedFieldId && handleFieldDelete(selectedFieldId)}
              />
            </div>

            <DragOverlay>
              {activeFieldId ? renderDragOverlay(activeFieldId) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          // Preview mode
          <div className="h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <div className="mb-4 p-3 bg-muted/50 border rounded-lg">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Eye className="size-4 text-muted-foreground" />
                  <span className="font-medium">Preview do Formulário</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Visualização de como o formulário será exibido aos usuários
                </p>
              </div>
              <DynamicFormRenderer
                schema={schema}
                onSubmit={(data) => {
                  console.log('Preview submit:', data);
                  toast.info('Preview - dados não serão salvos');
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Dialog: Exit Confirmation */}
      <Dialog open={showExitConfirmation} onOpenChange={setShowExitConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar alterações?</DialogTitle>
            <DialogDescription>
              Você tem alterações não salvas. Deseja descartar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitConfirmation(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => { setShowExitConfirmation(false); onCancel(); }}>
              Descartar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Section Edit */}
      <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSectionId ? 'Editar Seção' : 'Nova Seção'}</DialogTitle>
            <DialogDescription>
              Configure o título e descrição da seção
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={sectionForm.title}
                onChange={e => setSectionForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nome da seção"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={sectionForm.description}
                onChange={e => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSectionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSectionSave}>
              {editingSectionId ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Delete Section Confirmation */}
      <Dialog open={showDeleteSectionDialog} onOpenChange={setShowDeleteSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Deletar Seção?
            </DialogTitle>
            <DialogDescription>
              Esta seção contém campos. Ao deletá-la, todos os campos serão removidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteSectionDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmSectionDelete}>
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: JSON View */}
      <Dialog open={showJsonView} onOpenChange={setShowJsonView}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Visualizar/Editar JSON</DialogTitle>
            <DialogDescription>
              Visualize ou edite o schema em formato JSON
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={jsonContent}
              onChange={e => setJsonContent(e.target.value)}
              className="font-mono text-xs h-96"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJsonView(false)}>
              Fechar
            </Button>
            <Button onClick={handleImportJson}>
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}