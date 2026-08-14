import React from 'react';
import {
  MapPin,
  Building2,
  Calendar,
  Sparkles,
  ExternalLink,
  CheckCircle,
  EyeOff,
  Bookmark,
  Clock,
} from 'lucide-react';
import { JobRecord, JobStatus, JobUserMeta } from '../../types';

interface JobCardProps {
  job: JobRecord;
  userMeta?: JobUserMeta;
  isSelected: boolean;
  onSelect: () => void;
  onQuickStatusChange: (status: Exclude<JobStatus, 'all'>) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  userMeta,
  isSelected,
  onSelect,
  onQuickStatusChange,
}) => {
  const currentStatus = userMeta?.status || 'Saved';

  // Match score color badge styling
  const getScoreStyle = (score: number) => {
    if (score >= 80) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
    }
    if (score >= 60) {
      return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
    }
    return 'bg-gray-100 text-gray-600 border-gray-200 font-medium';
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Interviewing':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Hidden':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Parse match reasons into clean tags if they contain keywords or comma separation
  const matchReasonTags = React.useMemo(() => {
    if (!job.match_reason) return [];
    const cleaned = job.match_reason.replace(/^Matches:\s*/i, '').replace(/^Partial Match:\s*/i, '').replace(/^Weak Match:\s*/i, '');
    const tokens = cleaned.split(/,|;|\s+and\s+/i).map((t) => t.trim()).filter((t) => t.length > 2);
    return tokens.slice(0, 3);
  }, [job.match_reason]);

  return (
    <div
      onClick={onSelect}
      className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
        isSelected
          ? 'bg-blue-50/60 border-blue-500 shadow-xs ring-1 ring-blue-500/40'
          : 'bg-white hover:bg-gray-50/90 border-gray-200/90 hover:border-gray-300 shadow-2xs'
      }`}
    >
      {/* Top Header Row: Score + Company + Status */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`px-2 py-0.5 rounded-md text-xs border tracking-tight shrink-0 ${getScoreStyle(
              job.match_score
            )}`}
          >
            {job.match_score}% fit
          </span>
          <span className="text-xs font-semibold text-gray-600 truncate">
            {job.company}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <select
            value={currentStatus}
            onChange={(e) => onQuickStatusChange(e.target.value as Exclude<JobStatus, 'all'>)}
            className={`text-[10px] font-semibold py-0.5 px-2 rounded-full border cursor-pointer focus:outline-hidden transition shadow-2xs ${getStatusBadge(
              currentStatus
            )}`}
            title="Click to change application status"
          >
            <option value="Saved">Saved</option>
            <option value="Applied">Applied</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Rejected">Rejected</option>
            <option value="Hidden">Hidden</option>
          </select>
        </div>
      </div>

      {/* Title */}
      <h3
        className={`text-sm font-semibold leading-snug line-clamp-2 transition-colors ${
          isSelected ? 'text-gray-900 font-bold' : 'text-gray-800 group-hover:text-blue-600'
        }`}
      >
        {job.title}
      </h3>

      {/* Location & Salary */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
        <div className="flex items-center gap-1 min-w-0">
          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="truncate">{job.location}</span>
        </div>

        {job.salary && (
          <div className="flex items-center gap-1 text-emerald-700 font-medium shrink-0">
            <span>{job.salary}</span>
          </div>
        )}

        {job.source && (
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-500 border border-gray-200">
            {job.source}
          </span>
        )}
      </div>

      {/* Match Reason Key Badges */}
      {matchReasonTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mt-2.5">
          {matchReasonTags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200 truncate max-w-[170px]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Note indicator if user has notes */}
      {userMeta?.notes && (
        <div className="mt-2 text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/80 px-2 py-0.5 rounded-md flex items-center gap-1 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span className="italic truncate font-mono">"{userMeta.notes.slice(0, 45)}..."</span>
        </div>
      )}
    </div>
  );
};
