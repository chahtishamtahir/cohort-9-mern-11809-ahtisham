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

function sanitizeHtml(html) {
  if (!html) return '';
  // Remove script tags and contents
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove inline event handlers (onerror, onload, onclick, etc.)
  clean = clean.replace(/ on\w+="[^"]*"/gi, '').replace(/ on\w+='[^']*'/gi, '').replace(/ on\w+=\S+/gi, '');
  // Remove javascript: pseudo-protocol
  clean = clean.replace(/href=["']javascript:[^"']*["']/gi, 'href="#"');
  return clean;
}

/**
 * RichTextEditor Component
 * An intuitive, zero-dependency rich text editor using contentEditable
 * and clean formatting actions.
 */
export const RichTextEditor = ({ value, onChange, placeholder = 'Start typing your note here...' }) => {
  const editorRef = useRef(null);

  // Sync value from props only when not focused or initially mounting
  useEffect(() => {
    if (editorRef.current) {
      const sanitized = sanitizeHtml(value || '');
      if (editorRef.current.innerHTML !== sanitized && document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = sanitized;
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

  const handleClearFormatting = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editorRef.current) return;

    // 1. Capture selection first before any focus side-effects
    const selection = window.getSelection();
    let range = null;
    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    }

    // 2. Trigger native cleanup commands
    try {
      document.execCommand('removeFormat', false, null);
      document.execCommand('unlink', false, null);
      document.execCommand('formatBlock', false, '<p>');
    } catch {
      // Ignore if not supported in environment
    }

    if (selection && range) {
      const isInsideEditor =
        editorRef.current === range.commonAncestorContainer ||
        editorRef.current.contains(range.commonAncestorContainer);

      // Verify selection is within our editor
      if (isInsideEditor) {
        // If cursor is collapsed (no selection), expand to nearest formatted ancestor
        if (range.collapsed) {
          let node = selection.anchorNode;
          if (node && node.nodeType === Node.TEXT_NODE) {
            node = node.parentNode;
          }
          while (node && node !== editorRef.current) {
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              ['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'CODE', 'SPAN', 'MARK'].includes(node.tagName)
            ) {
              const newRange = document.createRange();
              newRange.selectNodeContents(node);
              selection.removeAllRanges();
              selection.addRange(newRange);
              range = newRange;
              break;
            }
            node = node.parentNode;
          }
        }

        // Deep unwrap all nested tags (bold, italic, underline, heading, code, quote, styles)
        if (!range.collapsed) {
          try {
            const container = document.createElement('div');
            container.appendChild(range.cloneContents());

            const tagsToStrip = [
              'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SPAN', 'FONT', 'MARK', 'CODE',
              'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE'
            ];

            let hasFormatting = false;
            const allElements = container.querySelectorAll('*');
            for (const el of allElements) {
              if (tagsToStrip.includes(el.tagName) || el.hasAttribute('style') || el.hasAttribute('class')) {
                hasFormatting = true;
                break;
              }
            }

            if (hasFormatting) {
              const cleanNode = (root) => {
                const elements = Array.from(root.querySelectorAll(tagsToStrip.join(',')));
                elements.reverse().forEach((el) => {
                  el.removeAttribute('style');
                  el.removeAttribute('class');
                  if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE'].includes(el.tagName)) {
                    const p = document.createElement('p');
                    while (el.firstChild) p.appendChild(el.firstChild);
                    el.parentNode.replaceChild(p, el);
                  } else {
                    while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
                    el.parentNode.removeChild(el);
                  }
                });

                root.querySelectorAll('*').forEach((el) => {
                  el.removeAttribute('style');
                  el.removeAttribute('class');
                });
              };

              cleanNode(container);

              range.deleteContents();
              const fragment = document.createDocumentFragment();
              while (container.firstChild) {
                fragment.appendChild(container.firstChild);
              }
              range.insertNode(fragment);
            }
          } catch (err) {
            console.warn('Clear formatting fallback:', err);
          }
        }
      }
    }

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
        className="editor-toolbar"
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 12px',
          borderBottom: '1px solid var(--hairline)',
          backgroundColor: 'var(--canvas-soft)',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('bold')}
          title="Bold (Ctrl+B)"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
        >
          <Bold size={16} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('italic')}
          title="Italic (Ctrl+I)"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
        >
          <Italic size={16} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyHeading('h2')}
          title="Heading 1"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
        >
          <Heading1 size={16} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('insertUnorderedList')}
          title="Bullet List"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
        >
          <List size={16} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('insertOrderedList')}
          title="Numbered List"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
        >
          <ListOrdered size={16} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyHeading('blockquote')}
          title="Quote"
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
        >
          <Quote size={16} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClearFormatting}
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
