import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DocsSearchProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export const DocsSearch = ({ containerRef }: DocsSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearHighlights = useCallback(() => {
    if (!containerRef.current) return;
    const marks = containerRef.current.querySelectorAll('mark[data-docs-search]');
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });
  }, [containerRef]);

  const highlightMatches = useCallback((searchQuery: string) => {
    clearHighlights();
    if (!searchQuery.trim() || !containerRef.current) {
      setMatchCount(0);
      setCurrentMatch(0);
      return;
    }

    const walker = document.createTreeWalker(
      containerRef.current,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.tagName === 'MARK' || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');
    let totalMatches = 0;

    for (const textNode of textNodes) {
      const text = textNode.textContent || '';
      if (!regex.test(text)) continue;
      regex.lastIndex = 0;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        const mark = document.createElement('mark');
        mark.setAttribute('data-docs-search', '');
        mark.setAttribute('data-match-index', String(totalMatches));
        mark.className = 'bg-primary/30 text-foreground rounded-sm px-0.5';
        mark.textContent = match[0];
        fragment.appendChild(mark);
        totalMatches++;
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      textNode.parentNode?.replaceChild(fragment, textNode);
    }

    setMatchCount(totalMatches);
    setCurrentMatch(totalMatches > 0 ? 1 : 0);

    // Scroll to first match
    if (totalMatches > 0) {
      scrollToMatch(0);
    }
  }, [containerRef, clearHighlights]);

  const scrollToMatch = (index: number) => {
    if (!containerRef.current) return;
    const marks = containerRef.current.querySelectorAll('mark[data-docs-search]');

    // Remove active styling from all
    marks.forEach((m) => {
      m.className = 'bg-primary/30 text-foreground rounded-sm px-0.5';
    });

    if (marks[index]) {
      marks[index].className = 'bg-primary text-primary-foreground rounded-sm px-0.5 ring-2 ring-primary/50';
      marks[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const goToNext = () => {
    if (matchCount === 0) return;
    const next = currentMatch >= matchCount ? 1 : currentMatch + 1;
    setCurrentMatch(next);
    scrollToMatch(next - 1);
  };

  const goToPrev = () => {
    if (matchCount === 0) return;
    const prev = currentMatch <= 1 ? matchCount : currentMatch - 1;
    setCurrentMatch(prev);
    scrollToMatch(prev - 1);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    clearHighlights();
    setMatchCount(0);
    setCurrentMatch(0);
  };

  // Keyboard shortcut: Ctrl/Cmd+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
      if (e.key === 'Enter' && isOpen && matchCount > 0) {
        if (e.shiftKey) goToPrev();
        else goToNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, matchCount, currentMatch]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      highlightMatches(query);
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, highlightMatches]);

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        <Search className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2 py-1 shadow-sm">
      <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search docs..."
        className="h-7 w-48 border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      {query && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {matchCount > 0 ? `${currentMatch}/${matchCount}` : 'No results'}
        </span>
      )}
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goToPrev} disabled={matchCount === 0}>
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={goToNext} disabled={matchCount === 0}>
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
