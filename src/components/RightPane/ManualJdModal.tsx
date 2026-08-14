import React, { useState } from 'react';
import { FileText, X, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';

interface ManualJdModalProps {
  isOpen: boolean;
  jobTitle: string;
  jobUrl: string;
  onClose: () => void;
  onSave: (content: string) => void;
}

export const ManualJdModal: React.FC<ManualJdModalProps> = ({
  isOpen,
  jobTitle,
  jobUrl,
  onClose,
  onSave,
}) => {
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSave(content.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Paste Job Description</h2>
              <p className="text-xs text-gray-500 truncate max-w-md">{jobTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
              <span className="text-gray-700">Target site blocking automated proxy fetching?</span>
              {jobUrl && (
                <a
                  href={jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                >
                  <span>Open Job in New Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Copy text or HTML from the job listing page and paste here:
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste the job description, responsibilities, requirements, and benefits text here..."
                rows={10}
                className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-blue-500 font-sans shadow-2xs"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold text-white rounded-xl shadow-xs transition cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Save to Reader Cache</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
