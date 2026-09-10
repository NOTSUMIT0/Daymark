import { useState } from 'react';
import { downloadFile } from '../utils/storage';

export interface ExportModalOptions {
  isOpen: boolean;
  title: string;
  filename: string;
  content: string;
  mimeType: string;
  onClose: () => void;
}

export function AppExportModal({
  isOpen,
  title,
  filename,
  content,
  mimeType,
  onClose
}: ExportModalOptions) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleTriggerDownload = () => {
    downloadFile(filename, content, mimeType);
  };

  const dataUri = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card export-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">DATA PORTABILITY & EXPORT</p>
            <h3>{title}</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="export-modal-body">
          <div className="export-filename-bar">
            <span className="export-filename-label">FILE: <strong>{filename}</strong></span>
            {copied && <span className="copied-toast-pill">Copied to Clipboard! ✓</span>}
          </div>

          <p className="export-modal-hint">
            Below is your generated output data. On mobile devices, tap <strong>Copy to Clipboard</strong> to paste into your notes/messages, or tap <strong>Save / Download File</strong>.
          </p>

          <textarea
            className="export-preview-textarea"
            value={content}
            readOnly
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />

          <div className="export-modal-actions">
            <button
              type="button"
              className={`primary-button copy-export-btn ${copied ? 'copied-success' : ''}`}
              onClick={handleCopy}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              <span>{copied ? '✓ Copied to Clipboard!' : 'Copy to Clipboard'}</span>
            </button>

            <a
              href={dataUri}
              download={filename}
              className="quiet-button export-data-link"
              onClick={handleTriggerDownload}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Save / Download File</span>
            </a>

            <button type="button" className="quiet-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
