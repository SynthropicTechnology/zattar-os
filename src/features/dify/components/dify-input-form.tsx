'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Upload,
  X,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  type DifyUserInputField,
  type DifyUserInputFormRaw,
  parseUserInputForm,
} from '../domain';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  extension: string;
  type: string;
  transfer_method: string;
}

interface DifyInputFormProps {
  appId: string;
  userInputForm: DifyUserInputFormRaw;
  openingStatement?: string;
  onSubmit: (inputs: Record<string, unknown>) => void;
  className?: string;
}

export function DifyInputForm({
  appId,
  userInputForm,
  openingStatement,
  onSubmit,
  className,
}: DifyInputFormProps) {
  const fields = parseUserInputForm(userInputForm);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const field of fields) {
      if (field.type === 'text-input' && field.default) {
        defaults[field.variable] = field.default;
      }
    }
    return defaults;
  });

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile[]>>({});
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTextChange = useCallback((variable: string, value: string) => {
    setValues((prev) => ({ ...prev, [variable]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[variable];
      return next;
    });
  }, []);

  const handleFileUpload = useCallback(
    async (variable: string, fileList: FileList) => {
      setUploadingFields((prev) => ({ ...prev, [variable]: true }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[variable];
        return next;
      });

      const newFiles: UploadedFile[] = [];

      for (const file of Array.from(fileList)) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('app_id', appId);
          formData.append('user', 'user');

          const response = await fetch('/api/dify/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Erro no upload');
          }

          const result = await response.json();
          newFiles.push({
            id: result.id,
            name: result.name,
            size: result.size,
            extension: result.extension,
            type: 'document',
            transfer_method: 'local_file',
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erro desconhecido';
          setErrors((prev) => ({ ...prev, [variable]: `Erro ao enviar ${file.name}: ${message}` }));
        }
      }

      if (newFiles.length > 0) {
        setUploadedFiles((prev) => ({
          ...prev,
          [variable]: [...(prev[variable] || []), ...newFiles],
        }));
      }

      setUploadingFields((prev) => ({ ...prev, [variable]: false }));
    },
    [appId]
  );

  const handleRemoveFile = useCallback((variable: string, fileId: string) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [variable]: (prev[variable] || []).filter((f) => f.id !== fileId),
    }));
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of fields) {
      if (!field.required) continue;

      if (field.type === 'file-list') {
        const files = uploadedFiles[field.variable] || [];
        if (files.length === 0) {
          newErrors[field.variable] = 'Obrigatório enviar ao menos um arquivo';
        }
      } else {
        const val = (values[field.variable] || '').trim();
        if (!val) {
          newErrors[field.variable] = 'Campo obrigatório';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fields, values, uploadedFiles]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const inputs: Record<string, unknown> = {};

      for (const field of fields) {
        if (field.type === 'file-list') {
          const files = uploadedFiles[field.variable] || [];
          if (files.length > 0) {
            inputs[field.variable] = files.map((f) => ({
              type: f.type,
              transfer_method: f.transfer_method,
              upload_file_id: f.id,
            }));
          }
        } else {
          const val = (values[field.variable] || '').trim();
          if (val) {
            inputs[field.variable] = val;
          }
        }
      }

      onSubmit(inputs);
    },
    [fields, values, uploadedFiles, validate, onSubmit]
  );

  const isAnyUploading = Object.values(uploadingFields).some(Boolean);

  const requiredFieldsFilled = fields.every((field) => {
    if (!field.required) return true;
    if (field.type === 'file-list') {
      return (uploadedFiles[field.variable] || []).length > 0;
    }
    return (values[field.variable] || '').trim().length > 0;
  });

  return (
    <ScrollArea className={cn('h-full', className)}>
      <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-3xl mx-auto">
        {/* Opening statement */}
        {openingStatement && (
          <div className="rounded-lg bg-muted/50 p-4 text-sm prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {openingStatement}
            </ReactMarkdown>
          </div>
        )}

        {/* Dynamic fields */}
        {fields.map((field) => {
          if (field.type === 'paragraph' && field.hide) return null;
          return (
            <DifyFormField
              key={field.variable}
              field={field}
              value={values[field.variable] || ''}
              uploadedFiles={uploadedFiles[field.variable] || []}
              isUploading={uploadingFields[field.variable] || false}
              error={errors[field.variable]}
              onTextChange={handleTextChange}
              onFileUpload={handleFileUpload}
              onRemoveFile={handleRemoveFile}
            />
          );
        })}

        {/* Submit */}
        <div className="pt-2 pb-2">
          <Button
            type="submit"
            className="w-full"
            disabled={!requiredFieldsFilled || isAnyUploading}
            size="lg"
          >
            {isAnyUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando arquivos...
              </>
            ) : (
              <>
                Iniciar Conversa
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>
    </ScrollArea>
  );
}

// --- Sub-component for individual fields ---

interface DifyFormFieldProps {
  field: DifyUserInputField;
  value: string;
  uploadedFiles: UploadedFile[];
  isUploading: boolean;
  error?: string;
  onTextChange: (variable: string, value: string) => void;
  onFileUpload: (variable: string, files: FileList) => void;
  onRemoveFile: (variable: string, fileId: string) => void;
}

function DifyFormField({
  field,
  value,
  uploadedFiles,
  isUploading,
  error,
  onTextChange,
  onFileUpload,
  onRemoveFile,
}: DifyFormFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        onFileUpload(field.variable, e.dataTransfer.files);
      }
    },
    [field.variable, onFileUpload]
  );

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.variable} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {field.type === 'text-input' && (
        <Input
          id={field.variable}
          value={value}
          onChange={(e) => onTextChange(field.variable, e.target.value)}
          maxLength={field.max_length}
          placeholder={field.label}
        />
      )}

      {field.type === 'paragraph' && (
        <Textarea
          id={field.variable}
          value={value}
          onChange={(e) => onTextChange(field.variable, e.target.value)}
          maxLength={field.max_length ?? undefined}
          placeholder={`Digite ${field.label.toLowerCase()}...`}
          className="min-h-32 resize-y"
        />
      )}

      {field.type === 'file-list' && (
        <div className="space-y-2">
          {/* Drop zone */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Enviando...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8" />
                <span className="text-sm">
                  Arraste arquivos aqui ou clique para selecionar
                </span>
                {field.allowed_file_types?.length > 0 && (
                  <span className="text-xs">
                    Tipos: {field.allowed_file_types.join(', ')}
                  </span>
                )}
                {field.max_length && (
                  <span className="text-xs">
                    Máximo: {field.max_length} arquivo(s)
                  </span>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple={!field.max_length || field.max_length > 1}
              accept={
                field.allowed_file_extensions?.length > 0
                  ? field.allowed_file_extensions.join(',')
                  : undefined
              }
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onFileUpload(field.variable, e.target.files);
                  e.target.value = '';
                }
              }}
            />
          </div>

          {/* Uploaded files list */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-1">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm"
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatFileSize(file.size)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(field.variable, file.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Character count for text fields */}
      {(field.type === 'paragraph' || field.type === 'text-input') &&
        field.max_length != null && (
          <p className="text-xs text-muted-foreground text-right">
            {value.length}/{field.max_length}
          </p>
        )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
