import React from 'react';
import { Pin, Trash2, Edit3, Calendar } from 'lucide-react';
import { hasMarkdownSyntax, markdownToHtml } from '../../utils/markdownUtils';

/**
 * NoteCard Component
 * Displays a single note with its category badge, formatted preview, pin status, and quick actions.
 */
function highlightMatch(text, query, keyPrefix = 'hl') {
  if (!query || !query.trim() || !text) return text;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = String(text).split(regex);
  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={`${keyPrefix}-${index}`} className="search-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

/**
 * Parses note content (Markdown or HTML) into rich formatted excerpt nodes
 * that preserve bold, italic, code, headings, and search highlighting.
 */
function renderFormattedExcerpt(htmlContent, searchQuery) {
  if (!htmlContent || !htmlContent.trim()) {
    return 'No content';
  }

  let html = htmlContent;
  if (hasMarkdownSyntax(html)) {
    html = markdownToHtml(html);
  }

  // Parse HTML into formatted preview elements
  let parser;
  try {
    parser = new DOMParser();
  } catch {
    // Fallback if DOMParser is unavailable
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || 'No content';
  }

  const doc = parser.parseFromString(html, 'text/html');
  let keyIndex = 0;

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!text) return null;
      return highlightMatch(text, searchQuery, `txt-${keyIndex++}`);
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      const children = Array.from(node.childNodes).map(processNode).filter(Boolean);

      if (['b', 'strong'].includes(tag)) {
        return (
          <strong key={`str-${keyIndex++}`} style={{ fontWeight: 650, color: 'var(--ink)' }}>
            {children}
          </strong>
        );
      }

      if (['i', 'em'].includes(tag)) {
        return (
          <em key={`em-${keyIndex++}`} style={{ fontStyle: 'italic' }}>
            {children}
          </em>
        );
      }

      if (['u'].includes(tag)) {
        return (
          <u key={`u-${keyIndex++}`}>{children}</u>
        );
      }

      if (['s', 'strike', 'del'].includes(tag)) {
        return (
          <s key={`s-${keyIndex++}`}>{children}</s>
        );
      }

      if (['code'].includes(tag)) {
        return (
          <code
            key={`code-${keyIndex++}`}
            style={{
              backgroundColor: 'var(--field)',
              color: 'var(--ink)',
              padding: '1px 5px',
              borderRadius: '4px',
              fontSize: '0.84em',
              fontFamily: 'monospace'
            }}
          >
            {children}
          </code>
        );
      }

      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        return (
          <strong key={`head-${keyIndex++}`} style={{ fontWeight: 650, color: 'var(--ink)' }}>
            {children}{' '}
          </strong>
        );
      }

      if (['label', 'input'].includes(tag)) {
        return null;
      }

      if (['li'].includes(tag)) {
        const checkbox = node.querySelector('input[type="checkbox"]');
        const isTaskItem = Boolean(
          checkbox ||
          node.getAttribute('data-type') === 'taskItem' ||
          node.classList.contains('task-item')
        );

        if (isTaskItem) {
          const isChecked = checkbox
            ? (checkbox.checked || checkbox.hasAttribute('checked'))
            : (node.getAttribute('data-checked') === 'true' || node.classList.contains('task-completed'));

          return (
            <span
              key={`task-${keyIndex++}`}
              style={{
                textDecoration: isChecked ? 'line-through' : 'none',
                opacity: isChecked ? 0.75 : 1
              }}
            >
              {isChecked ? '☑ ' : '☐ '}{children}{' '}
            </span>
          );
        }

        const parent = node.parentNode;
        if (parent && parent.tagName && parent.tagName.toLowerCase() === 'ol') {
          const siblings = Array.from(parent.children).filter((el) => el.tagName && el.tagName.toLowerCase() === 'li');
          const index = siblings.indexOf(node) + 1;
          return (
            <span key={`oli-${keyIndex++}`}>
              {index > 0 ? index : 1}. {children}{' '}
            </span>
          );
        }

        return (
          <span key={`li-${keyIndex++}`}>
            • {children}{' '}
          </span>
        );
      }

      if (['blockquote'].includes(tag)) {
        return (
          <span key={`bq-${keyIndex++}`} style={{ fontStyle: 'italic' }}>
            "{children}"{' '}
          </span>
        );
      }

      if (tag === 'mark') {
        return (
          <mark key={`m-${keyIndex++}`} className="search-highlight">
            {children}
          </mark>
        );
      }

      if (tag === 'br') {
        return ' ';
      }

      if (['p', 'div'].includes(tag)) {
        return (
          <React.Fragment key={`p-${keyIndex++}`}>
            {children}{' '}
          </React.Fragment>
        );
      }

      return children;
    }

    return null;
  }

  const result = Array.from(doc.body.childNodes).map(processNode).filter(Boolean);
  return result.length > 0 ? result : 'No content';
}

export const NoteCard = ({ note, onEdit, onDelete, onTogglePin, searchQuery = '' }) => {
  const formattedExcerpt = React.useMemo(() => {
    return renderFormattedExcerpt(note.content, searchQuery);
  }, [note.content, searchQuery]);

  const rawDate = note.updated_at || note.created_at;
  const formattedDate = rawDate && !isNaN(new Date(rawDate).getTime())
    ? new Date(rawDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Recently';

  return (
    <div
      className="note-card"
      style={{
        backgroundColor: 'var(--canvas)',
        border: '1px solid var(--hairline-soft)',
        borderRadius: 'var(--rounded-md)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '200px',
        transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={() => onEdit(note)}
    >
      <div>
        {/* Top bar: Category + Pin & Delete Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}
        >
          <span
            style={{
              backgroundColor: 'var(--canvas-soft)',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 'var(--rounded-full)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {highlightMatch(note.category || 'General', searchQuery)}
          </span>

          <div
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pin Toggle Button */}
            <button
              type="button"
              onClick={() => onTogglePin(note)}
              title={note.is_pinned || note.isPinned ? 'Unpin note' : 'Pin note to top'}
              className="btn btn-ghost btn-sm"
              style={{
                padding: '6px',
                borderRadius: 'var(--rounded-full)',
                color: (note.is_pinned || note.isPinned) ? 'var(--accent)' : 'var(--text-muted)'
              }}
            >
              <Pin size={15} fill={(note.is_pinned || note.isPinned) ? 'currentColor' : 'none'} />
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => onDelete(note.id || note._id)}
              title="Delete note"
              className="btn btn-ghost btn-sm"
              style={{
                padding: '6px',
                borderRadius: 'var(--rounded-full)',
                color: 'var(--text-muted)'
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Note Title */}
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 652,
            lineHeight: 1.25,
            color: 'var(--ink)',
            marginBottom: '8px'
          }}
        >
          {highlightMatch(note.title, searchQuery)}
        </h3>

        {/* Note Content Excerpt */}
        <div
          className="note-card-excerpt"
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.88rem',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {formattedExcerpt}
        </div>
      </div>

      {/* Card Footer: Timestamp & Edit icon */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid var(--hairline-soft)',
          fontSize: '0.78rem',
          color: 'var(--text-faint)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Calendar size={13} />
          {formattedDate}
        </span>

        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--ink)',
            fontWeight: 600,
            fontSize: '0.8rem'
          }}
        >
          <Edit3 size={13} /> Edit
        </span>
      </div>
    </div>
  );
};
