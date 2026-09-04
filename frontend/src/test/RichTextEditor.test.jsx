import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    expect(screen.getByTitle(/Clear Formatting/i)).toBeTruthy();
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

  it('clears multiple nested formats (bold, italic, underline) when Clear Formatting is clicked', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <RichTextEditor
        value="<p><b><i><u>Multi formatted text</u></i></b></p>"
        onChange={handleChange}
      />
    );

    const clearBtn = screen.getByTitle(/Clear Formatting/i);
    expect(clearBtn).toBeTruthy();

    const editable = container.querySelector('[contenteditable="true"]');
    expect(editable.innerHTML).toContain('Multi formatted text');

    // Create a range selecting the formatted text inside contentEditable
    const range = document.createRange();
    range.selectNodeContents(editable);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    // Click Clear Formatting
    fireEvent.click(clearBtn);

    // Verify all b, i, u tags are stripped from the selection
    expect(editable.querySelector('b')).toBeNull();
    expect(editable.querySelector('i')).toBeNull();
    expect(editable.querySelector('u')).toBeNull();
    expect(editable.textContent).toContain('Multi formatted text');
  });

  it('clears heading, blockquote, and inline styles back to normal paragraph', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <RichTextEditor
        value="<h2><b><i>Heading with bold and italic</i></b></h2>"
        onChange={handleChange}
      />
    );

    const clearBtn = screen.getByTitle(/Clear Formatting/i);
    const editable = container.querySelector('[contenteditable="true"]');

    const range = document.createRange();
    range.selectNodeContents(editable);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    fireEvent.click(clearBtn);

    expect(editable.querySelector('h2')).toBeNull();
    expect(editable.querySelector('b')).toBeNull();
    expect(editable.querySelector('i')).toBeNull();
    expect(editable.textContent).toContain('Heading with bold and italic');
  });
});
