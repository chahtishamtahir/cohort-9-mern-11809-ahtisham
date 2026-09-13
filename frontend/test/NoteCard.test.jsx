import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { NoteCard } from '../src/components/notes/NoteCard';

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

  it('renders formatted text excerpt reflecting bold and inline formatting', () => {
    const { container } = render(
      <NoteCard
        note={mockNote}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onTogglePin={vi.fn()}
      />
    );

    expect(container.textContent).toContain('Discuss scalable microservices and databases.');
    expect(screen.getByText('microservices').tagName).toBe('STRONG');
  });

  it('reflects markdown formatting (headings, bold, code) in note excerpt without raw syntax', () => {
    const markdownNote = {
      id: 102,
      title: 'Authentication Overview',
      content: '# Authentication - **authentication**: verifying identity (`401 Unauthorized`) - **authorization**: verifying permissions (`403 Forbidden`)',
      category: 'Security'
    };

    const { container } = render(
      <NoteCard
        note={markdownNote}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onTogglePin={vi.fn()}
      />
    );

    // Verify raw markdown characters are stripped and converted
    expect(container.textContent).not.toContain('# Authentication');
    expect(container.textContent).not.toContain('**authentication**');
    expect(container.textContent).not.toContain('`401 Unauthorized`');

    // Verify rich formatting elements reflect the content
    const strongs = container.querySelectorAll('strong');
    expect(strongs.length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector('code')).toBeTruthy();
    expect(container.textContent).toContain('401 Unauthorized');
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

  it('renders checklists with check indicators in note excerpt', () => {
    const checklistNote = {
      id: 103,
      title: 'Sprint Tasks',
      content: '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked /><span></span></label><div><p>Completed task</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox" /><span></span></label><div><p>Pending task</p></div></li></ul>',
      category: 'Work'
    };

    const { container } = render(
      <NoteCard
        note={checklistNote}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onTogglePin={vi.fn()}
      />
    );

    expect(container.textContent).toContain('☑ Completed task');
    expect(container.textContent).toContain('☐ Pending task');
  });

  it('renders numbered lists with sequential indices in note excerpt', () => {
    const orderedNote = {
      id: 104,
      title: 'Recipe',
      content: '<ol><li>Boil water</li><li>Add pasta</li><li>Stir gently</li></ol>',
      category: 'Personal'
    };

    const { container } = render(
      <NoteCard
        note={orderedNote}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onTogglePin={vi.fn()}
      />
    );

    expect(container.textContent).toContain('1. Boil water');
    expect(container.textContent).toContain('2. Add pasta');
    expect(container.textContent).toContain('3. Stir gently');
  });
});
