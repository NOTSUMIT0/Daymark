import { useState } from 'react';
import { Task, TaskPriority, NodeStatus } from '../types';

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

  const categories = ['all', 'Development', 'Design', 'Architecture', 'Security', 'Planning', 'General'];

  // Status Normalizer (Handles legacy strings like 'completed', 'in-progress', 'done')
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

      {/* Main Single-Line Clean Toolbar */}
      <div className="tasks-toolbar">
        <div className="filter-group">
          <button
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({tasks.length})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending ({pendingCount})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'progress' ? 'active' : ''}`}
            onClick={() => setStatusFilter('progress')}
          >
            In Progress ({progressCount})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'complete' ? 'active' : ''}`}
            onClick={() => setStatusFilter('complete')}
          >
            Completed ({completedCount})
          </button>
        </div>

        <div className="category-select-wrapper">
          <label htmlFor="cat-filter">Category:</label>
          <select
            id="cat-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c}
              </option>
            ))}
          </select>
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

      {/* Tasks Table */}
      <section className="panel tasks-panel">
        <div className="tasks-table">
          <div className="table-header">
            <span>Status</span>
            <span>Task Title, Category &amp; Resources</span>
            <span>Priority</span>
            <span>Due Date</span>
            <span>Actions</span>
          </div>

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
            filteredTasks.map((t) => {
              const currentNormStatus = normalizeStatus(t.status);
              return (
                <div key={t.id} className="table-row">
                  <div className="status-col">
                    <button
                      type="button"
                      className={`status-dot ${currentNormStatus}`}
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
                    />
                  </div>

                  <div className="title-col">
                    <div className="title-header-row">
                      <strong className={`task-title-text ${currentNormStatus === 'complete' ? 'completed-text' : ''}`}>
                        {t.title}
                      </strong>
                      {t.category && <span className="category-tag">{t.category}</span>}
                    </div>

                    {t.detail && <p className="task-detail-text">{t.detail}</p>}

                    {/* Resource Attachment Links */}
                    {t.resourceUrl && (
                      <div className="resource-link-box">
                        <a
                          href={t.resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="resource-anchor"
                        >
                          🔗 {t.resourceLabel || t.resourceUrl}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="priority-col">
                    <span className={`priority-badge ${getPriorityClass(t.priority)}`}>
                      {formatPriorityText(t.priority)}
                    </span>
                  </div>

                  <div className="due-col">
                    {formatDueDateDisplay(t.dueDate)}
                  </div>

                  <div className="actions-col">
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
              );
            })
          )}
        </div>
      </section>

      {/* Task Creation & Editing Modal */}
      {showModal && (
        <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}>
          <section className="composer" onMouseDown={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setShowModal(false)} aria-label="Close modal">
              ×
            </button>
            <p className="eyebrow">{editingTask ? 'EDIT TASK ENTRY' : 'NEW TASK ENTRY'}</p>

            <label>
              Task Title
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Audit database query execution plan"
                autoFocus
              />
            </label>

            <label>
              Description &amp; Action Steps
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Describe next concrete actions, requirements, and deliverables..."
              />
            </label>

            <div className="composer-row">
              <label>
                Category
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Security">Security</option>
                  <option value="Planning">Planning</option>
                  <option value="General">General</option>
                </select>
              </label>

              <label>
                Priority Level
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                >
                  <option value="high">High Priority</option>
                  <option value="med">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </label>

              <label>
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as NodeStatus)}
                >
                  <option value="pending">Pending</option>
                  <option value="progress">In Progress</option>
                  <option value="complete">Completed</option>
                </select>
              </label>
            </div>

            <div className="composer-row">
              <label className="flex-2">
                Resource Link URL (Docs, Figma, PR)
                <input
                  type="url"
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  placeholder="https://github.com/... or https://figma.com/..."
                />
              </label>

              <label className="flex-1">
                Link Title / Label
                <input
                  type="text"
                  value={resourceLabel}
                  onChange={(e) => setResourceLabel(e.target.value)}
                  placeholder="e.g. Figma Spec"
                />
              </label>
            </div>

            <label>
              Due Date
              <input
                type="date"
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
          </section>
        </div>
      )}
    </section>
  );
}
