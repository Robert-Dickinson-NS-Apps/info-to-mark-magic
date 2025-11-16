import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownPreview, SyntaxTheme } from './MarkdownPreview';
import { Edit, Eye, Columns, Palette } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MarkdownEditorProps {
  initialContent: string;
  onContentChange: (content: string) => void;
}

const themes: { value: SyntaxTheme; label: string }[] = [
  { value: 'vscDarkPlus', label: 'VS Code Dark+' },
  { value: 'oneDark', label: 'One Dark' },
  { value: 'atomDark', label: 'Atom Dark' },
  { value: 'nightOwl', label: 'Night Owl' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'vs', label: 'VS Light' },
];

export const MarkdownEditor = ({ initialContent, onContentChange }: MarkdownEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [syntaxTheme, setSyntaxTheme] = useState<SyntaxTheme>('vscDarkPlus');

  const handleChange = (newContent: string) => {
    setContent(newContent);
    onContentChange(newContent);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">Markdown Editor</h3>
        <div className="flex gap-2 items-center">
          <Select value={syntaxTheme} onValueChange={(value) => setSyntaxTheme(value as SyntaxTheme)}>
            <SelectTrigger className="w-[180px] h-9">
              <Palette className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              {themes.map((theme) => (
                <SelectItem key={theme.value} value={theme.value}>
                  {theme.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <MarkdownPreview content={content} theme={syntaxTheme} />
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
            <MarkdownPreview content={content} theme={syntaxTheme} />
          </div>
        )}
      </div>
    </Card>
  );
};
