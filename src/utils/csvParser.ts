import Papa from 'papaparse';
import { JobRecord, ParseResult } from '../types';

export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export function generateJobId(url: string, title?: string, company?: string): string {
  const cleanUrl = (url || '').trim().toLowerCase();
  if (cleanUrl) {
    return `job_${simpleHash(cleanUrl)}`;
  }
  const fallback = `${(title || 'untitled').trim().toLowerCase()}_${(company || 'unknown').trim().toLowerCase()}`;
  return `job_${simpleHash(fallback)}`;
}

interface RawCsvRow {
  [key: string]: any;
}

export function normalizeJobRow(row: RawCsvRow, index: number): JobRecord | null {
  // Normalize column keys to lowercase without spaces/underscores
  const normalizedKeyMap: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    const cleanKey = k.trim().toLowerCase().replace(/[\s_-]+/g, '');
    normalizedKeyMap[cleanKey] = v;
  }

  // Find URL
  const jobUrl =
    normalizedKeyMap['joburl'] ||
    normalizedKeyMap['url'] ||
    normalizedKeyMap['link'] ||
    normalizedKeyMap['joblink'] ||
    normalizedKeyMap['applyurl'] ||
    '';

  // Find Title
  const title =
    normalizedKeyMap['title'] ||
    normalizedKeyMap['jobtitle'] ||
    normalizedKeyMap['role'] ||
    normalizedKeyMap['position'] ||
    `Job Listing #${index + 1}`;

  // Find Company
  const company =
    normalizedKeyMap['company'] ||
    normalizedKeyMap['companyname'] ||
    normalizedKeyMap['employer'] ||
    normalizedKeyMap['organization'] ||
    'Unknown Company';

  // Find Location
  const location =
    normalizedKeyMap['location'] ||
    normalizedKeyMap['city'] ||
    normalizedKeyMap['region'] ||
    normalizedKeyMap['country'] ||
    'Not specified';

  // Find Match Score
  const rawScore =
    normalizedKeyMap['matchscore'] ??
    normalizedKeyMap['score'] ??
    normalizedKeyMap['fitscore'] ??
    normalizedKeyMap['relevance'] ??
    normalizedKeyMap['match'];
  
  let matchScore = 70;
  if (rawScore !== undefined && rawScore !== null && rawScore !== '') {
    const parsed = Number(String(rawScore).replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed)) {
      matchScore = parsed > 1 ? Math.min(100, Math.round(parsed)) : Math.round(parsed * 100);
    }
  }

  // Find Match Reason
  const matchReason =
    normalizedKeyMap['matchreason'] ||
    normalizedKeyMap['reason'] ||
    normalizedKeyMap['rationale'] ||
    normalizedKeyMap['matchcriteria'] ||
    normalizedKeyMap['description'] ||
    'Scored by dash-bookmarks matching engine';

  // Find Source
  let source =
    normalizedKeyMap['source'] ||
    normalizedKeyMap['portal'] ||
    normalizedKeyMap['board'] ||
    '';

  if (!source && jobUrl) {
    if (jobUrl.includes('adzuna.')) source = 'Adzuna';
    else if (jobUrl.includes('indeed.')) source = 'Indeed';
    else if (jobUrl.includes('reed.')) source = 'Reed';
    else if (jobUrl.includes('linkedin.')) source = 'LinkedIn';
    else if (jobUrl.includes('otta.')) source = 'Otta';
    else if (jobUrl.includes('glassdoor.')) source = 'Glassdoor';
    else {
      try {
        const domain = new URL(jobUrl).hostname.replace('www.', '');
        source = domain.split('.')[0] || 'Web';
      } catch {
        source = 'Web';
      }
    }
  }

  // Salary & Posted Date
  const salary =
    normalizedKeyMap['salary'] ||
    normalizedKeyMap['remuneration'] ||
    normalizedKeyMap['pay'] ||
    '';

  const postedDate =
    normalizedKeyMap['posteddate'] ||
    normalizedKeyMap['date'] ||
    normalizedKeyMap['createdat'] ||
    '';

  const id = generateJobId(jobUrl, title, company);

  return {
    id,
    job_url: jobUrl,
    title: String(title).trim(),
    company: String(company).trim(),
    location: String(location).trim(),
    match_score: matchScore,
    match_reason: String(matchReason).trim(),
    source: source ? String(source).trim() : undefined,
    salary: salary ? String(salary).trim() : undefined,
    posted_date: postedDate ? String(postedDate).trim() : undefined,
    raw_data: row as Record<string, string>,
  };
}

export function parseCSVFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const isJson = file.name.toLowerCase().endsWith('.json');

    if (isJson) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          const rawList = Array.isArray(parsed) ? parsed : parsed.jobs || parsed.custom_jobs || [];
          const jobs: JobRecord[] = [];
          
          rawList.forEach((item: any, idx: number) => {
            const normalized = normalizeJobRow(item, idx);
            if (normalized) jobs.push(normalized);
          });

          resolve({
            jobs,
            errors: jobs.length === 0 ? ['No valid job listings found in JSON.'] : [],
            totalParsed: jobs.length,
            fileName: file.name,
          });
        } catch (err: any) {
          resolve({
            jobs: [],
            errors: [`Failed to parse JSON file: ${err.message}`],
            totalParsed: 0,
            fileName: file.name,
          });
        }
      };
      reader.readAsText(file);
      return;
    }

    Papa.parse<RawCsvRow>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const jobs: JobRecord[] = [];
        const errors: string[] = results.errors.map((e) => `Row ${e.row}: ${e.message}`);

        results.data.forEach((row, idx) => {
          // Check if row has at least one non-empty value
          const hasValues = Object.values(row).some((val) => val && String(val).trim().length > 0);
          if (hasValues) {
            const normalized = normalizeJobRow(row, idx);
            if (normalized) {
              jobs.push(normalized);
            }
          }
        });

        resolve({
          jobs,
          errors,
          totalParsed: jobs.length,
          fileName: file.name,
        });
      },
      error: (err) => {
        resolve({
          jobs: [],
          errors: [err.message],
          totalParsed: 0,
          fileName: file.name,
        });
      },
    });
  });
}

export function parseCSVText(csvText: string, fileName = 'pasted_export.csv'): ParseResult {
  const results = Papa.parse<RawCsvRow>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
  });

  const jobs: JobRecord[] = [];
  const errors: string[] = results.errors.map((e) => `Row ${e.row}: ${e.message}`);

  results.data.forEach((row, idx) => {
    const hasValues = Object.values(row).some((val) => val && String(val).trim().length > 0);
    if (hasValues) {
      const normalized = normalizeJobRow(row, idx);
      if (normalized) {
        jobs.push(normalized);
      }
    }
  });

  return {
    jobs,
    errors,
    totalParsed: jobs.length,
    fileName,
  };
}

export function exportJobsToCSV(jobs: JobRecord[], statuses: Record<string, any>): string {
  const exportRows = jobs.map((job) => {
    const meta = statuses[job.id] || {};
    return {
      title: job.title,
      company: job.company,
      location: job.location,
      match_score: job.match_score,
      status: meta.status || 'Saved',
      notes: meta.notes || '',
      match_reason: job.match_reason,
      job_url: job.job_url,
      salary: job.salary || '',
      posted_date: job.posted_date || '',
      source: job.source || '',
      updated_at: meta.updated_at || '',
    };
  });

  return Papa.unparse(exportRows);
}
