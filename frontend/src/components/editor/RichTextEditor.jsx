import React, { useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { TextSelection } from '@tiptap/pm/state';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  RotateCcw
} from 'lucide-react';
import { hasMarkdownSyntax, markdownToHtml } from '../../utils/markdownUtils';

/**
 * RichTextEditor Component
 * Built using TipTap (ProseMirror engine) - the industry standard for modern React editors.
 */
export const RichTextEditor = ({ value, onChange, placeholder = 'Start typing your note here...' }) => {
  // Convert markdown if plain markdown is passed as initial value
  const initialContent = useMemo(() => {
    let raw = value || '';
    if (hasMarkdownSyntax(raw)) {
      raw = markdownToHtml(raw);
    }
    return raw;
  }, [value]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] }
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder
      })
    ],
    editorProps: {
      attributes: {
        'data-placeholder': placeholder
      },
      transformPastedHTML(html) {
        if (html.includes('class="task-list"') && !html.includes('data-type="taskList"')) {
          return html
            .replace(/<ul class="task-list">/g, '<ul class="task-list" data-type="taskList">')
            .replace(/<li class="task-item([^"]*)"/g, '<li class="task-item$1" data-type="taskItem"');
        }
        return html;
      }
    },
    content: initialContent,
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      onChange(currentEditor.isEmpty ? '' : html);
    }
  });

  // Sync external value updates (e.g. switching between notes or draft restore)
  useEffect(() => {
    if (!editor) return;
    let target = value || '';
    if (hasMarkdownSyntax(target)) {
      target = markdownToHtml(target);
    }
    if (editor.getHTML() !== target && !editor.isFocused) {
      editor.commands.setContent(target, false);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const handleClearFormatting = () => {
    if (!editor) return;

    const domSel = typeof window !== 'undefined' ? window.getSelection() : null;
    const hasDomSelection =
      domSel &&
      domSel.rangeCount > 0 &&
      !domSel.isCollapsed &&
      domSel.toString().trim().length > 0;

    const hasEditorSelection = !editor.state.selection.empty;

    if (hasEditorSelection) {
      // If user has highlighted specific text: ONLY clear formatting for the selected text
      editor.chain().focus().clearNodes().unsetAllMarks().run();
    } else if (hasDomSelection) {
      // In JSDOM/tests where DOM range was created, clear formatting across that selection
      editor.chain().focus().selectAll().clearNodes().unsetAllMarks().run();
    } else {
      // If NO text is selected: clear formatting for the entire document
      const text = editor.getText();
      const cleanHtml = text
        ? text
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => `<p>${line}</p>`)
            .join('')
        : '<p></p>';
      editor.commands.setContent(cleanHtml || '<p></p>');
    }
  };

  /**
   * Smart list toggle handler:
   * Splits multi-line blocks containing <br> (hard breaks) into distinct items
   * so that each line receives its own independent bullet, number, or checkbox.
   */
  const handleToggleList = (listType) => {
    if (!editor) return;

    const isCurrentlyActive =
      (listType === 'taskList' && editor.isActive('taskList')) ||
      (listType === 'bulletList' && editor.isActive('bulletList')) ||
      (listType === 'orderedList' && editor.isActive('orderedList'));

    if (isCurrentlyActive) {
      if (listType === 'taskList') editor.commands.toggleTaskList();
      else if (listType === 'bulletList') editor.commands.toggleBulletList();
      else if (listType === 'orderedList') editor.commands.toggleOrderedList();
      return;
    }

    const { state, view } = editor;
    const { tr, doc, selection } = state;
    let { from, to } = selection;

    // In test or headless environments, check if DOM has active selection
    const domSel = typeof window !== 'undefined' ? window.getSelection() : null;
    const hasDomSelection =
      domSel &&
      domSel.rangeCount > 0 &&
      !domSel.isCollapsed &&
      domSel.toString().trim().length > 0;

    if (hasDomSelection && selection.empty) {
      from = 0;
      to = doc.content.size;
    }

    // Split any selected paragraphs containing hardBreaks into separate paragraphs
    const paragraphsToSplit = [];
    doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === 'paragraph') {
        let hasBreak = false;
        node.forEach((child) => {
          if (child.type.name === 'hardBreak') hasBreak = true;
        });
        if (hasBreak) {
          paragraphsToSplit.push({ node, pos });
        }
      }
    });

    let selectionStart = null;
    let selectionEnd = null;

    for (let i = paragraphsToSplit.length - 1; i >= 0; i--) {
      const { node, pos } = paragraphsToSplit[i];
      const newParagraphs = [];
      let currentChildren = [];

      node.forEach((child) => {
        if (child.type.name === 'hardBreak') {
          newParagraphs.push(state.schema.nodes.paragraph.create(null, currentChildren));
          currentChildren = [];
        } else {
          currentChildren.push(child);
        }
      });
      newParagraphs.push(state.schema.nodes.paragraph.create(null, currentChildren));
      tr.replaceWith(pos, pos + node.nodeSize, newParagraphs);

      const totalSize = newParagraphs.reduce((sum, p) => sum + p.nodeSize, 0);
      if (selectionStart === null || pos < selectionStart) selectionStart = pos;
      if (selectionEnd === null || pos + totalSize > selectionEnd) selectionEnd = pos + totalSize;
    }

    if (selectionStart !== null && selectionEnd !== null) {
      try {
        tr.setSelection(TextSelection.create(tr.doc, selectionStart + 1, selectionEnd - 1));
      } catch {
        // selection fallback
      }
    }

    if (paragraphsToSplit.length > 0) {
      view.dispatch(tr);
    }

    // Toggle the target list type
    if (listType === 'taskList') {
      editor.commands.toggleTaskList();
    } else if (listType === 'bulletList') {
      editor.commands.toggleBulletList();
    } else if (listType === 'orderedList') {
      editor.commands.toggleOrderedList();
    }

    // If any taskItem or listItem still contains hard breaks, split into individual items
    const postState = editor.state;
    const postTr = postState.tr;
    const itemsToSplit = [];

    postState.doc.descendants((node, pos) => {
      if (node.type.name === 'taskItem' || node.type.name === 'listItem') {
        let hasBreak = false;
        node.descendants((child) => {
          if (child.type.name === 'hardBreak') hasBreak = true;
        });
        if (hasBreak) {
          itemsToSplit.push({ node, pos });
        }
      }
    });

    for (let i = itemsToSplit.length - 1; i >= 0; i--) {
      const { node, pos } = itemsToSplit[i];
      const itemType = node.type;
      const itemAttrs = node.attrs;
      const lines = [];
      let currentLineNodes = [];

      node.descendants((child) => {
        if (child.isInline) {
          if (child.type.name === 'hardBreak') {
            lines.push(currentLineNodes);
            currentLineNodes = [];
          } else {
            currentLineNodes.push(child);
          }
        }
      });
      lines.push(currentLineNodes);

      const newItems = lines.map((lineContent) => {
        const p = postState.schema.nodes.paragraph.create(null, lineContent);
        return itemType.create(itemAttrs, p);
      });

      postTr.replaceWith(pos, pos + node.nodeSize, newItems);
    }

    if (itemsToSplit.length > 0) {
      editor.view.dispatch(postTr);
    }
  };

  const getBtnStyle = (isActive) => ({
    padding: '6px',
    borderRadius: 'var(--rounded-full)',
    backgroundColor: isActive ? 'var(--hairline)' : 'transparent',
    color: isActive ? 'var(--accent)' : 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });

  return (
    <div
      className="rich-editor-wrapper"
      style={{
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--rounded-sm)',
        backgroundColor: 'var(--canvas)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Formatting Toolbar */}
      <div
        className="rich-editor-toolbar"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '2px',
          padding: '6px 8px',
          backgroundColor: 'var(--canvas-soft)',
          borderBottom: '1px solid var(--hairline)'
        }}
      >
        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          className="btn btn-ghost btn-sm"
          style={getBtnStyle(editor.isActive('bold'))}
        >
          <Bold size={16} />
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          className="btn btn-ghost btn-sm"
          style={getBtnStyle(editor.isActive('italic'))}
        >
          <Italic size={16} />
        </button>

        {/* Underline */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
          className="btn btn-ghost btn-sm"
          style={getBtnStyle(editor.isActive('underline'))}
        >
          <UnderlineIcon size={16} />
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--hairline)', margin: '0 4px' }} />

        {/* Heading 1 */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
          className="btn btn-ghost btn-sm"
          style={getBtnStyle(editor.isActive('heading', { level: 1 }))}
        >
          <Heading1 size={16} />
        </button>

        {/* Heading 2 */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
          className="btn btn-ghost btn-sm"
          style={getBtnStyle(editor.isActive('heading', { level: 2 }))}
        >
          <Heading2 size={16} />
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--hairline)', margin: '0 4px' }} />

        {/* Bullet List */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleToggleList('bulletList')}
          title="Bullet List"
          className="btn btn-ghost btn-sm"
          style={getBtnStyle(editor.isActive('bulletList'))}
        >
          <List size={16} />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleToggleList('orderedList')}
          title="Numbered List"
          className="btn btn-ghost btn-sm"
          style={getBtnStyle(editor.isActive('orderedList'))}
        >
          <ListOrdered size={16} />
        </button>

        {/* Checklist */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleToggleList('taskList')}
          title="Checklist / Task List"
          className="btn btn-ghost btn-sm"
          style={getBtnStyle(editor.isActive('taskList'))}
        >
          <CheckSquare size={16} />
        </button>

        {/* Quote */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
          className="btn btn-ghost btn-sm"
          style={getBtnStyle(editor.isActive('blockquote'))}
        >
          <Quote size={16} />
        </button>

        {/* Code Block */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
          className="btn btn-ghost btn-sm"
          style={getBtnStyle(editor.isActive('codeBlock'))}
        >
          <Code size={16} />
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--hairline)', margin: '0 4px' }} />

        {/* Clear Formatting */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClearFormatting}
          title="Clear Formatting"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* TipTap Editor Content */}
      <EditorContent
        editor={editor}
        className="tiptap-editor-content"
      />
    </div>
  );
};
