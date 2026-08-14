import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  Trash2,
  X,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { JobRecord, JobUserMeta, AppStoredState } from '../types';
import { exportJobsToCSV } from '../utils/csvParser';
import { getAllCachedJDs, loadAppState } from '../services/storageService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobRecord[];
  statuses: Record<string, JobUserMeta>;
  onRestoreBackup: (state: Partial<AppStoredState>) => void;
  onResetAll: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  jobs,
  statuses,
  onRestoreBackup,
  onResetAll,
}) => {
  const [copied, setCopied] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const downloadFile = (content: string, fileName: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csvContent = exportJobsToCSV(jobs, statuses);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(csvContent, `dash_jobs_export_${dateStr}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportFullJSON = async () => {
    const cachedJds = await getAllCachedJDs();
    const currentState = loadAppState();
    const payload = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      custom_jobs: jobs,
      job_statuses: statuses,
      active_filters: currentState.active_filters,
      cached_jds: cachedJds,
    };
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(
      JSON.stringify(payload, null, 2),
      `dash_job_viewer_backup_${dateStr}.json`,
      'application/json'
    );
  };

  const handleImportJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          if (parsed.custom_jobs || Array.isArray(parsed)) {
            const jobsToRestore = Array.isArray(parsed) ? parsed : parsed.custom_jobs;
            const statusesToRestore = parsed.job_statuses || {};
            onRestoreBackup({
              custom_jobs: jobsToRestore,
              job_statuses: statusesToRestore,
              active_filters: parsed.active_filters,
            });
            onClose();
          } else {
            alert('Invalid backup JSON structure.');
          }
        } catch (err: any) {
          alert(`Failed to parse backup JSON: ${err.message}`);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Export & Backup Options</h2>
              <p className="text-xs text-gray-500">Save your categorized applications and notes</p>
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
        <div className="p-6 space-y-4">
          
          {/* Export CSV Card */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-900">Export CSV Spreadsheet</h3>
              </div>
              <p className="text-xs text-gray-500">
                Exports all {jobs.length} jobs with status tags, match scores, and user notes for Excel or Google Sheets.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shrink-0 shadow-xs transition cursor-pointer"
            >
              Download CSV
            </button>
          </div>

          {/* Export Full JSON Backup Card */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Full JSON Backup</h3>
              </div>
              <p className="text-xs text-gray-500">
                Complete archive containing job listings, application status timeline, notes, and cached job descriptions.
              </p>
            </div>
            <button
              onClick={handleExportFullJSON}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shrink-0 shadow-xs transition cursor-pointer"
            >
              Download JSON
            </button>
          </div>

          {/* Restore JSON Backup Card */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-900">Restore Previous Backup</h3>
              </div>
              <p className="text-xs text-gray-500">
                Load a previously exported <span className="font-mono text-gray-700">.json</span> backup file.
              </p>
            </div>
            <input
              ref={jsonFileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportJSONFile}
            />
            <button
              onClick={() => jsonFileInputRef.current?.click()}
              className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-semibold shrink-0 shadow-2xs transition cursor-pointer"
            >
              Upload Backup
            </button>
          </div>

          {/* Clear / Reset Area */}
          <div className="pt-2 border-t border-gray-200">
            {showResetConfirm ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                <div className="flex items-start gap-2 text-xs text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p>
                    Are you sure? This will clear all custom job listings, notes, and cached descriptions from your browser.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onResetAll();
                      setShowResetConfirm(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition shadow-xs cursor-pointer"
                  >
                    Yes, Reset to Demo Data
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 hover:underline py-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset all local tracking state & cache</span>
              </button>
            )}
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
