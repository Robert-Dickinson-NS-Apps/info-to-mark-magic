import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { FileDown, Trash2, Package } from 'lucide-react';
import { exportToPDF } from '@/utils/pdfExport';
import type { TocItem } from '@/utils/markdownUtils';

export interface SavedScrape {
  id: string;
  url: string;
  markdown: string;
  toc: TocItem[];
  timestamp: Date;
}

interface BatchExportProps {
  scrapes: SavedScrape[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const BatchExport = ({ scrapes, onRemove, onClear }: BatchExportProps) => {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const handleToggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === scrapes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(scrapes.map(s => s.id));
    }
  };

  const handleExportSeparate = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select scrapes to export",
        variant: "destructive",
      });
      return;
    }

    try {
      for (const id of selectedIds) {
        const scrape = scrapes.find(s => s.id === id);
        if (scrape) {
          const urlPart = new URL(scrape.url).hostname.replace(/\./g, '-');
          await exportToPDF({
            markdown: scrape.markdown,
            toc: scrape.toc,
            filename: `${urlPart}-${scrape.id}.pdf`
          });
        }
      }

      toast({
        title: "Success",
        description: `Exported ${selectedIds.length} PDF(s) successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export PDFs",
        variant: "destructive",
      });
    }
  };

  const handleExportCombined = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select scrapes to export",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedScrapes = scrapes.filter(s => selectedIds.includes(s.id));
      
      // Combine all markdown content
      let combinedMarkdown = '# Combined Web Scrape Documentation\n\n';
      combinedMarkdown += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
      combinedMarkdown += '## Table of Contents\n\n';
      
      // Add links to each section
      selectedScrapes.forEach((scrape, idx) => {
        const hostname = new URL(scrape.url).hostname;
        combinedMarkdown += `${idx + 1}. [${hostname}](#section-${idx + 1})\n`;
      });
      
      combinedMarkdown += '\n---\n\n';

      // Add each scrape as a section
      selectedScrapes.forEach((scrape, idx) => {
        combinedMarkdown += `# Section ${idx + 1}: ${scrape.url} {#section-${idx + 1}}\n\n`;
        combinedMarkdown += scrape.markdown;
        combinedMarkdown += '\n\n---\n\n';
      });

      // Generate combined TOC
      const combinedToc: TocItem[] = [];
      selectedScrapes.forEach((scrape, idx) => {
        combinedToc.push({
          id: `section-${idx + 1}`,
          text: `Section ${idx + 1}: ${new URL(scrape.url).hostname}`,
          level: 1
        });
        scrape.toc.forEach(item => {
          combinedToc.push({
            ...item,
            level: item.level + 1
          });
        });
      });

      await exportToPDF({
        markdown: combinedMarkdown,
        toc: combinedToc,
        filename: 'combined-scrapes.pdf'
      });

      toast({
        title: "Success",
        description: "Combined PDF exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export combined PDF",
        variant: "destructive",
      });
    }
  };

  if (scrapes.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No saved scrapes yet. Start scraping to build your batch.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Batch Export ({scrapes.length} scrapes)
        </h3>
        <div className="flex gap-2">
          <Button onClick={handleSelectAll} variant="outline" size="sm">
            {selectedIds.length === scrapes.length ? 'Deselect All' : 'Select All'}
          </Button>
          <Button onClick={onClear} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-auto">
        {scrapes.map((scrape) => (
          <div
            key={scrape.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex items-center gap-3 flex-1">
              <Checkbox
                checked={selectedIds.includes(scrape.id)}
                onCheckedChange={() => handleToggle(scrape.id)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {new URL(scrape.url).hostname}
                </p>
                <p className="text-xs text-muted-foreground">
                  {scrape.timestamp.toLocaleString()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(scrape.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-4 border-t border-border">
        <Button
          onClick={handleExportSeparate}
          disabled={selectedIds.length === 0}
          className="flex-1"
          variant="outline"
        >
          <FileDown className="h-4 w-4 mr-2" />
          Export Separate ({selectedIds.length})
        </Button>
        <Button
          onClick={handleExportCombined}
          disabled={selectedIds.length === 0}
          className="flex-1"
        >
          <Package className="h-4 w-4 mr-2" />
          Combine & Export ({selectedIds.length})
        </Button>
      </div>
    </Card>
  );
};
