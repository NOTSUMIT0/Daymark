interface SidebarProps {
  activePage: string;
  onSelectPage: (page: string) => void;
  taskCount: number;
  workspaceName?: string;
}

export function Sidebar({ activePage, onSelectPage, taskCount, workspaceName }: SidebarProps) {
  const pages = [
    { id: 'Today', label: 'Today' },
    { id: 'Tasks', label: 'Tasks', count: taskCount },
    { id: 'Roadmaps', label: 'Roadmaps' },
    { id: 'Notes', label: 'Notes' },
    { id: 'Files', label: 'Files' },
    { id: 'Reports', label: 'Reports' },
    { id: 'Settings', label: 'Settings' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header-row">
        <button className="wordmark" onClick={() => onSelectPage('Today')}>
          <span>D</span>aymark
        </button>
        <button
          type="button"
          className={`sidebar-settings-icon-btn ${activePage === 'Settings' ? 'active' : ''}`}
          onClick={() => onSelectPage('Settings')}
          title="Open Workspace Settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 0010.7 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 10.7a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
      </div>

      <div className="workspace-name">
        <b>{workspaceName || 'Personal Workspace'}</b>
        <small>IndexedDB Engine · v1.0 Production</small>
      </div>

      <nav aria-label="Main Navigation">
        {pages.map((item) => (
          <button
            key={item.id}
            className={activePage === item.id ? 'active' : ''}
            onClick={() => onSelectPage(item.id)}
          >
            <span>{item.label}</span>
            {item.count !== undefined && item.count > 0 && <em>{item.count}</em>}
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <p>
          <span className="sync-dot" title="Device Encrypted IndexedDB Storage Active" />
          <span>IndexedDB Engine Active</span>
        </p>
        <small>Phase 1 & 2 Local-First Core</small>
      </div>
    </aside>
  );
}
