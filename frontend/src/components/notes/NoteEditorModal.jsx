import React, { useState, useEffect, useRef } from 'react';
import { X, Pin, Save, AlertCircle, Check, Tag } from 'lucide-react';
import { RichTextEditor } from '../editor/RichTextEditor';

const DEFAULT_CATEGORIES = ['General', 'Work', 'Personal', 'Ideas', 'Study', 'Meeting'];

/**
 * NoteEditorForm Component
 * Manages note form state, auto-saving, draft persistence, custom categories,
 * and rich text editing.
 */
const NoteEditorForm = ({
  noteToEdit,
  defaultCategory = 'General',
  onClose,
  onSave,
  onAutoSave,
  existingCategories = DEFAULT_CATEGORIES
}) => {
  // Check for local draft if creating a new note
  const getInitialDraft = () => {
    if (noteToEdit) return null;
    try {
      const saved = localStorage.getItem('notionflow_new_note_draft');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const initialDraft = getInitialDraft();

  const effectiveDefaultCategory = noteToEdit
    ? (noteToEdit.category || 'General')
    : (defaultCategory && defaultCategory !== 'All' && defaultCategory !== 'General'
        ? defaultCategory
        : initialDraft?.category || defaultCategory || 'General');

  const [title, setTitle] = useState(noteToEdit?.title || initialDraft?.title || '');
  const [content, setContent] = useState(noteToEdit?.content || initialDraft?.content || '');
  const [category, setCategory] = useState(effectiveDefaultCategory);
  const [isPinned, setIsPinned] = useState(Boolean(noteToEdit?.is_pinned || noteToEdit?.isPinned || initialDraft?.isPinned));
  const [customCategoryMode, setCustomCategoryMode] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState(initialDraft ? 'draft_saved' : '');

  const isFirstRender = useRef(true);

  const onAutoSaveRef = useRef(onAutoSave);
  useEffect(() => {
    onAutoSaveRef.current = onAutoSave;
  }, [onAutoSave]);

  const lastSavedRef = useRef({
    title: (noteToEdit?.title || initialDraft?.title || '').trim(),
    content: noteToEdit?.content || initialDraft?.content || '',
    category: effectiveDefaultCategory,
    isPinned: Boolean(noteToEdit?.is_pinned || noteToEdit?.isPinned || initialDraft?.isPinned)
  });

  const [customCategories, setCustomCategories] = useState([]);

  // Combine default categories with any passed from user notes, custom created, or current category
  const categoryOptions = React.useMemo(() => {
    const list = [...DEFAULT_CATEGORIES, ...existingCategories, ...customCategories];
    if (defaultCategory && defaultCategory !== 'All' && !list.includes(defaultCategory)) {
      list.push(defaultCategory);
    }
    if (category && category !== '__custom__' && !list.includes(category)) {
      list.push(category);
    }
    return Array.from(new Set(list));
  }, [existingCategories, defaultCategory, customCategories, category]);

  // Debounced auto-save effect
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const currentTitle = title.trim();
    const isDirty =
      currentTitle !== lastSavedRef.current.title ||
      content !== lastSavedRef.current.content ||
      category !== lastSavedRef.current.category ||
      isPinned !== lastSavedRef.current.isPinned;

    if (!isDirty) {
      return;
    }

    let resetTimer = null;

    if (noteToEdit && (noteToEdit.id || noteToEdit._id)) {
      // Auto-save existing note only if title is not empty
      if (!currentTitle) return;

      setAutoSaveStatus('saving');
      const timer = setTimeout(async () => {
        try {
          if (onAutoSaveRef.current) {
            await onAutoSaveRef.current({
              title: currentTitle,
              content,
              category,
              isPinned
            });
          }
          lastSavedRef.current = {
            title: currentTitle,
            content,
            category,
            isPinned
          };
          setAutoSaveStatus('saved');
          resetTimer = setTimeout(() => {
            setAutoSaveStatus((current) => (current === 'saved' ? '' : current));
          }, 3000);
        } catch {
          setAutoSaveStatus('');
        }
      }, 1200);

      return () => {
        clearTimeout(timer);
        if (resetTimer) clearTimeout(resetTimer);
      };
    } else {
      // Save draft for new note
      if (title || content) {
        try {
          localStorage.setItem(
            'notionflow_new_note_draft',
            JSON.stringify({ title, content, category, isPinned })
          );
          lastSavedRef.current = {
            title: currentTitle,
            content,
            category,
            isPinned
          };
          setAutoSaveStatus('draft_saved');
        } catch {
          // Ignore localStorage errors
        }
      }
    }
  }, [title, content, category, isPinned, noteToEdit]);

  const handleSelectCategoryChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setCustomCategoryMode(true);
      setCustomCategoryInput('');
    } else {
      setCategory(val);
    }
  };

  const handleApplyCustomCategory = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = customCategoryInput.trim();
    if (trimmed) {
      setCustomCategories((prev) => Array.from(new Set([...prev, trimmed])));
      setCategory(trimmed);
      setCustomCategoryMode(false);
      setCustomCategoryInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for your note.');
      return;
    }

    setSaving(true);
    setError('');

    const finalCategory = customCategoryMode && customCategoryInput.trim()
      ? customCategoryInput.trim()
      : category;

    try {
      await onSave({
        title: title.trim(),
        content,
        category: finalCategory,
        isPinned
      });
      // Clear draft on successful manual save
      if (!noteToEdit) {
        localStorage.removeItem('notionflow_new_note_draft');
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!noteToEdit) {
      localStorage.removeItem('notionflow_new_note_draft');
    }
    onClose();
  };

  return (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 652, color: 'var(--ink)' }}>
              {noteToEdit ? 'Edit Note.' : 'Create New Note.'}
            </h2>

            {/* Live Auto-Save Status Badge */}
            {autoSaveStatus === 'saving' && (
              <span
                className="badge-pill"
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 10px',
                  backgroundColor: 'var(--canvas-soft)',
                  color: 'var(--text-muted)'
                }}
              >
                ⏳ Auto-saving...
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span
                className="badge-pill"
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Check size={12} /> Auto-saved just now
              </span>
            )}
            {autoSaveStatus === 'draft_saved' && !noteToEdit && (
              <span
                className="badge-pill"
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 10px',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: 'var(--accent)'
                }}
              >
                ● Draft saved locally
              </span>
            )}
          </div>

          <p className="small-text" style={{ marginTop: '2px' }}>
            Format your thoughts with the rich text editor.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCancel}
          className="btn btn-ghost btn-sm"
          style={{ padding: '6px', borderRadius: 'var(--rounded-full)' }}
          aria-label="Close note editor"
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Category Tag
            </label>

            {!customCategoryMode ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={categoryOptions.includes(category) ? category : '__custom__'}
                  onChange={handleSelectCategoryChange}
                  className="text-input"
                  style={{ flex: 1, cursor: 'pointer' }}
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__custom__">+ Add Custom Tag...</option>
                </select>

                <button
                  type="button"
                  onClick={() => setCustomCategoryMode(true)}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                  title="Add custom category tag"
                >
                  <Tag size={13} /> + Custom
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  placeholder="e.g. Travel, Recipes, Habit..."
                  className="text-input"
                  style={{ flex: 1 }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyCustomCategory();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyCustomCategory}
                  className="btn btn-primary btn-sm"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setCustomCategoryMode(false)}
                  className="btn btn-ghost btn-sm"
                  title="Cancel custom tag"
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Pin Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`btn ${isPinned ? 'btn-primary' : 'btn-outline'} btn-sm`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '40px' }}
            >
              <Pin size={14} fill={isPinned ? 'currentColor' : 'none'} />
              {isPinned ? 'Pinned to top' : 'Pin note'}
            </button>
          </div>
        </div>

        {/* Rich Text Editor with Checklists */}
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
            onClick={handleCancel}
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
  );
};

/**
 * NoteEditorModal Component
 * Screen/Modal 3: Note Editor with rich text formatting, category selection,
 * pin toggle, auto-saving, and draft persistence.
 */
export const NoteEditorModal = ({
  isOpen,
  noteToEdit,
  defaultCategory = 'General',
  onClose,
  onSave,
  onAutoSave,
  existingCategories
}) => {
  if (!isOpen) return null;

  const resolvedDefaultCategory =
    defaultCategory && defaultCategory !== 'All' ? defaultCategory : 'General';

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <NoteEditorForm
        key={noteToEdit ? (noteToEdit.id || noteToEdit._id || 'edit') : `new-${resolvedDefaultCategory}`}
        noteToEdit={noteToEdit}
        defaultCategory={resolvedDefaultCategory}
        onClose={onClose}
        onSave={onSave}
        onAutoSave={onAutoSave}
        existingCategories={existingCategories}
      />
    </div>
  );
};
