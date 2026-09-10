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
      </div>

      <div className="workspace-name">
        <b className="workspace-title-heading">{workspaceName || 'Personal Workspace'}</b>
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
          <span className="sync-dot" title="Device Encrypted Storage Active" />
          <span>Daymark Studio</span>
        </p>
        <small>Encrypted Offline Vault • Local Sync</small>
      </div>
    </aside>
  );
}

