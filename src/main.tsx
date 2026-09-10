import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './roadmap.css';

import {
  Task,
  RoadmapMap,
  Note,
  FileItem,
  NodeStatus
} from './types';

import {
  getStoredRoadmaps,
  saveStoredRoadmaps,
  getStoredTasks,
  saveStoredTasks,
  getStoredNotes,
  saveStoredNotes,
  getStoredFiles,
  saveStoredFiles,
  exportTasksToCSV,
  exportNotesToText,
  downloadFile
} from './utils/storage';

import { daymarkDB } from './utils/indexedDB';
import { computePayloadChecksum, validateBackupSchema } from './utils/security';
import {
  checkAndNotifyDueTasks,
  notifyFocusSprintWarning,
  requestNotificationPermission
} from './utils/notificationService';


import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { PrivacyTermsModal } from './components/PrivacyTermsModal';
import { AppDialogModal, DialogOptions } from './components/AppDialogModal';
import { AppExportModal } from './components/AppExportModal';

import { TodayPage } from './pages/TodayPage';
import { TasksPage } from './pages/TasksPage';
import { RoadmapsPage } from './pages/RoadmapsPage';
import { NotesPage } from './pages/NotesPage';
import { FilesPage } from './pages/FilesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { SplashScreen } from './components/SplashScreen';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [dialogState, setDialogState] = useState<DialogOptions>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [globalExportModal, setGlobalExportModal] = useState<{
    isOpen: boolean;
    title: string;
    filename: string;
    content: string;
    mimeType: string;
  }>({
    isOpen: false,
    title: '',
    filename: '',
    content: '',
    mimeType: 'text/plain'
  });

  const showCustomDialog = (opts: Omit<DialogOptions, 'isOpen'>) => {
    setDialogState({ ...opts, isOpen: true });
  };

  const [activePage, setActivePage] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '').trim();
    const validPages = ['Today', 'Tasks', 'Roadmaps', 'Notes', 'Files', 'Reports', 'Settings'];
    const matchedFromHash = validPages.find(p => p.toLowerCase() === hash.toLowerCase());
    if (matchedFromHash) return matchedFromHash;

    const stored = localStorage.getItem('daymark.activePage');
    if (stored && validPages.includes(stored)) return stored;

    return 'Today';
  });
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [roadmaps, setRoadmaps] = useState<RoadmapMap[]>(getStoredRoadmaps);
  const [activeMapId, setActiveMapId] = useState<string>(roadmaps[0]?.id || 'launch');
  const [tasks, setTasks] = useState<Task[]>(getStoredTasks);
  const [notes, setNotes] = useState<Note[]>(getStoredNotes);
  const [files, setFiles] = useState<FileItem[]>(getStoredFiles);

  useEffect(() => {
    localStorage.setItem('daymark.activePage', activePage);
    if (window.location.hash.replace('#', '').toLowerCase() !== activePage.toLowerCase()) {
      window.location.hash = activePage.toLowerCase();
    }
  }, [activePage]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      const validPages = ['Today', 'Tasks', 'Roadmaps', 'Notes', 'Files', 'Reports', 'Settings'];
      const matched = validPages.find(p => p.toLowerCase() === hash.toLowerCase());
      if (matched) {
        setActivePage(matched);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('daymark.theme') === 'dark';
  });

  const [workspaceName, setWorkspaceName] = useState<string>(() => {
    return localStorage.getItem('daymark.workspaceName') || 'Personal Workspace';
  });

  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  // Global Keyboard Shortcuts (Ctrl+K, Alt+N, Alt+T, Alt+R, Alt+S, Alt+Space)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl + K -> Toggle Command Palette Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      // Alt + N -> Jump to Notes
      else if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setActivePage('Notes');
      }
      // Alt + T -> Jump to Tasks
      else if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setActivePage('Tasks');
      }
      // Alt + R -> Jump to Roadmaps
      else if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setActivePage('Roadmaps');
      }
      // Alt + S -> Jump to Settings
      else if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setActivePage('Settings');
      }
      // Alt + Space -> Start/Pause Focus Timer Sprint
      else if (e.altKey && e.code === 'Space') {
        e.preventDefault();
        setIsTimerActive((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Sync state to local storage
  useEffect(() => {
    saveStoredRoadmaps(roadmaps);
  }, [roadmaps]);

  useEffect(() => {
    saveStoredTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveStoredNotes(notes);
  }, [notes]);

  useEffect(() => {
    saveStoredFiles(files);
  }, [files]);

  useEffect(() => {
    localStorage.setItem('daymark.workspaceName', workspaceName);
  }, [workspaceName]);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('daymark.theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // IndexedDB Auto-Boot & Data Hydration Effect
  useEffect(() => {
    async function hydrateFromIndexedDB() {
      try {
        const payload = await daymarkDB.exportFullPayload();
        if (payload.roadmaps && payload.roadmaps.length > 0) setRoadmaps(payload.roadmaps);
        if (payload.tasks && payload.tasks.length > 0) setTasks(payload.tasks);
        if (payload.notes && payload.notes.length > 0) setNotes(payload.notes);
        if (payload.files && payload.files.length > 0) setFiles(payload.files);
      } catch (err) {
        console.warn('IndexedDB initial hydration warning:', err);
      }
    }
    hydrateFromIndexedDB();
  }, []);

  const handleImportBackup = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        const validation = validateBackupSchema(data);
        if (!validation.isValid) {
          showCustomDialog({
            title: 'Backup Validation Failed',
            message: `The selected JSON backup file is invalid: ${validation.error}`,
            type: 'danger'
          });
          return;
        }

        if (data.tasks && Array.isArray(data.tasks)) setTasks(data.tasks);
        if (data.roadmaps && Array.isArray(data.roadmaps)) setRoadmaps(data.roadmaps);
        if (data.notes && Array.isArray(data.notes)) setNotes(data.notes);
        if (data.files && Array.isArray(data.files)) setFiles(data.files);

        await daymarkDB.importFullPayload(data);
        showCustomDialog({
          title: 'Import Successful',
          message: 'Backup data has been verified and restored into your local IndexedDB storage.',
          type: 'success'
        });
      } catch (err) {
        console.error('Import error:', err);
        showCustomDialog({
          title: 'Corrupted Backup File',
          message: 'The selected backup file is corrupted or not a valid JSON structure.',
          type: 'danger'
        });
      }
    };
    reader.readAsText(file);
  };


  // Roadmap actions
  const handleUpdateMap = (updatedFields: Partial<RoadmapMap>) => {
    setRoadmaps((prev) =>
      prev.map((m) => (m.id === activeMapId ? { ...m, ...updatedFields } : m))
    );
  };

  const handleCreateRoadmap = () => {
    const newId = crypto.randomUUID();
    const newRoadmap: RoadmapMap = {
      id: newId,
      title: 'Untitled Roadmap Blueprint',
      description: 'Describe the main milestones and execution graph.',
      nodes: []
    };
    setRoadmaps((prev) => [newRoadmap, ...prev]);
    setActiveMapId(newId);
  };

  // Task actions
  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...newTask,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    setTasks((prev) => [task, ...prev]);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: NodeStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Note actions
  const handleSaveNote = (updatedNote: Note) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === updatedNote.id);
      if (exists) {
        return prev.map((n) => (n.id === updatedNote.id ? updatedNote : n));
      }
      return [updatedNote, ...prev];
    });
  };

  const handleCreateTodayLogNote = (title: string, content: string) => {
    const existingIndex = notes.findIndex((n) => n.title.includes('Work Log'));
    if (existingIndex !== -1) {
      const updated = {
        ...notes[existingIndex],
        title,
        content,
        updatedAt: new Date().toISOString()
      };
      setNotes((prev) => prev.map((n, i) => (i === existingIndex ? updated : n)));
    } else {
      const newNote: Note = {
        id: crypto.randomUUID(),
        title,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setNotes((prev) => [newNote, ...prev]);
    }
  };

  const handleCreateNote = (folderId?: string) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled Note',
      content: '',
      folderId: folderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // File actions
  const handleAddFile = (newFile: Omit<FileItem, 'id' | 'uploadedAt'>) => {
    const file: FileItem = {
      ...newFile,
      id: crypto.randomUUID(),
      uploadedAt: new Date().toISOString().split('T')[0]
    };
    setFiles((prev) => [file, ...prev]);
  };

  const handleUpdateFile = (updated: FileItem) => {
    setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const handleDeleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Backup and Export with Integrity Checksum
  const handleExportBackup = async () => {
    const payload = {
      roadmaps,
      tasks,
      notes,
      files,
      exportedAt: new Date().toISOString()
    };
    const checksum = await computePayloadChecksum(payload);
    const fullBackup = { ...payload, checksum };

    const jsonStr = JSON.stringify(fullBackup, null, 2);
    const filename = `Daymark_Backup_${new Date().toISOString().split('T')[0]}.json`;

    setGlobalExportModal({
      isOpen: true,
      title: 'Export JSON Backup',
      filename,
      content: jsonStr,
      mimeType: 'application/json'
    });
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Priority', 'Status', 'Category', 'Due Date', 'Created At'];
    const rows = tasks.map((t) => [
      `"${t.id}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${t.dueDate || ''}"`,
      `"${t.createdAt}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const filename = `Daymark_Tasks_${new Date().toISOString().split('T')[0]}.csv`;

    setGlobalExportModal({
      isOpen: true,
      title: 'Export Tasks CSV Spreadsheet',
      filename,
      content: csvContent,
      mimeType: 'text/csv'
    });
  };

  const handleExportText = () => {
    const content = notes
      .map(
        (n) =>
          `==================================================\nTITLE: ${n.title}\nUPDATED: ${n.updatedAt}\n==================================================\n${n.content}\n\n`
      )
      .join('\n');

    const filename = `Daymark_Notes_${new Date().toISOString().split('T')[0]}.txt`;

    setGlobalExportModal({
      isOpen: true,
      title: 'Export Notes Text Summary',
      filename,
      content,
      mimeType: 'text/plain'
    });
  };

  const handleResetData = () => {
    showCustomDialog({
      title: 'Purge Local Storage',
      message: 'Are you sure you want to reset all local workspace records? This action will permanently erase your offline tasks, notes, roadmaps, and files.',
      type: 'danger',
      confirmLabel: 'Purge Storage',
      cancelLabel: 'Keep Data',
      onConfirm: async () => {
        try {
          await daymarkDB.clearAllDatabaseData();
        } catch (err) {
          console.warn('Error clearing IndexedDB:', err);
        }
        localStorage.clear();
        window.location.reload();
      }
    });
  };

  const handleDeleteRoadmap = (mapId: string) => {
    showCustomDialog({
      title: 'Delete Roadmap Blueprint',
      message: 'Are you sure you want to delete this roadmap milestone canvas? This action cannot be undone.',
      type: 'danger',
      confirmLabel: 'Delete Roadmap',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        const remaining = roadmaps.filter((m) => m.id !== mapId);
        if (remaining.length === 0) {
          const fresh: RoadmapMap = {
            id: crypto.randomUUID(),
            title: 'Untitled Roadmap Blueprint',
            description: 'Describe the main milestones and execution graph.',
            nodes: []
          };
          setRoadmaps([fresh]);
          setActiveMapId(fresh.id);
        } else {
          setRoadmaps(remaining);
          setActiveMapId(remaining[0].id);
        }
      }
    });
  };


  // Daily Main Focus & Global Timer State
  const [mainFocus, setMainFocus] = useState(() => {
    return localStorage.getItem('daymark.todayFocus') || 'Complete primary deliverable & unblock roadmap node';
  });
  const [focusDone, setFocusDone] = useState(() => {
    return localStorage.getItem('daymark.todayFocusDone') === 'true';
  });
  const [customMinutes, setCustomMinutes] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('daymark.focusTimerMinutes');
      return stored ? parseInt(stored, 10) || 25 : 25;
    } catch {
      return 25;
    }
  });
  const [timerSeconds, setTimerSeconds] = useState(customMinutes * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Sync Main Focus to local storage
  useEffect(() => {
    localStorage.setItem('daymark.todayFocus', mainFocus);
  }, [mainFocus]);

  useEffect(() => {
    localStorage.setItem('daymark.todayFocusDone', String(focusDone));
  }, [focusDone]);

  const playFocusCompletionChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Executive 3-second ringtone chime sequence (2 cycles fading at 3.0s)
      const chimeNotes = [
        { freq: 523.25, time: 0.0 },  // C5
        { freq: 659.25, time: 0.25 }, // E5
        { freq: 783.99, time: 0.50 }, // G5
        { freq: 1046.5, time: 0.75 }, // C6
        { freq: 523.25, time: 1.35 }, // C5
        { freq: 659.25, time: 1.60 }, // E5
        { freq: 783.99, time: 1.85 }, // G5
        { freq: 1046.5, time: 2.10 }, // C6
      ];

      chimeNotes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);

        gain.gain.setValueAtTime(0, ctx.currentTime + n.time);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + n.time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + n.time + 0.85);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + n.time);
        osc.stop(ctx.currentTime + n.time + 0.9);
      });
    } catch (err) {
      console.warn('Audio chime playback failed:', err);
    }
  };

  // Background Proactive Task Due Date Notification Check
  useEffect(() => {
    requestNotificationPermission();
    checkAndNotifyDueTasks(tasks);

    const interval = setInterval(() => {
      checkAndNotifyDueTasks(tasks);
    }, 60000); // Check every 60s in background

    return () => clearInterval(interval);
  }, [tasks]);

  // Global Focus Timer Countdown Effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev === 61) { // 60 seconds remaining warning!
            notifyFocusSprintWarning(mainFocus);
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerSeconds === 0 && isTimerActive) {
      setIsTimerActive(false);
      playFocusCompletionChime();
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerSeconds, mainFocus]);


  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Floating Mini-Player State (Apple Music / Spotify Style)
  const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState(false);
  const [isMiniPlayerMinimized, setIsMiniPlayerMinimized] = useState(false);
  const [miniPlayerPos, setMiniPlayerPos] = useState(() => {
    try {
      const stored = localStorage.getItem('daymark.miniPlayerPos');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 410) : 800,
      y: typeof window !== 'undefined' ? Math.max(20, window.innerHeight - 240) : 500
    };
  });
  const [isDraggingPlayer, setIsDraggingPlayer] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    localStorage.setItem('daymark.miniPlayerPos', JSON.stringify(miniPlayerPos));
  }, [miniPlayerPos]);

  const handleMouseDownPlayer = (e: React.MouseEvent) => {
    setIsDraggingPlayer(true);
    setDragOffset({
      x: e.clientX - miniPlayerPos.x,
      y: e.clientY - miniPlayerPos.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingPlayer) return;
      const clampedX = Math.max(10, Math.min(window.innerWidth - 240, e.clientX - dragOffset.x));
      const clampedY = Math.max(10, Math.min(window.innerHeight - 120, e.clientY - dragOffset.y));
      setMiniPlayerPos({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDraggingPlayer(false);
    };

    if (isDraggingPlayer) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayer, dragOffset]);

  const handlePopOutDesktopWindow = () => {
    const width = 360;
    const height = 220;
    const left = window.screen.width - width - 40;
    const top = window.screen.height - height - 80;

    const popup = window.open(
      '',
      'DaymarkFocusMiniPlayer',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );

    if (!popup) return;

    const cleanTitle = mainFocus.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Focus Mini-Player</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: #181714;
              color: #e7e0d4;
              margin: 0;
              padding: 16px;
              box-sizing: border-box;
              user-select: none;
            }
            .pip-container {
              display: flex;
              flex-direction: column;
              height: 100%;
              gap: 8px;
            }
            .pip-head {
              display: flex;
              justify-content: space-between;
              font-size: 10.5px;
              font-weight: 700;
              color: #dc8064;
              letter-spacing: 0.05em;
            }
            .pip-title {
              font-size: 13px;
              font-weight: 700;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin: 2px 0 0;
            }
            .pip-timer {
              font-size: 34px;
              font-weight: 800;
              font-family: monospace;
              color: #dc8064;
              letter-spacing: 0.04em;
              line-height: 1.1;
            }
            .pip-controls {
              display: flex;
              gap: 6px;
              margin-top: auto;
            }
            button {
              flex: 1;
              padding: 8px 6px;
              border: 1px solid #454138;
              background: #24221e;
              color: #e7e0d4;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
            }
            button.primary {
              background: #dc8064;
              color: #ffffff;
              border-color: #dc8064;
            }
          </style>
        </head>
        <body>
          <div class="pip-container">
            <div class="pip-head">
              <span>DAILY MAIN FOCUS</span>
              <span id="pip-status">${focusDone ? 'COMPLETED' : isTimerActive ? 'ACTIVE' : 'IDLE'}</span>
            </div>
            <div class="pip-title">${cleanTitle}</div>
            <div class="pip-timer" id="pip-timer">${formatTimer(timerSeconds)}</div>
            <div class="pip-controls">
              <button class="primary" id="btn-toggle">${isTimerActive ? 'Pause' : 'Start'}</button>
              <button id="btn-reset">Reset</button>
              <button id="btn-add5">+5m</button>
              <button id="btn-done">${focusDone ? 'Undo' : 'Done'}</button>
            </div>
          </div>
          <script>
            document.getElementById('btn-toggle').onclick = () => window.opener && window.opener.postMessage('toggle_timer', '*');
            document.getElementById('btn-reset').onclick = () => window.opener && window.opener.postMessage('reset_timer', '*');
            document.getElementById('btn-add5').onclick = () => window.opener && window.opener.postMessage('add5_timer', '*');
            document.getElementById('btn-done').onclick = () => window.opener && window.opener.postMessage('toggle_done', '*');
          </script>
        </body>
      </html>
    `);

    popup.document.close();
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'toggle_timer') {
        setIsTimerActive((prev) => !prev);
      } else if (event.data === 'reset_timer') {
        setIsTimerActive(false);
        setTimerSeconds(customMinutes * 60);
      } else if (event.data === 'add5_timer') {
        setTimerSeconds((prev) => prev + 300);
      } else if (event.data === 'toggle_done') {
        setFocusDone((prev) => !prev);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [customMinutes]);

  // Header action mapping
  const getHeaderAction = (): { label: string; onClick: () => void } | undefined => {
    return undefined;
  };

  const headerAction = getHeaderAction();

  const renderPage = () => {
    switch (activePage) {
      case 'Today':
        return (
          <TodayPage
            tasks={tasks}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onAddTask={handleAddTask}
            notes={notes}
            onSaveNote={handleCreateTodayLogNote}
            roadmaps={roadmaps}
            onNavigate={setActivePage}
            onShowDialog={showCustomDialog}
            mainFocus={mainFocus}
            setMainFocus={setMainFocus}
            focusDone={focusDone}
            setFocusDone={setFocusDone}
            customMinutes={customMinutes}
            setCustomMinutes={setCustomMinutes}
            timerSeconds={timerSeconds}
            setTimerSeconds={setTimerSeconds}
            isTimerActive={isTimerActive}
            setIsTimerActive={setIsTimerActive}
            isMiniPlayerOpen={isMiniPlayerOpen}
            setIsMiniPlayerOpen={setIsMiniPlayerOpen}
          />
        );
      case 'Tasks':
        return (
          <TasksPage
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onShowDialog={showCustomDialog}
          />
        );
      case 'Roadmaps':
        return (
          <RoadmapsPage
            roadmaps={roadmaps}
            activeMapId={activeMapId}
            onSelectMap={setActiveMapId}
            onUpdateMap={handleUpdateMap}
            onCreateMap={handleCreateRoadmap}
            onDeleteMap={handleDeleteRoadmap}
            onShowDialog={showCustomDialog}
          />
        );
      case 'Notes':
        return (
          <NotesPage
            notes={notes}
            onSaveNote={handleSaveNote}
            onCreateNote={handleCreateNote}
            onDeleteNote={handleDeleteNote}
            onShowDialog={showCustomDialog}
          />
        );
      case 'Files':
        return (
          <FilesPage
            files={files}
            onAddFile={handleAddFile}
            onUpdateFile={handleUpdateFile}
            onDeleteFile={handleDeleteFile}
            onShowDialog={showCustomDialog}
          />
        );
      case 'Reports':
        return (
          <ReportsPage
            tasks={tasks}
            roadmaps={roadmaps}
            notes={notes}
            files={files}
          />
        );
      case 'Settings':
        return (
          <SettingsPage
            isDark={isDark}
            onToggleDark={() => setIsDark((prev) => !prev)}
            workspaceName={workspaceName}
            onUpdateWorkspaceName={setWorkspaceName}
            onOpenLegal={setLegalModal}
            onExportData={handleExportBackup}
            onImportData={handleImportBackup}
            onResetData={handleResetData}
            onExportCSV={handleExportCSV}
            onExportText={handleExportText}
            onShowDialog={showCustomDialog}
            tasksCount={tasks.length}
            roadmapsCount={roadmaps.length}
            notesCount={notes.length}
            filesCount={files.length}
          />
        );
      default:
        return <NotFoundPage onGoHome={() => setActivePage('Today')} />;
    }
  };

  return (
    <main className="app-shell">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        taskCount={tasks.filter((t) => t.status !== 'complete').length}
        workspaceName={workspaceName}
      />

      <MobileNav
        activePage={activePage}
        onSelectPage={setActivePage}
        taskCount={tasks.filter((t) => t.status !== 'complete').length}
      />


      <section className="workspace">
        <Header
          page={activePage}
          actionLabel={headerAction?.label}
          onActionClick={headerAction?.onClick}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenSettings={() => setActivePage('Settings')}
        />
        {renderPage()}
      </section>

      {/* Global Quick Search & Command Palette Modal (Ctrl + K) */}
      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        tasks={tasks}
        notes={notes}
        roadmaps={roadmaps}
        files={files}
        onNavigate={setActivePage}
      />

      {/* Floating Focus Mini-Player Widget (Global Across All Pages) */}
      {isMiniPlayerOpen && (
        <div
          className={`focus-mini-player-widget ${isMiniPlayerMinimized ? 'minimized' : ''}`}
          style={{
            left: `${miniPlayerPos.x}px`,
            top: `${miniPlayerPos.y}px`
          }}
        >
          {/* Header with drag handle & controls */}
          <div className="mini-player-header" onMouseDown={handleMouseDownPlayer}>
            <div className="mini-player-title-group">
              <svg className="drag-grip-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="9" cy="6" r="1.5" fill="currentColor"/>
                <circle cx="15" cy="6" r="1.5" fill="currentColor"/>
                <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
                <circle cx="15" cy="18" r="1.5" fill="currentColor"/>
              </svg>
              <span>FOCUS MINI-PLAYER</span>
            </div>

            <div className="mini-player-header-actions" onMouseDown={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="mini-player-icon-btn"
                onClick={handlePopOutDesktopWindow}
                title="Pop Out into Desktop OS Window (Floats outside browser app)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </button>
              <button
                type="button"
                className="mini-player-icon-btn"
                onClick={() => setIsMiniPlayerMinimized((prev) => !prev)}
                title={isMiniPlayerMinimized ? 'Expand Mini-Player' : 'Minimize Mini-Player'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <button
                type="button"
                className="mini-player-icon-btn close-btn"
                onClick={() => setIsMiniPlayerOpen(false)}
                title="Close Mini-Player"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          {!isMiniPlayerMinimized && (
            <>
              <div className="mini-player-body">
                {/* Apple Music / Spotify Disc Art */}
                <div className={`mini-player-disc ${isTimerActive ? 'active-pulse' : ''}`}>
                  <svg className="disc-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9"/>
                    <circle cx="12" cy="12" r="3"/>
                    <line x1="12" y1="3" x2="12" y2="9"/>
                  </svg>
                </div>

                <div className="mini-player-info">
                  <h4 className={`mini-player-focus-text ${focusDone ? 'completed' : ''}`} title={mainFocus}>
                    {mainFocus}
                  </h4>
                  <div className="mini-player-timer-digits">{formatTimer(timerSeconds)}</div>
                  <span className="mini-player-sprint-tag">
                    {customMinutes}M SPRINT • {focusDone ? 'COMPLETED' : isTimerActive ? 'RUNNING' : 'PAUSED'}
                  </span>
                </div>
              </div>

              {/* Player Controls */}
              <div className="mini-player-controls">
                <button
                  type="button"
                  className={`mini-player-btn primary ${isTimerActive ? 'active' : ''}`}
                  onClick={() => setIsTimerActive((prev) => !prev)}
                >
                  {isTimerActive ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1"/>
                        <rect x="14" y="4" width="4" height="16" rx="1"/>
                      </svg>
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      <span>Start</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="quiet-button sm-btn mini-player-btn"
                  onClick={() => {
                    setIsTimerActive(false);
                    setTimerSeconds(customMinutes * 60);
                  }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="quiet-button sm-btn mini-player-btn"
                  onClick={() => setTimerSeconds((prev) => prev + 300)}
                  title="Add +5 minutes"
                >
                  +5m
                </button>
                <button
                  type="button"
                  className={`quiet-button sm-btn mini-player-btn ${focusDone ? 'completed' : ''}`}
                  onClick={() => setFocusDone((prev) => !prev)}
                  title="Toggle focus completed"
                >
                  {focusDone ? 'Done ✓' : 'Complete'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Privacy Policy & Terms of Service Modal */}
      <PrivacyTermsModal
        type={legalModal}
        onClose={() => setLegalModal(null)}
      />

      {/* Global Application UI Custom Modal (Replaces Browser Dialogs) */}
      <AppDialogModal
        dialog={dialogState}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Global Export & Portability Modal for Mobile & Web */}
      <AppExportModal
        isOpen={globalExportModal.isOpen}
        title={globalExportModal.title}
        filename={globalExportModal.filename}
        content={globalExportModal.content}
        mimeType={globalExportModal.mimeType}
        onClose={() => setGlobalExportModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </main>
  );


}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

