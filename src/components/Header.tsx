interface HeaderProps {
  page: string;
  onActionClick?: () => void;
  actionLabel?: string;
  onOpenSearch?: () => void;
}

export function Header({ page, onActionClick, actionLabel, onOpenSearch }: HeaderProps) {
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
      <div>
        <p className="eyebrow">DAYMARK ECOSYSTEM</p>
        <h1>{getSubheading()}</h1>
      </div>

      <div className="header-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {onOpenSearch && (
          <button
            type="button"
            className="quiet-button header-search-trigger"
            onClick={onOpenSearch}
            title="Search all tasks, notes, roadmaps & files (Ctrl + K)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 12px',
              fontSize: '13px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span>Search...</span>
            <kbd className="esc-key-hint" style={{ fontSize: '9px', padding: '1px 5px' }}>Ctrl K</kbd>
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
