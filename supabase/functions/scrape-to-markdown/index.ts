import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PAGES = 50; // Limit to prevent abuse

interface SitemapUrl {
  loc: string;
  priority?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, useSitemap = false, maxPages = MAX_PAGES, stream = false, autoDiscoverLinks = false } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching URL:', url, 'Use sitemap:', useSitemap, 'Auto-discover:', autoDiscoverLinks, 'Stream:', stream);

    // If auto-discover mode with streaming
    if (autoDiscoverLinks && stream) {
      let urls: string[];
      try {
        console.log('Discovering blog links from:', url);
        urls = await discoverBlogLinks(url, maxPages);
        console.log(`Found ${urls.length} blog links`);
      } catch (error) {
        console.warn('Link discovery failed, falling back to single URL:', error);
        urls = [url];
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          // Send initial progress
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'start', 
            total: urls.length,
            discoveryMode: true
          })}\n\n`));

          let combinedMarkdown = `# Blog Posts from ${url}\n\n`;
          let successCount = 0;

          for (let i = 0; i < urls.length; i++) {
            const pageUrl = urls[i];
            console.log(`Scraping blog post ${i + 1}/${urls.length}: ${pageUrl}`);

            try {
              const markdown = await scrapeUrlToMarkdown(pageUrl);
              combinedMarkdown += `\n---\n\n## ${pageUrl}\n\n${markdown}\n\n`;
              successCount++;

              // Send progress update
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'progress',
                current: i + 1,
                total: urls.length,
                url: pageUrl,
                success: true
              })}\n\n`));
            } catch (error) {
              console.error(`Failed to scrape ${pageUrl}:`, error);
              combinedMarkdown += `\n---\n\n## ${pageUrl}\n\n*Failed to scrape this page*\n\n`;

              // Send failure update
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'progress',
                current: i + 1,
                total: urls.length,
                url: pageUrl,
                success: false
              })}\n\n`));
            }
          }

          // Send final result
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            markdown: combinedMarkdown,
            stats: {
              total: urls.length,
              success: successCount,
              failed: urls.length - successCount
            }
          })}\n\n`));

          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    }

    // If sitemap mode with streaming
    if (useSitemap && stream) {
      let urls: string[];
      try {
        urls = await fetchSitemapUrls(url, maxPages);
        console.log(`Found ${urls.length} URLs in sitemap`);
      } catch (error) {
        console.warn('Sitemap fetch failed, falling back to single URL:', error);
        urls = [url];
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          // Send initial progress
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'start', 
            total: urls.length 
          })}\n\n`));

          let combinedMarkdown = `# Scraped from ${url}\n\n`;
          let successCount = 0;

          for (let i = 0; i < urls.length; i++) {
            const pageUrl = urls[i];
            console.log(`Scraping page ${i + 1}/${urls.length}: ${pageUrl}`);

            try {
              const markdown = await scrapeUrlToMarkdown(pageUrl);
              combinedMarkdown += `\n---\n\n## Page: ${pageUrl}\n\n${markdown}\n\n`;
              successCount++;

              // Send progress update
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'progress',
                current: i + 1,
                total: urls.length,
                url: pageUrl,
                success: true
              })}\n\n`));
            } catch (error) {
              console.error(`Failed to scrape ${pageUrl}:`, error);
              combinedMarkdown += `\n---\n\n## Page: ${pageUrl}\n\n*Failed to scrape this page*\n\n`;

              // Send failure update
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'progress',
                current: i + 1,
                total: urls.length,
                url: pageUrl,
                success: false
              })}\n\n`));
            }
          }

          // Send final result
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            markdown: combinedMarkdown,
            stats: {
              total: urls.length,
              success: successCount,
              failed: urls.length - successCount
            }
          })}\n\n`));

          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    }

    // If sitemap mode without streaming
    if (useSitemap) {
      let urls: string[];
      try {
        urls = await fetchSitemapUrls(url, maxPages);
        console.log(`Found ${urls.length} URLs in sitemap`);
      } catch (error) {
        console.warn('Sitemap fetch failed, falling back to single URL:', error);
        urls = [url];
      }

      let combinedMarkdown = `# Scraped from ${url}\n\n`;
      let successCount = 0;

      for (let i = 0; i < urls.length; i++) {
        const pageUrl = urls[i];
        console.log(`Scraping page ${i + 1}/${urls.length}: ${pageUrl}`);

        try {
          const markdown = await scrapeUrlToMarkdown(pageUrl);
          combinedMarkdown += `\n---\n\n## Page: ${pageUrl}\n\n${markdown}\n\n`;
          successCount++;
        } catch (error) {
          console.error(`Failed to scrape ${pageUrl}:`, error);
          combinedMarkdown += `\n---\n\n## Page: ${pageUrl}\n\n*Failed to scrape this page*\n\n`;
        }
      }

      console.log(`Successfully scraped ${successCount}/${urls.length} pages`);

      return new Response(
        JSON.stringify({ 
          markdown: combinedMarkdown,
          stats: {
            total: urls.length,
            success: successCount,
            failed: urls.length - successCount
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Single page mode
    console.log('Scraping single page:', url);

    const markdown = await scrapeUrlToMarkdown(url);

    return new Response(
      JSON.stringify({ markdown }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-to-markdown:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchSitemapUrls(baseUrl: string, maxPages: number): Promise<string[]> {
  const parsedUrl = new URL(baseUrl);
  const sitemapUrl = `${parsedUrl.protocol}//${parsedUrl.host}/sitemap.xml`;
  
  console.log('Fetching sitemap from:', sitemapUrl);

  try {
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RubyInfoScrapper/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Sitemap not found at ${sitemapUrl}`);
    }

    const sitemapXml = await response.text();
    
    // Parse XML to extract URLs
    const urlMatches = sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g);
    const urls: string[] = [];
    
    for (const match of urlMatches) {
      if (urls.length >= maxPages) break;
      urls.push(match[1]);
    }

    if (urls.length === 0) {
      throw new Error('No URLs found in sitemap');
    }

    return urls;
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    throw new Error(`Failed to fetch sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function discoverBlogLinks(baseUrl: string, maxLinks: number): Promise<string[]> {
  try {
    // First, try to find and use sitemap
    console.log('Attempting to discover links from sitemap first...');
    try {
      const sitemapUrls = await fetchSitemapUrls(baseUrl, maxLinks);
      
      // Filter sitemap URLs for blog/article patterns
      const blogUrls = sitemapUrls.filter(url => {
        const path = url.toLowerCase();
        return path.includes('/blog/') ||
          path.includes('/post/') ||
          path.includes('/article/') ||
          path.includes('/news/') ||
          path.includes('/articles/') ||
          path.includes('/posts/') ||
          path.match(/\/\d{4}\/\d{2}\//) || // Date-based URLs
          path.match(/\/\d{4}-\d{2}-\d{2}/); // Date URLs
      });
      
      if (blogUrls.length > 0) {
        console.log(`Found ${blogUrls.length} blog URLs from sitemap`);
        return blogUrls.slice(0, maxLinks);
      }
      
      console.log('No blog URLs found in sitemap, falling back to HTML parsing');
    } catch (sitemapError) {
      console.log('Sitemap not found or failed, falling back to HTML parsing:', sitemapError);
    }
    
    // Fall back to HTML link discovery
    console.log('Fetching base page for HTML parsing:', baseUrl);
    
    const response = await fetch(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RubyInfoScrapper/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.statusText}`);
    }

    const html = await response.text();
    const links = new Set<string>();
    
    // Extract all links from the HTML
    const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>/gi;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      
      // Skip if it's not a valid link
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue;
      }
      
      // Convert relative URLs to absolute
      let fullUrl: string;
      try {
        if (href.startsWith('http://') || href.startsWith('https://')) {
          fullUrl = href;
        } else if (href.startsWith('//')) {
          fullUrl = new URL(baseUrl).protocol + href;
        } else if (href.startsWith('/')) {
          const base = new URL(baseUrl);
          fullUrl = `${base.protocol}//${base.host}${href}`;
        } else {
          const base = new URL(baseUrl);
          const basePath = base.pathname.endsWith('/') ? base.pathname : base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1);
          fullUrl = `${base.protocol}//${base.host}${basePath}${href}`;
        }
        
        const urlObj = new URL(fullUrl);
        
        // Only include links from the same domain
        if (urlObj.hostname !== new URL(baseUrl).hostname) {
          continue;
        }
        
        // Look for common blog/article patterns
        const path = urlObj.pathname.toLowerCase();
        const isBlogLink = 
          path.includes('/blog/') ||
          path.includes('/post/') ||
          path.includes('/article/') ||
          path.includes('/news/') ||
          path.includes('/articles/') ||
          path.includes('/posts/') ||
          path.match(/\/\d{4}\/\d{2}\//) || // Date-based URLs like /2024/01/
          path.match(/\/\d{4}-\d{2}-\d{2}/); // URLs with dates like /2024-01-15
        
        if (isBlogLink && fullUrl !== baseUrl) {
          links.add(fullUrl);
        }
      } catch (e) {
        // Skip invalid URLs
        continue;
      }
    }
    
    const urls = Array.from(links).slice(0, maxLinks);
    
    if (urls.length === 0) {
      throw new Error('No blog links found on the page');
    }
    
    console.log(`Found ${urls.length} blog URLs from HTML parsing`);
    return urls;
  } catch (error) {
    console.error('Error discovering blog links:', error);
    throw new Error(`Failed to discover blog links: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function scrapeUrlToMarkdown(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; RubyInfoScrapper/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`);
  }

  const html = await response.text();

  // Convert HTML to markdown (basic conversion)
  let markdown = html
    // Remove script and style tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Convert headings
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
    // Convert links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    // Convert bold and italic
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    // Convert lists
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    // Convert paragraphs
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    // Convert line breaks
    .replace(/<br[^>]*>/gi, '\n')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return markdown;
}
