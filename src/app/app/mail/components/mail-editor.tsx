'use client';

import * as React from 'react';

import type { Descendant } from 'platejs';
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
} from '@platejs/basic-nodes/react';
import {
  BlockquotePlugin,
  HorizontalRulePlugin,
} from '@platejs/basic-nodes/react';
import { ParagraphPlugin } from 'platejs/react';
import { LinkPlugin } from '@platejs/link/react';
import { ListPlugin } from '@platejs/list/react';
import { TextAlignPlugin } from '@platejs/basic-styles/react';
import { KEYS } from 'platejs';
import { Plate, usePlateEditor, useEditorRef } from 'platejs/react';
import { createPlatePlugin } from 'platejs/react';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
} from 'lucide-react';

import { ParagraphElement } from '@/components/editor/plate-ui/paragraph-node';
import { BlockquoteElement } from '@/components/editor/plate-ui/blockquote-node';
import { HrElement } from '@/components/editor/plate-ui/hr-node';
import { LinkElement } from '@/components/editor/plate-ui/link-node';
import { LinkFloatingToolbar } from '@/components/editor/plate-ui/link-toolbar';
import { BlockList } from '@/components/editor/plate-ui/block-list';
import { IndentKit } from '@/components/editor/plate/indent-kit';
import { MarkToolbarButton } from '@/components/editor/plate-ui/mark-toolbar-button';
import { LinkToolbarButton } from '@/components/editor/plate-ui/link-toolbar-button';
import { ToolbarGroup } from '@/components/editor/plate-ui/toolbar';
import { Toolbar } from '@/components/editor/plate-ui/toolbar';
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
} from '@/components/editor/plate-ui/list-toolbar-button';
import { AlignToolbarButton } from '@/components/editor/plate-ui/align-toolbar-button';
import {
  RedoToolbarButton,
  UndoToolbarButton,
} from '@/components/editor/plate-ui/history-toolbar-button';
import { Editor, EditorContainer } from '@/components/editor/plate-ui/editor';
import { FloatingToolbar } from '@/components/editor/plate-ui/floating-toolbar';
import { FloatingToolbarButtons } from '@/components/editor/plate-ui/floating-toolbar-buttons';
import { cn } from '@/lib/utils';

// Lightweight plugin kit for email composition
const MailEditorKit = [
  // Basic blocks
  ParagraphPlugin.withComponent(ParagraphElement),
  BlockquotePlugin.configure({
    node: { component: BlockquoteElement },
    shortcuts: { toggle: { keys: 'mod+shift+period' } },
  }),
  HorizontalRulePlugin.withComponent(HrElement),

  // Basic marks
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin.configure({
    shortcuts: { toggle: { keys: 'mod+shift+x' } },
  }),

  // Link
  LinkPlugin.configure({
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),

  // Lists with indent
  ...IndentKit,
  ListPlugin.configure({
    inject: {
      targetPlugins: [KEYS.p, KEYS.blockquote],
    },
    render: {
      belowNodes: BlockList,
    },
  }),

  // Alignment
  TextAlignPlugin.configure({
    inject: {
      nodeProps: {
        defaultNodeValue: 'start',
        nodeKey: 'align',
        styleKey: 'textAlign',
        validNodeValues: ['start', 'left', 'center', 'right', 'justify'],
      },
      targetPlugins: [KEYS.p, KEYS.blockquote],
    },
  }),

  // Floating toolbar for selection-based formatting
  createPlatePlugin({
    key: 'mail-floating-toolbar',
    render: {
      afterEditable: () => (
        <FloatingToolbar>
          <FloatingToolbarButtons />
        </FloatingToolbar>
      ),
    },
  }),
];

function MailToolbarButtons() {
  return (
    <div className="flex items-center gap-0.5">
      <ToolbarGroup>
        <UndoToolbarButton />
        <RedoToolbarButton />
      </ToolbarGroup>

      <ToolbarGroup>
        <MarkToolbarButton nodeType={KEYS.bold} tooltip="Negrito (⌘+B)">
          <BoldIcon />
        </MarkToolbarButton>
        <MarkToolbarButton nodeType={KEYS.italic} tooltip="Itálico (⌘+I)">
          <ItalicIcon />
        </MarkToolbarButton>
        <MarkToolbarButton nodeType={KEYS.underline} tooltip="Sublinhado (⌘+U)">
          <UnderlineIcon />
        </MarkToolbarButton>
        <MarkToolbarButton nodeType={KEYS.strikethrough} tooltip="Tachado (⌘+⇧+X)">
          <StrikethroughIcon />
        </MarkToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <BulletedListToolbarButton />
        <NumberedListToolbarButton />
      </ToolbarGroup>

      <ToolbarGroup>
        <AlignToolbarButton />
      </ToolbarGroup>

      <ToolbarGroup>
        <LinkToolbarButton />
      </ToolbarGroup>
    </div>
  );
}

export interface MailEditorRef {
  getHtml: () => string;
  getText: () => string;
  reset: () => void;
  isEmpty: () => boolean;
  focus: () => void;
}

interface MailEditorProps {
  placeholder?: string;
  className?: string;
  editorRef?: React.RefObject<MailEditorRef | null>;
  autoFocus?: boolean;
}

const defaultValue: Descendant[] = [
  { type: 'p', children: [{ text: '' }] },
];

function MailEditorContent({
  editorRef,
  placeholder,
}: {
  editorRef?: React.RefObject<MailEditorRef | null>;
  placeholder?: string;
}) {
  const editor = useEditorRef();

  React.useImperativeHandle(
    editorRef,
    () => ({
      getHtml: () => {
        // Serialize editor content to simple HTML
        const serializeNode = (node: Record<string, unknown>): string => {
          if ('text' in node) {
            let text = (node.text as string) || '';
            if (!text) return '';
            // Escape HTML
            text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (node.bold) text = `<strong>${text}</strong>`;
            if (node.italic) text = `<em>${text}</em>`;
            if (node.underline) text = `<u>${text}</u>`;
            if (node.strikethrough) text = `<s>${text}</s>`;
            return text;
          }

          const children = ((node.children as Record<string, unknown>[]) || []).map(serializeNode).join('');

          switch (node.type) {
            case 'p': {
              const align = node.align ? ` style="text-align: ${node.align}"` : '';
              return `<p${align}>${children || '<br>'}</p>`;
            }
            case 'blockquote':
              return `<blockquote>${children}</blockquote>`;
            case 'a':
              return `<a href="${node.url || ''}">${children}</a>`;
            case 'hr':
              return '<hr>';
            default:
              return children;
          }
        };

        return editor.children.map(serializeNode).join('');
      },
      getText: () => {
        // Extract plain text
        const extractText = (node: Record<string, unknown>): string => {
          if ('text' in node) return (node.text as string) || '';
          return ((node.children as Record<string, unknown>[]) || []).map(extractText).join('');
        };
        return editor.children.map(extractText).join('\n');
      },
      reset: () => {
        editor.tf.reset();
      },
      isEmpty: () => {
        const text = editor.children
          .map((node: Record<string, unknown>) => {
            const extractText = (n: Record<string, unknown>): string => {
              if ('text' in n) return (n.text as string) || '';
              return ((n.children as Record<string, unknown>[]) || []).map(extractText).join('');
            };
            return extractText(node);
          })
          .join('');
        return text.trim().length === 0;
      },
      focus: () => {
        editor.tf.focus();
      },
    }),
    [editor]
  );

  return (
    <Editor
      variant="none"
      className="min-h-30 max-h-75 overflow-y-auto px-3 py-2 text-sm"
      placeholder={placeholder}
    />
  );
}

export function MailEditor({
  placeholder = 'Escreva sua mensagem...',
  className,
  editorRef,
  autoFocus: _autoFocus = false,
}: MailEditorProps) {
  const editor = usePlateEditor({
    plugins: MailEditorKit,
  });

  return (
    <Plate
      editor={editor}
      // @ts-expect-error - Plate v52 type definitions issue
      initialValue={defaultValue}
    >
      <div
        className={cn(
          'rounded-lg border bg-background transition-colors focus-within:ring-1 focus-within:ring-ring',
          className
        )}
      >
        <Toolbar
          className="scrollbar-hide flex-wrap justify-start border-b border-border bg-muted/30 p-1"
        >
          <MailToolbarButtons />
        </Toolbar>

        <EditorContainer variant="default" className="[&_.slate-selection-area]:bg-transparent">
          <MailEditorContent
            editorRef={editorRef}
            placeholder={placeholder}
          />
        </EditorContainer>
      </div>
    </Plate>
  );
}
