import React, { useState, useEffect } from 'react';
import { X, Pin, Save, AlertCircle } from 'lucide-react';
import { RichTextEditor } from '../editor/RichTextEditor';

const CATEGORIES = ['General', 'Work', 'Personal', 'Ideas', 'Study', 'Meeting'];

/**
 * NoteEditorModal Component
 * Screen/Modal 3: Note Editor with rich text formatting, category selection,
 * pin toggle, and save/cancel actions.
 */
export const NoteEditorModal = ({ isOpen, noteToEdit, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title || '');
      setContent(noteToEdit.content || '');
      setCategory(noteToEdit.category || 'General');
      setIsPinned(!!noteToEdit.is_pinned);
    } else {
      setTitle('');
      setContent('');
      setCategory('General');
      setIsPinned(false);
    }
    setError('');
  }, [noteToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for your note.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave({
        title: title.trim(),
        content,
        category,
        isPinned
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '740px',
          width: '94%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 652, color: 'var(--ink)' }}>
              {noteToEdit ? 'Edit Note.' : 'Create New Note.'}
            </h2>
            <p className="small-text" style={{ marginTop: '2px' }}>
              Format your thoughts with the rich text editor.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div
            style={{
              backgroundColor: 'var(--canvas-soft)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--rounded-sm)',
              padding: '10px 14px',
              color: 'var(--ink)',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} color="var(--accent)" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {/* Note Title Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Note Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q3 Product Roadmap & Strategy"
              className="text-input"
              style={{ width: '100%', fontSize: '1rem', fontWeight: 600 }}
              required
              autoFocus
            />
          </div>

          {/* Settings Row: Category & Pin */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-input"
                style={{ width: '100%', cursor: 'pointer' }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Pin Toggle */}
            <div style={{ paddingTop: '20px' }}>
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`btn ${isPinned ? 'btn-primary' : 'btn-outline'} btn-sm`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Pin size={14} fill={isPinned ? 'currentColor' : 'none'} />
                {isPinned ? 'Pinned to top' : 'Pin note'}
              </button>
            </div>
          </div>

          {/* Rich Text Editor */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Note Content
            </label>
            <RichTextEditor value={content} onChange={setContent} />
          </div>

          {/* Action Buttons: Cancel and Save */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              marginTop: 'auto',
              borderTop: '1px solid var(--hairline-soft)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-outline"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={16} />
              {saving ? 'Saving...' : noteToEdit ? 'Save Changes' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
