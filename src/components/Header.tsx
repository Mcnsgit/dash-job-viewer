import React from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  BarChart2,
  RefreshCw,
  Sparkles,
  Layers,
  Database,
  Trash2,
} from 'lucide-react';
import { JobRecord, JobUserMeta, JobStatus } from '../types';

interface HeaderProps {
  jobs: JobRecord[];
  statuses: Record<string, JobUserMeta>;
  onOpenUpload: () => void;
  onOpenAnalytics: () => void;
  onOpenExport: () => void;
  onLoadSampleData: () => void;
  onClearAllData: () => void;
  fileName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  jobs,
  statuses,
  onOpenUpload,
  onOpenAnalytics,
  onOpenExport,
  onLoadSampleData,
  onClearAllData,
  fileName,
}) => {
  // Compute fast stats
  const total = jobs.length;
  const statusCounts: Record<string, number> = {
    Saved: 0,
    Applied: 0,
    Interviewing: 0,
    Rejected: 0,
    Hidden: 0,
  };

  let totalScore = 0;
  jobs.forEach((job) => {
    totalScore += job.match_score || 0;
    const s = statuses[job.id]?.status || 'Saved';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  const avgScore = total > 0 ? Math.round(totalScore / total) : 0;

  return (
    <header className="bg-white border-b border-gray-200 text-gray-800 shrink-0 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-xs text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-gray-900">
                  Dash Job Viewer
                </h1>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  v1.0 • Client-Side
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {fileName ? (
                  <span className="inline-flex items-center gap-1">
                    <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                    <span className="text-gray-700 font-medium">{fileName}</span> ({total} roles)
                  </span>
                ) : (
                  <span>Master-Detail Reviewer & Tracker</span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="hidden lg:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-xs">
            <div className="flex items-center gap-1.5 px-2 border-r border-gray-200">
              <span className="text-gray-500">Total:</span>
              <span className="font-semibold text-gray-900">{total}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 border-r border-gray-200">
              <span className="text-gray-500">Avg Fit:</span>
              <span className="font-semibold text-emerald-600">{avgScore}%</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 border-r border-gray-200">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-gray-500">Applied:</span>
              <span className="font-semibold text-blue-700">{statusCounts['Applied']}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-gray-500">Interviewing:</span>
              <span className="font-semibold text-amber-700">{statusCounts['Interviewing']}</span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={onOpenAnalytics}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-xs transition cursor-pointer"
              title="View Application Pipeline Analytics"
            >
              <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Analytics</span>
            </button>

            <button
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-xs transition cursor-pointer"
              title="Export CSV with statuses and backup"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
              title="Upload new CSV or JSON export"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </button>

            <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>

            <button
              onClick={onLoadSampleData}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              title="Load 12 sample UK job records (Adzuna, Reed, LinkedIn)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Demo Batch</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
