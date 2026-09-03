import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
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
  Folder,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const CATEGORIES = ['All', 'General', 'Work', 'Personal', 'Ideas', 'Study', 'Meeting'];

/**
 * DashboardPage Component
 * Main authenticated dashboard displaying list of user notes, search/filtering,
 * note creation, import/export, and rich editing.
 */
export const DashboardPage = () => {
  const { user, openProfileModal } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Editor Modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // File input ref for import
  const fileInputRef = useRef(null);

  // Fetch notes from backend
  const fetchNotes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await notesApi.getAll(searchQuery, selectedCategory);
      if (res && res.notes) {
        setNotes(res.notes);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch notes from backend.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when search or category changes (with debounce on search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

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
    if (editingNote) {
      // Update
      await notesApi.update(editingNote.id, noteData);
    } else {
      // Create
      await notesApi.create(noteData);
    }
    await fetchNotes();
  };

  // Delete note
  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await notesApi.delete(noteId);
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      } catch (err) {
        alert(err.message || 'Failed to delete note');
      }
    }
  };

  // Toggle pin
  const handleTogglePin = async (note) => {
    try {
      const updatedPinned = !note.is_pinned;
      await notesApi.update(note.id, { isPinned: updatedPinned });
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, is_pinned: updatedPinned ? 1 : 0 } : n))
      );
    } catch (err) {
      alert(err.message || 'Failed to update pin status');
    }
  };

  // Export notes as JSON
  const handleExportNotes = async () => {
    try {
      const data = await notesApi.exportAll();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `notionflow_notes_export_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert(err.message || 'Failed to export notes');
    }
  };

  // Import notes from file
  const handleImportFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const notesToImport = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.notes)
          ? parsed.notes
          : null;

        if (!notesToImport) {
          throw new Error('Invalid file format. Expected a JSON file with notes.');
        }

        const res = await notesApi.importAll(notesToImport);
        alert(res.message || 'Notes imported successfully!');
        await fetchNotes();
      } catch (err) {
        alert(err.message || 'Failed to parse and import file.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Pinned vs Regular Notes
  const pinnedNotes = notes.filter((n) => n.is_pinned === 1);
  const regularNotes = notes.filter((n) => !n.is_pinned);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFileChange}
        accept=".json"
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

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Import notes from JSON file"
          >
            <Upload size={15} />
            Import
          </button>

          <button
            type="button"
            onClick={handleExportNotes}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Export all notes to a JSON file"
          >
            <Download size={15} />
            Export
          </button>

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
            onClick={fetchNotes}
            className="btn btn-outline btn-sm"
            style={{ marginLeft: 'auto' }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
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
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '20px'
                }}
              >
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
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
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '20px'
                }}
              >
                {regularNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
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
    </div>
  );
};
