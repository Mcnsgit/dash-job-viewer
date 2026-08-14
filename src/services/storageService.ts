import { get, set, del, clear, entries } from 'idb-keyval';
import { AppStoredState, EnrichedJD, FilterState, JobRecord, JobStatus, JobUserMeta } from '../types';
import { SAMPLE_JOBS } from '../data/sampleJobs';

const STORAGE_KEY = 'djv_app_state_v1';

export const DEFAULT_FILTERS: FilterState = {
  search_query: '',
  min_score: 0,
  max_score: 100,
  status: 'all',
  sortBy: 'score_desc',
  selectedLocation: '',
  selectedCompany: '',
  selectedSource: '',
  hideHidden: true,
};

export function loadAppState(): AppStoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        active_filters: { ...DEFAULT_FILTERS, ...(parsed.active_filters || {}) },
        job_statuses: parsed.job_statuses || {},
        custom_jobs: Array.isArray(parsed.custom_jobs) && parsed.custom_jobs.length > 0
          ? parsed.custom_jobs
          : SAMPLE_JOBS,
        selected_job_id: parsed.selected_job_id || null,
        last_imported_file: parsed.last_imported_file,
      };
    }
  } catch (err) {
    console.error('Failed to parse state from localStorage', err);
  }

  return {
    active_filters: DEFAULT_FILTERS,
    job_statuses: {},
    custom_jobs: SAMPLE_JOBS,
    selected_job_id: null,
  };
}

export function saveAppState(state: Partial<AppStoredState>): void {
  try {
    const current = loadAppState();
    const merged: AppStoredState = {
      ...current,
      ...state,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.error('Failed to save state to localStorage', err);
  }
}

export function setJobMeta(
  jobId: string,
  metaUpdate: Partial<JobUserMeta>
): Record<string, JobUserMeta> {
  const state = loadAppState();
  const existing = state.job_statuses[jobId] || {
    status: 'Saved',
    notes: '',
    updated_at: new Date().toISOString(),
  };

  const updated: JobUserMeta = {
    ...existing,
    ...metaUpdate,
    updated_at: new Date().toISOString(),
  };

  state.job_statuses[jobId] = updated;
  saveAppState({ job_statuses: state.job_statuses });
  return state.job_statuses;
}

// --- IndexedDB for Heavy JD Caching ---

const JD_CACHE_PREFIX = 'jd_cache_';

export async function getCachedJD(jobId: string): Promise<EnrichedJD | null> {
  try {
    const key = `${JD_CACHE_PREFIX}${jobId}`;
    const result = await get<EnrichedJD>(key);
    return result || null;
  } catch (err) {
    console.warn(`IndexedDB read error for job ${jobId}:`, err);
    return null;
  }
}

export async function saveCachedJD(jobId: string, jd: EnrichedJD): Promise<void> {
  try {
    const key = `${JD_CACHE_PREFIX}${jobId}`;
    await set(key, jd);
  } catch (err) {
    console.warn(`IndexedDB write error for job ${jobId}:`, err);
  }
}

export async function removeCachedJD(jobId: string): Promise<void> {
  try {
    const key = `${JD_CACHE_PREFIX}${jobId}`;
    await del(key);
  } catch (err) {
    console.warn(`IndexedDB delete error for job ${jobId}:`, err);
  }
}

export async function clearAllCachedJDs(): Promise<void> {
  try {
    await clear();
  } catch (err) {
    console.warn('IndexedDB clear error:', err);
  }
}

export async function getAllCachedJDs(): Promise<Record<string, EnrichedJD>> {
  try {
    const allEntries = await entries();
    const result: Record<string, EnrichedJD> = {};
    for (const [k, v] of allEntries) {
      if (typeof k === 'string' && k.startsWith(JD_CACHE_PREFIX)) {
        const jobId = k.replace(JD_CACHE_PREFIX, '');
        result[jobId] = v as EnrichedJD;
      }
    }
    return result;
  } catch (err) {
    console.warn('Failed to retrieve all cached JDs:', err);
    return {};
  }
}
