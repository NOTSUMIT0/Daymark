interface HeaderProps {
  page: string;
  onActionClick?: () => void;
  actionLabel?: string;
  onOpenSearch?: () => void;
  onBack?: () => void;
}

export function Header({ page, onActionClick, actionLabel, onOpenSearch, onBack }: HeaderProps) {
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

  return (
    <header className="topbar">
      <div className="header-title-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
        <div>
          <p className="eyebrow">DAYMARK — {page.toUpperCase()}</p>
          <h1>{getSubheading()}</h1>
        </div>
      </div>

      <div className="header-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

