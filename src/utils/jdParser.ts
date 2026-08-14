import { Readability } from '@mozilla/readability';

export interface ParsedArticle {
  title: string;
  byline?: string;
  excerpt?: string;
  contentHtml: string;
  textContent: string;
  siteName?: string;
  length?: number;
}

export function cleanExtractedHtml(html: string): string {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove unwanted elements
  const selectorsToRemove = [
    'script',
    'style',
    'noscript',
    'iframe',
    'svg',
    'form',
    'input',
    'button',
    'header',
    'footer',
    'nav',
    '.ad',
    '.advertisement',
    '.cookie-banner',
    '.social-share',
    '.related-jobs',
  ];

  selectorsToRemove.forEach((selector) => {
    doc.querySelectorAll(selector).forEach((el) => el.remove());
  });

  // Clean attributes from allowed elements
  const allElements = doc.body.querySelectorAll('*');
  allElements.forEach((el) => {
    // Keep href for links, but make them safe
    if (el.tagName.toLowerCase() === 'a') {
      const href = el.getAttribute('href');
      el.removeAttribute('class');
      el.removeAttribute('style');
      el.removeAttribute('onclick');
      if (href) {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    } else {
      el.removeAttribute('class');
      el.removeAttribute('style');
      el.removeAttribute('id');
      el.removeAttribute('onclick');
    }
  });

  return doc.body.innerHTML;
}

export function parseHtmlWithReadability(rawHtml: string, documentUrl?: string): ParsedArticle | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // If documentUrl provided, set base URI
    if (documentUrl) {
      const baseEl = doc.createElement('base');
      baseEl.href = documentUrl;
      doc.head.appendChild(baseEl);
    }

    // Try Readability
    const reader = new Readability(doc, {
      charThreshold: 50,
      classesToPreserve: ['job-description', 'description', 'job-details', 'requirements'],
    });

    const article = reader.parse();

    if (article && article.textContent && article.textContent.trim().length > 40) {
      return {
        title: article.title || '',
        byline: article.byline || '',
        excerpt: article.excerpt || '',
        contentHtml: cleanExtractedHtml(article.content || ''),
        textContent: article.textContent.trim(),
        siteName: article.siteName || '',
        length: article.length,
      };
    }

    // Fallback: extract from common job description containers if Readability was too aggressive
    const fallbackSelectors = [
      '[class*="jobDescription"]',
      '[class*="job-description"]',
      '[class*="jobDetails"]',
      '[id*="jobDescription"]',
      '[id*="job-description"]',
      'article',
      'main',
      '.content',
      '#content',
    ];

    for (const selector of fallbackSelectors) {
      const el = doc.querySelector(selector);
      if (el && el.textContent && el.textContent.trim().length > 60) {
        return {
          title: doc.title || '',
          contentHtml: cleanExtractedHtml(el.innerHTML),
          textContent: el.textContent.trim(),
        };
      }
    }

    // Last fallback: use cleaned body text
    const cleanedBody = cleanExtractedHtml(doc.body.innerHTML);
    const bodyText = doc.body.textContent || '';
    if (bodyText.trim().length > 30) {
      return {
        title: doc.title || '',
        contentHtml: cleanedBody,
        textContent: bodyText.trim(),
      };
    }

    return null;
  } catch (err) {
    console.error('Failed to parse HTML with Readability:', err);
    return null;
  }
}
