export type JobStatus = 'all' | 'Saved' | 'Applied' | 'Interviewing' | 'Rejected' | 'Hidden';

export interface JobRecord {
  id: string;
  job_url: string;
  title: string;
  company: string;
  location: string;
  match_score: number;
  match_reason: string;
  source?: string;
  salary?: string;
  posted_date?: string;
  raw_data?: Record<string, string>;
}

export interface JobUserMeta {
  status: Exclude<JobStatus, 'all'>;
  notes: string;
  updated_at: string;
  interview_date?: string;
  applied_date?: string;
}

export interface EnrichedJD {
  job_id: string;
  title?: string;
  byline?: string;
  excerpt?: string;
  contentHtml?: string;
  textContent?: string;
  siteName?: string;
  fetched_at: string;
  source_type: 'proxy' | 'cached' | 'manual';
  proxy_used?: string;
}

export type SortOption =
  | 'score_desc'
  | 'score_asc'
  | 'title_asc'
  | 'company_asc'
  | 'status_order';

export interface FilterState {
  search_query: string;
  min_score: number;
  max_score: number;
  status: JobStatus;
  sortBy: SortOption;
  selectedLocation: string;
  selectedCompany: string;
  selectedSource: string;
  hideHidden: boolean;
}

export interface AppStoredState {
  active_filters: FilterState;
  job_statuses: Record<string, JobUserMeta>;
  custom_jobs: JobRecord[];
  selected_job_id: string | null;
  last_imported_file?: string;
}

export interface ParseResult {
  jobs: JobRecord[];
  errors: string[];
  totalParsed: number;
  fileName: string;
}
