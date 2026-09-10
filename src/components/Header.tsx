interface HeaderProps {
  page: string;
  onActionClick?: () => void;
  actionLabel?: string;
  onOpenSearch?: () => void;
  onOpenSettings?: () => void;
  onBack?: () => void;
}

export function Header({ page, onActionClick, actionLabel, onOpenSearch, onOpenSettings, onBack }: HeaderProps) {
  const handleBackNavigation = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    }
  };

  const getSubheading = () => {
    switch (page) {
      case 'Today':
        return 'Make the day legible.';
      case 'Tasks':
        return 'Structure daily progress and next actions.';
      case 'Roadmaps':
        return 'See the path, not only the next task.';
      case 'Notes':
        return 'Capture insights, thoughts, and daily learnings.';
      case 'Files':
        return 'Organized record of attachments & documents.';
      case 'Reports':
        return 'Weekly and monthly progress analysis.';
      case 'Settings':
        return 'System appearance, data backups, and security baseline.';
      default:
        return page;
    }
  };

  const isTodayPage = page.toLowerCase() === 'today';

  return (
    <header className="topbar">
      <div className="header-title-container">
        {!isTodayPage && (
          <button
            type="button"
            className="header-mobile-back-btn"
            onClick={handleBackNavigation}
            title="Go back to previous page"
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <div className="header-text-group">
          <p className="eyebrow">DAYMARK — {page.toUpperCase()}</p>
          <h1>{getSubheading()}</h1>
        </div>
      </div>


      <div className="header-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onOpenSettings && (
          <button
            type="button"
            className={`header-settings-trigger ${page === 'Settings' ? 'active' : ''}`}
            onClick={onOpenSettings}
            title="Open Workspace Settings"
            aria-label="Settings"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}

        {onOpenSearch && (
          <button
            type="button"
            className="quiet-button header-search-trigger"
            onClick={onOpenSearch}
            title="Search all tasks, notes, roadmaps & files (Ctrl + K)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span className="search-text-label">Search...</span>
            <kbd className="esc-key-hint">Ctrl K</kbd>
          </button>
        )}


        {onActionClick && actionLabel && (
          <button className="primary-button" onClick={onActionClick}>
            {actionLabel}
          </button>
        )}
      </div>
    </header>
  );
}

