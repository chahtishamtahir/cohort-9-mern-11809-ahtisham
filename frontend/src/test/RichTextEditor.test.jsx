import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { RichTextEditor } from '../components/editor/RichTextEditor';

describe('RichTextEditor Component', () => {
  it('renders formatting toolbar buttons', () => {
    render(<RichTextEditor value="<p>Test</p>" onChange={vi.fn()} />);

    expect(screen.getByTitle(/Bold/i)).toBeTruthy();
    expect(screen.getByTitle(/Italic/i)).toBeTruthy();
    expect(screen.getByTitle(/Underline/i)).toBeTruthy();
    expect(screen.getByTitle(/Heading 1/i)).toBeTruthy();
    expect(screen.getByTitle(/Heading 2/i)).toBeTruthy();
    expect(screen.getByTitle(/Bullet List/i)).toBeTruthy();
    expect(screen.getByTitle(/Numbered List/i)).toBeTruthy();
    expect(screen.getByTitle(/Quote/i)).toBeTruthy();
    expect(screen.getByTitle(/Code Block/i)).toBeTruthy();
  });

  it('renders editable surface with correct placeholder attribute', () => {
    const { container } = render(
      <RichTextEditor
        value=""
        onChange={vi.fn()}
        placeholder="Type something amazing..."
      />
    );

    const editable = container.querySelector('[contenteditable="true"]');
    expect(editable).toBeTruthy();
    expect(editable.getAttribute('data-placeholder')).toBe('Type something amazing...');
  });
});
