import { useState, useEffect } from 'react';
import { Task, Note, RoadmapMap, NodeStatus } from '../types';
import { CustomSelect } from '../components/CustomSelect';

interface TodayPageProps {
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, status: NodeStatus) => void;
  onAddTask?: (newTask: Omit<Task, 'id' | 'createdAt'>) => void;
  notes: Note[];
  onSaveNote: (title: string, content: string) => void;
  roadmaps: RoadmapMap[];
  onNavigate: (page: string) => void;

  // Global Focus Timer Props
  mainFocus: string;
  setMainFocus: React.Dispatch<React.SetStateAction<string>>;
  focusDone: boolean;
  setFocusDone: React.Dispatch<React.SetStateAction<boolean>>;
  customMinutes: number;
  setCustomMinutes: React.Dispatch<React.SetStateAction<number>>;
  timerSeconds: number;
  setTimerSeconds: React.Dispatch<React.SetStateAction<number>>;
  isTimerActive: boolean;
  setIsTimerActive: React.Dispatch<React.SetStateAction<boolean>>;
  isMiniPlayerOpen: boolean;
  setIsMiniPlayerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// Helpers for data normalization
function normalizeStatus(status: string): NodeStatus {
  const s = (status || '').toLowerCase().trim();
  if (s === 'complete' || s === 'completed' || s === 'done') return 'complete';
  if (s === 'progress' || s === 'in-progress' || s === 'doing') return 'progress';
  return 'pending';
}

function normalizePriority(priority: string): 'high' | 'med' | 'low' {
  const p = (priority || '').toLowerCase().trim();
  if (p === 'high' || p === 'urgent') return 'high';
  if (p === 'med' || p === 'medium' || p === 'normal') return 'med';
  return 'low';
}

export interface RoutineItem {
  id: string;
  label: string;
  category: string;
}

const DEFAULT_ROUTINES: RoutineItem[] = [
  { id: 'r1', label: 'Morning Prep: Triaging priorities & clear calendar', category: 'Morning' },
  { id: 'r2', label: 'Deep Work Sprint: 90-min uninterrupted execution block', category: 'Focus' },
  { id: 'r3', label: 'Midday Sync: Review roadmap milestones & unblock team', category: 'Review' },
  { id: 'r4', label: 'EOD Log: Update daily work log & stage tomorrow’s deck', category: 'Shutdown' }
];

export function TodayPage({
  tasks,
  onUpdateTaskStatus,
  onAddTask,
  notes,
  onSaveNote,
  roadmaps,
  onNavigate,
  mainFocus,
  setMainFocus,
  focusDone,
  setFocusDone,
  customMinutes,
  setCustomMinutes,
  timerSeconds,
  setTimerSeconds,
  isTimerActive,
  setIsTimerActive,
  isMiniPlayerOpen: _isMiniPlayerOpen,
  setIsMiniPlayerOpen
}: TodayPageProps) {
  const d = new Date();
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(d);
  const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(d);
  const todayStr = d.toISOString().split('T')[0];

  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [tempMinutesInput, setTempMinutesInput] = useState(String(customMinutes));

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleSaveTimerDuration = (mins?: number) => {
    const val = mins !== undefined ? mins : parseInt(tempMinutesInput, 10) || 25;
    const clamped = Math.max(1, Math.min(180, val));
    setCustomMinutes(clamped);
    setTimerSeconds(clamped * 60);
    setIsTimerActive(false);
    setIsEditingTimer(false);
    localStorage.setItem('daymark.focusTimerMinutes', String(clamped));
  };

  // Executive Rituals / Routines List State (Fully Editable)
  const [routinesList, setRoutinesList] = useState<RoutineItem[]>(() => {
    try {
      const stored = localStorage.getItem('daymark.routinesList');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_ROUTINES;
  });

  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [editingCategory, setEditingCategory] = useState('');

  const [newRoutineLabel, setNewRoutineLabel] = useState('');
  const [newRoutineCategory, setNewRoutineCategory] = useState('Focus');
  const [isAddingRoutine, setIsAddingRoutine] = useState(false);

  // Daily Routine Checkpoints Completion State
  const [routineDone, setRoutineDone] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(`daymark.routines.${todayStr}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Agenda Quick Capture State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'high' | 'med' | 'low'>('high');

  // Work Log state
  const latestNote = notes[0] || { title: '', content: '' };
  const [logTitle, setLogTitle] = useState(latestNote.title || `Work Log — ${dayName}`);
  const [logContent, setLogContent] = useState(latestNote.content || '');
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('daymark.todayFocus', mainFocus);
  }, [mainFocus]);

  useEffect(() => {
    localStorage.setItem('daymark.todayFocusDone', String(focusDone));
  }, [focusDone]);

  useEffect(() => {
    localStorage.setItem('daymark.routinesList', JSON.stringify(routinesList));
  }, [routinesList]);

  useEffect(() => {
    localStorage.setItem(`daymark.routines.${todayStr}`, JSON.stringify(routineDone));
  }, [routineDone, todayStr]);

  // Routine Actions
  const handleToggleRoutine = (id: string) => {
    setRoutineDone((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartEditRoutine = (r: RoutineItem) => {
    setEditingRoutineId(r.id);
    setEditingLabel(r.label);
    setEditingCategory(r.category);
  };

  const handleSaveEditRoutine = (id: string) => {
    if (!editingLabel.trim()) return;
    setRoutinesList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, label: editingLabel.trim(), category: editingCategory.trim() || 'General' }
          : item
      )
    );
    setEditingRoutineId(null);
  };

  const handleDeleteRoutine = (id: string) => {
    setRoutinesList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineLabel.trim()) return;
    const newItem: RoutineItem = {
      id: `r_${Date.now()}`,
      label: newRoutineLabel.trim(),
      category: newRoutineCategory.trim() || 'Focus'
    };
    setRoutinesList((prev) => [...prev, newItem]);
    setNewRoutineLabel('');
    setIsAddingRoutine(false);
  };

  // Agenda Quick Add Handler
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    if (onAddTask) {
      onAddTask({
        title: quickTitle.trim(),
        detail: 'Quick capture from Today page',
        priority: quickPriority,
        status: 'pending',
        dueDate: todayStr,
        category: 'Focus'
      });
    }
    setQuickTitle('');
  };

  const handleSaveLog = () => {
    onSaveNote(logTitle, logContent);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  // Normalized task calculations
  const completedTasksCount = tasks.filter((t) => normalizeStatus(t.status) === 'complete').length;
  const todayTasks = tasks.slice(0, 5);

  const activeRoadmap = roadmaps[0];
  const completedNodes = activeRoadmap?.nodes.filter((n) => normalizeStatus(n.state) === 'complete').length || 0;
  const totalNodes = activeRoadmap?.nodes.length || 0;

  const routineCompletedCount = routinesList.filter((r) => routineDone[r.id]).length;

  return (
    <section className="page today-page">
      {/* Date Hero — Large Typography */}
      <div className="date-hero">
        <p className="day-name">{dayName}</p>
        <strong className="day-number">{d.getDate()}</strong>
        <span className="month-year">{monthYear}</span>
        <div className="hero-stats">
          <b>
            {completedTasksCount} / {tasks.length} Tasks Done
          </b>
          <small>Daily Focus Progress</small>
        </div>
      </div>

      {/* Main Focus / Focus Mode Banner — Executive Clean, Emoji-Free, Sprint Timer */}
      <section className="panel focus-banner-panel">
        <div className="focus-banner-content">
          <div className="focus-left">
            <input
              type="checkbox"
              id="focus-checkbox"
              className="focus-checkbox"
              checked={focusDone}
              onChange={(e) => setFocusDone(e.target.checked)}
              title="Mark Main Focus as Completed"
            />
            <div className="focus-text-group">
              <div className="focus-meta-row">
                <span className="focus-tag">DAILY MAIN FOCUS</span>
                <span className={`focus-status-pill ${focusDone ? 'completed' : isTimerActive ? 'active' : 'idle'}`}>
                  {focusDone ? 'COMPLETED' : isTimerActive ? 'FOCUS SPRINT ACTIVE' : 'FOCUS LOCKED'}
                </span>
              </div>

              {isEditingFocus ? (
                <div className="focus-edit-box">
                  <input
                    type="text"
                    className="focus-input-edit"
                    value={mainFocus}
                    onChange={(e) => setMainFocus(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingFocus(false);
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="primary-button sm-btn"
                    onClick={() => setIsEditingFocus(false)}
                  >
                    Save Focus
                  </button>
                </div>
              ) : (
                <h3
                  className={`focus-heading ${focusDone ? 'completed' : ''}`}
                  onClick={() => setIsEditingFocus(true)}
                  title="Click to edit focus objective"
                >
                  {mainFocus}
                </h3>
              )}
            </div>
          </div>

          {/* Focus Sprint Timer Controls (Editable Duration) */}
          <div className="focus-timer-widget">
            {isEditingTimer ? (
              <div className="timer-edit-box">
                <span className="edit-timer-label">SET TIMER DURATION:</span>
                <div className="timer-edit-input-group">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    className="timer-minutes-input"
                    value={tempMinutesInput}
                    onChange={(e) => setTempMinutesInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTimerDuration();
                    }}
                    autoFocus
                  />
                  <span className="unit-label">MINUTES</span>
                </div>
                <div className="timer-presets-row">
                  {[15, 25, 45, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className="preset-chip"
                      onClick={() => {
                        setTempMinutesInput(String(m));
                        handleSaveTimerDuration(m);
                      }}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
                <div className="timer-edit-actions">
                  <button
                    type="button"
                    className="primary-button sm-btn"
                    onClick={() => handleSaveTimerDuration()}
                  >
                    Save Duration
                  </button>
                  <button
                    type="button"
                    className="quiet-button sm-btn"
                    onClick={() => setIsEditingTimer(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="timer-display clickable"
                  onClick={() => {
                    setTempMinutesInput(String(customMinutes));
                    setIsEditingTimer(true);
                  }}
                  title="Click to edit timer duration"
                >
                  <span className="timer-digits">{formatTimer(timerSeconds)}</span>
                  <small className="timer-label">{customMinutes}m Sprint • Click to edit</small>
                </div>
                <div className="timer-controls">
                  <button
                    type="button"
                    className={`quiet-button sm-btn ${isTimerActive ? 'active-timer-btn' : ''}`}
                    onClick={() => setIsTimerActive((prev) => !prev)}
                  >
                    {isTimerActive ? 'Pause Sprint' : 'Start Sprint'}
                  </button>
                  <button
                    type="button"
                    className="quiet-button sm-btn"
                    onClick={() => {
                      setIsTimerActive(false);
                      setTimerSeconds(customMinutes * 60);
                    }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="quiet-button sm-btn"
                    onClick={() => {
                      setTempMinutesInput(String(customMinutes));
                      setIsEditingTimer(true);
                    }}
                  >
                    Edit Time
                  </button>
                  {!isEditingFocus && (
                    <button
                      type="button"
                      className="quiet-button sm-btn"
                      onClick={() => setIsEditingFocus(true)}
                    >
                      Edit Focus
                    </button>
                  )}
                  <button
                    type="button"
                    className="quiet-button sm-btn popout-trigger-btn"
                    onClick={() => setIsMiniPlayerOpen(true)}
                    title="Open Floating Apple Music / Spotify style Focus Mini-Player"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    <span>Pop Out Mini-Player</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Today's Agenda Panel — KEEP UNTOUCHED */}
        <section className="panel agenda-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">PRIORITY ACTION ITEMS</p>
              <h2>Today’s Agenda</h2>
            </div>
            <button className="quiet-button" onClick={() => onNavigate('Tasks')}>
              Manage Tasks →
            </button>
          </div>

          {/* Quick Capture Input Bar */}
          <form className="quick-capture-form" onSubmit={handleQuickAdd}>
            <input
              type="text"
              className="quick-capture-input"
              placeholder="+ Quick capture task or idea for today..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
            />
            <CustomSelect
              className="quick-priority-select"
              value={quickPriority}
              options={[
                { value: 'high', label: 'High Priority' },
                { value: 'med', label: 'Normal Priority' },
                { value: 'low', label: 'Low Priority' }
              ]}
              onChange={(val) => setQuickPriority(val as 'high' | 'med' | 'low')}
            />
            <button type="submit" className="primary-button quick-add-btn">
              Add
            </button>
          </form>

          <div className="task-list">
            {todayTasks.length === 0 ? (
              <p className="empty-text">No active tasks scheduled for today. Quick capture one above!</p>
            ) : (
              todayTasks.map((t) => {
                const normStatus = normalizeStatus(t.status);
                const normPriority = normalizePriority(t.priority);
                return (
                  <div key={t.id} className="task-row">
                    <button
                      type="button"
                      className={`status-dot ${normStatus}`}
                      title={`Current Status: ${normStatus}. Click to toggle.`}
                      onClick={() =>
                        onUpdateTaskStatus(
                          t.id,
                          normStatus === 'complete'
                            ? 'pending'
                            : normStatus === 'pending'
                            ? 'progress'
                            : 'complete'
                        )
                      }
                    />
                    <div className="task-info">
                      <strong className={normStatus === 'complete' ? 'completed-text' : ''}>
                        {t.title}
                      </strong>
                      {t.detail && <p>{t.detail}</p>}
                      {t.resourceUrl && (
                        <a
                          href={t.resourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="today-link-chip"
                          onClick={(e) => e.stopPropagation()}
                        >
                          [Link] {t.resourceLabel || 'Resource Link'}
                        </a>
                      )}
                    </div>
                    <span className={`priority-badge ${normPriority}`}>
                      {normPriority.toUpperCase()}
                    </span>
                    {t.dueDate && <span className="due-date">{t.dueDate}</span>}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Daily Routine Checkpoints Panel — EDITABLE, NO EMOJIS */}
        <section className="panel routine-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">EXECUTIVE RITUALS</p>
              <h2>Daily Routine Checkpoints</h2>
            </div>
            <div className="routine-head-actions">
              <span className="routine-count-badge">
                {routineCompletedCount} / {routinesList.length} Done
              </span>
              <button
                type="button"
                className="quiet-button sm-btn"
                onClick={() => setIsAddingRoutine((prev) => !prev)}
              >
                {isAddingRoutine ? 'Cancel' : '+ Add Ritual'}
              </button>
            </div>
          </div>

          {/* Add New Ritual Form */}
          {isAddingRoutine && (
            <form className="add-routine-form" onSubmit={handleAddRoutine}>
              <input
                type="text"
                className="routine-input"
                placeholder="Ritual title (e.g., Code Review Block)..."
                value={newRoutineLabel}
                onChange={(e) => setNewRoutineLabel(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                className="routine-category-input"
                placeholder="Category (e.g., Focus)"
                value={newRoutineCategory}
                onChange={(e) => setNewRoutineCategory(e.target.value)}
              />
              <button type="submit" className="primary-button sm-btn">
                Save Ritual
              </button>
            </form>
          )}

          <div className="routine-list">
            {routinesList.length === 0 ? (
              <p className="empty-text">No routine checkpoints defined. Click "+ Add Ritual" to create one.</p>
            ) : (
              routinesList.map((r) => {
                const isDone = Boolean(routineDone[r.id]);
                const isEditing = editingRoutineId === r.id;

                if (isEditing) {
                  return (
                    <div key={r.id} className="routine-item editing">
                      <input
                        type="text"
                        className="routine-input"
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        autoFocus
                      />
                      <input
                        type="text"
                        className="routine-category-input"
                        value={editingCategory}
                        onChange={(e) => setEditingCategory(e.target.value)}
                        placeholder="Category"
                      />
                      <button
                        type="button"
                        className="primary-button sm-btn"
                        onClick={() => handleSaveEditRoutine(r.id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="quiet-button sm-btn"
                        onClick={() => setEditingRoutineId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={r.id}
                    className={`routine-item ${isDone ? 'routine-done' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => handleToggleRoutine(r.id)}
                      className="routine-checkbox"
                    />
                    <div className="routine-info" onClick={() => handleToggleRoutine(r.id)}>
                      <strong>{r.label}</strong>
                      <small className="category-pill">{r.category.toUpperCase()}</small>
                    </div>
                    <div className="routine-actions">
                      <button
                        type="button"
                        className="icon-action-btn"
                        title="Edit Ritual"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditRoutine(r);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="icon-action-btn danger-text"
                        title="Delete Ritual"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoutine(r.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Daily Work Log Journal Sub-Panel */}
          <div className="log-subpanel">
            <div className="panel-head subhead">
              <div>
                <p className="eyebrow">JOURNAL & RECORD</p>
                <h3>Today’s Work Log</h3>
              </div>
              {savedFeedback && <span className="save-toast">Saved ✓</span>}
            </div>

            <div className="log-editor">
              <input
                type="text"
                className="log-title-input"
                value={logTitle}
                onChange={(e) => setLogTitle(e.target.value)}
                placeholder="Log Title..."
              />
              <textarea
                className="log-content-input"
                value={logContent}
                onChange={(e) => setLogContent(e.target.value)}
                placeholder="Capture what was completed today, blockages, and next concrete actions..."
              />
              <div className="log-actions">
                <button type="button" className="primary-button" onClick={handleSaveLog}>
                  Save Work Log Entry
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Active Roadmap Snapshot */}
      {activeRoadmap && (
        <section className="panel roadmap-snapshot-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">ACTIVE ROADMAP TRACKER</p>
              <h2>{activeRoadmap.title}</h2>
            </div>
            <button className="quiet-button" onClick={() => onNavigate('Roadmaps')}>
              Open Full Blueprint Canvas →
            </button>
          </div>
          <p className="snapshot-desc">{activeRoadmap.description}</p>
          <div className="roadmap-progress-bar">
            <div
              className="progress-fill"
              style={{
                width: totalNodes > 0 ? `${(completedNodes / totalNodes) * 100}%` : '0%'
              }}
            />
          </div>
          <small className="progress-label">
            {completedNodes} of {totalNodes} milestone nodes completed (
            {totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0}%)
          </small>
        </section>
      )}
    </section>
  );
}


