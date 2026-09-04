import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { NoteCard } from '../components/notes/NoteCard';

describe('NoteCard Component', () => {
  const mockNote = {
    id: 101,
    title: 'Architecture Meeting',
    content: '<p>Discuss scalable <strong>microservices</strong> and databases.</p>',
    category: 'Work',
    is_pinned: 1,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-02T12:00:00Z'
  };

  it('renders note title and category badge', () => {
    render(
      <NoteCard
        note={mockNote}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onTogglePin={vi.fn()}
      />
    );

    expect(screen.getByText('Architecture Meeting')).toBeTruthy();
    expect(screen.getByText('Work')).toBeTruthy();
  });

  it('strips html tags and renders clean text excerpt', () => {
    render(
      <NoteCard
        note={mockNote}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onTogglePin={vi.fn()}
      />
    );

    expect(screen.getByText(/Discuss scalable microservices/i)).toBeTruthy();
  });

  it('triggers onEdit callback when card is clicked', () => {
    const handleEdit = vi.fn();
    render(
      <NoteCard
        note={mockNote}
        onEdit={handleEdit}
        onDelete={vi.fn()}
        onTogglePin={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Architecture Meeting'));
    expect(handleEdit).toHaveBeenCalledWith(mockNote);
  });

  it('triggers onDelete when trash button is clicked', () => {
    const handleDelete = vi.fn();
    render(
      <NoteCard
        note={mockNote}
        onEdit={vi.fn()}
        onDelete={handleDelete}
        onTogglePin={vi.fn()}
      />
    );

    const deleteBtn = screen.getByTitle('Delete note');
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(101);
  });

  it('triggers onTogglePin when pin button is clicked', () => {
    const handleTogglePin = vi.fn();
    render(
      <NoteCard
        note={mockNote}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onTogglePin={handleTogglePin}
      />
    );

    const pinBtn = screen.getByTitle('Unpin note');
    fireEvent.click(pinBtn);
    expect(handleTogglePin).toHaveBeenCalledWith(mockNote);
  });
});
