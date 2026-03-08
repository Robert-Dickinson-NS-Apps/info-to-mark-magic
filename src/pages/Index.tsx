import { ScraperForm } from '@/components/ScraperForm';
import { ThemeToggle } from '@/components/ThemeToggle';
import { WorkflowDiagram } from '@/components/WorkflowDiagram';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/docs')}>
          <FileText className="h-4 w-4 mr-1" />
          Docs
        </Button>
        <ThemeToggle />
      </div>
      <div className="container mx-auto px-4 max-w-7xl">
        <WorkflowDiagram />
        <ScraperForm />
      </div>
    </div>
  );
};

export default Index;
