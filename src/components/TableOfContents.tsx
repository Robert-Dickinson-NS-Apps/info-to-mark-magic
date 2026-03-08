import { useMemo, useState } from 'react';
import { ChevronRight, List, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateTableOfContents, TocItem } from '@/utils/markdownUtils';

interface TableOfContentsProps {
  markdown: string;
  onNavigate?: (heading: TocItem) => void;
}

export const TableOfContents = ({ markdown, onNavigate }: TableOfContentsProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const tocItems = useMemo(() => {
    // Also include H1 headings
    const lines = markdown.split('\n');
    const items: TocItem[] = [];
    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        items.push({ id, text, level });
      }
    }
    return items;
  }, [markdown]);

  if (tocItems.length === 0) return null;

  const handleClick = (item: TocItem) => {
    setActiveId(item.id);
    onNavigate?.(item);
  };

  const minLevel = Math.min(...tocItems.map(i => i.level));

  return (
    <div className={cn(
      "transition-all duration-300 ease-in-out border-r border-border bg-card/80 backdrop-blur-sm",
      isOpen ? "w-64 min-w-[16rem]" : "w-10 min-w-[2.5rem]"
    )}>
      <div className="flex items-center justify-between p-2 border-b border-border">
        {isOpen && (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Contents
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {isOpen && (
        <ScrollArea className="h-[calc(100%-2.5rem)]">
          <nav className="p-2 space-y-0.5">
            {tocItems.map((item, index) => (
              <button
                key={`${item.id}-${index}`}
                onClick={() => handleClick(item)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground truncate block",
                  activeId === item.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground",
                  item.level === 1 && "font-semibold text-foreground",
                )}
                style={{ paddingLeft: `${(item.level - minLevel) * 12 + 8}px` }}
                title={item.text}
              >
                {item.level > minLevel && (
                  <ChevronRight className="inline h-3 w-3 mr-1 opacity-40" />
                )}
                {item.text}
              </button>
            ))}
          </nav>
        </ScrollArea>
      )}
    </div>
  );
};
