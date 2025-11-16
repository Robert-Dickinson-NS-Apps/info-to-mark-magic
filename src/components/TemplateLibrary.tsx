import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileText, BookOpen, Code2, FileCode } from 'lucide-react';
import { markdownTemplates, type MarkdownTemplate } from '@/utils/markdownTemplates';
import { useToast } from '@/hooks/use-toast';

interface TemplateLibraryProps {
  onApplyTemplate: (template: MarkdownTemplate) => void;
}

export const TemplateLibrary = ({ onApplyTemplate }: TemplateLibraryProps) => {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MarkdownTemplate | null>(null);
  const { toast } = useToast();

  const handleApplyTemplate = (template: MarkdownTemplate) => {
    onApplyTemplate(template);
    setOpen(false);
    toast({
      title: "Template Applied",
      description: `${template.name} template has been applied successfully`,
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'documentation':
        return <BookOpen className="h-4 w-4" />;
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'technical':
        return <Code2 className="h-4 w-4" />;
      case 'api':
        return <FileCode className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const TemplateCard = ({ template }: { template: MarkdownTemplate }) => (
    <Card 
      className="p-4 cursor-pointer hover:border-primary transition-colors"
      onClick={() => setSelectedTemplate(template)}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          {getCategoryIcon(template.category)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-foreground">{template.name}</h4>
            <Badge variant="outline" className="text-xs">
              {template.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Markdown Templates</DialogTitle>
          <DialogDescription>
            Choose a pre-built template to structure your scraped content
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="documentation">Docs</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {markdownTemplates.map(template => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {['documentation', 'blog', 'technical', 'api'].map(category => (
            <TabsContent key={category} value={category} className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {markdownTemplates
                    .filter(t => t.category === category)
                    .map(template => (
                      <TemplateCard key={template.id} template={template} />
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        {selectedTemplate && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Selected: {selectedTemplate.name}</h4>
              <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleApplyTemplate(selectedTemplate)} className="flex-1">
                Apply Template
              </Button>
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
