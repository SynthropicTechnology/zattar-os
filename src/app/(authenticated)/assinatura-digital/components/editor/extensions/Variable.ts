import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    variable: {
      insertVariable: (options: { key: string }) => ReturnType;
    };
  }
}

export const Variable = Node.create({
  name: 'variable',

  group: 'inline',

  atom: true,

  selectable: false,

  inline: true,

  addAttributes() {
    return {
      key: {
        default: null,
        parseHTML: element => element.getAttribute('data-variable-key'),
        renderHTML: attributes => {
          if (!attributes.key) {
            return {};
          }
          return {
            'data-variable-key': attributes.key,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable-key]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'variable',
        style:
          'background-color: #ede9fe; color: #6d28d9; padding: 1px 6px; border-radius: 4px; font-size: 0.85em; font-family: monospace; white-space: nowrap;',
      }),
      `{{${node.attrs.key}}}`,
    ];
  },

  renderText({ node }) {
    return `{{${node.attrs.key}}}`;
  },

  addCommands() {
    return {
      insertVariable: (options: { key: string }) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});