interface PrivacyTermsModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export function PrivacyTermsModal({ type, onClose }: PrivacyTermsModalProps) {
  if (!type) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="composer legal-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">{type === 'privacy' ? 'PRIVACY & DATA BOUNDARY POLICY' : 'TERMS OF SERVICE'}</p>
            <h3 style={{ margin: 0 }}>{type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {type === 'privacy' ? (
          <div className="legal-body">
            <p>
              <strong>100% Offline &amp; Local-First Storage:</strong> Daymark stores all user data—including tasks, roadmaps, notes, focus logs, and attachments—locally on your device (IndexedDB &amp; LocalStorage).
            </p>
            <p>
              <strong>Zero Telemetry &amp; Data Mining:</strong> No personal logs, note content, or device activity are collected or transmitted to external servers. Your data stays entirely on your device.
            </p>
            <p>
              <strong>Complete Ownership &amp; Portability:</strong> You maintain 100% ownership of your work. You can export complete JSON backups, CSV spreadsheets, and text reports, or purge local storage at any time from Settings.
            </p>
          </div>
        ) : (
          <div className="legal-body">
            <p>
              <strong>Local Workspace Governance:</strong> Daymark is provided as a local-first offline workspace tool. You retain full freedom to manage, export, and modify your local data records.
            </p>
            <p>
              <strong>Device Security &amp; Backup Responsibility:</strong> Because Daymark operates offline on your device without cloud lock-in, maintaining device security and creating routine JSON data backups remains the responsibility of the device owner.
            </p>
            <p>
              <strong>High Performance &amp; Offline Guarantee:</strong> Daymark works seamlessly without an internet connection, ensuring instant loading, zero cloud dependency, and total availability.
            </p>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="primary-button" onClick={onClose}>
            I Understand
          </button>
        </div>
      </section>
    </div>
  );
}
