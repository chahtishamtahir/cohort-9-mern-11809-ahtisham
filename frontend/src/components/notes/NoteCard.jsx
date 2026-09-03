import React from 'react';
import { Pin, Trash2, Edit3, Calendar } from 'lucide-react';

/**
 * NoteCard Component
 * Displays a single note with its category badge, preview, pin status, and quick actions.
 */
export const NoteCard = ({ note, onEdit, onDelete, onTogglePin }) => {
  // Strip HTML tags for clean card preview
  const plainTextContent = note.content
    ? note.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : 'No content';

  const formattedDate = new Date(note.updated_at || note.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

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
            {note.category || 'General'}
          </span>

          <div
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pin Toggle Button */}
            <button
              type="button"
              onClick={() => onTogglePin(note)}
              title={note.is_pinned ? 'Unpin note' : 'Pin note to top'}
              className="btn btn-ghost btn-sm"
              style={{
                padding: '6px',
                borderRadius: 'var(--rounded-full)',
                color: note.is_pinned ? 'var(--accent)' : 'var(--text-muted)'
              }}
            >
              <Pin size={15} fill={note.is_pinned ? 'currentColor' : 'none'} />
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => onDelete(note.id)}
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
          {note.title}
        </h3>

        {/* Note Content Excerpt */}
        <p
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
          {plainTextContent}
        </p>
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
