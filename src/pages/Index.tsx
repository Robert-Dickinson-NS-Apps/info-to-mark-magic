import { ScraperForm } from '@/components/ScraperForm';
import { ThemeToggle } from '@/components/ThemeToggle';

const Index = () => {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <ScraperForm />
    </div>
  );
};

export default Index;
