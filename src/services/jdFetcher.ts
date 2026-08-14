import { EnrichedJD } from '../types';
import { parseHtmlWithReadability } from '../utils/jdParser';
import { getCachedJD, saveCachedJD } from './storageService';

const PROXY_PIPELINE = [
  {
    name: 'AllOrigins',
    getUrl: (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'CorsProxyIO',
    getUrl: (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  },
  {
    name: 'CodeTabs',
    getUrl: (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  },
];

const TIMEOUT_MS = 6500;

export async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(id);
    return response;
  } catch (err: any) {
    clearTimeout(id);
    throw err;
  }
}

export interface FetchJdResult {
  jd: EnrichedJD | null;
  error?: string;
  isCloudflareOrBlocked?: boolean;
}

export async function fetchAndEnrichJD(
  jobId: string,
  jobUrl: string,
  forceRefresh = false
): Promise<FetchJdResult> {
  if (!jobUrl || !jobUrl.startsWith('http')) {
    return { jd: null, error: 'Invalid or missing job URL' };
  }

  // 1. Check IndexedDB cache unless forced
  if (!forceRefresh) {
    const cached = await getCachedJD(jobId);
    if (cached) {
      return { jd: cached };
    }
  }

  // 2. Try CORS proxy chain
  let lastError = '';
  let hitBlockedPage = false;

  for (const proxy of PROXY_PIPELINE) {
    try {
      const proxyUrl = proxy.getUrl(jobUrl);
      const res = await fetchWithTimeout(proxyUrl, TIMEOUT_MS);

      if (!res.ok) {
        if (res.status === 403 || res.status === 429) {
          hitBlockedPage = true;
        }
        lastError = `${proxy.name} returned HTTP ${res.status}`;
        continue;
      }

      const html = await res.text();

      // Check if html is a Cloudflare / anti-bot challenge
      const isCloudflare =
        html.includes('cf-browser-verification') ||
        html.includes('Checking your browser before accessing') ||
        html.includes('Cloudflare Ray ID') ||
        html.includes('Just a moment...') ||
        html.includes('Attention Required! | Cloudflare') ||
        (html.includes('captcha') && html.length < 3000);

      if (isCloudflare) {
        hitBlockedPage = true;
        lastError = `${proxy.name}: Encountered Cloudflare anti-bot challenge on destination`;
        continue;
      }

      // Parse with Readability
      const parsed = parseHtmlWithReadability(html, jobUrl);

      if (parsed && (parsed.contentHtml || parsed.textContent)) {
        const enriched: EnrichedJD = {
          job_id: jobId,
          title: parsed.title,
          byline: parsed.byline,
          excerpt: parsed.excerpt,
          contentHtml: parsed.contentHtml,
          textContent: parsed.textContent,
          siteName: parsed.siteName,
          fetched_at: new Date().toISOString(),
          source_type: 'proxy',
          proxy_used: proxy.name,
        };

        // Cache in IndexedDB
        await saveCachedJD(jobId, enriched);

        return { jd: enriched };
      } else {
        lastError = `${proxy.name}: Could not extract readable content from response`;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        lastError = `${proxy.name} timed out after ${TIMEOUT_MS / 1000}s`;
      } else {
        lastError = `${proxy.name} fetch failed: ${err.message || 'Network error'}`;
      }
    }
  }

  return {
    jd: null,
    error: lastError || 'All CORS proxies failed to fetch job description.',
    isCloudflareOrBlocked: hitBlockedPage,
  };
}

export async function saveManualJD(
  jobId: string,
  content: string,
  title?: string
): Promise<EnrichedJD> {
  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  let contentHtml = '';
  let textContent = '';

  if (isHtml) {
    const parsed = parseHtmlWithReadability(content);
    if (parsed) {
      contentHtml = parsed.contentHtml;
      textContent = parsed.textContent;
    } else {
      contentHtml = content;
      textContent = content.replace(/<[^>]*>?/gm, '');
    }
  } else {
    // Convert plain text paragraphs into HTML
    const paragraphs = content
      .split(/\n\s*\n/)
      .map((p) => `<p class="mb-3">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
    contentHtml = paragraphs || `<p>${content}</p>`;
    textContent = content;
  }

  const enriched: EnrichedJD = {
    job_id: jobId,
    title: title || 'Custom Job Description',
    contentHtml,
    textContent,
    fetched_at: new Date().toISOString(),
    source_type: 'manual',
  };

  await saveCachedJD(jobId, enriched);
  return enriched;
}
