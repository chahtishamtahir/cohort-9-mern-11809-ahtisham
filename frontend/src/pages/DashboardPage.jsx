import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { notesApi } from '../services/api';
import { NoteCard } from '../components/notes/NoteCard';
import { NoteEditorModal } from '../components/notes/NoteEditorModal';
import {
  Plus,
  Search,
  Download,
  Upload,
  Pin,
  FileText,
  FileJson,
  ChevronDown,
  Folder,
  RefreshCw,
  AlertCircle,
  Trash2
} from 'lucide-react';

const CATEGORIES = ['All', 'General', 'Work', 'Personal', 'Ideas', 'Study', 'Meeting'];

/**
 * Delete Confirmation Modal
 * Replaces native window.confirm with Mobbin stadium/pill aesthetic
 */
const ConfirmDeleteModal = ({ isOpen, noteTitle, onConfirm, onCancel, deleting }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', textAlign: 'center', padding: '28px' }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}
        >
          <Trash2 size={22} />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
          Delete this note?
        </h3>

        <p className="body-text" style={{ fontSize: '0.9rem', marginBottom: '24px', color: 'var(--text-muted)' }}>
          Are you sure you want to permanently delete{' '}
          <strong style={{ color: 'var(--ink)' }}>"{noteTitle || 'this note'}"</strong>? This action cannot be undone.
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="btn btn-outline"
            style={{ minWidth: '100px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="btn btn-primary"
            style={{
              backgroundColor: '#ef4444',
              borderColor: '#ef4444',
              color: '#ffffff',
              minWidth: '120px'
            }}
          >
            {deleting ? 'Deleting...' : 'Delete Note'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * DashboardPage Component
 * Main authenticated dashboard displaying list of user notes, search/filtering,
 * note creation, import/export, and rich editing.
 */
export const DashboardPage = () => {
  const { user, setNoteCount } = useAuth();
  const toast = useToast();
  const [notes, setNotes] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Editor Modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Delete Modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, noteId: null, noteTitle: '', deleting: false });

  // File input ref and dropdown menu states for import/export
  const fileInputRef = useRef(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);
  const importMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setExportMenuOpen(false);
      }
      if (importMenuRef.current && !importMenuRef.current.contains(event.target)) {
        setImportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerFileInput = (accept) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept || '.json,.txt,.md,text/plain,application/json';
      fileInputRef.current.click();
    }
  };

  // Fetch notes from backend
  const fetchNotes = React.useCallback(async (showSearchIndicator = true) => {
    if (showSearchIndicator && !initialLoading) {
      setIsSearching(true);
    }
    setError('');

    try {
      const res = await notesApi.getAll(searchQuery, selectedCategory);
      if (res && res.notes) {
        setNotes(res.notes);
        if (setNoteCount) setNoteCount(res.notes.length);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch notes from backend.');
      toast.error(err.message || 'Failed to load notes');
    } finally {
      setInitialLoading(false);
      setIsSearching(false);
    }
  }, [searchQuery, selectedCategory, setNoteCount, initialLoading, toast]);

  // Re-fetch when search or category changes (with debounce on search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, fetchNotes]);

  // Open editor to create new note
  const handleCreateNew = () => {
    setEditingNote(null);
    setEditorOpen(true);
  };

  // Open editor to edit an existing note
  const handleEditNote = (note) => {
    setEditingNote(note);
    setEditorOpen(true);
  };

  // Save note (create or update)
  const handleSaveNote = async (noteData) => {
    try {
      if (editingNote) {
        const id = editingNote.id || editingNote._id;
        await notesApi.update(id, noteData);
        toast.success('Note updated successfully.');
      } else {
        await notesApi.create(noteData);
        toast.success('Note created successfully.');
      }
      await fetchNotes(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save note');
      throw err;
    }
  };

  // Request note deletion (open confirmation modal)
  const handleDeleteClick = (note) => {
    const noteId = note.id || note._id;
    setDeleteModal({
      isOpen: true,
      noteId,
      noteTitle: note.title,
      deleting: false
    });
  };

  // Confirm delete note
  const handleConfirmDelete = async () => {
    if (!deleteModal.noteId) return;
    setDeleteModal((prev) => ({ ...prev, deleting: true }));

    try {
      await notesApi.delete(deleteModal.noteId);
      const updated = notes.filter((n) => (n.id || n._id) !== deleteModal.noteId);
      setNotes(updated);
      if (setNoteCount) setNoteCount(updated.length);
      toast.success('Note deleted successfully.');
      setDeleteModal({ isOpen: false, noteId: null, noteTitle: '', deleting: false });
    } catch (err) {
      toast.error(err.message || 'Failed to delete note');
      setDeleteModal((prev) => ({ ...prev, deleting: false }));
    }
  };

  // Toggle pin
  const handleTogglePin = async (note) => {
    try {
      const noteId = note.id || note._id;
      const currentPinned = Boolean(note.is_pinned || note.isPinned);
      const updatedPinned = !currentPinned;
      await notesApi.update(noteId, { isPinned: updatedPinned });
      setNotes((prev) =>
        prev.map((n) => ((n.id || n._id) === noteId ? { ...n, is_pinned: updatedPinned, isPinned: updatedPinned } : n))
      );
      toast.info(updatedPinned ? 'Note pinned to top.' : 'Note unpinned.');
    } catch (err) {
      toast.error(err.message || 'Failed to update pin status');
    }
  };

  // Helper to convert HTML note content to clean, readable plain text
  const htmlToPlainText = (html) => {
    if (!html) return '';
    let text = html
      .replace(/<br\s*[/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li>/gi, '• ');
    text = text.replace(/<[^>]+>/g, '');
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    return text.replace(/\n{3,}/g, '\n\n').trim();
  };

  // Export notes as JSON or TXT
  const handleExportNotes = async (format = 'json') => {
    try {
      const data = await notesApi.exportAll();
      const notesList = Array.isArray(data) ? data : data.notes || [];

      if (notesList.length === 0) {
        toast.info('No notes available to export.');
        return;
      }

      const dateStr = new Date().toISOString().slice(0, 10);

      if (format === 'txt') {
        let txtContent = `NOTIONFLOW NOTES EXPORT\nGenerated on: ${new Date().toLocaleString()}\nTotal Notes: ${notesList.length}\n`;
        txtContent += '='.repeat(60) + '\n\n';

        notesList.forEach((n, idx) => {
          const title = n.title || 'Untitled';
          const category = n.category || 'General';
          const pinned = (n.is_pinned || n.isPinned) ? 'Yes' : 'No';
          const date = n.created_at ? new Date(n.created_at).toLocaleDateString() : 'N/A';
          const plainContent = htmlToPlainText(n.content);

          txtContent += `[Note ${idx + 1}] ${title}\n`;
          txtContent += `Category: ${category} | Date: ${date} | Pinned: ${pinned}\n`;
          txtContent += '-'.repeat(40) + '\n';
          txtContent += plainContent + '\n\n';
          txtContent += '='.repeat(60) + '\n\n';
        });

        const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', url);
        downloadAnchor.setAttribute('download', `notionflow_notes_export_${dateStr}.txt`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        URL.revokeObjectURL(url);

        toast.success(`Exported ${notesList.length} notes as TXT.`);
      } else {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(data, null, 2)
        )}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', `notionflow_notes_export_${dateStr}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        toast.success(`Exported ${notesList.length} notes as JSON.`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to export notes');
    }
  };

  // Import notes from file (.json, .txt, .md)
  const handleImportFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name;
    const isJson = fileName.toLowerCase().endsWith('.json');
    const isTxtOrMd = fileName.toLowerCase().endsWith('.txt') || fileName.toLowerCase().endsWith('.md');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawContent = event.target.result;

        if (isJson) {
          const parsed = JSON.parse(rawContent);
          const notesToImport = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed.notes)
            ? parsed.notes
            : null;

          if (!notesToImport || notesToImport.length === 0) {
            throw new Error('Invalid JSON file. Expected an array of notes.');
          }

          const res = await notesApi.importAll(notesToImport);
          toast.success(res.message || `Successfully imported ${notesToImport.length} note(s) from JSON!`);
          await fetchNotes(false);
        } else if (isTxtOrMd) {
          const notesToImport = [];

          if (rawContent.includes('NOTIONFLOW NOTES EXPORT') || (rawContent.includes('[Note') && rawContent.includes('Category:'))) {
            const blocks = rawContent.split(/={20,}/).filter((b) => b.trim().length > 0);
            for (const block of blocks) {
              if (block.includes('NOTIONFLOW NOTES EXPORT')) continue;
              const lines = block.trim().split('\n');
              if (lines.length === 0) continue;

              let title = '';
              let category = 'General';
              const contentLines = [];
              let readingContent = false;

              for (const line of lines) {
                if (!readingContent) {
                  const noteMatch = line.match(/^\[Note \d+\]\s*(.*)$/);
                  if (noteMatch) {
                    title = noteMatch[1].trim();
                    continue;
                  }
                  const catMatch = line.match(/^Category:\s*([^|]+)/i);
                  if (catMatch) {
                    category = catMatch[1].trim();
                    continue;
                  }
                  if (line.startsWith('---')) {
                    readingContent = true;
                    continue;
                  }
                } else {
                  contentLines.push(line);
                }
              }

              if (title || contentLines.length > 0) {
                const formattedHtml = contentLines
                  .map((l) => `<p>${l ? l.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '&nbsp;'}</p>`)
                  .join('');
                notesToImport.push({
                  title: title || 'Imported Text Note',
                  category: category || 'General',
                  content: formattedHtml || '<p></p>',
                  isPinned: false
                });
              }
            }
          }

          if (notesToImport.length === 0) {
            const cleanTitle = fileName.replace(/\.(txt|md)$/i, '').trim() || 'Imported Note';
            const formattedHtml = rawContent
              .split('\n')
              .map((line) => `<p>${line.trim() ? line.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '&nbsp;'}</p>`)
              .join('');

            notesToImport.push({
              title: cleanTitle,
              category: 'General',
              content: formattedHtml,
              isPinned: false
            });
          }

          const res = await notesApi.importAll(notesToImport);
          toast.success(res.message || `Successfully imported ${notesToImport.length} note(s) from ${fileName}!`);
          await fetchNotes(false);
        } else {
          const parsed = JSON.parse(rawContent);
          const notesToImport = Array.isArray(parsed) ? parsed : parsed.notes || [parsed];
          const res = await notesApi.importAll(notesToImport);
          toast.success(res.message || `Imported ${notesToImport.length} note(s)!`);
          await fetchNotes(false);
        }
      } catch (err) {
        toast.error(err.message || 'Failed to parse and import file.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Pinned vs Regular Notes
  const isNotePinned = (n) => Boolean(n.is_pinned || n.isPinned);
  const pinnedNotes = notes.filter(isNotePinned);
  const regularNotes = notes.filter((n) => !isNotePinned(n));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFileChange}
        accept=".json,.txt,.md,text/plain,application/json"
        style={{ display: 'none' }}
      />

      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px',
          marginBottom: '32px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 652, lineHeight: 1.1, color: 'var(--ink)' }}>
            Welcome back, {user?.name || 'Friend'}.
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '1rem' }}>
            You have {notes.length} {notes.length === 1 ? 'note' : 'notes'} stored in your workspace.
          </p>
        </div>

        {/* Action Buttons with Dropdown Options */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {/* Import Dropdown Menu */}
          <div style={{ position: 'relative' }} ref={importMenuRef}>
            <button
              type="button"
              onClick={() => {
                setImportMenuOpen((prev) => !prev);
                setExportMenuOpen(false);
              }}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Import notes from JSON or Text file"
            >
              <Download size={15} />
              Import
              <ChevronDown
                size={13}
                style={{
                  opacity: 0.7,
                  transform: importMenuOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease'
                }}
              />
            </button>

            {importMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  backgroundColor: 'var(--canvas)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--rounded-sm)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                  padding: '6px',
                  zIndex: 100,
                  minWidth: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setImportMenuOpen(false);
                    triggerFileInput('.json,application/json');
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'flex-start',
                    borderRadius: 'var(--rounded-xs)',
                    padding: '8px 12px',
                    fontSize: '0.86rem'
                  }}
                >
                  <FileJson size={15} style={{ color: 'var(--accent)' }} />
                  <span>Import JSON Backup (.json)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setImportMenuOpen(false);
                    triggerFileInput('.txt,.md,text/plain');
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'flex-start',
                    borderRadius: 'var(--rounded-xs)',
                    padding: '8px 12px',
                    fontSize: '0.86rem'
                  }}
                >
                  <FileText size={15} style={{ color: 'var(--text-muted)' }} />
                  <span>Import Text File (.txt, .md)</span>
                </button>
              </div>
            )}
          </div>

          {/* Export Dropdown Menu */}
          <div style={{ position: 'relative' }} ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => {
                setExportMenuOpen((prev) => !prev);
                setImportMenuOpen(false);
              }}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Export notes to JSON or Text file"
            >
              <Upload size={15} />
              Export
              <ChevronDown
                size={13}
                style={{
                  opacity: 0.7,
                  transform: exportMenuOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease'
                }}
              />
            </button>

            {exportMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  backgroundColor: 'var(--canvas)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--rounded-sm)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                  padding: '6px',
                  zIndex: 100,
                  minWidth: '210px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleExportNotes('json');
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'flex-start',
                    borderRadius: 'var(--rounded-xs)',
                    padding: '8px 12px',
                    fontSize: '0.86rem'
                  }}
                >
                  <FileJson size={15} style={{ color: 'var(--accent)' }} />
                  <span>Export as JSON (.json)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleExportNotes('txt');
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'flex-start',
                    borderRadius: 'var(--rounded-xs)',
                    padding: '8px 12px',
                    fontSize: '0.86rem'
                  }}
                >
                  <FileText size={15} style={{ color: 'var(--text-muted)' }} />
                  <span>Export as Text (.txt)</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleCreateNew}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            New Note
          </button>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div
        style={{
          backgroundColor: 'var(--canvas-soft)',
          borderRadius: 'var(--rounded-md)',
          padding: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px'
        }}
      >
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '460px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-faint)'
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title or content..."
            className="text-input"
            style={{
              width: '100%',
              paddingLeft: '38px',
              backgroundColor: 'var(--canvas)',
              borderRadius: 'var(--rounded-full)'
            }}
          />
          {isSearching && (
            <RefreshCw
              size={14}
              className="spin"
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
          )}
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  borderRadius: 'var(--rounded-full)',
                  padding: '6px 14px',
                  fontSize: '0.82rem'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            backgroundColor: 'var(--canvas-soft)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--rounded-sm)',
            padding: '12px 16px',
            color: 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px'
          }}
        >
          <AlertCircle size={18} color="var(--accent)" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchNotes(false)}
            className="btn btn-outline btn-sm"
            style={{ marginLeft: 'auto' }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Loading State for initial fetch */}
      {initialLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading your notes...</p>
        </div>
      ) : notes.length === 0 ? (
        /* Empty State */
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: 'var(--canvas-soft)',
            borderRadius: 'var(--rounded-md)',
            border: '1px dashed var(--hairline)'
          }}
        >
          <div
            className="app-icon-squircle"
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <FileText size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 652, color: 'var(--ink)' }}>
            {searchQuery || selectedCategory !== 'All'
              ? 'No matching notes found.'
              : 'You have no notes yet.'}
          </h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', maxWidth: '420px', margin: '6px auto 20px' }}>
            {searchQuery || selectedCategory !== 'All'
              ? 'Try changing your search query or category filter.'
              : 'Create your first note now using our rich text editor.'}
          </p>
          <button type="button" onClick={handleCreateNew} className="btn btn-primary">
            <Plus size={16} /> Create Note
          </button>
        </div>
      ) : (
        /* Notes Grid */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {/* Pinned Notes Section (if any) */}
          {pinnedNotes.length > 0 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  color: 'var(--ink)',
                  fontWeight: 652,
                  fontSize: '1.05rem'
                }}
              >
                <Pin size={16} color="var(--accent)" fill="var(--accent)" />
                <span>Pinned Notes ({pinnedNotes.length})</span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                  gap: '20px'
                }}
              >
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id || note._id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={() => handleDeleteClick(note)}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Notes Section */}
          {regularNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.95rem'
                  }}
                >
                  <Folder size={15} />
                  <span>Other Notes ({regularNotes.length})</span>
                </div>
              )}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                  gap: '20px'
                }}
              >
                {regularNotes.map((note) => (
                  <NoteCard
                    key={note.id || note._id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={() => handleDeleteClick(note)}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={editorOpen}
        noteToEdit={editingNote}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveNote}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        noteTitle={deleteModal.noteTitle}
        deleting={deleteModal.deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, noteId: null, noteTitle: '', deleting: false })}
      />
    </div>
  );
};
