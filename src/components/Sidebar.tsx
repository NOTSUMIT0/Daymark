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
      <button className="wordmark" onClick={() => onSelectPage('Today')}>
        <span>D</span>aymark
      </button>

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
