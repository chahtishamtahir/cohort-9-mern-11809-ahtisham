import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { RichTextEditor } from '../src/components/editor/RichTextEditor';

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

  it('clears all formatting (headings, checklists, quotes, code, lists, styles) even without active selection', () => {
    const handleChange = vi.fn();
    const formattedHtml = `
      <h2>Project Roadmap</h2>
      <blockquote style="color: grey;"><p>Remember to stay focused</p></blockquote>
      <pre><code>const secretKey = 'xyz';</code></pre>
      <ul class="task-list">
        <li class="task-item"><input type="checkbox" /> <span>Deploy to production</span></li>
        <li class="task-item task-completed"><input type="checkbox" checked /> <span>Write unit tests</span></li>
      </ul>
      <ul>
        <li><span style="font-weight: bold; color: red;">Bullet item with <i>italic</i></span></li>
      </ul>
      <p>Final paragraph with <b>bold</b>, <u>underline</u>, and <span style="background: yellow;">highlight</span></p>
    `;

    const { container } = render(
      <RichTextEditor
        value={formattedHtml}
        onChange={handleChange}
      />
    );

    const clearBtn = screen.getByTitle(/Clear Formatting/i);
    const editable = container.querySelector('[contenteditable="true"]');

    // Ensure no active text range selection (mimics user clicking the button while typing)
    const selection = window.getSelection();
    selection.removeAllRanges();

    fireEvent.click(clearBtn);

    // Verify all complex formatting elements are completely gone
    expect(editable.querySelector('h2')).toBeNull();
    expect(editable.querySelector('blockquote')).toBeNull();
    expect(editable.querySelector('pre')).toBeNull();
    expect(editable.querySelector('code')).toBeNull();
    expect(editable.querySelector('ul')).toBeNull();
    expect(editable.querySelector('ol')).toBeNull();
    expect(editable.querySelector('li')).toBeNull();
    expect(editable.querySelector('input')).toBeNull();
    expect(editable.querySelector('b')).toBeNull();
    expect(editable.querySelector('i')).toBeNull();
    expect(editable.querySelector('u')).toBeNull();
    expect(editable.querySelector('span')).toBeNull();

    // Verify no elements retain style or class attributes
    const styledElements = editable.querySelectorAll('[style], [class]');
    expect(styledElements.length).toBe(0);

    // Verify text content was preserved
    expect(editable.textContent).toContain('Project Roadmap');
    expect(editable.textContent).toContain('Remember to stay focused');
    expect(editable.textContent).toContain("const secretKey = 'xyz';");
    expect(editable.textContent).toContain('Deploy to production');
    expect(editable.textContent).toContain('Write unit tests');
    expect(editable.textContent).toContain('Bullet item with italic');
    expect(editable.textContent).toContain('Final paragraph with bold, underline, and highlight');

    // Verify all remaining blocks are clean <p> elements
    const paragraphs = editable.querySelectorAll('p');
    expect(paragraphs.length).toBeGreaterThan(0);
    expect(handleChange).toHaveBeenCalled();
  });

  it('splits multi-line text into individual task items when Checklist is clicked', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <RichTextEditor
        value="<p>Buy groceries<br>Clean the house<br>Prepare presentation</p>"
        onChange={handleChange}
      />
    );

    const checklistBtn = screen.getByTitle(/Checklist/i);
    const editable = container.querySelector('[contenteditable="true"]');

    // Select all content
    const range = document.createRange();
    range.selectNodeContents(editable);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    fireEvent.click(checklistBtn);

    // Verify multiple taskItem li elements were created, each with its own checkbox
    const taskItems = editable.querySelectorAll('ul[data-type="taskList"] li');
    expect(taskItems.length).toBe(3);

    const checkboxes = editable.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(3);

    expect(taskItems[0].textContent).toContain('Buy groceries');
    expect(taskItems[1].textContent).toContain('Clean the house');
    expect(taskItems[2].textContent).toContain('Prepare presentation');
  });

  it('splits multi-line text into individual list items when Bullet List is clicked', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <RichTextEditor
        value="<p>Item Alpha<br>Item Beta<br>Item Gamma</p>"
        onChange={handleChange}
      />
    );

    const bulletBtn = screen.getByTitle(/Bullet List/i);
    const editable = container.querySelector('[contenteditable="true"]');

    const range = document.createRange();
    range.selectNodeContents(editable);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    fireEvent.click(bulletBtn);

    const listItems = editable.querySelectorAll('ul li');
    expect(listItems.length).toBe(3);
    expect(listItems[0].textContent).toContain('Item Alpha');
    expect(listItems[1].textContent).toContain('Item Beta');
    expect(listItems[2].textContent).toContain('Item Gamma');
  });

  it('splits multi-line text into individual ordered items when Numbered List is clicked', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <RichTextEditor
        value="<p>Step one<br>Step two<br>Step three</p>"
        onChange={handleChange}
      />
    );

    const orderedBtn = screen.getByTitle(/Numbered List/i);
    const editable = container.querySelector('[contenteditable="true"]');

    const range = document.createRange();
    range.selectNodeContents(editable);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    fireEvent.click(orderedBtn);

    const orderedList = editable.querySelector('ol');
    expect(orderedList).toBeTruthy();

    const listItems = editable.querySelectorAll('ol li');
    expect(listItems.length).toBe(3);
    expect(listItems[0].textContent).toContain('Step one');
    expect(listItems[1].textContent).toContain('Step two');
    expect(listItems[2].textContent).toContain('Step three');
  });
});
