import { RoadmapMap, Task, Note, FileItem } from '../types';

export const INITIAL_ROADMAPS: RoadmapMap[] = [
  {
    id: 'launch',
    title: 'Product launch roadmap',
    description: 'A connected delivery path for the initial production release and feature rollout.',
    nodes: [
      {
        id: 'a',
        title: 'Clarify outcome',
        detail: 'Define target user goals and key metrics in one concise spec.',
        state: 'complete',
        links: ['b', 'c'],
        x: 80,
        y: 140
      },
      {
        id: 'b',
        title: 'Plan delivery route',
        detail: 'Break milestones into small, incremental checkpoints and tasks.',
        state: 'progress',
        links: ['d'],
        x: 440,
        y: 80
      },
      {
        id: 'c',
        title: 'Design node canvas',
        detail: 'Build zoomable, draggable canvas with precise edge connections.',
        state: 'complete',
        links: ['d'],
        x: 440,
        y: 320
      },
      {
        id: 'd',
        title: 'Build first version',
        detail: 'Implement Phase 0 local shell with offline storage persistence.',
        state: 'progress',
        links: ['e'],
        x: 800,
        y: 200
      },
      {
        id: 'e',
        title: 'Review & security launch',
        detail: 'Perform security audit, restore test, and publish production build.',
        state: 'pending',
        links: [],
        x: 1140,
        y: 200
      }
    ]
  },
  {
    id: 'mobile-app',
    title: 'Android & Desktop packaging',
    description: 'Wrap web shell using Capacitor (Android) and Tauri (Windows).',
    nodes: [
      {
        id: 'm1',
        title: 'Capacitor Setup',
        detail: 'Initialize Capacitor CLI, configure android platform & icons.',
        state: 'pending',
        links: ['m2'],
        x: 100,
        y: 150
      },
      {
        id: 'm2',
        title: 'Local Notifications',
        detail: 'Wire native push and reminder alerts via local storage triggers.',
        state: 'pending',
        links: ['m3'],
        x: 460,
        y: 150
      },
      {
        id: 'm3',
        title: 'APK & Windows Build',
        detail: 'Generate debug APK and standalone Windows desktop executable.',
        state: 'pending',
        links: [],
        x: 820,
        y: 150
      }
    ]
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Complete node canvas edge routing',
    detail: 'Ensure SVG bezier curves stem from node right port to left port with dynamic orientation.',
    priority: 'high',
    status: 'complete',
    category: 'Development',
    resourceUrl: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d',
    resourceLabel: 'SVG Path Spec',
    dueDate: '2026-09-07',
    createdAt: '2026-09-07T08:00:00.000Z'
  },
  {
    id: 't2',
    title: 'Audit application accessibility & font hierarchy',
    detail: 'Check contrast, focus states, and Georgia serif headers across dark & light themes.',
    priority: 'med',
    status: 'progress',
    category: 'Design',
    resourceUrl: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
    resourceLabel: 'WCAG Guidelines',
    dueDate: '2026-09-08',
    createdAt: '2026-09-07T09:30:00.000Z'
  },
  {
    id: 't3',
    title: 'Prepare Phase 1 IndexedDB schema migration',
    detail: 'Replace localStorage with Dexie wrapper for large data records.',
    priority: 'high',
    status: 'pending',
    category: 'Architecture',
    resourceUrl: 'https://dexie.org/docs/Tutorial/Getting-started',
    resourceLabel: 'Dexie Docs',
    dueDate: '2026-09-10',
    createdAt: '2026-09-07T10:15:00.000Z'
  },
  {
    id: 't4',
    title: 'Generate weekly work summary report',
    detail: 'Review completed logs and map progress stats for team breakdown.',
    priority: 'low',
    status: 'pending',
    category: 'Planning',
    dueDate: '2026-09-12',
    createdAt: '2026-09-07T11:00:00.000Z'
  }
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'n1',
    title: 'Daily Architecture & System Blueprint',
    content: 'Daymark architecture relies on local-first data storage. All user logs, roadmaps, and notes remain encrypted and on-device before any server sync is enabled. SSH access is restricted to administrative maintenance only.',
    createdAt: '2026-09-07T08:12:00.000Z',
    updatedAt: '2026-09-07T14:30:00.000Z'
  },
  {
    id: 'n2',
    title: 'Canvas Graph Interaction Notes',
    content: 'Nodes support free panning, zooming, and connection links. Each node features Red (Pending), Yellow (In Progress), and Green (Complete) status circles that update state in real time.',
    createdAt: '2026-09-06T16:00:00.000Z',
    updatedAt: '2026-09-06T16:45:00.000Z'
  }
];

// Sample SVG Document Data URL for mock PDF viewer
const SAMPLE_PDF_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <rect width="800" height="1000" fill="%231a1917"/>
  <rect x="40" y="40" width="720" height="920" fill="%2324221f" rx="12" stroke="%233e3a35" stroke-width="2"/>
  
  <!-- Header Banner -->
  <rect x="70" y="70" width="660" height="100" fill="%232e2b26" rx="8" stroke="%234a453f"/>
  <text x="100" y="115" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="%23f5efeb">Daymark System Architecture Blueprint v1.0</text>
  <text x="100" y="145" font-family="sans-serif" font-size="14" fill="%23b8ad9e">Document ID: ARCH-2026-902 | Classification: Confidential</text>
  
  <!-- Section 1: Overview -->
  <text x="70" y="210" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="%23e63946">1. Executive Overview & Data Flow</text>
  <text x="70" y="240" font-family="sans-serif" font-size="14" fill="%23d0c5b6">Daymark operates as a local-first offline workspace with browser local storage and IndexedDB.</text>
  <text x="70" y="265" font-family="sans-serif" font-size="14" fill="%23d0c5b6">All user documents, task graphs, notes, and file attachments persist across client sessions.</text>
  
  <!-- Architecture Diagram Blocks -->
  <rect x="70" y="300" width="180" height="90" fill="%2336322c" rx="8" stroke="%23e63946" stroke-width="2"/>
  <text x="100" y="340" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23ffffff">React Client Shell</text>
  <text x="95" y="365" font-family="sans-serif" font-size="12" fill="%23b8ad9e">UI Components & State</text>
  
  <line x1="250" y1="345" x2="310" y2="345" stroke="%23e63946" stroke-width="3" stroke-dasharray="5,5"/>
  
  <rect x="310" y="300" width="180" height="90" fill="%2336322c" rx="8" stroke="%232a9d8f" stroke-width="2"/>
  <text x="345" y="340" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23ffffff">Storage Layer</text>
  <text x="330" y="365" font-family="sans-serif" font-size="12" fill="%23b8ad9e">IndexedDB & Storage API</text>
  
  <line x1="490" y1="345" x2="550" y2="345" stroke="%232a9d8f" stroke-width="3" stroke-dasharray="5,5"/>
  
  <rect x="550" y="300" width="180" height="90" fill="%2336322c" rx="8" stroke="%23e76f51" stroke-width="2"/>
  <text x="585" y="340" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23ffffff">File Annotator</text>
  <text x="575" y="365" font-family="sans-serif" font-size="12" fill="%23b8ad9e">Canvas Markup Engine</text>

  <!-- Section 2: Key Requirements -->
  <text x="70" y="440" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="%23e63946">2. Security & Compliance Requirements</text>
  <circle cx="85" cy="480" r="5" fill="%232a9d8f"/>
  <text x="105" y="485" font-family="sans-serif" font-size="15" fill="%23f5efeb">Zero telemetry: All user data remains entirely client-side on local machine storage.</text>
  
  <circle cx="85" cy="520" r="5" fill="%232a9d8f"/>
  <text x="105" y="525" font-family="sans-serif" font-size="15" fill="%23f5efeb">Data URL Blob parsing for instant, lag-free file attachment rendering.</text>
  
  <circle cx="85" cy="560" r="5" fill="%232a9d8f"/>
  <text x="105" y="565" font-family="sans-serif" font-size="15" fill="%23f5efeb">Interactive canvas markup studio with marker, pen, eraser, and text notes.</text>

  <!-- Section 3: Notes & Annotations Space -->
  <rect x="70" y="610" width="660" height="280" fill="%231e1c19" rx="8" stroke="%233e3a35" stroke-dasharray="4,4"/>
  <text x="90" y="645" font-family="sans-serif" font-size="14" font-weight="bold" fill="%238a8075">[ ANNOTATION & MARKUP ZONE — USE HIGHLIGHTER / PEN TOOL ABOVE TO WRITE OR UNDERLINE ]</text>
</svg>`;

export const INITIAL_FILES: FileItem[] = [];

import { daymarkDB } from './indexedDB';

export function getStoredFiles(): FileItem[] {
  try {
    const raw = localStorage.getItem('daymark.files');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((f) => f && !f.dataUrl?.includes('Daymark System Architecture Blueprint'));
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredFiles(files: FileItem[]) {
  localStorage.setItem('daymark.files', JSON.stringify(files));
  daymarkDB.setAll('files', files).catch((err) => console.warn('IndexedDB file sync warning:', err));
}

export function getStoredRoadmaps(): RoadmapMap[] {
  try {
    const raw = localStorage.getItem('daymark.roadmaps');
    if (!raw) return INITIAL_ROADMAPS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_ROADMAPS;
    return parsed;
  } catch {
    return INITIAL_ROADMAPS;
  }
}

export function saveStoredRoadmaps(roadmaps: RoadmapMap[]) {
  localStorage.setItem('daymark.roadmaps', JSON.stringify(roadmaps));
  daymarkDB.setAll('roadmaps', roadmaps).catch((err) => console.warn('IndexedDB roadmap sync warning:', err));
}

export function getStoredTasks(): Task[] {
  try {
    const raw = localStorage.getItem('daymark.tasks');
    if (!raw) return INITIAL_TASKS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_TASKS;
  }
}

export function saveStoredTasks(tasks: Task[]) {
  localStorage.setItem('daymark.tasks', JSON.stringify(tasks));
  daymarkDB.setAll('tasks', tasks).catch((err) => console.warn('IndexedDB task sync warning:', err));
}

export function getStoredNotes(): Note[] {
  try {
    const raw = localStorage.getItem('daymark.notes');
    if (!raw) return INITIAL_NOTES;
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTES;
  }
}

export function saveStoredNotes(notes: Note[]) {
  localStorage.setItem('daymark.notes', JSON.stringify(notes));
  daymarkDB.setAll('notes', notes).catch((err) => console.warn('IndexedDB note sync warning:', err));
}

/**
 * Robust cross-platform file download utility (Desktop, PWA, Mobile WebView)
 */
export function downloadFile(filename: string, content: string, mimeType: string) {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
  } catch (e) {
    console.warn('Blob URL download failed, executing data URI fallback:', e);
    try {
      const dataUrl = `data:${mimeType};charset=utf-8,` + encodeURIComponent(content);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('All file export methods failed:', err);
    }
  }
}

/**
 * Advanced file download with Native Web Share API (Android/iOS Mobile File Save Sheet)
 * & Native File System Access Picker API (Desktop Save As dialog) with multi-level fallback.
 */
export async function downloadFileWithLocationPicker(
  filename: string,
  content: string,
  mimeType: string
): Promise<boolean> {
  const cleanMime = mimeType || 'text/plain';

  // 1. Mobile Native File Save / Share Sheet (Android & iOS Native WebViews & Mobile Browsers)
  if (typeof navigator !== 'undefined' && navigator.share && typeof File !== 'undefined') {
    try {
      const file = new File([content], filename, { type: cleanMime });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
          text: `Daymark Workspace Export: ${filename}`
        });
        return true;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User closed native Android save/share dialog
        return false;
      }
      console.warn('Mobile Web Share API failed, falling through to File Picker / Blob:', err);
    }
  }

  // 2. Desktop File System Access API (showSaveFilePicker for Chrome / Edge desktop)
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const ext = filename.includes('.') ? filename.split('.').pop() || 'txt' : 'txt';
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'Save Data Export File',
            accept: {
              [cleanMime]: [`.${ext}`]
            }
          }
        ]
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled desktop File Explorer dialog
        return false;
      }
      console.warn('showSaveFilePicker failed or unsupported, executing Blob fallback:', err);
    }
  }

  // 3. Fallback: Blob URL download & Data URI fallback
  downloadFile(filename, content, cleanMime);
  return true;
}

/**
 * Export tasks as a downloadable CSV spreadsheet
 */
export function exportTasksToCSV(tasks: Task[]) {
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
  downloadFile(`Daymark_Tasks_${new Date().toISOString().split('T')[0]}.csv`, csvContent, 'text/csv;charset=utf-8;');
}

/**
 * Export notes as a formatted text summary file
 */
export function exportNotesToText(notes: Note[]) {
  const content = notes
    .map(
      (n) =>
        `==================================================\nTITLE: ${n.title}\nUPDATED: ${n.updatedAt}\n==================================================\n${n.content}\n\n`
    )
    .join('\n');

  downloadFile(`Daymark_Notes_${new Date().toISOString().split('T')[0]}.txt`, content, 'text/plain;charset=utf-8;');
}

