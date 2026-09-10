import { useState, useRef, useEffect, MouseEvent } from 'react';
import { Note, NoteFolder } from '../types';
import { CustomSelect } from '../components/CustomSelect';
import { DialogOptions } from '../components/AppDialogModal';

interface NotesPageProps {
  notes: Note[];
  onSaveNote: (note: Note) => void;
  onCreateNote: (folderId?: string) => void;
  onDeleteNote: (id: string) => void;
  onShowDialog?: (opts: Omit<DialogOptions, 'isOpen'>) => void;
}

const DEFAULT_FOLDERS: NoteFolder[] = [
  { id: 'f_work', name: 'Work' },
  { id: 'f_personal', name: 'Personal' },
  { id: 'f_arch', name: 'Architecture' }
];

interface ImageCropModalProps {
  imageSrc: string;
  onSave: (croppedDataUrl: string) => void;
  onClose: () => void;
}

function ImageCropModal({ imageSrc, onSave, onClose }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [aspectRatio, setAspectRatio] = useState<string>('free');
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, initialCrop: { x: 10, y: 10, width: 80, height: 80 } });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!imgRef.current || !previewCanvasRef.current) return;
    const img = imgRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sourceX = (crop.x / 100) * img.naturalWidth;
    const sourceY = (crop.y / 100) * img.naturalHeight;
    const sourceW = (crop.width / 100) * img.naturalWidth;
    const sourceH = (crop.height / 100) * img.naturalHeight;

    canvas.width = Math.max(1, Math.round(sourceW));
    canvas.height = Math.max(1, Math.round(sourceH));

    ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, canvas.width, canvas.height);
  }, [crop, imageSrc]);

  const handleApplyCrop = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;

    const canvas = document.createElement('canvas');
    const sourceX = (crop.x / 100) * img.naturalWidth;
    const sourceY = (crop.y / 100) * img.naturalHeight;
    const sourceW = Math.max(1, (crop.width / 100) * img.naturalWidth);
    const sourceH = Math.max(1, (crop.height / 100) * img.naturalHeight);

    canvas.width = Math.round(sourceW);
    canvas.height = Math.round(sourceH);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, canvas.width, canvas.height);
      const isPng = imageSrc.startsWith('data:image/png');
      const croppedDataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.9);
      onSave(croppedDataUrl);
    }
  };

  const handleMouseDown = (handle: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(handle);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      initialCrop: { ...crop }
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaXPercent = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - dragStart.y) / rect.height) * 100;

    const init = dragStart.initialCrop;
    let newX = init.x;
    let newY = init.y;
    let newW = init.width;
    let newH = init.height;

    if (isDragging === 'move') {
      newX = Math.max(0, Math.min(100 - init.width, init.x + deltaXPercent));
      newY = Math.max(0, Math.min(100 - init.height, init.y + deltaYPercent));
    } else if (isDragging === 'nw') {
      const targetX = Math.max(0, Math.min(init.x + init.width - 5, init.x + deltaXPercent));
      const targetY = Math.max(0, Math.min(init.y + init.height - 5, init.y + deltaYPercent));
      newW = init.x + init.width - targetX;
      newH = init.y + init.height - targetY;
      newX = targetX;
      newY = targetY;
    } else if (isDragging === 'ne') {
      newW = Math.max(5, Math.min(100 - init.x, init.width + deltaXPercent));
      const targetY = Math.max(0, Math.min(init.y + init.height - 5, init.y + deltaYPercent));
      newH = init.y + init.height - targetY;
      newY = targetY;
    } else if (isDragging === 'sw') {
      const targetX = Math.max(0, Math.min(init.x + init.width - 5, init.x + deltaXPercent));
      newW = init.x + init.width - targetX;
      newX = targetX;
      newH = Math.max(5, Math.min(100 - init.y, init.height + deltaYPercent));
    } else if (isDragging === 'se') {
      newW = Math.max(5, Math.min(100 - init.x, init.width + deltaXPercent));
      newH = Math.max(5, Math.min(100 - init.y, init.height + deltaYPercent));
    }

    setCrop({
      x: Math.round(newX * 10) / 10,
      y: Math.round(newY * 10) / 10,
      width: Math.round(newW * 10) / 10,
      height: Math.round(newH * 10) / 10
    });
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const applyPresetRatio = (ratioStr: string) => {
    setAspectRatio(ratioStr);
    if (!imgRef.current) return;
    const naturalRatio = imgRef.current.naturalWidth / imgRef.current.naturalHeight;

    let targetRatio = 1;
    if (ratioStr === '1:1') targetRatio = 1;
    else if (ratioStr === '4:3') targetRatio = 4 / 3;
    else if (ratioStr === '16:9') targetRatio = 16 / 9;
    else if (ratioStr === '3:2') targetRatio = 3 / 2;
    else return;

    let newW = 80;
    let newH = (newW * naturalRatio) / targetRatio;
    if (newH > 80) {
      newH = 80;
      newW = (newH * targetRatio) / naturalRatio;
    }

    setCrop({
      x: Math.round((100 - newW) / 2),
      y: Math.round((100 - newH) / 2),
      width: Math.round(newW),
      height: Math.round(newH)
    });
  };

  return (
    <div className="modal-overlay crop-modal-overlay" onClick={onClose}>
      <div
        className="modal-card crop-modal-card"
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2v14a2 2 0 002 2h14"/>
              <path d="M18 22V8a2 2 0 00-2-2H2"/>
            </svg>
            <h3>Crop Picture</h3>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="crop-modal-body">
          <div className="crop-preset-toolbar">
            <span className="crop-label">Aspect Ratio:</span>
            {['free', '1:1', '4:3', '16:9', '3:2'].map((ratio) => (
              <button
                key={ratio}
                type="button"
                className={`quiet-button sm-btn ${aspectRatio === ratio ? 'active' : ''}`}
                onClick={() => applyPresetRatio(ratio)}
              >
                {ratio === 'free' ? 'Freeform' : ratio}
              </button>
            ))}
          </div>

          <div className="crop-stage-container">
            <div className="crop-image-wrapper" ref={containerRef}>
              <img
                ref={imgRef}
                src={imageSrc}
                alt="To Crop"
                className="crop-target-img"
                onLoad={() => setCrop((prev) => ({ ...prev }))}
              />

              <div
                className="crop-box-overlay"
                style={{
                  left: `${crop.x}%`,
                  top: `${crop.y}%`,
                  width: `${crop.width}%`,
                  height: `${crop.height}%`
                }}
                onMouseDown={(e) => handleMouseDown('move', e)}
              >
                <div className="crop-handle handle-nw" onMouseDown={(e) => handleMouseDown('nw', e)} />
                <div className="crop-handle handle-ne" onMouseDown={(e) => handleMouseDown('ne', e)} />
                <div className="crop-handle handle-sw" onMouseDown={(e) => handleMouseDown('sw', e)} />
                <div className="crop-handle handle-se" onMouseDown={(e) => handleMouseDown('se', e)} />
              </div>
            </div>

            <div className="crop-preview-panel">
              <span className="preview-label">Live Preview:</span>
              <div className="preview-canvas-box">
                <canvas ref={previewCanvasRef} className="crop-preview-canvas" />
              </div>
              <div className="crop-dimension-info">
                {crop.width}% × {crop.height}%
              </div>
            </div>
          </div>

          <div className="crop-sliders-row">
            <label>
              Width %:
              <input
                type="range"
                min="10"
                max="100"
                value={crop.width}
                onChange={(e) => setCrop((p) => ({ ...p, width: Number(e.target.value) }))}
              />
            </label>
            <label>
              Height %:
              <input
                type="range"
                min="10"
                max="100"
                value={crop.height}
                onChange={(e) => setCrop((p) => ({ ...p, height: Number(e.target.value) }))}
              />
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="quiet-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-button" onClick={handleApplyCrop}>
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotesPage({ notes, onSaveNote, onCreateNote, onDeleteNote, onShowDialog }: NotesPageProps) {
  const [activeId, setActiveId] = useState<string>(notes[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');

  // Folders State
  const [folders, setFolders] = useState<NoteFolder[]>(() => {
    try {
      const stored = localStorage.getItem('daymark.noteFolders');
      if (stored) return JSON.parse(stored);
    } catch {
      // Fallback
    }
    return DEFAULT_FOLDERS;
  });

  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    localStorage.setItem('daymark.noteFolders', JSON.stringify(folders));
  }, [folders]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: NoteFolder = {
      id: `f_${Date.now()}`,
      name: newFolderName.trim()
    };
    setFolders((prev) => [...prev, newFolder]);
    setNewFolderName('');
    setIsCreatingFolder(false);
    setSelectedFolderId(newFolder.id);
  };

  const handleDeleteFolder = (folderId: string) => {
    const targetFolder = folders.find((f) => f.id === folderId);
    const folderName = targetFolder ? targetFolder.name : 'this folder';
    if (onShowDialog) {
      onShowDialog({
        title: 'Delete Folder',
        message: `Are you sure you want to delete folder "${folderName}"? Notes inside will be unassigned.`,
        type: 'danger',
        confirmLabel: 'Delete Folder',
        cancelLabel: 'Cancel',
        onConfirm: () => {
          setFolders((prev) => prev.filter((f) => f.id !== folderId));
          if (selectedFolderId === folderId) setSelectedFolderId('all');
        }
      });
    } else {
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      if (selectedFolderId === folderId) setSelectedFolderId('all');
    }
  };

  const [selectedImgElement, setSelectedImgElement] = useState<HTMLImageElement | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync folders to local storage
  useEffect(() => {
    localStorage.setItem('daymark.folders', JSON.stringify(folders));
  }, [folders]);

  // Active Note
  const activeNote = notes.find((n) => n.id === activeId) || notes[0];

  useEffect(() => {
    if (!activeNote && notes.length > 0) {
      setActiveId(notes[0].id);
    }
  }, [notes, activeNote]);

  // Sync editor innerHTML when activeNote changes
  useEffect(() => {
    if (editorRef.current && activeNote) {
      if (editorRef.current.innerHTML !== activeNote.content) {
        editorRef.current.innerHTML = activeNote.content || '';
      }
      setSelectedImgElement(null);
    }
  }, [activeNote?.id]);

  // Filter notes by search & folder
  const filteredNotes = notes.filter((n) => {
    const textContent = (n.content || '').replace(/<[^>]*>?/gm, '');
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      textContent.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFolderId === 'all') return true;
    if (selectedFolderId === 'unorganized') return !n.folderId;
    return n.folderId === selectedFolderId;
  });




  const saveCurrentContent = () => {
    if (!activeNote || !editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    if (currentHtml !== activeNote.content) {
      onSaveNote({
        ...activeNote,
        content: currentHtml,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleTitleChange = (val: string) => {
    if (!activeNote) return;
    onSaveNote({
      ...activeNote,
      title: val,
      updatedAt: new Date().toISOString()
    });
  };

  const handleFolderChange = (folderId: string) => {
    if (!activeNote) return;
    onSaveNote({
      ...activeNote,
      folderId: folderId || undefined,
      updatedAt: new Date().toISOString()
    });
  };

  const highlightSelectedImage = (imgEl: HTMLImageElement | null) => {
    if (!editorRef.current) return;
    const allImgs = editorRef.current.querySelectorAll('img');
    allImgs.forEach((img) => {
      if (img === imgEl) {
        img.classList.add('selected-image');
      } else {
        img.classList.remove('selected-image');
      }
    });
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      if (!img.classList.contains('inline-note-image')) {
        img.classList.add('inline-note-image');
      }
      if (
        !img.classList.contains('wrap-inline') &&
        !img.classList.contains('wrap-left') &&
        !img.classList.contains('wrap-right') &&
        !img.classList.contains('wrap-break')
      ) {
        img.classList.add('wrap-inline');
      }
      setSelectedImgElement(img);
      highlightSelectedImage(img);
    } else {
      setSelectedImgElement(null);
      highlightSelectedImage(null);
    }
  };

  // Insert DOM Node directly at cursor without breaking paragraphs
  const insertNodeAtCursor = (node: Node) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        range.insertNode(node);

        range.setStartAfter(node);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

        if (node instanceof HTMLImageElement) {
          setSelectedImgElement(node);
          highlightSelectedImage(node);
        }

        saveCurrentContent();
        return;
      }
    }

    if (editorRef.current) {
      editorRef.current.appendChild(node);
      if (node instanceof HTMLImageElement) {
        setSelectedImgElement(node);
        highlightSelectedImage(node);
      }
      saveCurrentContent();
    }
  };

  // Helper to compress image data URL before inserting to keep DOM responsive
  const compressImage = (
    dataUrl: string,
    maxDimension: number,
    quality: number,
    callback: (compressedUrl: string) => void
  ) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const isPng = dataUrl.startsWith('data:image/png');
        const compressed = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality);
        callback(compressed);
      } else {
        callback(dataUrl);
      }
    };
    img.onerror = () => callback(dataUrl);
    img.src = dataUrl;
  };

  // Formatting State Tracking
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
  });

  const checkFormatStates = () => {
    if (!editorRef.current) return;
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const anchor = sel.anchorNode;
        if (anchor && editorRef.current.contains(anchor)) {
          setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikeThrough: document.queryCommandState('strikeThrough'),
            insertUnorderedList: document.queryCommandState('insertUnorderedList'),
            insertOrderedList: document.queryCommandState('insertOrderedList'),
            justifyLeft: document.queryCommandState('justifyLeft'),
            justifyCenter: document.queryCommandState('justifyCenter'),
            justifyRight: document.queryCommandState('justifyRight'),
            justifyFull: document.queryCommandState('justifyFull'),
          });
          return;
        }
      }
    } catch {}
    setActiveFormats({
      bold: false,
      italic: false,
      underline: false,
      strikeThrough: false,
      insertUnorderedList: false,
      insertOrderedList: false,
      justifyLeft: false,
      justifyCenter: false,
      justifyRight: false,
      justifyFull: false,
    });
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      checkFormatStates();
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Formatting commands (Bold, Italic, Underline, Font size, Color)
  const execFormat = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    saveCurrentContent();
    setTimeout(checkFormatStates, 10);
  };

  // Paste handler for seamless Ctrl+V inline image insertion at cursor
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const files = clipboardData.files;
    const items = clipboardData.items;
    let imageFile: File | null = null;

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          imageFile = files[i];
          break;
        }
      }
    }

    if (!imageFile && items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          imageFile = items[i].getAsFile();
          break;
        }
      }
    }

    if (imageFile) {
      e.preventDefault();
      e.stopPropagation();
      readAndInsertInlineImage(imageFile);
    }
  };

  // Upload button handler for inline image insertion at cursor
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      readAndInsertInlineImage(files[i]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readAndInsertInlineImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (rawDataUrl) {
        compressImage(rawDataUrl, 1600, 0.85, (compressedDataUrl) => {
          const img = document.createElement('img');
          img.src = compressedDataUrl;
          img.className = 'inline-note-image wrap-inline';
          img.alt = 'Inserted Picture';
          img.style.maxWidth = '100%';
          img.style.height = 'auto';

          insertNodeAtCursor(img);
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Picture Toolbar Options: Wrap Modes, Size, Crop, Delete
  const setWrapMode = (mode: 'wrap-inline' | 'wrap-left' | 'wrap-right' | 'wrap-break') => {
    if (!selectedImgElement) return;
    selectedImgElement.classList.remove('wrap-inline', 'wrap-left', 'wrap-right', 'wrap-break');
    selectedImgElement.classList.add(mode);

    if (mode === 'wrap-inline') {
      selectedImgElement.style.float = 'none';
      selectedImgElement.style.display = 'inline-block';
      selectedImgElement.style.margin = '4px 8px';
    } else if (mode === 'wrap-left') {
      selectedImgElement.style.float = 'left';
      selectedImgElement.style.display = 'block';
      selectedImgElement.style.margin = '6px 18px 6px 0';
    } else if (mode === 'wrap-right') {
      selectedImgElement.style.float = 'right';
      selectedImgElement.style.display = 'block';
      selectedImgElement.style.margin = '6px 0 6px 18px';
    } else if (mode === 'wrap-break') {
      selectedImgElement.style.float = 'none';
      selectedImgElement.style.display = 'block';
      selectedImgElement.style.margin = '12px auto';
    }
    saveCurrentContent();
  };

  const setSizePreset = (percent: number) => {
    if (!selectedImgElement) return;
    selectedImgElement.style.width = `${percent}%`;
    selectedImgElement.style.height = 'auto';
    saveCurrentContent();
  };

  const setCustomWidth = (pxWidth: number) => {
    if (!selectedImgElement || pxWidth <= 0) return;
    selectedImgElement.style.width = `${pxWidth}px`;
    selectedImgElement.style.height = 'auto';
    saveCurrentContent();
  };

  const handleDeleteSelectedImage = () => {
    if (!selectedImgElement) return;
    selectedImgElement.remove();
    setSelectedImgElement(null);
    saveCurrentContent();
  };

  const handleSaveCrop = (croppedDataUrl: string) => {
    if (selectedImgElement) {
      selectedImgElement.src = croppedDataUrl;
      saveCurrentContent();
    }
    setIsCropping(false);
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeSync = (iso: string) => {
    if (!iso) return 'Just now';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return formatDate(iso);
  };

  return (
    <section className="page notes-page">
      {/* Folder Navigation Bar */}
      <div className="folder-nav-bar">
        <div className="folder-pills">
          <button
            type="button"
            className={`folder-pill ${selectedFolderId === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFolderId('all')}
          >
            All Notes ({notes.length})
          </button>
          <button
            type="button"
            className={`folder-pill ${selectedFolderId === 'unorganized' ? 'active' : ''}`}
            onClick={() => setSelectedFolderId('unorganized')}
          >
            Unorganized ({notes.filter((n) => !n.folderId).length})
          </button>
          {folders.map((f) => {
            const count = notes.filter((n) => n.folderId === f.id).length;
            return (
              <div key={f.id} className="folder-pill-wrapper">
                <button
                  type="button"
                  className={`folder-pill ${selectedFolderId === f.id ? 'active' : ''}`}
                  onClick={() => setSelectedFolderId(f.id)}
                >
                  {f.name} ({count})
                </button>
                <button
                  type="button"
                  className="folder-delete-btn"
                  title="Delete folder"
                  onClick={() => handleDeleteFolder(f.id)}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="quiet-button sm-btn"
          onClick={() => setIsCreatingFolder((prev) => !prev)}
        >
          {isCreatingFolder ? 'Cancel' : '+ New Folder'}
        </button>
      </div>

      {/* New Folder Inline Form */}
      {isCreatingFolder && (
        <form className="add-folder-form" onSubmit={handleCreateFolder}>
          <input
            type="text"
            className="folder-name-input"
            placeholder="Folder name (e.g., Ideas, Project Spec)..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            autoFocus
          />
          <button type="submit" className="primary-button sm-btn">
            Create Folder
          </button>
        </form>
      )}

      <div className="notes-layout">
        {/* Notes Sidebar List */}
        <aside className="note-list-sidebar">
          <button
            className="primary-button full-width"
            onClick={() =>
              onCreateNote(
                selectedFolderId !== 'all' && selectedFolderId !== 'unorganized'
                  ? selectedFolderId
                  : undefined
              )
            }
          >
            + New Note
          </button>

          <input
            type="text"
            className="search-input"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="note-items">
            {filteredNotes.length === 0 ? (
              <p className="empty-text">No notes in this view.</p>
            ) : (
              filteredNotes.map((n) => {
                const folderName = folders.find((f) => f.id === n.folderId)?.name;
                const cleanPreview = (n.content || '').replace(/<[^>]*>?/gm, '');
                return (
                  <button
                    key={n.id}
                    className={`note-item-card ${activeNote?.id === n.id ? 'active' : ''}`}
                    onClick={() => setActiveId(n.id)}
                  >
                    <div className="note-card-head">
                      <strong>{n.title || 'Untitled Note'}</strong>
                      {folderName && <span className="card-folder-tag">{folderName}</span>}
                    </div>
                    <p>{cleanPreview ? cleanPreview.substring(0, 75) + '...' : 'Empty note...'}</p>
                    <span className="timestamp">{formatDate(n.createdAt)}</span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Note Editor Area — MS Word Style Rich Content & Inline Pictures */}
        <main className="panel note-editor-panel">
          {activeNote ? (
            <>
              <div className="editor-meta">
                <span className="eyebrow">CREATED: {formatDate(activeNote.createdAt)}</span>
                <span className="eyebrow">LAST EDITED: {formatDate(activeNote.updatedAt)}</span>
              </div>

              {/* Editor Top Control Bar */}
              <div className="editor-toolbar">
                <div className="folder-select-group">
                  <label>Folder:</label>
                  <CustomSelect
                    className="folder-select-custom"
                    value={activeNote.folderId || ''}
                    options={[
                      { value: '', label: 'Unorganized' },
                      ...folders.map((f) => ({ value: f.id, label: f.name }))
                    ]}
                    onChange={(val) => handleFolderChange(val)}
                  />
                </div>
              </div>

              {/* Note Title */}
              <input
                type="text"
                className="note-title-input"
                value={activeNote.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Note Title..."
              />

              {/* Dynamic Picture Options Toolbar (Shown when an image is selected) */}
              {selectedImgElement && (
                <div className="picture-options-bar">
                  <div className="picture-bar-title">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>PICTURE TOOLS</span>
                  </div>

                  {/* Text Wrap Modes */}
                  <div className="picture-tool-group">
                    <span className="tool-sublabel">Text Wrap:</span>
                    <button
                      type="button"
                      className={`picture-tool-btn ${
                        selectedImgElement.classList.contains('wrap-inline') ||
                        (!selectedImgElement.classList.contains('wrap-left') &&
                         !selectedImgElement.classList.contains('wrap-right') &&
                         !selectedImgElement.classList.contains('wrap-break'))
                          ? 'active'
                          : ''
                      }`}
                      onClick={() => setWrapMode('wrap-inline')}
                      title="In Line with Text (Write in front, beside, or around text)"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="7" width="18" height="10" rx="1.5"/>
                        <line x1="3" y1="12" x2="21" y2="12"/>
                      </svg>
                      <span>In Line</span>
                    </button>
                    <button
                      type="button"
                      className={`picture-tool-btn ${selectedImgElement.classList.contains('wrap-left') ? 'active' : ''}`}
                      onClick={() => setWrapMode('wrap-left')}
                      title="Wrap Left (Float image left, text wraps on right side)"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="8" height="10" rx="1"/>
                        <line x1="14" y1="5" x2="21" y2="5"/>
                        <line x1="14" y1="9" x2="21" y2="9"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                      </svg>
                      <span>Wrap Left</span>
                    </button>
                    <button
                      type="button"
                      className={`picture-tool-btn ${selectedImgElement.classList.contains('wrap-right') ? 'active' : ''}`}
                      onClick={() => setWrapMode('wrap-right')}
                      title="Wrap Right (Float image right, text wraps on left side)"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="13" y="4" width="8" height="10" rx="1"/>
                        <line x1="3" y1="5" x2="10" y2="5"/>
                        <line x1="3" y1="9" x2="10" y2="9"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                      </svg>
                      <span>Wrap Right</span>
                    </button>
                    <button
                      type="button"
                      className={`picture-tool-btn ${selectedImgElement.classList.contains('wrap-break') ? 'active' : ''}`}
                      onClick={() => setWrapMode('wrap-break')}
                      title="Break Text (Block image, text stays strictly above & below)"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="4" x2="21" y2="4"/>
                        <rect x="5" y="8" width="14" height="8" rx="1"/>
                        <line x1="3" y1="20" x2="21" y2="20"/>
                      </svg>
                      <span>Break Text</span>
                    </button>
                  </div>

                  {/* Size Presets */}
                  <div className="picture-tool-group">
                    <span className="tool-sublabel">Size:</span>
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        className="picture-tool-btn sm"
                        onClick={() => setSizePreset(pct)}
                      >
                        {pct}%
                      </button>
                    ))}
                    <div className="custom-width-input-wrapper">
                      <input
                        type="number"
                        className="custom-width-input"
                        placeholder="px"
                        min="20"
                        max="2000"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = Number((e.target as HTMLInputElement).value);
                            if (val > 0) setCustomWidth(val);
                          }
                        }}
                      />
                      <span className="px-unit">px</span>
                    </div>
                  </div>

                  {/* Crop & Delete Action Buttons */}
                  <div className="picture-tool-group right-align">
                    <button
                      type="button"
                      className="picture-tool-btn crop-btn"
                      onClick={() => setIsCropping(true)}
                      title="Crop Picture"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 2v14a2 2 0 002 2h14"/>
                        <path d="M18 22V8a2 2 0 00-2-2H2"/>
                      </svg>
                      <span>Crop Picture</span>
                    </button>
                    <button
                      type="button"
                      className="picture-tool-btn delete-btn"
                      onClick={handleDeleteSelectedImage}
                      title="Delete Picture"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Rich Text Formatting Toolbar */}
              <div className="rich-formatting-toolbar">
                <div className="tool-group">
                  <CustomSelect
                    className="format-dropdown-custom"
                    value="p"
                    placeholder="Font Style"
                    options={[
                      { value: 'p', label: 'Normal Text' },
                      { value: 'h1', label: 'Heading 1' },
                      { value: 'h2', label: 'Heading 2' },
                      { value: 'h3', label: 'Heading 3' },
                      { value: 'blockquote', label: 'Quote' }
                    ]}
                    onChange={(val) => execFormat('formatBlock', val)}
                  />

                  <CustomSelect
                    className="format-dropdown-custom"
                    value="3"
                    placeholder="Font Size"
                    options={[
                      { value: '1', label: 'Small' },
                      { value: '3', label: 'Normal' },
                      { value: '5', label: 'Large' },
                      { value: '7', label: 'Huge' }
                    ]}
                    onChange={(val) => execFormat('fontSize', val)}
                  />
                </div>

                <div className="tool-group">
                  <button
                    type="button"
                    className={`format-btn bold-btn ${activeFormats.bold ? 'active' : ''}`}
                    onClick={() => execFormat('bold')}
                    title="Bold (Ctrl+B)"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    className={`format-btn italic-btn ${activeFormats.italic ? 'active' : ''}`}
                    onClick={() => execFormat('italic')}
                    title="Italic (Ctrl+I)"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    className={`format-btn underline-btn ${activeFormats.underline ? 'active' : ''}`}
                    onClick={() => execFormat('underline')}
                    title="Underline (Ctrl+U)"
                  >
                    U
                  </button>
                  <button
                    type="button"
                    className={`format-btn strike-btn ${activeFormats.strikeThrough ? 'active' : ''}`}
                    onClick={() => execFormat('strikeThrough')}
                    title="Strikethrough"
                  >
                    S
                  </button>
                </div>

                <div className="tool-group">
                  <label className="color-tool-label" title="Text Color">
                    <span>A</span>
                    <input
                      type="color"
                      className="color-picker-input"
                      onChange={(e) => execFormat('foreColor', e.target.value)}
                      defaultValue="#e7e0d4"
                    />
                  </label>
                  <label className="color-tool-label highlight" title="Highlight Color">
                    <span>H</span>
                    <input
                      type="color"
                      className="color-picker-input"
                      onChange={(e) => execFormat('hiliteColor', e.target.value)}
                      defaultValue="#933e2d"
                    />
                  </label>
                </div>

                <div className="tool-group">
                  <button
                    type="button"
                    className={`format-btn ${activeFormats.insertUnorderedList ? 'active' : ''}`}
                    onClick={() => execFormat('insertUnorderedList')}
                    title="Bulleted List"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="9" y1="6" x2="20" y2="6"/>
                      <line x1="9" y1="12" x2="20" y2="12"/>
                      <line x1="9" y1="18" x2="20" y2="18"/>
                      <circle cx="4" cy="6" r="1.5" fill="currentColor"/>
                      <circle cx="4" cy="12" r="1.5" fill="currentColor"/>
                      <circle cx="4" cy="18" r="1.5" fill="currentColor"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`format-btn ${activeFormats.insertOrderedList ? 'active' : ''}`}
                    onClick={() => execFormat('insertOrderedList')}
                    title="Numbered List"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="10" y1="6" x2="21" y2="6"/>
                      <line x1="10" y1="12" x2="21" y2="12"/>
                      <line x1="10" y1="18" x2="21" y2="18"/>
                      <path d="M4 6h2v4"/>
                      <path d="M4 10h4"/>
                      <path d="M4 14h3c.6 0 1 .4 1 1s-.4 1-1 1H4v2h4"/>
                    </svg>
                  </button>
                </div>

                {/* Text Alignment Toolbar (Align Left, Center, Right, Justify) */}
                <div className="tool-group">
                  <button
                    type="button"
                    className={`format-btn ${activeFormats.justifyLeft ? 'active' : ''}`}
                    onClick={() => execFormat('justifyLeft')}
                    title="Align Left"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <line x1="3" y1="12" x2="14" y2="12"/>
                      <line x1="3" y1="18" x2="18" y2="18"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`format-btn ${activeFormats.justifyCenter ? 'active' : ''}`}
                    onClick={() => execFormat('justifyCenter')}
                    title="Align Center / Middle"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <line x1="6" y1="12" x2="18" y2="12"/>
                      <line x1="4" y1="18" x2="20" y2="18"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`format-btn ${activeFormats.justifyRight ? 'active' : ''}`}
                    onClick={() => execFormat('justifyRight')}
                    title="Align Right"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <line x1="10" y1="12" x2="21" y2="12"/>
                      <line x1="6" y1="18" x2="21" y2="18"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`format-btn ${activeFormats.justifyFull ? 'active' : ''}`}
                    onClick={() => execFormat('justifyFull')}
                    title="Justify"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <line x1="3" y1="11" x2="21" y2="11"/>
                      <line x1="3" y1="16" x2="21" y2="16"/>
                      <line x1="3" y1="21" x2="21" y2="21"/>
                    </svg>
                  </button>
                </div>

                <div className="tool-group media-tool">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileInputRef}
                    onChange={handleImageFileSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="quiet-button sm-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Insert picture at cursor position"
                  >
                    Attach Picture at Cursor
                  </button>
                </div>
              </div>

              {/* Rich Content Editable Area (MS Word Inline Text & Pictures) */}
              <div className="note-body-wrapper">
                <div
                  ref={editorRef}
                  className="rich-editor-content"
                  contentEditable={true}
                  onInput={saveCurrentContent}
                  onBlur={saveCurrentContent}
                  onPaste={handlePaste}
                  onClick={handleEditorClick}
                  data-placeholder="Start typing your note here... Copy and paste images (Ctrl+V) or use 'Attach Picture at Cursor' to insert images anywhere!"
                />
              </div>

              <div className="editor-actions">
                <button
                  type="button"
                  className="quiet-button danger"
                  onClick={() => {
                    if (onShowDialog) {
                      onShowDialog({
                        title: 'Delete Note',
                        message: `Are you sure you want to delete note "${activeNote.title}"? This action cannot be undone.`,
                        type: 'danger',
                        confirmLabel: 'Delete Note',
                        cancelLabel: 'Cancel',
                        onConfirm: () => onDeleteNote(activeNote.id)
                      });
                    } else {
                      onDeleteNote(activeNote.id);
                    }
                  }}
                >
                  Delete Note
                </button>
                <small className="autosave-label">
                  Synced to local browser storage ({formatRelativeSync(activeNote.updatedAt)}) ✓
                </small>
              </div>
            </>
          ) : (
            <p className="empty-text">Select or create a note to begin writing.</p>
          )}
        </main>
      </div>

      {/* Image Crop Modal Overlay */}
      {isCropping && selectedImgElement && (
        <ImageCropModal
          imageSrc={selectedImgElement.src}
          onSave={handleSaveCrop}
          onClose={() => setIsCropping(false)}
        />
      )}
    </section>
  );
}
