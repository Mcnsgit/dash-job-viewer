import React from 'react';
import {
  BarChart2,
  X,
  TrendingUp,
  Award,
  Layers,
  Building,
  CheckCircle,
  Briefcase,
  Users,
} from 'lucide-react';
import { JobRecord, JobUserMeta } from '../types';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobRecord[];
  statuses: Record<string, JobUserMeta>;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  jobs,
  statuses,
}) => {
  if (!isOpen) return null;

  const total = jobs.length;

  // Status counts
  const statusCounts = {
    Saved: 0,
    Applied: 0,
    Interviewing: 0,
    Rejected: 0,
    Hidden: 0,
  };

  // Score tiers
  const scoreTiers = {
    '90-100% (Exceptional)': 0,
    '80-89% (Strong)': 0,
    '70-79% (Good)': 0,
    '60-69% (Moderate)': 0,
    '<60% (Low)': 0,
  };

  // Source breakdown
  const sourceCounts: Record<string, number> = {};

  let totalScore = 0;

  jobs.forEach((job) => {
    totalScore += job.match_score || 0;
    const s = (statuses[job.id]?.status || 'Saved') as keyof typeof statusCounts;
    if (statusCounts[s] !== undefined) {
      statusCounts[s]++;
    }

    // Score tier
    const sc = job.match_score || 0;
    if (sc >= 90) scoreTiers['90-100% (Exceptional)']++;
    else if (sc >= 80) scoreTiers['80-89% (Strong)']++;
    else if (sc >= 70) scoreTiers['70-79% (Good)']++;
    else if (sc >= 60) scoreTiers['60-69% (Moderate)']++;
    else scoreTiers['<60% (Low)']++;

    // Source
    const src = job.source || 'Other';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });

  const avgScore = total > 0 ? Math.round(totalScore / total) : 0;
  const appliedOrAbove = statusCounts.Applied + statusCounts.Interviewing;
  const applicationRate = total > 0 ? Math.round((appliedOrAbove / total) * 100) : 0;
  const interviewRate = appliedOrAbove > 0 ? Math.round((statusCounts.Interviewing / appliedOrAbove) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Application Pipeline & Score Analytics</h2>
              <p className="text-xs text-gray-500">Insights across {total} evaluated job listings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Top Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-center">
              <span className="text-[11px] text-gray-500 font-medium">Avg Fit Score</span>
              <p className="text-2xl font-bold font-mono text-emerald-700 mt-0.5">{avgScore}%</p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-center">
              <span className="text-[11px] text-gray-500 font-medium">Applied</span>
              <p className="text-2xl font-bold font-mono text-blue-600 mt-0.5">{statusCounts.Applied}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-center">
              <span className="text-[11px] text-gray-500 font-medium">Interviewing</span>
              <p className="text-2xl font-bold font-mono text-purple-700 mt-0.5">{statusCounts.Interviewing}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-center">
              <span className="text-[11px] text-gray-500 font-medium">Action Rate</span>
              <p className="text-2xl font-bold font-mono text-amber-700 mt-0.5">{applicationRate}%</p>
            </div>
          </div>

          {/* Status Funnel */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              Application Status Breakdown
            </h3>

            <div className="space-y-2 text-xs">
              {[
                { label: 'Saved (To Review)', count: statusCounts.Saved, color: 'bg-gray-400' },
                { label: 'Applied', count: statusCounts.Applied, color: 'bg-blue-600' },
                { label: 'Interviewing', count: statusCounts.Interviewing, color: 'bg-purple-600' },
                { label: 'Rejected / Archived', count: statusCounts.Rejected, color: 'bg-red-500' },
                { label: 'Hidden', count: statusCounts.Hidden, color: 'bg-gray-300' },
              ].map((item) => {
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-gray-700">
                      <span>{item.label}</span>
                      <span className="font-mono font-medium">{item.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Match Score Distribution */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              Match Score Distribution
            </h3>

            <div className="space-y-2 text-xs">
              {Object.entries(scoreTiers).map(([tier, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const isHigh = tier.includes('90') || tier.includes('80');
                return (
                  <div key={tier} className="space-y-1">
                    <div className="flex justify-between text-gray-700">
                      <span>{tier}</span>
                      <span className="font-mono font-medium">{count} roles ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          isHigh ? 'bg-emerald-600' : tier.includes('70') ? 'bg-amber-500' : 'bg-gray-400'
                        } transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Source Breakdown */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Job Boards & Portals
            </h3>

            <div className="flex flex-wrap gap-2">
              {Object.entries(sourceCounts).map(([src, count]) => (
                <div
                  key={src}
                  className="px-3 py-1.5 rounded-lg bg-white text-xs text-gray-700 border border-gray-200 flex items-center gap-2 shadow-2xs"
                >
                  <span className="font-semibold text-gray-900">{src}</span>
                  <span className="px-1.5 py-0.2 rounded bg-gray-100 text-[10px] font-mono text-gray-600 border border-gray-200">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl shadow-2xs transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
