interface PrivacyTermsModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export function PrivacyTermsModal({ type, onClose }: PrivacyTermsModalProps) {
  if (!type) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="composer legal-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close modal">
          ×
        </button>
        {type === 'privacy' ? (
          <>
            <p className="eyebrow">PRIVACY & DATA BOUNDARY POLICY</p>
            <h2>Privacy Policy</h2>
            <div className="legal-body">
              <p>
                <strong>Local-First Guarantee:</strong> Daymark stores all user data—including tasks, roadmaps, notes, work logs, and attachments—locally on your device.
              </p>
              <p>
                <strong>No Unauthorized Telemetry:</strong> No personal logs or note text are transmitted to remote servers during Phase 0 or Phase 1.
              </p>
              <p>
                <strong>Data Portability & Encryption:</strong> You retain complete ownership of your data. You may export or purge your local records at any time from the Settings page.
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">TERMS OF SERVICE</p>
            <h2>Terms of Service</h2>
            <div className="legal-body">
              <p>
                <strong>Open Source & Self-Hostable:</strong> Daymark is provided under open-source standards. You have full permission to host and run your personal instance.
              </p>
              <p>
                <strong>Device Security Responsibility:</strong> As a local-first system, device-level security (disk encryption, strong lock passwords, SSH administrative key hygiene) remains the responsibility of the device operator.
              </p>
            </div>
          </>
        )}
        <div className="modal-actions">
          <button className="primary-button" onClick={onClose}>
            I Understand
          </button>
        </div>
      </section>
    </div>
  );
}
