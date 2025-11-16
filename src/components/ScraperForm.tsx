import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, FileText, Globe, List, FileDown, Save, Code, Clock, ChevronDown, FileJson, FileCode, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { generateTableOfContents, addTocToMarkdown, type TocItem } from '@/utils/markdownUtils';
import { exportToPDF } from '@/utils/pdfExport';
import { exportToHTML } from '@/utils/htmlExport';
import { exportToXmlSitemap } from '@/utils/xmlExport';
import { validateUrlFormat, checkUrlReachability, type UrlCheckResult } from '@/utils/urlValidation';
import { MarkdownPreview } from './MarkdownPreview';
import { MarkdownEditor } from './MarkdownEditor';
import { BatchExport, type SavedScrape } from './BatchExport';
import { TemplateLibrary } from './TemplateLibrary';
import type { MarkdownTemplate } from '@/utils/markdownTemplates';

interface ScrapeStats {
  total: number;
  success: number;
  failed: number;
}

interface ProgressState {
  current: number;
  total: number;
  currentUrl: string;
}

interface DiscoveredUrls {
  urls: string[];
  discoveryMethod: string;
  total: number;
}

const URL_HISTORY_KEY = 'scraper-url-history';
const SAVED_URLS_KEY = 'scraper-saved-urls';
const MAX_HISTORY_ITEMS = 10;

export const ScraperForm = () => {
  const [url, setUrl] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [editedMarkdown, setEditedMarkdown] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSitemap, setUseSitemap] = useState(false);
  const [autoDiscoverLinks, setAutoDiscoverLinks] = useState(false);
  const [maxPages, setMaxPages] = useState(50);
  const [stats, setStats] = useState<ScrapeStats | null>(null);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [addToc, setAddToc] = useState(true);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [savedScrapes, setSavedScrapes] = useState<SavedScrape[]>([]);
  const [urlHistory, setUrlHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [urlValidation, setUrlValidation] = useState<UrlCheckResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [discoveredUrls, setDiscoveredUrls] = useState<DiscoveredUrls | null>(null);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isDiscovering, setIsDiscovering] = useState(false);
  const { toast } = useToast();

  // Load URL history from localStorage on mount
  useState(() => {
    const stored = localStorage.getItem(URL_HISTORY_KEY);
    if (stored) {
      try {
        setUrlHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse URL history:', e);
      }
    }
  });

  const saveToHistory = (scrapedUrl: string) => {
    const updated = [scrapedUrl, ...urlHistory.filter(u => u !== scrapedUrl)].slice(0, MAX_HISTORY_ITEMS);
    setUrlHistory(updated);
    localStorage.setItem(URL_HISTORY_KEY, JSON.stringify(updated));
  };

  const saveDiscoveredUrls = () => {
    if (!discoveredUrls) return;
    
    const saved = {
      baseUrl: url,
      urls: discoveredUrls.urls,
      discoveryMethod: discoveredUrls.discoveryMethod,
      timestamp: new Date().toISOString()
    };
    
    const existing = localStorage.getItem(SAVED_URLS_KEY);
    const savedLists = existing ? JSON.parse(existing) : [];
    savedLists.unshift(saved);
    
    // Keep only last 10 saved lists
    localStorage.setItem(SAVED_URLS_KEY, JSON.stringify(savedLists.slice(0, 10)));
    
    toast({
      title: "URLs Saved",
      description: `Saved ${discoveredUrls.urls.length} URLs for future reference`,
    });
  };

  const handleDiscover = async () => {
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to discover links",
        variant: "destructive",
      });
      return;
    }

    setIsDiscovering(true);
    setDiscoveredUrls(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-to-markdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, useSitemap, autoDiscoverLinks, maxPages, stream: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to discover URLs');
      }

      const data = await response.json();
      setDiscoveredUrls(data);
      setSelectedUrls(new Set(data.urls)); // Select all by default
      
      toast({
        title: "Discovery Complete",
        description: `Found ${data.total} URLs via ${data.discoveryMethod}`,
      });
    } catch (error) {
      console.error('Discovery error:', error);
      toast({
        title: "Discovery Failed",
        description: error instanceof Error ? error.message : "Failed to discover URLs",
        variant: "destructive",
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  // Validate URL when it changes
  useEffect(() => {
    const validateUrl = async () => {
      if (!url.trim()) {
        setUrlValidation(null);
        return;
      }

      // Quick format check
      const formatCheck = validateUrlFormat(url);
      if (!formatCheck.valid) {
        setUrlValidation({
          isValid: false,
          isReachable: false,
          error: formatCheck.error
        });
        return;
      }

      // Debounce the reachability check
      setIsValidating(true);
      const timeoutId = setTimeout(async () => {
        const result = await checkUrlReachability(url);
        setUrlValidation(result);
        setIsValidating(false);
      }, 800);

      return () => {
        clearTimeout(timeoutId);
        setIsValidating(false);
      };
    };

    validateUrl();
  }, [url]);

  const handleScrape = async () => {
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to scrape",
        variant: "destructive",
      });
      return;
    }

    // Check URL validation
    if (urlValidation && !urlValidation.isValid) {
      toast({
        title: "Invalid URL",
        description: urlValidation.error || "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    // Show warning if URL is not reachable but allow scraping
    if (urlValidation && !urlValidation.isReachable && urlValidation.warning) {
      toast({
        title: "Warning",
        description: urlValidation.warning,
      });
    }

    setIsLoading(true);
    setStats(null);
    setProgress(null);
    setToc([]);
    
    try {
      // If using discovery mode with selected URLs
      if ((useSitemap || autoDiscoverLinks) && discoveredUrls && selectedUrls.size > 0) {
        const urlsToScrape = Array.from(selectedUrls);
        
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-to-markdown`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            url, 
            useSitemap: false, 
            autoDiscoverLinks: false, 
            customUrls: urlsToScrape,
            stream: true 
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to scrape websites');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'start') {
                setProgress({ current: 0, total: data.total, currentUrl: '' });
              } else if (data.type === 'progress') {
                setProgress({ current: data.current, total: data.total, currentUrl: data.url });
              } else if (data.type === 'complete') {
                let finalMarkdown = data.markdown;
                
                if (addToc && useSitemap) {
                  const tocItems = generateTableOfContents(finalMarkdown);
                  setToc(tocItems);
                  finalMarkdown = addTocToMarkdown(finalMarkdown, tocItems);
                }
                
                setMarkdown(finalMarkdown);
                setEditedMarkdown(finalMarkdown);
                setStats(data.stats);
                setProgress(null);
                saveToHistory(url);
              }
            }
          }
        }
      } else if (useSitemap || autoDiscoverLinks) {
        // Use streaming for sitemap or auto-discover mode
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-to-markdown`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, useSitemap, autoDiscoverLinks, maxPages, stream: true }),
        });

        if (!response.ok) {
          throw new Error('Failed to scrape website');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'start') {
                setProgress({ current: 0, total: data.total, currentUrl: '' });
              } else if (data.type === 'progress') {
                setProgress({
                  current: data.current,
                  total: data.total,
                  currentUrl: data.url
                });
              } else if (data.type === 'complete') {
                let finalMarkdown = data.markdown;
                
                // Generate and add TOC if enabled
                if (addToc) {
                  const tocItems = generateTableOfContents(finalMarkdown);
                  setToc(tocItems);
                  if (tocItems.length > 0) {
                    finalMarkdown = addTocToMarkdown(finalMarkdown, tocItems);
                  }
                }
                
                setMarkdown(finalMarkdown);
                setEditedMarkdown(finalMarkdown);
                setStats(data.stats);
                setProgress(null);
                saveToHistory(url);
                
                toast({
                  title: "Success",
                  description: `Scraped ${data.stats.success} of ${data.stats.total} pages successfully`,
                });
              }
            }
          }
        }
      } else {
        // Non-streaming single page mode
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-to-markdown`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, useSitemap, maxPages }),
        });

      if (!response.ok) {
        throw new Error('Failed to scrape website');
      }

        const data = await response.json();
        let finalMarkdown = data.markdown;
        
        // Generate and add TOC if enabled
        if (addToc) {
          const tocItems = generateTableOfContents(finalMarkdown);
          setToc(tocItems);
          if (tocItems.length > 0) {
            finalMarkdown = addTocToMarkdown(finalMarkdown, tocItems);
          }
        }
        
        setMarkdown(finalMarkdown);
        setEditedMarkdown(finalMarkdown);
        saveToHistory(url);
        
        if (data.stats) {
          setStats(data.stats);
          toast({
            title: "Success",
            description: `Scraped ${data.stats.success} of ${data.stats.total} pages successfully`,
          });
        } else {
          toast({
            title: "Success",
            description: "Website scraped successfully",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to scrape website",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!editedMarkdown) return;

    const blob = new Blob([editedMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scraped-content.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Markdown file saved successfully",
    });
  };

  const handleDownloadPDF = async () => {
    if (!editedMarkdown) return;

    try {
      await exportToPDF({
        markdown: editedMarkdown,
        toc,
        filename: 'scraped-content.pdf'
      });

      toast({
        title: "Downloaded",
        description: "PDF file saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const handleDownloadHTML = () => {
    if (!editedMarkdown) return;

    try {
      exportToHTML({
        markdown: editedMarkdown,
        toc,
        filename: 'scraped-content.html',
        theme: 'light'
      });

      toast({
        title: "Downloaded",
        description: "HTML file saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate HTML",
        variant: "destructive",
      });
    }
  };

  const handleDownloadJSON = () => {
    if (!editedMarkdown) return;

    try {
      const jsonData = {
        url,
        markdown: editedMarkdown,
        toc,
        stats,
        timestamp: new Date().toISOString(),
        metadata: {
          usedSitemap: useSitemap,
          maxPages: useSitemap ? maxPages : 1,
          addedToc: addToc
        }
      };

      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'scraped-content.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Downloaded",
        description: "JSON file saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate JSON",
        variant: "destructive",
      });
    }
  };

  const handleDownloadXmlSitemap = () => {
    if (!url) return;

    try {
      exportToXmlSitemap({
        url,
        toc,
        filename: 'sitemap.xml',
        priority: 0.8,
        changefreq: 'weekly'
      });

      toast({
        title: "Downloaded",
        description: "XML sitemap saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate XML sitemap",
        variant: "destructive",
      });
    }
  };

  const handleSaveToBatch = () => {
    if (!markdown || !url) return;

    const newScrape: SavedScrape = {
      id: Date.now().toString(),
      url,
      markdown: editedMarkdown,
      toc,
      timestamp: new Date(),
    };

    setSavedScrapes(prev => [...prev, newScrape]);

    toast({
      title: "Saved to Batch",
      description: "Scrape added to batch export queue",
    });
  };

  const handleRemoveScrape = (id: string) => {
    setSavedScrapes(prev => prev.filter(s => s.id !== id));
  };

  const handleClearBatch = () => {
    setSavedScrapes([]);
    toast({
      title: "Cleared",
      description: "All scrapes removed from batch",
    });
  };

  const handleApplyTemplate = (template: MarkdownTemplate) => {
    setEditedMarkdown(template.template);
    toast({
      title: "Template Applied",
      description: `${template.name} template has been applied to your content`,
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <FileText className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">RubyInfoScrapper</h1>
        </div>
        <p className="text-muted-foreground">Convert online help files to markdown format</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">{/* ... keep existing code */}

      <Card className="p-6 space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium text-foreground">
              Website URL
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/help"
                  className="pr-10"
                  disabled={isLoading}
                />
                {urlHistory.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7 w-7 p-0"
                    onClick={() => setShowHistory(!showHistory)}
                    disabled={isLoading}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                )}
                {showHistory && urlHistory.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-border">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Recent URLs
                      </div>
                    </div>
                    <ul className="py-1">
                      {urlHistory.map((historyUrl, index) => (
                        <li key={index}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors truncate"
                            onClick={() => {
                              setUrl(historyUrl);
                              setShowHistory(false);
                            }}
                          >
                            {historyUrl}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <Button onClick={handleScrape} disabled={isLoading || !url || isValidating || ((useSitemap || autoDiscoverLinks) && !discoveredUrls)}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  'Scrape'
                )}
              </Button>
              {(useSitemap || autoDiscoverLinks) && !discoveredUrls && (
                <Button onClick={handleDiscover} disabled={isDiscovering || !url || isValidating} variant="outline">
                  {isDiscovering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Discovering...
                    </>
                  ) : (
                    'Discover URLs'
                  )}
                </Button>
              )}
            </div>
            
            {/* URL Validation Status */}
            {url && (
              <div className="flex items-center gap-2 text-sm animate-fade-in">
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Checking URL...</span>
                  </>
                ) : urlValidation ? (
                  <>
                    {urlValidation.isValid && urlValidation.isReachable ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 dark:text-green-400">URL is accessible</span>
                      </>
                    ) : !urlValidation.isValid ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="text-destructive">{urlValidation.error}</span>
                      </>
                    ) : urlValidation.warning ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-yellow-600 dark:text-yellow-400">{urlValidation.warning}</span>
                      </>
                    ) : null}
                  </>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <div className="space-y-0.5">
                <Label htmlFor="sitemap-mode" className="font-medium">
                  Crawl Entire Sitemap
                </Label>
                <p className="text-xs text-muted-foreground">
                  Scrape all pages in sitemap.xml (falls back to single page if not found)
                </p>
              </div>
            </div>
            <Switch
              id="sitemap-mode"
              checked={useSitemap}
              onCheckedChange={(checked) => {
                setUseSitemap(checked);
                if (checked) setAutoDiscoverLinks(false);
              }}
              disabled={isLoading || autoDiscoverLinks}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <List className="h-5 w-5 text-primary" />
              <div className="space-y-0.5">
                <Label htmlFor="auto-discover-mode" className="font-medium">
                  Auto-Discover Blog Posts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Find and scrape all blog/article links from the page
                </p>
              </div>
            </div>
            <Switch
              id="auto-discover-mode"
              checked={autoDiscoverLinks}
              onCheckedChange={(checked) => {
                setAutoDiscoverLinks(checked);
                if (checked) setUseSitemap(false);
              }}
              disabled={isLoading || useSitemap}
            />
          </div>

          {(useSitemap || autoDiscoverLinks) && (
            <>
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                <Label htmlFor="max-pages" className="text-sm font-medium">
                  Max {autoDiscoverLinks ? 'Links' : 'Pages'} to Scrape: {maxPages}
                </Label>
                <Input
                  id="max-pages"
                  type="number"
                  min="1"
                  max="100"
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value) || 50)}
                  disabled={isLoading}
                />
              </div>

              {useSitemap && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <List className="h-5 w-5 text-primary" />
                    <div className="space-y-0.5">
                      <Label htmlFor="toc-mode" className="font-medium">
                        Generate Table of Contents
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically add navigation links
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="toc-mode"
                    checked={addToc}
                    onCheckedChange={setAddToc}
                    disabled={isLoading}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Discovered URLs Panel */}
        {discoveredUrls && (
          <Card className="p-6 space-y-4 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-foreground">Discovered URLs</h3>
                <p className="text-sm text-muted-foreground">
                  Discovery Method: <span className="font-medium text-primary">{discoveredUrls.discoveryMethod}</span> • Found {discoveredUrls.total} URLs
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveDiscoveredUrls} variant="outline" size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  Save List
                </Button>
                <Button 
                  onClick={() => {
                    setDiscoveredUrls(null);
                    setSelectedUrls(new Set());
                  }} 
                  variant="ghost" 
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium">
                  {selectedUrls.size} of {discoveredUrls.urls.length} URLs selected
                </Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedUrls(new Set(discoveredUrls.urls))}
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedUrls(new Set())}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2 p-4 bg-muted/30 rounded-lg">
                {discoveredUrls.urls.map((discoveredUrl, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded transition-colors">
                    <input
                      type="checkbox"
                      id={`url-${index}`}
                      checked={selectedUrls.has(discoveredUrl)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedUrls);
                        if (e.target.checked) {
                          newSelected.add(discoveredUrl);
                        } else {
                          newSelected.delete(discoveredUrl);
                        }
                        setSelectedUrls(newSelected);
                      }}
                      className="mt-1 h-4 w-4 rounded border-border"
                    />
                    <label htmlFor={`url-${index}`} className="flex-1 text-sm text-foreground break-all cursor-pointer">
                      {discoveredUrl}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleScrape} disabled={isLoading || selectedUrls.size === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scraping {selectedUrls.size} URLs...
                  </>
                ) : (
                  `Scrape ${selectedUrls.size} Selected URL${selectedUrls.size !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </Card>
        )}

        {progress && (
          <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                {autoDiscoverLinks ? 'Discovering & Scraping Blog Posts' : 'Scraping Progress'}: {progress.current} / {progress.total}
              </span>
              <span className="text-muted-foreground">
                {Math.round((progress.current / progress.total) * 100)}%
              </span>
            </div>
            <Progress value={(progress.current / progress.total) * 100} className="h-2" />
            {progress.currentUrl && (
              <p className="text-xs text-muted-foreground truncate">
                Current: {progress.currentUrl}
              </p>
            )}
          </div>
        )}

        {markdown && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Content Preview & Editor
                </label>
                {stats && (
                  <p className="text-xs text-muted-foreground">
                    Successfully scraped {stats.success} of {stats.total} pages
                    {stats.failed > 0 && ` (${stats.failed} failed)`}
                  </p>
                )}
                {toc.length > 0 && (
                  <p className="text-xs text-primary">
                    Table of contents with {toc.length} sections generated
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <TemplateLibrary onApplyTemplate={handleApplyTemplate} />
                <Button onClick={handleSaveToBatch} variant="secondary" size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  Save to Batch
                </Button>
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download MD
                </Button>
                <Button onClick={handleDownloadJSON} variant="outline" size="sm">
                  <FileJson className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
                <Button onClick={handleDownloadXmlSitemap} variant="outline" size="sm">
                  <FileCode className="mr-2 h-4 w-4" />
                  Export Sitemap
                </Button>
                <Button onClick={handleDownloadHTML} variant="outline" size="sm">
                  <Code className="mr-2 h-4 w-4" />
                  Export HTML
                </Button>
                <Button onClick={handleDownloadPDF} variant="default" size="sm">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </div>

            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview Only</TabsTrigger>
              </TabsList>
              <TabsContent value="editor" className="mt-4">
                <MarkdownEditor
                  initialContent={editedMarkdown}
                  onContentChange={setEditedMarkdown}
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-4">
                <MarkdownPreview content={editedMarkdown} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </Card>
    </div>

    <div className="lg:col-span-1">
      <BatchExport
        scrapes={savedScrapes}
        onRemove={handleRemoveScrape}
        onClear={handleClearBatch}
      />
    </div>
  </div>
</div>
  );
};
