import React, { useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  RotateCcw
} from 'lucide-react';

/**
 * RichTextEditor Component
 * An intuitive, zero-dependency rich text editor using contentEditable
 * and clean formatting actions.
 */
export const RichTextEditor = ({ value, onChange, placeholder = 'Start typing your note here...' }) => {
  const editorRef = useRef(null);

  // Sync value from props only when not focused or initially mounting
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  };

  const executeCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const applyHeading = (headingTag) => {
    document.execCommand('formatBlock', false, `<${headingTag}>`);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  return (
    <div
      style={{
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--rounded-sm)',
        overflow: 'hidden',
        backgroundColor: 'var(--canvas)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '260px'
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 12px',
          borderBottom: '1px solid var(--hairline)',
          backgroundColor: 'var(--canvas-soft)'
        }}
      >
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          title="Bold (Ctrl+B)"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
        >
          <Bold size={16} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('italic')}
          title="Italic (Ctrl+I)"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
        >
          <Italic size={16} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('underline')}
          title="Underline (Ctrl+U)"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
        >
          <Underline size={16} />
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--hairline)', margin: '0 4px' }} />

        <button
          type="button"
          onClick={() => applyHeading('h2')}
          title="Heading 1"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
        >
          <Heading1 size={16} />
        </button>

        <button
          type="button"
          onClick={() => applyHeading('h3')}
          title="Heading 2"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
        >
          <Heading2 size={16} />
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--hairline)', margin: '0 4px' }} />

        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          title="Bullet List"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
        >
          <List size={16} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          title="Numbered List"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
        >
          <ListOrdered size={16} />
        </button>

        <button
          type="button"
          onClick={() => applyHeading('blockquote')}
          title="Quote"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
        >
          <Quote size={16} />
        </button>

        <button
          type="button"
          onClick={() => applyHeading('pre')}
          title="Code Block"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
        >
          <Code size={16} />
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--hairline)', margin: '0 4px' }} />

        <button
          type="button"
          onClick={() => executeCommand('removeFormat')}
          title="Clear Formatting"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Editable Surface */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{
          flex: 1,
          padding: '16px',
          outline: 'none',
          minHeight: '200px',
          color: 'var(--ink)',
          fontSize: '0.98rem',
          lineHeight: '1.6',
          fontFamily: 'inherit'
        }}
      />
    </div>
  );
};
