import type { TocItem } from './markdownUtils';

interface HTMLExportOptions {
  markdown: string;
  toc: TocItem[];
  filename?: string;
  theme?: 'light' | 'dark';
}

const getInlineStyles = (theme: 'light' | 'dark') => {
  const isDark = theme === 'dark';
  
  return `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: ${isDark ? '#e4e4e7' : '#18181b'};
        background-color: ${isDark ? '#09090b' : '#ffffff'};
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem;
      }
      
      h1, h2, h3, h4, h5, h6 {
        margin-top: 2rem;
        margin-bottom: 1rem;
        font-weight: 600;
        line-height: 1.25;
      }
      
      h1 {
        font-size: 2.5rem;
        border-bottom: 2px solid ${isDark ? '#27272a' : '#e4e4e7'};
        padding-bottom: 0.5rem;
      }
      
      h2 {
        font-size: 2rem;
        border-bottom: 1px solid ${isDark ? '#27272a' : '#e4e4e7'};
        padding-bottom: 0.3rem;
      }
      
      h3 {
        font-size: 1.5rem;
      }
      
      h4 {
        font-size: 1.25rem;
      }
      
      p {
        margin-bottom: 1rem;
      }
      
      a {
        color: ${isDark ? '#60a5fa' : '#2563eb'};
        text-decoration: underline;
      }
      
      a:hover {
        color: ${isDark ? '#93c5fd' : '#1d4ed8'};
      }
      
      code {
        background-color: ${isDark ? '#27272a' : '#f4f4f5'};
        padding: 0.2rem 0.4rem;
        border-radius: 0.25rem;
        font-size: 0.875rem;
        font-family: 'Courier New', monospace;
      }
      
      pre {
        background-color: ${isDark ? '#18181b' : '#f9fafb'};
        border: 1px solid ${isDark ? '#27272a' : '#e5e7eb'};
        border-radius: 0.5rem;
        padding: 1rem;
        overflow-x: auto;
        margin-bottom: 1rem;
      }
      
      pre code {
        background-color: transparent;
        padding: 0;
      }
      
      blockquote {
        border-left: 4px solid ${isDark ? '#60a5fa' : '#2563eb'};
        padding-left: 1rem;
        margin: 1rem 0;
        color: ${isDark ? '#a1a1aa' : '#71717a'};
        font-style: italic;
      }
      
      ul, ol {
        margin-bottom: 1rem;
        padding-left: 2rem;
      }
      
      li {
        margin-bottom: 0.5rem;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1rem;
        border: 1px solid ${isDark ? '#27272a' : '#e4e4e7'};
      }
      
      th, td {
        padding: 0.75rem;
        text-align: left;
        border: 1px solid ${isDark ? '#27272a' : '#e4e4e7'};
      }
      
      th {
        background-color: ${isDark ? '#18181b' : '#f4f4f5'};
        font-weight: 600;
      }
      
      hr {
        border: none;
        border-top: 2px solid ${isDark ? '#27272a' : '#e4e4e7'};
        margin: 2rem 0;
      }
      
      img {
        max-width: 100%;
        height: auto;
        border-radius: 0.5rem;
        margin: 1rem 0;
      }
      
      .toc {
        background-color: ${isDark ? '#18181b' : '#f9fafb'};
        border: 1px solid ${isDark ? '#27272a' : '#e5e7eb'};
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin: 2rem 0;
      }
      
      .toc h2 {
        margin-top: 0;
        border-bottom: none;
        font-size: 1.5rem;
      }
      
      .toc ul {
        list-style: none;
        padding-left: 0;
      }
      
      .toc li {
        margin-bottom: 0.5rem;
      }
      
      .toc a {
        text-decoration: none;
        color: ${isDark ? '#e4e4e7' : '#18181b'};
      }
      
      .toc a:hover {
        color: ${isDark ? '#60a5fa' : '#2563eb'};
      }
      
      .header {
        text-align: center;
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 2px solid ${isDark ? '#27272a' : '#e4e4e7'};
      }
      
      .header h1 {
        border-bottom: none;
        margin-bottom: 0.5rem;
      }
      
      .header .date {
        color: ${isDark ? '#71717a' : '#a1a1aa'};
        font-size: 0.875rem;
      }
      
      .toc-level-2 { padding-left: 0; }
      .toc-level-3 { padding-left: 1rem; }
      .toc-level-4 { padding-left: 2rem; }
      .toc-level-5 { padding-left: 3rem; }
      .toc-level-6 { padding-left: 4rem; }
      
      @media print {
        body {
          background-color: white;
          color: black;
        }
        
        a {
          color: #2563eb;
        }
      }
    </style>
  `;
};

const markdownToHTML = (markdown: string): string => {
  let html = markdown;
  
  // Convert headings with anchors
  html = html.replace(/^(#{1,6})\s+(.+?)\s*\{#([^}]+)\}\s*$/gm, (_, hashes, text, id) => {
    const level = hashes.length;
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
  
  // Convert regular headings
  html = html.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, text) => {
    const level = hashes.length;
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
  
  // Convert horizontal rules
  html = html.replace(/^(---|\*\*\*)$/gm, '<hr>');
  
  // Convert bold text
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Convert italic text
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Convert code blocks
  html = html.replace(/```(\w+)?\n([\s\S]+?)```/g, (_, lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });
  
  // Convert inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Convert images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  
  // Convert blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  
  // Convert unordered lists
  html = html.replace(/^\*\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/^-\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>');
  
  // Convert ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  
  // Convert paragraphs
  html = html.split('\n\n').map(paragraph => {
    paragraph = paragraph.trim();
    if (!paragraph) return '';
    if (paragraph.startsWith('<h') || paragraph.startsWith('<ul') || 
        paragraph.startsWith('<ol') || paragraph.startsWith('<pre') ||
        paragraph.startsWith('<blockquote') || paragraph.startsWith('<hr') ||
        paragraph.startsWith('<img')) {
      return paragraph;
    }
    return `<p>${paragraph}</p>`;
  }).join('\n');
  
  return html;
};

const generateTOCHTML = (toc: TocItem[]): string => {
  if (toc.length === 0) return '';
  
  let tocHTML = '<div class="toc"><h2>Table of Contents</h2><ul>';
  
  for (const item of toc) {
    tocHTML += `<li class="toc-level-${item.level}"><a href="#${item.id}">${item.text}</a></li>`;
  }
  
  tocHTML += '</ul></div>';
  return tocHTML;
};

export const exportToHTML = ({ markdown, toc, filename = 'scraped-content.html', theme = 'light' }: HTMLExportOptions) => {
  const date = new Date().toLocaleDateString();
  const tocHTML = generateTOCHTML(toc);
  const contentHTML = markdownToHTML(markdown);
  
  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="Web Scraper">
  <title>Web Scrape Documentation</title>
  ${getInlineStyles(theme)}
</head>
<body>
  <div class="header">
    <h1>Web Scrape Documentation</h1>
    <p class="date">Generated on: ${date}</p>
  </div>
  
  ${tocHTML}
  
  <div class="content">
    ${contentHTML}
  </div>
</body>
</html>`;
  
  // Create blob and download
  const blob = new Blob([fullHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
