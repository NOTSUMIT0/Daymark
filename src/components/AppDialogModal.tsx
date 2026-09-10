import React from 'react';

export interface DialogOptions {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'info' | 'confirm' | 'danger' | 'success';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AppDialogModalProps {
  dialog: DialogOptions;
  onClose: () => void;
}

export function AppDialogModal({ dialog, onClose }: AppDialogModalProps) {
  if (!dialog.isOpen) return null;

  const isDanger = dialog.type === 'danger';
  const isConfirm = dialog.type === 'confirm' || isDanger;

  const handleConfirm = () => {
    if (dialog.onConfirm) dialog.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (dialog.onCancel) dialog.onCancel();
    onClose();
  };

  return (
    <div className="app-dialog-overlay" onClick={handleCancel}>
      <div
        className="app-dialog-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="dialog-header">
          <div className={`dialog-badge ${dialog.type || 'info'}`}>
            DAYMARK SYSTEM WORKSPACE
          </div>
          <button
            type="button"
            className="dialog-close-btn"
            onClick={handleCancel}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <h3 className="dialog-title">{dialog.title}</h3>
        <p className="dialog-message">{dialog.message}</p>

        <div className="dialog-actions">
          {isConfirm && (
            <button
              type="button"
              className="quiet-button"
              onClick={handleCancel}
            >
              {dialog.cancelLabel || 'Cancel'}
            </button>
          )}
          <button
            type="button"
            className={`primary-button ${isDanger ? 'danger-btn' : ''}`}
            onClick={handleConfirm}
            autoFocus
          >
            {dialog.confirmLabel || (isConfirm ? 'Confirm' : 'Acknowledge')}
          </button>
        </div>
      </div>
    </div>
  );
}
