interface HeaderProps {
  page: string;
  onActionClick?: () => void;
  actionLabel?: string;
}

export function Header({ page, onActionClick, actionLabel }: HeaderProps) {
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
      {onActionClick && actionLabel && (
        <button className="primary-button" onClick={onActionClick}>
          {actionLabel}
        </button>
      )}
    </header>
  );
}
