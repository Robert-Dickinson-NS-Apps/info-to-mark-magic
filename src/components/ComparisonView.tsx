import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Highlighter } from 'lucide-react';
import { CodeViewerWithLineNumbers } from './CodeViewerWithLineNumbers';
import CodeEditor from '@uiw/react-textarea-code-editor';

interface ComparisonViewProps {
  sourceHtml: string;
  markdown: string;
  onMarkdownChange: (value: string) => void;
}

export const ComparisonView = ({ sourceHtml, markdown, onMarkdownChange }: ComparisonViewProps) => {
  const [highlightMode, setHighlightMode] = useState(false);
  const [selectedHtmlRange, setSelectedHtmlRange] = useState<{ start: number; end: number } | null>(null);
  const [selectedMdRange, setSelectedMdRange] = useState<{ start: number; end: number } | null>(null);

  // Find text in markdown that corresponds to HTML selection
  const findCorrespondingMarkdown = (htmlText: string) => {
    // Clean the HTML text (remove tags, normalize whitespace)
    const cleanText = htmlText
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    if (cleanText.length < 5) return null;

    // Search for similar text in markdown
    const mdLower = markdown.toLowerCase();
    const words = cleanText.split(' ').filter(w => w.length > 3);
    
    // Try to find a section with most matching words
    let bestMatch = { start: -1, end: -1, score: 0 };
    
    for (let i = 0; i < mdLower.length - 20; i++) {
      let score = 0;
      const window = mdLower.substring(i, Math.min(i + cleanText.length * 2, mdLower.length));
      
      for (const word of words) {
        if (window.includes(word)) score++;
      }
      
      if (score > bestMatch.score && score >= words.length * 0.4) {
        bestMatch = {
          start: i,
          end: Math.min(i + cleanText.length * 2, mdLower.length),
          score
        };
      }
    }
    
    return bestMatch.score > 0 ? { start: bestMatch.start, end: bestMatch.end } : null;
  };

  // Find HTML that corresponds to markdown selection
  const findCorrespondingHtml = (mdText: string) => {
    const cleanMdText = mdText
      .replace(/[#*_`\[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    if (cleanMdText.length < 5) return null;

    const htmlLower = sourceHtml.toLowerCase();
    const words = cleanMdText.split(' ').filter(w => w.length > 3);
    
    let bestMatch = { start: -1, end: -1, score: 0 };
    
    for (let i = 0; i < htmlLower.length - 20; i++) {
      let score = 0;
      const window = htmlLower.substring(i, Math.min(i + cleanMdText.length * 3, htmlLower.length));
      
      for (const word of words) {
        if (window.includes(word)) score++;
      }
      
      if (score > bestMatch.score && score >= words.length * 0.4) {
        bestMatch = {
          start: i,
          end: Math.min(i + cleanMdText.length * 3, htmlLower.length),
          score
        };
      }
    }
    
    return bestMatch.score > 0 ? { start: bestMatch.start, end: bestMatch.end } : null;
  };

  const handleHtmlSelection = () => {
    if (!highlightMode) return;
    
    const selection = window.getSelection();
    const selectedText = selection?.toString();
    
    if (selectedText && selectedText.length > 5) {
      const range = findCorrespondingMarkdown(selectedText);
      if (range) {
        setSelectedMdRange(range);
        // Highlight in editor
        setTimeout(() => {
          const editor = document.querySelector('[data-color-mode="dark"] textarea') as HTMLTextAreaElement;
          if (editor) {
            editor.focus();
            editor.setSelectionRange(range.start, range.end);
            editor.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  };

  const handleMarkdownSelection = () => {
    if (!highlightMode) return;
    
    const editor = document.querySelector('[data-color-mode="dark"] textarea') as HTMLTextAreaElement;
    if (editor) {
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const selectedText = markdown.substring(start, end);
      
      if (selectedText.length > 5) {
        const range = findCorrespondingHtml(selectedText);
        if (range) {
          setSelectedHtmlRange(range);
        }
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-sm font-medium text-foreground">HTML to Markdown Comparison</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {highlightMode 
              ? "Select text in one panel to highlight the corresponding section in the other"
              : "Side-by-side view of original HTML and converted markdown"
            }
          </p>
        </div>
        <Button
          variant={highlightMode ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setHighlightMode(!highlightMode);
            setSelectedHtmlRange(null);
            setSelectedMdRange(null);
          }}
        >
          <Highlighter className="h-4 w-4 mr-2" />
          {highlightMode ? "Highlighting Active" : "Enable Highlighting"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-2">
            <p className="text-xs font-medium text-muted-foreground">
              Original HTML {highlightMode && "(Click & select text to highlight)"}
            </p>
          </div>
          <div 
            className={`max-h-[600px] overflow-auto ${highlightMode ? 'cursor-text' : ''}`}
            onMouseUp={handleHtmlSelection}
          >
            {sourceHtml ? (
              <div className={selectedHtmlRange ? 'relative' : ''}>
                <CodeViewerWithLineNumbers code={sourceHtml} language="html" />
                {selectedHtmlRange && (
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(transparent ${selectedHtmlRange.start / sourceHtml.length * 100}%, rgba(var(--primary) / 0.2) ${selectedHtmlRange.start / sourceHtml.length * 100}%, rgba(var(--primary) / 0.2) ${selectedHtmlRange.end / sourceHtml.length * 100}%, transparent ${selectedHtmlRange.end / sourceHtml.length * 100}%)`
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="border border-border rounded-lg p-8 bg-muted/30 text-center text-muted-foreground text-sm">
                No HTML source available
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="mb-2">
            <p className="text-xs font-medium text-muted-foreground">
              Converted Markdown {highlightMode && "(Select text to find in HTML)"}
            </p>
          </div>
          <div 
            className="border border-border rounded-lg overflow-hidden bg-muted/30 max-h-[600px] overflow-auto"
            onMouseUp={handleMarkdownSelection}
          >
            <CodeEditor
              value={markdown}
              language="markdown"
              placeholder="Converted markdown..."
              onChange={(e) => onMarkdownChange(e.target.value)}
              padding={15}
              data-color-mode="dark"
              style={{
                fontSize: 13,
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                minHeight: '600px',
              }}
            />
          </div>
        </div>
      </div>
      {highlightMode && (selectedHtmlRange || selectedMdRange) && (
        <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Tip:</span> Highlighted sections show the approximate correspondence between HTML and Markdown. 
            The matching algorithm looks for similar text content across both formats.
          </p>
        </div>
      )}
    </div>
  );
};
