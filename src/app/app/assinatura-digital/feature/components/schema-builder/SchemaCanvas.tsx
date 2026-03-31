"use client"

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DynamicFormSchema, FormSectionSchema, FormFieldSchema } from '../../types/domain';
import { FormFieldType } from '../../types/domain';
import { Edit, Trash2, Copy, GripVertical, Plus, AlertCircle, CheckCircle, Info, Type, Hash, Calendar, List, FileText, Phone, MapPin, CreditCard, Building, Mail, CheckSquare, Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SchemaCanvasProps {
  schema: DynamicFormSchema;
  selectedFieldId: string | null;
  selectedSectionId: string | null;
  onFieldSelect: (fieldId: string) => void;
  onSectionSelect: (sectionId: string) => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldDuplicate: (fieldId: string) => void;
  onSectionAdd: () => void;
  onSectionEdit: (sectionId: string) => void;
  onSectionDelete: (sectionId: string) => void;
}

export const getFieldIcon = (type: FormFieldType) => {
  switch (type) {
    case FormFieldType.TEXT: return Type;
    case FormFieldType.EMAIL: return Mail;
    case FormFieldType.TEXTAREA: return FileText;
    case FormFieldType.NUMBER: return Hash;
    case FormFieldType.DATE: return Calendar;
    case FormFieldType.SELECT: return List;
    case FormFieldType.RADIO: return CheckCircle;
    case FormFieldType.CHECKBOX: return CheckSquare;
    case FormFieldType.CPF: return CreditCard;
    case FormFieldType.CNPJ: return Building;
    case FormFieldType.PHONE: return Phone;
    case FormFieldType.CEP: return MapPin;
    case FormFieldType.CLIENT_SEARCH: return Search;
    case FormFieldType.PARTE_CONTRARIA_SEARCH: return Users;
    default: return Info;
  }
};

interface SortableFieldItemProps {
  field: FormFieldSchema;
  sectionId: string;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function SortableFieldItem({ field, sectionId, isSelected, onSelect, onDuplicate, onDelete }: SortableFieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: { type: 'field', sectionId, fieldId: field.id }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 rounded-lg border bg-card px-2.5 py-2 transition-all",
        isSelected ? "border-primary ring-1 ring-primary/20" : "border-transparent hover:border-border",
        isDragging && "opacity-50"
      )}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        <GripVertical className="size-4" />
      </div>

      {React.createElement(getFieldIcon(field.type), { className: "size-3.5 text-muted-foreground shrink-0" })}

      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{field.label}</div>
        {(field.validation?.required || field.conditional || (field.options && field.options.length > 0)) && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {field.validation?.required && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Obrigatório
              </Badge>
            )}
            {field.conditional && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Condicional
              </Badge>
            )}
            {field.options && field.options.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {field.options.length} opções
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                aria-label="Duplicar campo"
              >
                <Copy className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                aria-label="Deletar campo"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Deletar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

interface DroppableSectionCardProps {
  section: FormSectionSchema;
  fields: FormFieldSchema[];
  selectedFieldId: string | null;
  selectedSectionId: string | null;
  onFieldSelect: (fieldId: string) => void;
  onSectionSelect: (sectionId: string) => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldDuplicate: (fieldId: string) => void;
  onSectionEdit: () => void;
  onSectionDelete: () => void;
}

function DroppableSectionCard({
  section,
  fields,
  selectedFieldId,
  selectedSectionId,
  onFieldSelect,
  onSectionSelect,
  onFieldDelete,
  onFieldDuplicate,
  onSectionEdit,
  onSectionDelete
}: DroppableSectionCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: section.id,
    data: { type: 'section', sectionId: section.id }
  });

  const isSelected = selectedSectionId === section.id;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border bg-card transition-all cursor-pointer",
        isOver && "border-dashed border-primary bg-primary/5",
        isSelected && !isOver && "border-primary/50 shadow-sm"
      )}
      onClick={() => onSectionSelect(section.id)}
    >
      <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold">{section.title}</h4>
          {section.description && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{section.description}</p>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => { e.stopPropagation(); onSectionEdit(); }}
                  aria-label="Editar seção"
                >
                  <Edit className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar Seção</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => { e.stopPropagation(); onSectionDelete(); }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  aria-label="Deletar seção"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Deletar Seção</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="px-3 pb-3 space-y-1">
        {fields.length === 0 ? (
          <div className="border border-dashed rounded-lg p-4 text-center">
            <AlertCircle className="size-5 text-muted-foreground/50 mx-auto mb-1" />
            <p className="text-[11px] text-muted-foreground">Arraste campos da paleta para adicionar</p>
          </div>
        ) : (
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            {fields.map(field => (
              <SortableFieldItem
                key={field.id}
                field={field}
                sectionId={section.id}
                isSelected={selectedFieldId === field.id}
                onSelect={() => onFieldSelect(field.id)}
                onDuplicate={() => onFieldDuplicate(field.id)}
                onDelete={() => onFieldDelete(field.id)}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}

export default function SchemaCanvas({
  schema,
  selectedFieldId,
  selectedSectionId,
  onFieldSelect,
  onSectionSelect,
  onFieldDelete,
  onFieldDuplicate,
  onSectionAdd,
  onSectionEdit,
  onSectionDelete
}: SchemaCanvasProps) {
  return (
    <div className="space-y-3">
      {schema.sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 gap-3">
          <AlertCircle className="size-8 text-muted-foreground/60" />
          <div className="text-center space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Nenhuma seção criada</p>
            <p className="text-[11px] text-muted-foreground/70">
              Clique abaixo para começar a construir o formulário
            </p>
          </div>
          <Button onClick={onSectionAdd} size="sm">
            <Plus className="size-4" />
            Adicionar Seção
          </Button>
        </div>
      ) : (
        <>
          {schema.sections.map(section => (
            <DroppableSectionCard
              key={section.id}
              section={section}
              fields={section.fields}
              selectedFieldId={selectedFieldId}
              selectedSectionId={selectedSectionId}
              onFieldSelect={onFieldSelect}
              onSectionSelect={onSectionSelect}
              onFieldDelete={onFieldDelete}
              onFieldDuplicate={onFieldDuplicate}
              onSectionEdit={() => onSectionEdit(section.id)}
              onSectionDelete={() => onSectionDelete(section.id)}
            />
          ))}

          <button
            onClick={onSectionAdd}
            className="w-full rounded-xl border border-dashed py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-accent/50 transition-colors cursor-pointer"
          >
            <Plus className="size-4 inline-block mr-1.5 -mt-0.5" />
            Adicionar Seção
          </button>
        </>
      )}
    </div>
  );
}
