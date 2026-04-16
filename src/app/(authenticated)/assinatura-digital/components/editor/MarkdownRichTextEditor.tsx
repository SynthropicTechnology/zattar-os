"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Variable } from './extensions/Variable';
import {
  getAvailableVariables,
  type VariableOption,
  markdownToTiptapJSON,
  tiptapJSONToMarkdown,
  type TiptapDocument,
} from './editor-helpers';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Link as LinkIcon,
} from 'lucide-react';

interface MarkdownRichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  formularios: string[];
}

export function MarkdownRichTextEditor({ value, onChange, formularios }: MarkdownRichTextEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [selectedVariable, setSelectedVariable] = useState<string[]>([]);
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Digite seu texto aqui...',
      }),
      Link.configure({
        openOnClick: false,
      }),
      Variable,
    ],
    content: markdownToTiptapJSON(value),
    onUpdate: ({ editor }) => {
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
      }
      const markdown = tiptapJSONToMarkdown(editor.getJSON() as TiptapDocument);
      onChange(markdown);
    },
  });

  useEffect(() => {
    if (editor && !isInternalUpdate.current) {
      const currentMarkdown = tiptapJSONToMarkdown(editor.getJSON() as TiptapDocument);
      if (currentMarkdown !== value) {
        isInternalUpdate.current = true;
        editor.commands.setContent(markdownToTiptapJSON(value));
      }
    }
  }, [value, editor]);

  const variables = getAvailableVariables(formularios);

  // Efeito para inserir variável quando selecionada
  useEffect(() => {
    if (selectedVariable.length > 0 && editor && !editor.isDestroyed) {
      const variableKey = selectedVariable[0];
      const variable = variables.find((v: VariableOption) => v.value === variableKey);
      if (variable) {
        // Garantir que o editor está pronto e focado
        const insert = () => {
          try {
            if (editor && !editor.isDestroyed) {
              editor.chain().focus().insertVariable({ key: variable.value }).run();
              setSelectedVariable([]); // Limpar após inserir
            }
          } catch (error) {
            console.error('Erro ao inserir variável:', error);
            setSelectedVariable([]);
          }
        };
        
        // Usar setTimeout para garantir que o popover fechou
        setTimeout(insert, 150);
      }
    }
  }, [selectedVariable, editor, variables]);

  const openLinkDialog = () => {
    const { from, to } = editor?.state.selection || { from: 0, to: 0 };
    const selectedText = editor?.state.doc.textBetween(from ?? 0, to ?? 0);
    setLinkText(selectedText || '');
    setLinkUrl('');
    setLinkDialogOpen(true);
  };

  const insertLink = () => {
    if (linkUrl && linkText) {
      editor?.chain().focus().setLink({ href: linkUrl }).insertContent(linkText).run();
    }
    setLinkDialogOpen(false);
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md">
      <div className="border-b p-2 flex flex-wrap gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'bg-muted' : ''}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'bg-muted' : ''}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-muted' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-muted' : ''}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={openLinkDialog}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={editor.isActive({ textAlign: 'justify' }) ? 'bg-muted' : ''}
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Combobox
          options={variables.map((v: VariableOption) => ({ value: v.value, label: v.label }))}
          value={selectedVariable}
          onValueChange={(values: string[]) => {
            // Atualizar estado - o useEffect vai inserir a variável
            setSelectedVariable(values);
          }}
          placeholder="Inserir variável..."
          searchPlaceholder="Buscar variável..."
          emptyText="Nenhuma variável encontrada"
          className="w-48"
        />
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4 max-h-[calc(85vh-250px)] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="link-text">Texto do Link</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Texto do link"
              />
            </div>
            <div>
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://exemplo.com"
              />
            </div>
            <Button onClick={insertLink} className="w-full">
              Inserir Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}