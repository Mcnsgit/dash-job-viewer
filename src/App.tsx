import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { JobList } from './components/LeftPane/JobList';
import { JobDetail } from './components/RightPane/JobDetail';
import { UploadZone } from './components/UploadZone';
import { AnalyticsModal } from './components/AnalyticsModal';
import { ExportModal } from './components/ExportModal';
import {
  loadAppState,
  saveAppState,
  setJobMeta,
  DEFAULT_FILTERS,
  clearAllCachedJDs,
} from './services/storageService';
import { JobRecord, JobStatus, JobUserMeta, FilterState, ParseResult, AppStoredState } from './types';
import { SAMPLE_JOBS } from './data/sampleJobs';

export default function App() {
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [statuses, setStatuses] = useState<Record<string, JobUserMeta>>({});
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | undefined>(undefined);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Mobile drawer view state
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const saved = loadAppState();
    setJobs(saved.custom_jobs || SAMPLE_JOBS);
    setStatuses(saved.job_statuses || {});
    setFilters(saved.active_filters || DEFAULT_FILTERS);
    setFileName(saved.last_imported_file);

    const initialSelect = saved.selected_job_id || (saved.custom_jobs?.[0]?.id ?? SAMPLE_JOBS[0].id);
    setSelectedJobId(initialSelect);
    setInitialLoaded(true);
  }, []);

  // 2. Persist state changes
  useEffect(() => {
    if (!initialLoaded) return;
    saveAppState({
      custom_jobs: jobs,
      job_statuses: statuses,
      active_filters: filters,
      selected_job_id: selectedJobId,
      last_imported_file: fileName,
    });
  }, [jobs, statuses, filters, selectedJobId, fileName, initialLoaded]);

  // Active selected job object
  const selectedJob = useMemo(() => {
    if (!selectedJobId) return jobs[0] || null;
    return jobs.find((j) => j.id === selectedJobId) || jobs[0] || null;
  }, [jobs, selectedJobId]);

  // Handlers
  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setShowMobileDetail(true);
  };

  const handleStatusChange = (status: Exclude<JobStatus, 'all'>) => {
    if (!selectedJob) return;
    const updated = setJobMeta(selectedJob.id, { status });
    setStatuses({ ...updated });
  };

  const handleQuickStatusChange = (jobId: string, status: Exclude<JobStatus, 'all'>) => {
    const updated = setJobMeta(jobId, { status });
    setStatuses({ ...updated });
  };

  const handleNotesChange = (notes: string) => {
    if (!selectedJob) return;
    const updated = setJobMeta(selectedJob.id, { notes });
    setStatuses({ ...updated });
  };

  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleImportSuccess = (result: ParseResult) => {
    setJobs(result.jobs);
    setFileName(result.fileName);
    if (result.jobs.length > 0) {
      setSelectedJobId(result.jobs[0].id);
    }
  };

  const handleLoadSampleData = () => {
    setJobs(SAMPLE_JOBS);
    setFileName('Demo UK Jobs Batch (12 Roles)');
    setSelectedJobId(SAMPLE_JOBS[0].id);
  };

  const handleClearAllData = async () => {
    await clearAllCachedJDs();
    localStorage.clear();
    setJobs(SAMPLE_JOBS);
    setStatuses({});
    setFilters(DEFAULT_FILTERS);
    setSelectedJobId(SAMPLE_JOBS[0].id);
    setFileName(undefined);
  };

  const handleRestoreBackup = (state: Partial<AppStoredState>) => {
    if (state.custom_jobs) setJobs(state.custom_jobs);
    if (state.job_statuses) setStatuses(state.job_statuses);
    if (state.active_filters) setFilters(state.active_filters);
    if (state.custom_jobs && state.custom_jobs.length > 0) {
      setSelectedJobId(state.custom_jobs[0].id);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50 text-gray-800 overflow-hidden select-none font-sans">
      
      {/* Top Main Navigation Header */}
      <Header
        jobs={jobs}
        statuses={statuses}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onLoadSampleData={handleLoadSampleData}
        onClearAllData={handleClearAllData}
        fileName={fileName}
      />

      {/* Main Split-Pane Layout */}
      <main className="flex-1 flex overflow-hidden relative bg-gray-50">
        
        {/* Left Pane (Master Feed): 380px - 440px width on desktop */}
        <div
          className={`w-full md:w-[380px] lg:w-[420px] xl:w-[460px] shrink-0 h-full flex flex-col transition-transform duration-200 z-10 ${
            showMobileDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          <JobList
            jobs={jobs}
            statuses={statuses}
            selectedJobId={selectedJob?.id || null}
            filters={filters}
            onFilterChange={handleFilterChange}
            onSelectJob={handleSelectJob}
            onQuickStatusChange={handleQuickStatusChange}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Right Pane (Detail & JD Reader): remaining flexible width */}
        <div
          className={`flex-1 h-full overflow-hidden flex flex-col bg-white ${
            !showMobileDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          <JobDetail
            job={selectedJob}
            userMeta={selectedJob ? statuses[selectedJob.id] : undefined}
            onStatusChange={handleStatusChange}
            onNotesChange={handleNotesChange}
            onBackToFeed={() => setShowMobileDetail(false)}
          />
        </div>

      </main>

      {/* Upload Modal */}
      <UploadZone
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        jobs={jobs}
        statuses={statuses}
      />

      {/* Export & Backup Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        jobs={jobs}
        statuses={statuses}
        onRestoreBackup={handleRestoreBackup}
        onResetAll={handleClearAllData}
      />

    </div>
  );
}
