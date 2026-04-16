'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Variable } from './extensions/Variable';
import { Button } from '@/components/ui/button';
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
  Variable as VariableIcon,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { ConteudoComposto } from '@/shared/assinatura-digital/types/template.types';
import {
  getAvailableVariables,
  type VariableOption,
  type TiptapDocument,
  type TiptapNode,
} from './editor-helpers';

interface RichTextEditorProps {
  value?: ConteudoComposto;
  onChange: (value: ConteudoComposto) => void;
  formularios: string[];
  /** Elemento extra renderizado no final da toolbar (ex: botão de ajustar altura) */
  toolbarExtra?: React.ReactNode;
  /** Classes adicionais para o container externo */
  className?: string;
}

export function RichTextEditor({ value, onChange, formularios, toolbarExtra, className }: RichTextEditorProps) {
  const [isVariableOpen, setIsVariableOpen] = useState(false);

  const variables = getAvailableVariables(formularios);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Digite o conteúdo aqui...',
      }),
      Variable,
    ],
    content: value?.json || {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const template = generateTemplateString(json);
      onChange({ json, template });
    },
    // Evitar hydration mismatch em SSR/Next.js
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'outline-none min-h-40 cursor-text',
      },
    },
  });

  // Sync editor content when value prop changes
  useEffect(() => {
    if (value?.json && editor && !editor.isFocused) {
      editor.commands.setContent(value.json);
    }
  }, [value?.json, editor]);

  const generateTemplateString = useCallback((json: TiptapDocument): string => {
    let template = '';

    const traverse = (node: TiptapNode) => {
      if (node.type === 'text') {
        template += node.text;
      } else if (node.type === 'variable') {
        if (node && node.attrs && typeof node.attrs.key === 'string') {
          template += `{{${node.attrs.key}}}`;
        }
      } else if (node.type === 'hardBreak') {
        template += '\n';
      } else if (node.content) {
        node.content.forEach(traverse);
        if (node.type === 'paragraph') {
          template += '\n';
        }
      }
    };

    if (json.content) {
      json.content.forEach(traverse);
    }

    return template.trim();
  }, []);

  const insertVariable = useCallback((variable: VariableOption) => {
    if (editor) {
      editor.chain().focus().insertVariable({ key: variable.value }).run();
      setIsVariableOpen(false);
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border rounded-lg flex flex-col", className)}>
      {/* Toolbar - fixa no topo */}
      <div className="border-b p-2 flex flex-wrap items-center gap-1 shrink-0">
        {/* Formatting buttons */}
        <Button
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('code') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Headings */}
        <Button
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Text alignment */}
        <Button
          variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <Button
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Block elements */}
        <Button
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Undo/Redo */}
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

        <Separator orientation="vertical" className="h-6" />

        {/* Variable insertion */}
        <Popover open={isVariableOpen} onOpenChange={setIsVariableOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm">
              <VariableIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar variável..." />
              <CommandList>
                <CommandEmpty>Nenhuma variável encontrada.</CommandEmpty>
                {Object.entries(
                  variables.reduce<Record<string, VariableOption[]>>((groups, v) => {
                    const group = v.label.split(':')[0]?.trim() || 'Outros';
                    if (!groups[group]) groups[group] = [];
                    groups[group].push(v);
                    return groups;
                  }, {})
                ).map(([group, groupVars]) => (
                  <CommandGroup key={group} heading={group}>
                    {groupVars.map((variable: VariableOption) => (
                      <CommandItem
                        key={variable.value}
                        onSelect={() => insertVariable(variable)}
                      >
                        {variable.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Extra toolbar actions (ex: Ajustar Altura) */}
        {toolbarExtra && (
          <>
            <Separator orientation="vertical" className="h-6" />
            {toolbarExtra}
          </>
        )}
      </div>

      {/* Editor - área scrollável */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
