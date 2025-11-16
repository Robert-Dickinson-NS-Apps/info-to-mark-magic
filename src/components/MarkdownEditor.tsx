import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownPreview } from './MarkdownPreview';
import { Edit, Eye, Columns } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface MarkdownEditorProps {
  initialContent: string;
  onContentChange: (content: string) => void;
}

export const MarkdownEditor = ({ initialContent, onContentChange }: MarkdownEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');

  const handleChange = (newContent: string) => {
    setContent(newContent);
    onContentChange(newContent);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">Markdown Editor</h3>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'edit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('edit')}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant={viewMode === 'split' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('split')}
          >
            <Columns className="h-4 w-4 mr-1" />
            Split
          </Button>
          <Button
            variant={viewMode === 'preview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('preview')}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        {viewMode === 'split' && (
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="p-4 bg-muted/30">
              <Textarea
                value={content}
                onChange={(e) => handleChange(e.target.value)}
                className="min-h-[500px] font-mono text-sm resize-none border-0 bg-transparent focus-visible:ring-0"
                placeholder="Edit your markdown here..."
              />
            </div>
            <div className="p-4 overflow-auto max-h-[500px]">
              <MarkdownPreview content={content} />
            </div>
          </div>
        )}

        {viewMode === 'edit' && (
          <div className="p-4 bg-muted/30">
            <Textarea
              value={content}
              onChange={(e) => handleChange(e.target.value)}
              className="min-h-[500px] font-mono text-sm resize-none border-0 bg-transparent focus-visible:ring-0"
              placeholder="Edit your markdown here..."
            />
          </div>
        )}

        {viewMode === 'preview' && (
          <div className="p-4 overflow-auto max-h-[500px]">
            <MarkdownPreview content={content} />
          </div>
        )}
      </div>
    </Card>
  );
};
