import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const WorkflowDiagram = () => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true, 
      theme: 'default',
      themeVariables: {
        primaryColor: '#4A90E2',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#4A90E2',
        lineColor: '#A0AEC0',
        secondaryColor: '#E2E8F0',
        tertiaryColor: '#E2E8F0',
      }
    });

    if (mermaidRef.current) {
      mermaid.contentLoaded();
    }
  }, []);

  const diagram = `
    graph TD
      A[Start] --> B{Choose Input Method}
      B -->|Manual Paste| C[Paste HTML Content]
      B -->|Fetch URL| D[Enter Website URL]
      D --> E[Fetch HTML]
      E --> C
      C --> F{Add Section Title?}
      F -->|Yes| G[Enter Section Title]
      F -->|No| H[Convert to Markdown]
      G --> H
      H --> I[Content Accumulated]
      I --> J{Add More Pages?}
      J -->|Yes| B
      J -->|No| K[Preview & Edit]
      K --> L{Export Options}
      L -->|PDF| M[Export as PDF]
      L -->|HTML| N[Export as HTML]
      L -->|XML| O[Export as XML]
      M --> P[Done]
      N --> P
      O --> P
      
      style A fill:hsl(var(--primary)),stroke:hsl(var(--primary)),color:#fff
      style P fill:hsl(var(--primary)),stroke:hsl(var(--primary)),color:#fff
      style I fill:hsl(var(--accent)),stroke:hsl(var(--accent))
  `;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>
                Follow this workflow to convert multiple pages into a single markdown document
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div ref={mermaidRef} className="mermaid bg-background p-4 rounded-md overflow-x-auto">
              {diagram}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
