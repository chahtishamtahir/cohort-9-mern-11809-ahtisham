/**
 * Markdown & Rich Text Formatting Utilities
 * Parses markdown syntax (headings, bold, italic, code, quotes, lists, checklists)
 * into rich HTML or formatted preview nodes.
 */

/**
 * Checks whether a text string contains Markdown syntax indicators
 */
export function hasMarkdownSyntax(text) {
  if (!text || typeof text !== 'string') return false;
  // Match markdown headers (# ), bold (** or __), inline code (`), blockquotes (> ), checklists (- [ ]), bullet lists (- item or * item), numbered lists (1. item), or horizontal rules (---)
  return /(?:^|\n)\s*#{1,6}\s+|(?:^|[^*])\*\*[^*]+\*\*|(?:^|[^_])__[^_]+__|(?:^|[^`])`[^`\n]+`|(?:^|\n)\s*>\s+|(?:^|\n)\s*[-*]\s+\[[ xX]\]|(?:^|\n)\s*[-*]\s+\S+|(?:^|\n)\s*\d+\.\s+\S+|(?:^|\n)\s*[-*_]{3,}\s*(?:\n|$)/m.test(text);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats inline markdown tags:
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Code: `code`
 * - Strikethrough: ~~text~~
 */
export function formatInlineMarkdown(str) {
  if (!str) return '';
  let result = String(str);

  // Inline code: `code` (protect code from being parsed by bold/italic)
  const codeSnippets = [];
  result = result.replace(/`([^`\n]+)`/g, (_match, code) => {
    codeSnippets.push(code);
    return `@@CODESNIPPET${codeSnippets.length - 1}@@`;
  });

  // Bold: **text** or __text__
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_ (single asterisks/underscores not part of words)
  result = result.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  result = result.replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>');

  // Strikethrough: ~~text~~
  result = result.replace(/~~([^~]+)~~/g, '<s>$1</s>');

  // Restore code snippets as styled HTML code tags
  result = result.replace(/@@CODESNIPPET(\d+)@@/g, (_match, index) => {
    return `<code class="inline-code">${escapeHtml(codeSnippets[Number(index)])}</code>`;
  });

  return result;
}

/**
 * Converts Markdown text into clean HTML
 */
export function markdownToHtml(input) {
  if (!input) return '<p><br></p>';

  let text = String(input);

  // If text is already wrapped in <p> tags with embedded markdown, unwrap for clean processing
  const hasParagraphWrappers = /<p[^>]*>[\s\S]*?<\/p>/i.test(text);
  if (hasParagraphWrappers && hasMarkdownSyntax(text)) {
    text = text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n');
  }

  const lines = text.split(/\r?\n/);
  const htmlBlocks = [];
  let inCodeBlock = false;
  let codeBlockLines = [];
  let currentList = null; // 'ul' | 'ol' | 'task'

  const flushList = () => {
    if (currentList) {
      if (currentList === 'task') {
        htmlBlocks.push('</ul>');
      } else {
        htmlBlocks.push(`</${currentList}>`);
      }
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      flushList();
      if (inCodeBlock) {
        htmlBlocks.push(`<pre><code>${escapeHtml(codeBlockLines.join('\n'))}</code></pre>`);
        inCodeBlock = false;
        codeBlockLines = [];
      } else {
        inCodeBlock = true;
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Empty lines
    if (!trimmed) {
      flushList();
      continue;
    }

    // Blockquote: > quote
    if (trimmed.startsWith('>')) {
      flushList();
      const quoteText = trimmed.replace(/^>\s*/, '');
      htmlBlocks.push(`<blockquote><p>${formatInlineMarkdown(quoteText)}</p></blockquote>`);
      continue;
    }

    // Headings: # Heading
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const headingTag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
      htmlBlocks.push(`<${headingTag}>${formatInlineMarkdown(headingMatch[2])}</${headingTag}>`);
      continue;
    }

    // Task list / checklist: - [ ] Task or - [x] Task
    const taskMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      if (currentList !== 'task') {
        flushList();
        htmlBlocks.push('<ul class="task-list" data-type="taskList">');
        currentList = 'task';
      }
      const isChecked = taskMatch[1].toLowerCase() === 'x';
      htmlBlocks.push(
        `<li class="task-item${isChecked ? ' task-completed' : ''}" data-type="taskItem" data-checked="${isChecked ? 'true' : 'false'}"><label><input type="checkbox" ${isChecked ? 'checked' : ''} /><span></span></label><div><p>${formatInlineMarkdown(taskMatch[2])}</p></div></li>`
      );
      continue;
    }

    // Bullet list: - item or * item
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (currentList !== 'ul') {
        flushList();
        htmlBlocks.push('<ul>');
        currentList = 'ul';
      }
      htmlBlocks.push(`<li>${formatInlineMarkdown(bulletMatch[1])}</li>`);
      continue;
    }

    // Numbered list: 1. item
    const numMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numMatch) {
      if (currentList !== 'ol') {
        flushList();
        htmlBlocks.push('<ol>');
        currentList = 'ol';
      }
      htmlBlocks.push(`<li>${formatInlineMarkdown(numMatch[1])}</li>`);
      continue;
    }

    // Horizontal rule
    if (/^([-*_]){3,}$/.test(trimmed)) {
      flushList();
      htmlBlocks.push('<hr />');
      continue;
    }

    // Standard paragraph
    flushList();
    htmlBlocks.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
  }

  flushList();
  if (inCodeBlock) {
    htmlBlocks.push(`<pre><code>${escapeHtml(codeBlockLines.join('\n'))}</code></pre>`);
  }

  return htmlBlocks.join('') || '<p><br></p>';
}

/**
 * Converts HTML content into clean Markdown format
 */
export function htmlToMarkdown(html) {
  if (!html) return '';

  // If there are no HTML tags, return clean trimmed text
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html.trim();
  }

  // Use DOMParser if available in environment
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        const children = Array.from(node.childNodes).map(processNode).join('');

        if (['strong', 'b'].includes(tag)) {
          const trimmed = children.trim();
          return trimmed ? `**${trimmed}**` : '';
        }
        if (['em', 'i'].includes(tag)) {
          const trimmed = children.trim();
          return trimmed ? `*${trimmed}*` : '';
        }
        if (['u'].includes(tag)) {
          const trimmed = children.trim();
          return trimmed ? `_${trimmed}_` : '';
        }
        if (['s', 'strike', 'del'].includes(tag)) {
          const trimmed = children.trim();
          return trimmed ? `~~${trimmed}~~` : '';
        }
        if (tag === 'code') {
          if (node.parentNode && node.parentNode.tagName.toLowerCase() === 'pre') {
            return children;
          }
          const trimmed = children.trim();
          return trimmed ? `\`${trimmed}\`` : '';
        }
        if (tag === 'pre') {
          return `\n\`\`\`\n${children.trim()}\n\`\`\`\n\n`;
        }
        if (tag === 'h1') {
          return `\n# ${children.trim()}\n\n`;
        }
        if (tag === 'h2') {
          return `\n## ${children.trim()}\n\n`;
        }
        if (tag === 'h3') {
          return `\n### ${children.trim()}\n\n`;
        }
        if (['h4', 'h5', 'h6'].includes(tag)) {
          return `\n#### ${children.trim()}\n\n`;
        }
        if (tag === 'blockquote') {
          return `\n> ${children.trim().replace(/\n/g, '\n> ')}\n\n`;
        }
        if (tag === 'li') {
          const checkbox = node.querySelector('input[type="checkbox"]');
          const isTaskItem = Boolean(
            checkbox ||
            node.getAttribute('data-type') === 'taskItem' ||
            node.classList.contains('task-item')
          );

          if (isTaskItem) {
            const isChecked = checkbox
              ? (checkbox.checked || checkbox.hasAttribute('checked'))
              : (node.getAttribute('data-checked') === 'true' || node.classList.contains('task-completed'));

            let label = '';
            const contentDiv = node.querySelector('div');
            if (contentDiv) {
              label = Array.from(contentDiv.childNodes).map(processNode).join('').trim();
            } else {
              const clone = node.cloneNode(true);
              const labelEl = clone.querySelector('label');
              if (labelEl) labelEl.remove();
              const inputEl = clone.querySelector('input');
              if (inputEl) inputEl.remove();
              label = Array.from(clone.childNodes).map(processNode).join('').trim();
            }
            return `- [${isChecked ? 'x' : ' '}] ${label}\n`;
          }

          const parent = node.parentNode;
          if (parent && parent.tagName && parent.tagName.toLowerCase() === 'ol') {
            const siblings = Array.from(parent.children).filter((el) => el.tagName && el.tagName.toLowerCase() === 'li');
            const index = siblings.indexOf(node) + 1;
            return `${index > 0 ? index : 1}. ${children.trim()}\n`;
          }

          return `- ${children.trim()}\n`;
        }
        if (tag === 'ul' || tag === 'ol') {
          return `\n${children}\n`;
        }
        if (tag === 'p' || tag === 'div') {
          const trimmed = children.trim();
          return trimmed ? `${trimmed}\n\n` : '\n';
        }
        if (tag === 'br') {
          return '\n';
        }
        if (tag === 'hr') {
          return '\n---\n\n';
        }
        return children;
      }
      return '';
    }

    const md = Array.from(doc.body.childNodes).map(processNode).join('');
    return md.replace(/\n{3,}/g, '\n\n').trim();
  } catch {
    // Fallback regex converter
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '\n> $1\n\n')
      .replace(/<li[^>]*data-type="taskItem"[^>]*data-checked="true"[^>]*>[\s\S]*?<p>(.*?)<\/p>[\s\S]*?<\/li>/gi, '- [x] $1\n')
      .replace(/<li[^>]*data-type="taskItem"[^>]*>[\s\S]*?<p>(.*?)<\/p>[\s\S]*?<\/li>/gi, '- [ ] $1\n')
      .replace(/<li[^>]*class="[^"]*task-item[^"]*"[^>]*>[\s\S]*?<input[^>]*checked[^>]*>[\s\S]*?<span>(.*?)<\/span><\/li>/gi, '- [x] $1\n')
      .replace(/<li[^>]*class="[^"]*task-item[^"]*"[^>]*>[\s\S]*?<span>(.*?)<\/span><\/li>/gi, '- [ ] $1\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
