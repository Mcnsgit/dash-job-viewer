import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle2,
  FileCode,
  ArrowRight,
  Clipboard,
} from 'lucide-react';
import { parseCSVFile, parseCSVText } from '../utils/csvParser';
import { ParseResult } from '../types';

interface UploadZoneProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (result: ParseResult) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setErrorMsg(null);
    setParsing(true);
    try {
      const result = await parseCSVFile(file);
      if (result.jobs.length === 0) {
        setErrorMsg(result.errors[0] || 'No valid job listings found in this file.');
        setParseResult(null);
      } else {
        setParseResult(result);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse file.');
      setParseResult(null);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleParsePasted = () => {
    if (!pastedText.trim()) {
      setErrorMsg('Please paste CSV text first.');
      return;
    }
    setErrorMsg(null);
    try {
      const result = parseCSVText(pastedText, 'pasted_data.csv');
      if (result.jobs.length === 0) {
        setErrorMsg('No valid rows found in pasted text. Ensure header line contains: job_url, title, company, match_score');
        setParseResult(null);
      } else {
        setParseResult(result);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse CSV text.');
      setParseResult(null);
    }
  };

  const handleConfirmImport = () => {
    if (parseResult && parseResult.jobs.length > 0) {
      onImportSuccess(parseResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Import Job Listings</h2>
              <p className="text-xs text-gray-500">Upload CSV or JSON export from dash-bookmarks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200 px-6 pt-2 bg-white">
          <button
            onClick={() => {
              setActiveTab('file');
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'file'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Drag & Drop File (.csv, .json)
          </button>
          <button
            onClick={() => {
              setActiveTab('paste');
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Paste Raw Text
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {activeTab === 'file' ? (
            <div>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-gray-300 hover:border-blue-400 bg-gray-50/50 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Drop your export file here, or <span className="text-blue-600 underline">browse</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports <span className="text-gray-700 font-mono">.csv</span> or <span className="text-gray-700 font-mono">.json</span> (e.g. <span className="text-gray-700 font-mono">2026-08-14T13-51_export.csv</span>)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste CSV text with headers: job_url, title, company, location, match_score, match_reason..."
                rows={6}
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs font-mono text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-blue-500 shadow-2xs"
              />
              <button
                onClick={handleParsePasted}
                className="px-3 py-1.5 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 rounded-lg border border-gray-300 shadow-2xs transition cursor-pointer"
              >
                Validate Pasted Text
              </button>
            </div>
          )}

          {/* Error Notice */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-semibold">Import Warning</p>
                <p className="text-red-700">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Parse Success Preview */}
          {parseResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ready to Import: {parseResult.jobs.length} jobs detected</span>
              </div>
              <p className="text-xs text-gray-700">
                Source: <span className="font-mono text-gray-900 font-semibold">{parseResult.fileName}</span>
              </p>
              <div className="max-h-28 overflow-y-auto space-y-1 text-xs text-gray-600 pr-1">
                {parseResult.jobs.slice(0, 3).map((job, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-emerald-100">
                    <span className="truncate max-w-[280px] text-gray-800">{job.title}</span>
                    <span className="text-emerald-700 font-mono font-medium">{job.match_score}% fit</span>
                  </div>
                ))}
                {parseResult.jobs.length > 3 && (
                  <p className="text-[11px] text-gray-500 pt-1">+ {parseResult.jobs.length - 3} more records</p>
                )}
              </div>
            </div>
          )}

          {/* Expected Columns Reference */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-[11px] text-gray-600 space-y-1">
            <span className="font-semibold text-gray-800">Supported CSV Headers:</span>
            <p className="font-mono text-gray-500">job_url, title, company, location, match_score, match_reason, salary, posted_date</p>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={!parseResult || parseResult.jobs.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white rounded-xl shadow-xs transition cursor-pointer"
          >
            <span>Load {parseResult ? `${parseResult.jobs.length} Listings` : 'Listings'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
