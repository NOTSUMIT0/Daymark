import { useState, useRef, useEffect } from 'react';
import { Task, TaskPriority, NodeStatus } from '../types';
import { CustomSelect } from '../components/CustomSelect';

interface TasksPageProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export function TasksPage({ tasks, onAddTask, onUpdateTask, onDeleteTask }: TasksPageProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | NodeStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('med');
  const [status, setStatus] = useState<NodeStatus>('pending');
  const [category, setCategory] = useState('Development');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceLabel, setResourceLabel] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Custom Dropdown State
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setIsCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = ['all', 'Development', 'Design', 'Architecture', 'Security', 'Planning', 'General'];

  // Status Normalizer
  const normalizeStatus = (s: string): NodeStatus => {
    const lower = (s || '').toLowerCase().trim();
    if (lower === 'complete' || lower === 'completed' || lower === 'done') return 'complete';
    if (lower === 'progress' || lower === 'in-progress' || lower === 'in progress' || lower === 'in_progress') return 'progress';
    return 'pending';
  };

  // Priority Normalizer
  const isHighPriority = (p: string) => (p || '').toLowerCase() === 'high';
  const getPriorityClass = (p: string) => {
    const lower = (p || '').toLowerCase();
    if (lower === 'high') return 'high';
    if (lower === 'low') return 'low';
    return 'med';
  };
  const formatPriorityText = (p: string) => {
    const lower = (p || '').toLowerCase();
    if (lower === 'high') return 'HIGH';
    if (lower === 'low') return 'LOW';
    return 'MEDIUM';
  };

  // Date Formatter
  const formatDueDateDisplay = (dateStr?: string) => {
    if (!dateStr || !dateStr.trim()) return 'No due date';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    const normStatus = normalizeStatus(t.status);
    const matchesStatus = statusFilter === 'all' ? true : normStatus === statusFilter;
    const matchesCategory =
      categoryFilter === 'all'
        ? true
        : (t.category || 'General').toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.category || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const pendingCount = tasks.filter((t) => normalizeStatus(t.status) === 'pending').length;
  const progressCount = tasks.filter((t) => normalizeStatus(t.status) === 'progress').length;
  const completedCount = tasks.filter((t) => normalizeStatus(t.status) === 'complete').length;
  const highPriorityCount = tasks.filter((t) => isHighPriority(t.priority) && normalizeStatus(t.status) !== 'complete').length;
  const completionPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDetail('');
    setPriority('med');
    setStatus('pending');
    setCategory('Development');
    setResourceUrl('');
    setResourceLabel('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const openEditModal = (t: Task) => {
    setEditingTask(t);
    setTitle(t.title);
    setDetail(t.detail);
    setPriority(getPriorityClass(t.priority) as TaskPriority);
    setStatus(normalizeStatus(t.status));
    setCategory(t.category || 'Development');
    setResourceUrl(t.resourceUrl || '');
    setResourceLabel(t.resourceLabel || '');
    setDueDate(t.dueDate || new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        title: title.trim(),
        detail: detail.trim(),
        priority,
        status,
        category,
        resourceUrl: resourceUrl.trim() || undefined,
        resourceLabel: resourceLabel.trim() || undefined,
        dueDate: dueDate || new Date().toISOString().split('T')[0]
      });
    } else {
      onAddTask({
        title: title.trim(),
        detail: detail.trim(),
        priority,
        status,
        category,
        resourceUrl: resourceUrl.trim() || undefined,
        resourceLabel: resourceLabel.trim() || undefined,
        dueDate: dueDate || new Date().toISOString().split('T')[0]
      });
    }

    setShowModal(false);
  };

  return (
    <section className="page tasks-page">
      {/* Task Summary Metrics Bar */}
      <div className="tasks-summary-bar">
        <div className="summary-card">
          <span className="eyebrow">TOTAL TASKS</span>
          <strong>{tasks.length}</strong>
        </div>
        <div className="summary-card">
          <span className="eyebrow">COMPLETED RATE</span>
          <strong>{completionPercentage}%</strong>
          <div className="mini-progress-bar">
            <div className="fill" style={{ width: `${completionPercentage}%` }} />
          </div>
        </div>
        <div className="summary-card">
          <span className="eyebrow">HIGH PRIORITY PENDING</span>
          <strong className="text-danger">{highPriorityCount}</strong>
        </div>
      </div>

      {/* Main Responsive Toolbar */}
      <div className="tasks-toolbar">
        {/* All 4 Status Filters visible side by side / grid */}
        <div className="filter-group">
          <button
            type="button"
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({tasks.length})
          </button>
          <button
            type="button"
            className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            className={`filter-btn ${statusFilter === 'progress' ? 'active' : ''}`}
            onClick={() => setStatusFilter('progress')}
          >
            In Progress ({progressCount})
          </button>
          <button
            type="button"
            className={`filter-btn ${statusFilter === 'complete' ? 'active' : ''}`}
            onClick={() => setStatusFilter('complete')}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Custom Category Dropdown (Desktop & Mobile Unified) */}
        <div className="custom-roadmap-dropdown category-dropdown-wrapper" ref={catDropdownRef}>
          <button
            type="button"
            className={`roadmap-dropdown-trigger ${isCatDropdownOpen ? 'open' : ''}`}
            onClick={() => setIsCatDropdownOpen((prev) => !prev)}
          >
            <span>
              {categoryFilter === 'all' ? 'All Categories' : `Category: ${categoryFilter}`}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isCatDropdownOpen && (
            <div className="roadmap-dropdown-menu">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`roadmap-dropdown-item ${categoryFilter === c ? 'active' : ''}`}
                  onClick={() => {
                    setCategoryFilter(c);
                    setIsCatDropdownOpen(false);
                  }}
                >
                  <span>{c === 'all' ? 'All Categories' : c}</span>
                  {categoryFilter === c && <span className="check-icon">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          type="text"
          className="search-input task-search"
          placeholder="Search tasks or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button type="button" className="primary-button" onClick={openCreateModal}>
          + Create Task
        </button>
      </div>

      {/* Tasks Grid List */}
      <section className="panel tasks-panel">
        {filteredTasks.length === 0 ? (
          <div className="empty-tasks-container">
            <div className="empty-icon">📋</div>
            <h3>No Tasks Found</h3>
            <p>
              No tasks match the current status filter ({statusFilter.toUpperCase()}) or category search.
            </p>
            <div className="empty-actions">
              <button
                type="button"
                className="quiet-button"
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setSearchTerm('');
                }}
              >
                Reset Filters
              </button>
              <button type="button" className="primary-button" onClick={openCreateModal}>
                + Create Task
              </button>
            </div>
          </div>
        ) : (
          <div className="task-cards-grid">
            {filteredTasks.map((t) => {
              const currentNormStatus = normalizeStatus(t.status);
              const normPriority = getPriorityClass(t.priority);
              return (
                <div
                  key={t.id}
                  className={`task-card-item status-${currentNormStatus} priority-${normPriority}`}
                >
                  <div className="task-card-top">
                    <div className="status-badge-group">
                      <button
                        type="button"
                        className={`status-toggle-btn ${currentNormStatus}`}
                        title="Click to advance status"
                        onClick={() => {
                          const nextStatus: NodeStatus =
                            currentNormStatus === 'pending'
                              ? 'progress'
                              : currentNormStatus === 'progress'
                              ? 'complete'
                              : 'pending';
                          onUpdateTask({ ...t, status: nextStatus });
                        }}
                      >
                        <span className="dot" />
                        <span>{currentNormStatus.toUpperCase()}</span>
                      </button>
                      {t.category && <span className="category-chip">{t.category}</span>}
                    </div>
                    <span className={`priority-tag ${normPriority}`}>
                      {formatPriorityText(t.priority)}
                    </span>
                  </div>

                  <h3 className={`task-card-title ${currentNormStatus === 'complete' ? 'completed-text' : ''}`}>
                    {t.title}
                  </h3>

                  {t.detail && <p className="task-card-detail">{t.detail}</p>}

                  <div className="task-card-bottom">
                    <div className="meta-tags-row">
                      {t.dueDate && (
                        <span className="due-date-chip">
                          📅 {formatDueDateDisplay(t.dueDate)}
                        </span>
                      )}
                      {t.resourceUrl && (
                        <a
                          href={t.resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="resource-chip"
                        >
                          🔗 {t.resourceLabel || 'Resource Link'}
                        </a>
                      )}
                    </div>

                    <div className="task-actions-row">
                      <button
                        type="button"
                        className="quiet-button sm-btn"
                        onClick={() => openEditModal(t)}
                      >
                        Edit ✎
                      </button>
                      <button
                        type="button"
                        className="quiet-button danger-sm"
                        onClick={() => onDeleteTask(t.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Task Creation & Editing Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card task-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">{editingTask ? 'EDIT TASK ENTRY' : 'NEW TASK ENTRY'}</p>
                <h3>{editingTask ? 'Update Task Details' : 'Create New Task'}</h3>
              </div>
              <button type="button" className="close-btn" onClick={() => setShowModal(false)} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="task-form-body">
              <label className="form-label">
                Task Title
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Audit database query execution plan"
                  autoFocus
                />
              </label>

              <label className="form-label">
                Description &amp; Action Steps
                <textarea
                  className="form-textarea"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="Describe next concrete actions, requirements, and deliverables..."
                />
              </label>

              <div className="form-row-3col">
                <label className="form-label">
                  Category
                  <CustomSelect
                    value={category}
                    options={['Development', 'Design', 'Architecture', 'Security', 'Planning', 'General']}
                    onChange={(val) => setCategory(val)}
                  />
                </label>

                <label className="form-label">
                  Priority Level
                  <CustomSelect
                    value={priority}
                    options={[
                      { value: 'high', label: 'High Priority' },
                      { value: 'med', label: 'Medium Priority' },
                      { value: 'low', label: 'Low Priority' }
                    ]}
                    onChange={(val) => setPriority(val as TaskPriority)}
                  />
                </label>

                <label className="form-label">
                  Status
                  <CustomSelect
                    value={status}
                    options={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'progress', label: 'In Progress' },
                      { value: 'complete', label: 'Completed' }
                    ]}
                    onChange={(val) => setStatus(val as NodeStatus)}
                  />
                </label>
              </div>

              <div className="form-row-2col">
                <label className="form-label">
                  Resource Link URL (Docs, Figma, PR)
                  <input
                    type="url"
                    className="form-input"
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                    placeholder="https://github.com/... or https://figma.com/..."
                  />
                </label>

                <label className="form-label">
                  Link Title / Label
                  <input
                    type="text"
                    className="form-input"
                    value={resourceLabel}
                    onChange={(e) => setResourceLabel(e.target.value)}
                    placeholder="e.g. Figma Spec"
                  />
                </label>
              </div>

              <label className="form-label">
                Due Date
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="quiet-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="button" className="primary-button" onClick={handleSave}>
                  {editingTask ? 'Save Task Changes' : 'Add Task to List'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
