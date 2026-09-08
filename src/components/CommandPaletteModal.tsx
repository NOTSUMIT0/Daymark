import React, { useState, useEffect, useRef } from 'react';
import { Task, Note, RoadmapMap, FileItem } from '../types';

interface SearchResultItem {
  id: string;
  type: 'task' | 'note' | 'roadmap' | 'file' | 'navigation';
  title: string;
  subtitle?: string;
  badge: string;
  action: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  notes: Note[];
  roadmaps: RoadmapMap[];
  files: FileItem[];
  onNavigate: (page: string) => void;
  onSelectTask?: (task: Task) => void;
  onSelectNote?: (note: Note) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  tasks,
  notes,
  roadmaps,
  files,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build unified search results list
  const results: SearchResultItem[] = [];

  // 1. Navigation Shortcuts
  const navItems = [
    { page: 'Today', label: 'Go to Today Dashboard', badge: 'PAGE' },
    { page: 'Tasks', label: 'Go to Tasks Management', badge: 'PAGE' },
    { page: 'Roadmaps', label: 'Go to Roadmap Canvas', badge: 'PAGE' },
    { page: 'Notes', label: 'Go to Notes & Journal', badge: 'PAGE' },
    { page: 'Files', label: 'Go to File Storage', badge: 'PAGE' },
    { page: 'Reports', label: 'Go to Progress Reports', badge: 'PAGE' },
    { page: 'Settings', label: 'Go to Workspace Settings', badge: 'PAGE' }
  ];

  navItems.forEach((nav) => {
    if (!query || nav.label.toLowerCase().includes(query.toLowerCase()) || nav.page.toLowerCase().includes(query.toLowerCase())) {
      results.push({
        id: `nav-${nav.page}`,
        type: 'navigation',
        title: nav.label,
        badge: nav.badge,
        action: () => {
          onNavigate(nav.page);
          onClose();
        }
      });
    }
  });

  // 2. Search Tasks
  tasks.forEach((t) => {
    const text = `${t.title} ${t.detail || ''} ${t.category || ''}`.toLowerCase();
    if (!query || text.includes(query.toLowerCase())) {
      results.push({
        id: `task-${t.id}`,
        type: 'task',
        title: t.title,
        subtitle: t.detail ? (t.detail.length > 70 ? `${t.detail.slice(0, 70)}...` : t.detail) : `Status: ${t.status}`,
        badge: `TASK • ${t.priority.toUpperCase()}`,
        action: () => {
          onNavigate('Tasks');
          onClose();
        }
      });
    }
  });

  // 3. Search Notes
  notes.forEach((n) => {
    const text = `${n.title} ${n.content || ''}`.toLowerCase();
    if (!query || text.includes(query.toLowerCase())) {
      results.push({
        id: `note-${n.id}`,
        type: 'note',
        title: n.title || 'Untitled Note',
        subtitle: n.content ? (n.content.replace(/<[^>]*>/g, '').slice(0, 75) + '...') : 'Empty note content',
        badge: 'NOTE',
        action: () => {
          onNavigate('Notes');
          onClose();
        }
      });
    }
  });

  // 4. Search Roadmaps
  roadmaps.forEach((r) => {
    const text = `${r.title} ${r.description || ''}`.toLowerCase();
    if (!query || text.includes(query.toLowerCase())) {
      results.push({
        id: `roadmap-${r.id}`,
        type: 'roadmap',
        title: r.title,
        subtitle: `${r.nodes.length} Milestone Nodes • ${r.description}`,
        badge: 'ROADMAP',
        action: () => {
          onNavigate('Roadmaps');
          onClose();
        }
      });
    }
  });

  // 5. Search Files
  files.forEach((f) => {
    const text = `${f.name} ${f.category || ''} ${f.type || ''}`.toLowerCase();
    if (!query || text.includes(query.toLowerCase())) {
      results.push({
        id: `file-${f.id}`,
        type: 'file',
        title: f.name,
        subtitle: `${f.size || 'Attachment'} • Uploaded ${f.uploadedAt}`,
        badge: 'FILE',
        action: () => {
          onNavigate('Files');
          onClose();
        }
      });
    }
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div
        className="command-palette-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input */}
        <div className="command-palette-header">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command or search tasks, notes, roadmaps, files... (Press Esc to close)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <kbd className="esc-key-hint">ESC</kbd>
        </div>

        {/* Search Results List */}
        <div className="command-palette-results">
          {results.length === 0 ? (
            <div className="no-results-state">
              <p>No matching records found for "{query}"</p>
              <small>Try searching for a task name, note keyword, or roadmap title.</small>
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`command-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="command-item-main">
                    <span className="command-title">{item.title}</span>
                    {item.subtitle && <span className="command-subtitle">{item.subtitle}</span>}
                  </div>
                  <span className={`command-badge ${item.type}`}>{item.badge}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Tips */}
        <div className="command-palette-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Select</span>
          <span><kbd>ESC</kbd> Close</span>
        </div>
      </div>
    </div>
  );
};
