import { describe, it, expect } from 'vitest';
import {
  hasMarkdownSyntax,
  markdownToHtml,
  htmlToMarkdown
} from '../src/utils/markdownUtils';

describe('markdownUtils Module', () => {
  describe('hasMarkdownSyntax', () => {
    it('detects checklists (- [ ] and - [x])', () => {
      expect(hasMarkdownSyntax('- [ ] Buy milk')).toBe(true);
      expect(hasMarkdownSyntax('- [x] Call dentist')).toBe(true);
      expect(hasMarkdownSyntax('* [ ] Item')).toBe(true);
    });

    it('detects bullet lists (- item and * item)', () => {
      expect(hasMarkdownSyntax('- First item')).toBe(true);
      expect(hasMarkdownSyntax('* Second item')).toBe(true);
    });

    it('detects numbered lists (1. item)', () => {
      expect(hasMarkdownSyntax('1. First step\n2. Second step')).toBe(true);
    });

    it('detects headings, bold, code, blockquotes', () => {
      expect(hasMarkdownSyntax('# Heading 1')).toBe(true);
      expect(hasMarkdownSyntax('**bold text**')).toBe(true);
      expect(hasMarkdownSyntax('`inline code`')).toBe(true);
      expect(hasMarkdownSyntax('> Blockquote')).toBe(true);
    });

    it('returns false for plain unstructured text', () => {
      expect(hasMarkdownSyntax('Just plain text without markdown')).toBe(false);
      expect(hasMarkdownSyntax('')).toBe(false);
      expect(hasMarkdownSyntax(null)).toBe(false);
    });
  });

  describe('markdownToHtml', () => {
    it('converts markdown checklists to TipTap-compatible taskList HTML', () => {
      const md = '- [ ] Task pending\n- [x] Task completed';
      const html = markdownToHtml(md);

      expect(html).toContain('data-type="taskList"');
      expect(html).toContain('data-type="taskItem"');
      expect(html).toContain('data-checked="false"');
      expect(html).toContain('data-checked="true"');
      expect(html).toContain('Task pending');
      expect(html).toContain('Task completed');
    });

    it('converts bullet lists to <ul><li>', () => {
      const md = '- Item 1\n- Item 2';
      const html = markdownToHtml(md);

      expect(html).toContain('<ul><li>Item 1</li><li>Item 2</li></ul>');
    });

    it('converts numbered lists to <ol><li>', () => {
      const md = '1. Step A\n2. Step B';
      const html = markdownToHtml(md);

      expect(html).toContain('<ol><li>Step A</li><li>Step B</li></ol>');
    });
  });

  describe('htmlToMarkdown', () => {
    it('accurately preserves task text from TipTap taskList HTML', () => {
      const tiptapHtml = `
        <ul data-type="taskList">
          <li data-checked="false" data-type="taskItem">
            <label><input type="checkbox"><span></span></label>
            <div><p>Buy organic milk</p></div>
          </li>
          <li data-checked="true" data-type="taskItem">
            <label><input type="checkbox" checked><span></span></label>
            <div><p>Call electrician</p></div>
          </li>
        </ul>
      `;

      const md = htmlToMarkdown(tiptapHtml);
      expect(md).toContain('- [ ] Buy organic milk');
      expect(md).toContain('- [x] Call electrician');
    });

    it('converts ordered list <ol> to numbered markdown lines', () => {
      const olHtml = '<ol><li>First</li><li>Second</li><li>Third</li></ol>';
      const md = htmlToMarkdown(olHtml);

      expect(md).toContain('1. First');
      expect(md).toContain('2. Second');
      expect(md).toContain('3. Third');
    });

    it('converts bullet list <ul> to dash markdown lines', () => {
      const ulHtml = '<ul><li>Alpha</li><li>Beta</li></ul>';
      const md = htmlToMarkdown(ulHtml);

      expect(md).toContain('- Alpha');
      expect(md).toContain('- Beta');
    });

    it('handles markdown roundtrip without data loss', () => {
      const original = '- [ ] First task\n- [x] Second task';
      const html = markdownToHtml(original);
      const roundtrip = htmlToMarkdown(html);

      expect(roundtrip).toContain('- [ ] First task');
      expect(roundtrip).toContain('- [x] Second task');
    });
  });
});
