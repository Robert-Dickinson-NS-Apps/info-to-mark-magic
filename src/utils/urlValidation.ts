import { z } from 'zod';

export const urlSchema = z.string()
  .trim()
  .nonempty({ message: "URL cannot be empty" })
  .url({ message: "Please enter a valid URL" })
  .max(2048, { message: "URL is too long" });

export interface UrlCheckResult {
  isValid: boolean;
  isReachable: boolean;
  statusCode?: number;
  error?: string;
  warning?: string;
}

export const validateUrlFormat = (url: string): { valid: boolean; error?: string } => {
  try {
    urlSchema.parse(url);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: "Invalid URL format" };
  }
};

export const checkUrlReachability = async (url: string): Promise<UrlCheckResult> => {
  const formatCheck = validateUrlFormat(url);
  
  if (!formatCheck.valid) {
    return {
      isValid: false,
      isReachable: false,
      error: formatCheck.error
    };
  }

  try {
    // Use a HEAD request first to check without downloading content
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors', // Allow cross-origin requests
    });

    clearTimeout(timeoutId);

    // Note: no-cors mode means we can't read the status, but we can detect if it loads
    return {
      isValid: true,
      isReachable: true,
      statusCode: response.status || undefined,
    };
  } catch (error) {
    // If HEAD fails, try GET (some servers block HEAD)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        mode: 'no-cors',
      });

      clearTimeout(timeoutId);

      return {
        isValid: true,
        isReachable: true,
        statusCode: response.status || undefined,
      };
    } catch (retryError) {
      if (retryError instanceof Error) {
        if (retryError.name === 'AbortError') {
          return {
            isValid: true,
            isReachable: false,
            error: 'Request timeout - the server took too long to respond',
            warning: 'The URL may still be scrapable, but it\'s slow to respond'
          };
        }

        // Network errors
        if (retryError.message.includes('Failed to fetch')) {
          return {
            isValid: true,
            isReachable: false,
            error: 'Unable to reach the URL - possible CORS restrictions or network issue',
            warning: 'Our scraper may still be able to access it from the server'
          };
        }
      }

      return {
        isValid: true,
        isReachable: false,
        error: 'Unable to verify URL accessibility',
        warning: 'The scraper will attempt to access it anyway'
      };
    }
  }
};

export const getStatusMessage = (statusCode?: number): { type: 'error' | 'warning' | 'success'; message: string } | null => {
  if (!statusCode) return null;

  if (statusCode >= 200 && statusCode < 300) {
    return { type: 'success', message: 'URL is accessible' };
  }

  if (statusCode === 403) {
    return { type: 'error', message: '403 Forbidden - Access denied. The server is blocking requests.' };
  }

  if (statusCode === 404) {
    return { type: 'error', message: '404 Not Found - The page does not exist.' };
  }

  if (statusCode === 429) {
    return { type: 'warning', message: '429 Too Many Requests - Rate limit exceeded. Try again later.' };
  }

  if (statusCode === 500) {
    return { type: 'error', message: '500 Server Error - The server encountered an error.' };
  }

  if (statusCode === 503) {
    return { type: 'warning', message: '503 Service Unavailable - The server is temporarily unavailable.' };
  }

  if (statusCode >= 400 && statusCode < 500) {
    return { type: 'error', message: `Client error (${statusCode}) - Unable to access the URL.` };
  }

  if (statusCode >= 500) {
    return { type: 'error', message: `Server error (${statusCode}) - The server is having issues.` };
  }

  return null;
};
