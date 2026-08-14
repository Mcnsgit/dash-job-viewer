import React, { useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { JobRecord, FilterState, JobUserMeta, JobStatus, SortOption } from '../../types';
import { JobCard } from './JobCard';

interface JobListProps {
  jobs: JobRecord[];
  statuses: Record<string, JobUserMeta>;
  selectedJobId: string | null;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onSelectJob: (jobId: string) => void;
  onQuickStatusChange: (jobId: string, status: Exclude<JobStatus, 'all'>) => void;
  onResetFilters: () => void;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  statuses,
  selectedJobId,
  filters,
  onFilterChange,
  onSelectJob,
  onQuickStatusChange,
  onResetFilters,
}) => {
  // Status filter options
  const statusOptions: { label: string; value: JobStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Saved', value: 'Saved' },
    { label: 'Applied', value: 'Applied' },
    { label: 'Interviewing', value: 'Interviewing' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Hidden', value: 'Hidden' },
  ];

  // Quick score presets
  const scorePresets = [0, 60, 70, 80, 90];

  // Filtering & Sorting Logic
  const filteredAndSortedJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        const meta = statuses[job.id];
        const status = meta?.status || 'Saved';

        // Hidden filter rule
        if (filters.hideHidden && status === 'Hidden' && filters.status !== 'Hidden') {
          return false;
        }

        // Status filter
        if (filters.status !== 'all' && status !== filters.status) {
          return false;
        }

        // Score filter
        if (job.match_score < filters.min_score || job.match_score > filters.max_score) {
          return false;
        }

        // Search text query
        if (filters.search_query.trim()) {
          const q = filters.search_query.toLowerCase();
          const title = job.title.toLowerCase();
          const comp = job.company.toLowerCase();
          const loc = job.location.toLowerCase();
          const reason = job.match_reason.toLowerCase();
          const notes = (meta?.notes || '').toLowerCase();
          const match =
            title.includes(q) ||
            comp.includes(q) ||
            loc.includes(q) ||
            reason.includes(q) ||
            notes.includes(q);
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const metaA = statuses[a.id];
        const metaB = statuses[b.id];

        switch (filters.sortBy) {
          case 'score_desc':
            return b.match_score - a.match_score;
          case 'score_asc':
            return a.match_score - b.match_score;
          case 'title_asc':
            return a.title.localeCompare(b.title);
          case 'company_asc':
            return a.company.localeCompare(b.company);
          case 'status_order': {
            const order: Record<string, number> = {
              Interviewing: 1,
              Applied: 2,
              Saved: 3,
              Rejected: 4,
              Hidden: 5,
            };
            const sA = metaA?.status || 'Saved';
            const sB = metaB?.status || 'Saved';
            return (order[sA] || 99) - (order[sB] || 99);
          }
          default:
            return b.match_score - a.match_score;
        }
      });
  }, [jobs, statuses, filters]);

  const isFiltered =
    filters.search_query !== '' ||
    filters.min_score > 0 ||
    filters.status !== 'all' ||
    !filters.hideHidden;

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      
      {/* Control Filters Header */}
      <div className="p-3.5 border-b border-gray-200 space-y-3 shrink-0 bg-white shadow-2xs">
        
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search_query}
            onChange={(e) => onFilterChange({ search_query: e.target.value })}
            placeholder="Search title, company, skills, or notes..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition"
          />
          {filters.search_query && (
            <button
              onClick={() => onFilterChange({ search_query: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Score Threshold Slider & Presets */}
        <div className="space-y-1.5 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-700 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Min Match Score:
            </span>
            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">
              ≥ {filters.min_score}%
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.min_score}
            onChange={(e) => onFilterChange({ min_score: Number(e.target.value) })}
            className="w-full accent-blue-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg"
          />

          <div className="flex items-center justify-between gap-1 pt-1">
            {scorePresets.map((score) => (
              <button
                key={score}
                onClick={() => onFilterChange({ min_score: score })}
                className={`text-[10px] px-2 py-0.5 rounded transition cursor-pointer font-medium ${
                  filters.min_score === score
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {score === 0 ? 'All' : `${score}%+`}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter Badges (Horizontal scrollable) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFilterChange({ status: opt.value })}
              className={`text-xs px-2.5 py-1 rounded-md shrink-0 transition font-medium cursor-pointer ${
                filters.status === opt.value
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 border border-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sort & Quick Controls Row */}
        <div className="flex items-center justify-between gap-2 pt-1 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
              className="bg-white border border-gray-300 rounded-md px-2 py-1 text-gray-700 text-xs focus:outline-hidden focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="score_desc">Match Score (High to Low)</option>
              <option value="score_asc">Match Score (Low to High)</option>
              <option value="status_order">Application Status</option>
              <option value="title_asc">Job Title (A-Z)</option>
              <option value="company_asc">Company (A-Z)</option>
            </select>
          </div>

          {/* Result Count & Clear */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-semibold text-gray-700">
              {filteredAndSortedJobs.length} / {jobs.length}
            </span>
            {isFiltered && (
              <button
                onClick={onResetFilters}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Scrollable Job Cards Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredAndSortedJobs.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
              <Filter className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">No jobs match your filters</p>
              <p className="text-xs text-gray-500 mt-1">
                Try lowering the min match score threshold or clearing search keywords.
              </p>
            </div>
            <button
              onClick={onResetFilters}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredAndSortedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              userMeta={statuses[job.id]}
              isSelected={selectedJobId === job.id}
              onSelect={() => onSelectJob(job.id)}
              onQuickStatusChange={(newStatus) => onQuickStatusChange(job.id, newStatus)}
            />
          ))
        )}
      </div>

    </div>
  );
};
