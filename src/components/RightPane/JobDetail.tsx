import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  MapPin,
  Building2,
  Calendar,
  Sparkles,
  RefreshCw,
  FileText,
  Bookmark,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  AlertCircle,
  Share2,
  PenSquare,
  BookOpen,
  Send,
  EyeOff,
  ChevronLeft,
} from 'lucide-react';
import { JobRecord, JobStatus, JobUserMeta, EnrichedJD } from '../../types';
import { fetchAndEnrichJD, saveManualJD } from '../../services/jdFetcher';
import { getCachedJD } from '../../services/storageService';
import { ManualJdModal } from './ManualJdModal';

interface JobDetailProps {
  job: JobRecord | null;
  userMeta?: JobUserMeta;
  onStatusChange: (status: Exclude<JobStatus, 'all'>) => void;
  onNotesChange: (notes: string) => void;
  onBackToFeed?: () => void; // for mobile
}

export const JobDetail: React.FC<JobDetailProps> = ({
  job,
  userMeta,
  onStatusChange,
  onNotesChange,
  onBackToFeed,
}) => {
  const [enrichedJd, setEnrichedJd] = useState<EnrichedJD | null>(null);
  const [loadingJd, setLoadingJd] = useState(false);
  const [jdError, setJdError] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'reader' | 'notes'>('reader');
  const [notesInput, setNotesInput] = useState(userMeta?.notes || '');

  // Keep local notes input synced
  useEffect(() => {
    setNotesInput(userMeta?.notes || '');
  }, [userMeta?.notes, job?.id]);

  // Load JD on job change
  useEffect(() => {
    if (!job) {
      setEnrichedJd(null);
      return;
    }

    let isMounted = true;

    async function loadJD() {
      if (!job) return;
      setLoadingJd(true);
      setJdError(null);
      setIsBlocked(false);

      // 1. Check cache first
      const cached = await getCachedJD(job.id);
      if (cached) {
        if (isMounted) {
          setEnrichedJd(cached);
          setLoadingJd(false);
        }
        return;
      }

      // 2. Fetch via CORS proxy
      const result = await fetchAndEnrichJD(job.id, job.job_url);
      if (isMounted) {
        if (result.jd) {
          setEnrichedJd(result.jd);
          setJdError(null);
        } else {
          setJdError(result.error || 'Could not fetch job description.');
          setIsBlocked(!!result.isCloudflareOrBlocked);
        }
        setLoadingJd(false);
      }
    }

    loadJD();

    return () => {
      isMounted = false;
    };
  }, [job?.id, job?.job_url]);

  const handleRefreshJd = async () => {
    if (!job) return;
    setLoadingJd(true);
    setJdError(null);
    setIsBlocked(false);
    const result = await fetchAndEnrichJD(job.id, job.job_url, true);
    if (result.jd) {
      setEnrichedJd(result.jd);
    } else {
      setJdError(result.error || 'Failed to refresh job description.');
      setIsBlocked(!!result.isCloudflareOrBlocked);
    }
    setLoadingJd(false);
  };

  const handleSaveManualJd = async (content: string) => {
    if (!job) return;
    const enriched = await saveManualJD(job.id, content, job.title);
    setEnrichedJd(enriched);
    setJdError(null);
    setIsBlocked(false);
  };

  const handleCopyLink = () => {
    if (job?.job_url) {
      navigator.clipboard.writeText(job.job_url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleNotesBlur = () => {
    onNotesChange(notesInput);
  };

  const addNoteTemplate = (template: string) => {
    const today = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const prefix = notesInput.trim() ? `${notesInput.trim()}\n• ` : '• ';
    const newText = `${prefix}${template.replace('{date}', today)}`;
    setNotesInput(newText);
    onNotesChange(newText);
  };

  if (!job) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 text-gray-400 h-full">
        <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 mb-4 shadow-xs">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-gray-800">No Job Selected</h3>
        <p className="text-xs text-gray-500 max-w-sm mt-1">
          Select any listing from the left feed to preview match details, read full job descriptions, and track your application notes.
        </p>
      </div>
    );
  }

  const currentStatus = userMeta?.status || 'Saved';

  // Match score styles
  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        text: 'High Match',
        bar: 'bg-emerald-600',
      };
    }
    if (score >= 60) {
      return {
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        text: 'Moderate Match',
        bar: 'bg-amber-500',
      };
    }
    return {
      badge: 'bg-gray-100 text-gray-600 border-gray-200',
      text: 'Low Match',
      bar: 'bg-gray-400',
    };
  };

  const scoreMeta = getScoreBadge(job.match_score);

  return (
    <div className="flex-1 flex flex-col h-full bg-white text-gray-800 overflow-hidden">
      
      {/* Detail Header & Action Toolbar */}
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-white shrink-0 space-y-4 shadow-2xs">
        
        {/* Mobile Back Button */}
        {onBackToFeed && (
          <button
            onClick={onBackToFeed}
            className="md:hidden inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition mb-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Job Feed</span>
          </button>
        )}

        {/* Title, Company & Score Gauge Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-blue-600 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {job.company}
              </span>
              {job.source && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                  via {job.source}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 leading-tight">
              {job.title}
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 pt-0.5">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{job.location}</span>
              </div>
              {job.salary && (
                <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <span>{job.salary}</span>
                </div>
              )}
              {job.posted_date && (
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Posted {job.posted_date}</span>
                </div>
              )}
            </div>
          </div>

          {/* Match Score Indicator Gauge */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center p-3 rounded-xl bg-gray-50 border border-gray-200 shrink-0 gap-1.5 min-w-[140px]">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-mono text-gray-900">
                {job.match_score}%
              </span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${scoreMeta.badge}`}>
                {scoreMeta.text}
              </span>
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1 hidden sm:block">
              <div
                className={`h-full ${scoreMeta.bar} transition-all duration-500`}
                style={{ width: `${Math.min(100, job.match_score)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Primary Controls Row: Status Switcher & External Apply Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-gray-200">
          
          {/* Status Selector Pills & Mark Applied Shortcut */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
              {(['Saved', 'Applied', 'Interviewing', 'Rejected', 'Hidden'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusChange(status)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                    currentStatus === status
                      ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {currentStatus === 'Saved' && (
              <button
                onClick={() => onStatusChange('Applied')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer shadow-2xs"
                title="Quick mark as applied"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark as Applied</span>
              </button>
            )}
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-2xs transition cursor-pointer"
              title="Copy Job Link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            {job.job_url && (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
              >
                <span>Apply on Job Board</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

        </div>

      </div>

      {/* Match Reason Callout Card */}
      <div className="px-4 sm:px-6 py-3 bg-gray-50/70 border-b border-gray-200">
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/80 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Match Engine Rationale
            </h4>
            <p className="text-xs text-blue-950/90 leading-relaxed font-sans">
              {job.match_reason}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Header: Reader Mode vs Notes */}
      <div className="flex items-center justify-between px-6 border-b border-gray-200 bg-white shrink-0">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('reader')}
            className={`flex items-center gap-2 py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'reader'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Job Description Reader</span>
            {enrichedJd && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'notes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <PenSquare className="w-4 h-4" />
            <span>Application Notes & Log</span>
            {notesInput.trim() && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            )}
          </button>
        </div>

        {activeTab === 'reader' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManualModal(true)}
              className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition cursor-pointer shadow-2xs"
              title="Paste custom text or HTML for this JD"
            >
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <span>Paste JD</span>
            </button>

            <button
              onClick={handleRefreshJd}
              disabled={loadingJd}
              className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition cursor-pointer shadow-2xs"
              title="Re-fetch via CORS proxy"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingJd ? 'animate-spin' : ''}`} />
              <span>Re-fetch</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
        {activeTab === 'reader' ? (
          <div className="max-w-3xl mx-auto space-y-4">
            
            {loadingJd ? (
              <div className="space-y-4 py-8 animate-pulse">
                <div className="h-6 bg-gray-200 rounded-md w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                <div className="space-y-2 pt-4">
                  <div className="h-3 bg-gray-200 rounded-md w-full"></div>
                  <div className="h-3 bg-gray-200 rounded-md w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded-md w-4/5"></div>
                  <div className="h-3 bg-gray-200 rounded-md w-full"></div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 pt-4 justify-center">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Fetching and extracting clean text via CORS proxy pool...</span>
                </div>
              </div>
            ) : enrichedJd ? (
              <div className="space-y-4">
                
                {/* Meta info bar about extraction */}
                <div className="flex items-center justify-between text-[11px] text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Clean Reader Mode ({enrichedJd.source_type === 'proxy' ? `Fetched via ${enrichedJd.proxy_used || 'Proxy'}` : enrichedJd.source_type === 'manual' ? 'Manually Pasted' : 'Cached'})
                  </span>
                  <span>{new Date(enrichedJd.fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Extracted Body Content */}
                <div
                  className="prose prose-slate max-w-none text-gray-800 text-sm leading-relaxed space-y-3 font-sans"
                  dangerouslySetInnerHTML={{
                    __html: enrichedJd.contentHtml || `<p>${enrichedJd.textContent}</p>`,
                  }}
                />
              </div>
            ) : (
              <div className="py-8 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
                  <AlertCircle className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {isBlocked ? 'External Site Has Bot Verification' : 'Job Description Fetch Pending'}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                    {jdError ||
                      'Target job board protected by Cloudflare. You can open the listing directly or paste the text in one click.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {job.job_url && (
                    <a
                      href={job.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-2xs transition cursor-pointer"
                    >
                      <span>1. Open Job in New Tab</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={() => setShowManualModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>2. Paste Job Description</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Application Notes & Log Tab */
          <div className="max-w-3xl mx-auto space-y-4">
            
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Your Application Notes & Journal
                </h4>
                {userMeta?.updated_at && (
                  <span className="text-[11px] text-gray-500">
                    Last updated: {new Date(userMeta.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              <textarea
                value={notesInput}
                onChange={(e) => {
                  setNotesInput(e.target.value);
                  onNotesChange(e.target.value);
                }}
                onBlur={handleNotesBlur}
                placeholder="Log application notes, tailored resume keywords, recruiter contact details, questions for the interview..."
                rows={8}
                className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-blue-500 font-mono leading-relaxed shadow-2xs"
              />

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Auto-saved to browser local storage.
                </p>
                <button
                  onClick={handleNotesBlur}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
                >
                  Save Notes
                </button>
              </div>
            </div>

            {/* Quick Note Snippets */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500">Quick Log Templates:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => addNoteTemplate('Applied on company careers portal on {date}')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition cursor-pointer shadow-2xs"
                >
                  + Applied on portal
                </button>
                <button
                  onClick={() => addNoteTemplate('Recruiter screening call scheduled for {date}')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition cursor-pointer shadow-2xs"
                >
                  + Recruiter screen
                </button>
                <button
                  onClick={() => addNoteTemplate('Technical interview stage 1 completed on {date}')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition cursor-pointer shadow-2xs"
                >
                  + Technical round
                </button>
                <button
                  onClick={() => addNoteTemplate('Followed up with hiring team on {date}')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition cursor-pointer shadow-2xs"
                >
                  + Followed up
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Manual Paste Modal */}
      <ManualJdModal
        isOpen={showManualModal}
        jobTitle={job.title}
        jobUrl={job.job_url}
        onClose={() => setShowManualModal(false)}
        onSave={handleSaveManualJd}
      />

    </div>
  );
};
