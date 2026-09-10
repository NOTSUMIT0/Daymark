import { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { FileItem } from '../types';
import { CustomSelect } from '../components/CustomSelect';
import { DialogOptions } from '../components/AppDialogModal';

interface FilesPageProps {
  files: FileItem[];
  onAddFile: (file: Omit<FileItem, 'id' | 'uploadedAt'>) => void;
  onUpdateFile?: (file: FileItem) => void;
  onDeleteFile: (id: string) => void;
  onShowDialog?: (opts: Omit<DialogOptions, 'isOpen'>) => void;
}

const DEFAULT_CATEGORIES = ['Architecture', 'Design', 'Security', 'General'];

export function FilesPage({ files, onAddFile, onUpdateFile, onDeleteFile, onShowDialog }: FilesPageProps) {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Custom User Categories State
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('daymark.fileCategories');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_CATEGORIES;
  });

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Upload Modal & File State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('General');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneInputRef = useRef<HTMLInputElement>(null);

  // Document Viewer & Canvas Annotator Modal State
  const [viewerFile, setViewerFile] = useState<FileItem | null>(null);

  // Sync Categories to localStorage
  useEffect(() => {
    localStorage.setItem('daymark.fileCategories', JSON.stringify(categories));
  }, [categories]);

  // Handle Category Creation
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (!categories.map((c) => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      setCategories((prev) => [...prev, trimmed]);
    }
    setNewCatName('');
    setIsCreatingCategory(false);
    setCategoryFilter(trimmed);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (DEFAULT_CATEGORIES.includes(catToDelete)) return;
    if (onShowDialog) {
      onShowDialog({
        title: 'Delete Category',
        message: `Are you sure you want to delete custom category "${catToDelete}"?`,
        type: 'danger',
        confirmLabel: 'Delete Category',
        cancelLabel: 'Cancel',
        onConfirm: () => {
          setCategories((prev) => prev.filter((c) => c !== catToDelete));
          if (categoryFilter === catToDelete) setCategoryFilter('All');
        }
      });
    } else {
      setCategories((prev) => prev.filter((c) => c !== catToDelete));
      if (categoryFilter === catToDelete) setCategoryFilter('All');
    }
  };


  // Format File Size Helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Upload Handler with Automatic Metadata Extraction
  const processUploadedFiles = (fileList: FileList | File[]) => {
    Array.from(fileList).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const formattedSize = formatBytes(file.size);

      // Is text/code file?
      const isText =
        file.type.startsWith('text/') ||
        ['md', 'txt', 'json', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'py', 'java', 'c', 'cpp'].includes(ext);

      const reader = new FileReader();

      if (isText) {
        reader.onload = (event) => {
          const text = event.target?.result as string;
          onAddFile({
            name: file.name,
            size: formattedSize,
            sizeBytes: file.size,
            category: selectedCategory,
            type: file.type || 'text/plain',
            extension: ext,
            textContent: text,
            dataUrl: undefined
          });
        };
        reader.readAsText(file);
      } else {
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          onAddFile({
            name: file.name,
            size: formattedSize,
            sizeBytes: file.size,
            category: selectedCategory,
            type: file.type || 'application/octet-stream',
            extension: ext,
            dataUrl: dataUrl
          });
        };
        reader.readAsDataURL(file);
      }
    });

    setShowUploadModal(false);
  };

  // Trigger File Download
  const downloadFileItem = (item: FileItem) => {
    if (item.dataUrl || item.annotations) {
      const link = document.createElement('a');
      link.href = item.annotations || item.dataUrl || '';
      link.download = item.name;
      link.click();
    } else if (item.textContent) {
      const blob = new Blob([item.textContent], { type: item.type || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.name;
    } else if (item.textContent) {
      const blob = new Blob([item.textContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.name}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }

  };

  // Update File Category
  const handleFileCategoryChange = (file: FileItem, newCat: string) => {
    if (onUpdateFile) {
      onUpdateFile({ ...file, category: newCat });
    }
  };

  // Filtered & Sorted Files
  const filteredFiles = files.filter((f) => {
    const matchesCat = categoryFilter === 'All' || f.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.extension && f.extension.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    if (sortBy === 'oldest') return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'size') return (b.sizeBytes || 0) - (a.sizeBytes || 0);
    return 0;
  });

  // Parse size in bytes even if legacy file size string is stored
  const parseSizeBytes = (f: FileItem): number => {
    if (f.sizeBytes && f.sizeBytes > 0) return f.sizeBytes;
    if (!f.size) return 0;
    const num = parseFloat(f.size);
    if (isNaN(num)) return 0;
    if (f.size.toLowerCase().includes('gb')) return num * 1024 * 1024 * 1024;
    if (f.size.toLowerCase().includes('mb')) return num * 1024 * 1024;
    if (f.size.toLowerCase().includes('kb')) return num * 1024;
    return num;
  };

  // Calculate Total Storage Stats
  const totalSizeBytes = files.reduce((acc, f) => acc + parseSizeBytes(f), 0);
  const totalStorageFormatted = formatBytes(totalSizeBytes);

  // Extension Badge Helper
  const getFileBadgeIcon = (ext?: string, type?: string) => {
    const cleanExt = (ext || '').toLowerCase();
    if (cleanExt === 'pdf') return { label: 'PDF', color: '#e63946' };
    if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(cleanExt) || type?.startsWith('image/'))
      return { label: 'IMG', color: '#2a9d8f' };
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(cleanExt))
      return { label: 'ZIP', color: '#f4a261' };
    if (['md', 'txt', 'doc', 'docx'].includes(cleanExt))
      return { label: 'DOC', color: '#457b9d' };
    if (['js', 'ts', 'jsx', 'tsx', 'json', 'py', 'html', 'css'].includes(cleanExt))
      return { label: 'CODE', color: '#e76f51' };
    return { label: 'FILE', color: '#8a8075' };
  };

  return (
    <section className="page files-page">
      {/* Category Navigation Bar */}
      <div className="folder-nav-bar">
        <div className="folder-pills">
          <button
            type="button"
            className={`folder-pill ${categoryFilter === 'All' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('All')}
          >
            All Files ({files.length})
          </button>
          {categories.map((cat) => {
            const count = files.filter((f) => f.category.toLowerCase() === cat.toLowerCase()).length;
            const isCustom = !DEFAULT_CATEGORIES.includes(cat);
            if (!isCustom) {
              return (
                <button
                  key={cat}
                  type="button"
                  className={`folder-pill ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat} ({count})
                </button>
              );
            }
            return (
              <div key={cat} className="folder-pill-wrapper">
                <button
                  type="button"
                  className={`folder-pill ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat} ({count})
                </button>
                <button
                  type="button"
                  className="folder-delete-btn"
                  title="Delete custom category"
                  onClick={() => handleDeleteCategory(cat)}
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
          onClick={() => setIsCreatingCategory((prev) => !prev)}
        >
          {isCreatingCategory ? 'Cancel' : '+ New Category'}
        </button>
      </div>

      {/* New Category Inline Form */}
      {isCreatingCategory && (
        <form className="add-folder-form" onSubmit={handleAddCategory}>
          <input
            type="text"
            className="folder-name-input"
            placeholder="Category name (e.g., Financials, Contracts, Research)..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            autoFocus
          />
          <button type="submit" className="primary-button sm-btn">
            Create Category
          </button>
        </form>
      )}

      {/* Toolbar & Controls */}
      <div className="files-controls-bar">
        <div className="search-sort-group">
          <input
            type="text"
            className="search-input"
            placeholder="Search files by name or extension (.pdf, .png)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <CustomSelect
            className="sort-select-custom"
            value={sortBy}
            options={[
              { value: 'newest', label: 'Sort: Newest First' },
              { value: 'oldest', label: 'Sort: Oldest First' },
              { value: 'name', label: 'Sort: Name (A-Z)' },
              { value: 'size', label: 'Sort: Size (Largest)' }
            ]}
            onChange={(val) => setSortBy(val as any)}
          />

          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              Grid
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              List
            </button>
          </div>
        </div>

        <div className="files-summary-badge">
          <span>Total Storage: <strong>{totalStorageFormatted}</strong> ({files.length} items)</span>
        </div>

        <button className="primary-button" onClick={() => setShowUploadModal(true)}>
          + Upload File
        </button>
      </div>

      {/* File Grid / List Display */}
      <section className="panel files-panel">
        {sortedFiles.length === 0 ? (
          <div className="empty-files-box">
            <p className="empty-title">No files found</p>
            <p className="empty-text">Upload a document, PDF, screenshot, or code snippet to begin organizing your files.</p>
            <button className="primary-button sm-btn" onClick={() => setShowUploadModal(true)}>
              + Upload File
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="files-grid">
            {sortedFiles.map((f) => {
              const badge = getFileBadgeIcon(f.extension, f.type);
              return (
                <div key={f.id} className="file-card-item">
                  <div className="file-card-header">
                    <span className="file-badge" style={{ backgroundColor: badge.color }}>
                      {badge.label}
                    </span>
                    <select
                      className="card-category-select"
                      value={f.category}
                      onChange={(e) => handleFileCategoryChange(f, e.target.value)}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="file-card-body" onClick={() => setViewerFile(f)}>
                    <div className="file-icon-large">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    <strong className="file-card-title" title={f.name}>
                      {f.name}
                    </strong>
                    <span className="file-card-meta">
                      {f.size} · {f.uploadedAt}
                    </span>
                  </div>

                  <div className="file-card-footer">
                    <button
                      type="button"
                      className="quiet-button sm-btn"
                      onClick={() => setViewerFile(f)}
                      title="Open & Annotate Document in Full Screen Studio"
                    >
                      Open / View
                    </button>
                    <button
                      type="button"
                      className="quiet-button sm-btn"
                      onClick={() => downloadFileItem(f)}
                      title="Download File"
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      className="card-delete-btn"
                      onClick={() => onDeleteFile(f.id)}
                      title="Delete File"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="files-list-table">
            <div className="list-header">
              <span>Name</span>
              <span>Category</span>
              <span>Size</span>
              <span>Date</span>
              <span>Actions</span>
            </div>
            {sortedFiles.map((f) => {
              const badge = getFileBadgeIcon(f.extension, f.type);
              const isPdf = f.name.toLowerCase().endsWith('.pdf');
              const isImg = f.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
              const isTxt = f.name.match(/\.(txt|md|csv|json|js|ts|html|css|xml)$/i);
              const canView = isPdf || isImg || isTxt;

              return (
                <div key={f.id} className="list-row">
                  <div className="list-name-col" onClick={() => setViewerFile(f)}>
                    <span className="file-badge-sm" style={{ backgroundColor: badge.color }}>
                      {badge.label}
                    </span>
                    <strong className="list-file-name">{f.name}</strong>
                  </div>
                  <div className="list-category-col">
                    <select
                      value={f.category}
                      onChange={(e) => handleFileCategoryChange(f, e.target.value)}
                      className="list-category-select"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="list-size-col">{f.size}</div>
                  <div className="list-date-col">{f.uploadedAt}</div>
                  <div className="list-actions-col">
                    {canView && (
                      <button
                        type="button"
                        className="quiet-button sm-btn"
                        onClick={() => setViewerFile(f)}
                      >
                        View
                      </button>
                    )}
                    <button
                      type="button"
                      className="quiet-button sm-btn"
                      onClick={() => downloadFileItem(f)}
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      className="quiet-button danger-sm sm-btn"
                      onClick={() => {
                        if (onShowDialog) {
                          onShowDialog({
                            title: 'Delete File Record',
                            message: `Are you sure you want to delete file "${f.name}"? This action cannot be undone.`,
                            type: 'danger',
                            confirmLabel: 'Delete File',
                            cancelLabel: 'Cancel',
                            onConfirm: () => onDeleteFile(f.id)
                          });
                        } else {
                          onDeleteFile(f.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="modal-backdrop" onMouseDown={() => setShowUploadModal(false)}>
          <section className="composer upload-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">UPLOAD NEW FILE RECORD</p>
                <h3 style={{ margin: 0 }}>Add Files to Workspace</h3>
              </div>
              <button type="button" className="close-btn" onClick={() => setShowUploadModal(false)} aria-label="Close modal">
                ✕
              </button>
            </div>

            <div
              className="dropzone-area"
              onClick={() => dropzoneInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  processUploadedFiles(e.dataTransfer.files);
                }
              }}
            >
              <input
                type="file"
                multiple
                ref={dropzoneInputRef}
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    processUploadedFiles(e.target.files);
                  }
                }}
              />
              <div className="dropzone-icon">📁</div>
              <p className="dropzone-text">
                <strong>Click to browse</strong> or drag & drop files here
              </p>
              <small className="dropzone-sub">
                Supports PDFs, Images, Markdown, Code, Zip, Documents (Auto-extracts metadata & size)
              </small>
            </div>

            <label style={{ marginTop: '14px' }}>
              Assign Category
              <CustomSelect
                value={selectedCategory}
                options={categories}
                onChange={(val) => setSelectedCategory(val)}
              />
            </label>

            <div className="modal-actions" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="quiet-button"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => dropzoneInputRef.current?.click()}
              >
                Browse Files
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Interactive Full-Screen Document Studio & Annotator Modal */}
      {viewerFile && (
        <DocumentStudioModal
          file={viewerFile}
          onClose={() => setViewerFile(null)}
          onUpdateFile={(updated) => {
            if (onUpdateFile) onUpdateFile(updated);
            setViewerFile(updated);
          }}
          onDownload={() => downloadFileItem(viewerFile)}
        />
      )}
    </section>
  );
}

/* =========================================================================
   Full-Width Multi-Format File Studio Viewer Components
   ========================================================================= */

interface SheetData {
  name: string;
  rows: (string | number)[][];
}

/* Interactive Excel & Spreadsheet Viewer */
function SpreadsheetViewer({ file }: { file: FileItem }) {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setLoading(true);
      setErrorMsg(null);

      let wb: XLSX.WorkBook | null = null;
      if (file.dataUrl && file.dataUrl.startsWith('data:')) {
        const base64Str = file.dataUrl.split(',')[1];
        wb = XLSX.read(base64Str, { type: 'base64' });
      } else if (file.textContent) {
        wb = XLSX.read(file.textContent, { type: 'string' });
      }

      if (wb && wb.SheetNames && wb.SheetNames.length > 0) {
        const parsedSheets: SheetData[] = wb.SheetNames.map((sheetName) => {
          const worksheet = wb!.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
            header: 1,
            defval: ''
          });
          return { name: sheetName, rows: rawRows };
        });
        setSheets(parsedSheets);
      } else {
        setErrorMsg('No readable sheet data found in spreadsheet.');
      }
    } catch (err) {
      console.error('Spreadsheet parse error:', err);
      setErrorMsg('Unable to parse spreadsheet layout.');
    } finally {
      setLoading(false);
    }
  }, [file.id, file.dataUrl, file.textContent]);

  if (loading) {
    return (
      <div className="sheet-status-box">
        <p>Loading spreadsheet layout...</p>
      </div>
    );
  }

  if (errorMsg || sheets.length === 0) {
    return (
      <div className="sheet-status-box error">
        <p>{errorMsg || 'No spreadsheet rows available.'}</p>
        <span className="sub-text">Download file to view in Microsoft Excel or Google Sheets.</span>
      </div>
    );
  }

  const currentSheet = sheets[activeSheetIndex] || sheets[0];
  const allRows = currentSheet.rows || [];

  const filteredRows = searchFilter.trim()
    ? allRows.filter((r) => r.some((c) => String(c).toLowerCase().includes(searchFilter.toLowerCase())))
    : allRows;

  const maxCols = Math.max(0, ...filteredRows.map((r) => r.length));
  const getColHeader = (index: number) => {
    let code = '';
    while (index >= 0) {
      code = String.fromCharCode((index % 26) + 65) + code;
      index = Math.floor(index / 26) - 1;
    }
    return code;
  };

  return (
    <div className="spreadsheet-viewer-container">
      <div className="spreadsheet-meta-bar">
        <div className="sheet-info-group">
          <span className="sheet-badge">EXCEL / SPREADSHEET</span>
          <span className="sheet-meta">
            Sheet: <strong>{currentSheet.name}</strong> · Rows: <strong>{allRows.length}</strong> · Cols: <strong>{maxCols}</strong>
          </span>
        </div>
        <div className="sheet-search-box">
          <input
            type="text"
            placeholder="Search spreadsheet cells..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="sheet-search-input"
          />
        </div>
      </div>

      {sheets.length > 1 && (
        <div className="spreadsheet-tabs-row">
          {sheets.map((s, idx) => (
            <button
              key={s.name}
              type="button"
              className={`sheet-tab-btn ${idx === activeSheetIndex ? 'active' : ''}`}
              onClick={() => setActiveSheetIndex(idx)}
            >
              {s.name} ({s.rows.length} rows)
            </button>
          ))}
        </div>
      )}

      <div className="spreadsheet-grid-viewport">
        <table className="excel-data-table">
          <thead>
            <tr>
              <th className="row-num-col">#</th>
              {Array.from({ length: maxCols }).map((_, cIdx) => (
                <th key={cIdx} className="excel-header-col">
                  {getColHeader(cIdx)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, rIdx) => (
              <tr key={rIdx}>
                <td className="row-num-cell">{rIdx + 1}</td>
                {Array.from({ length: maxCols }).map((_, cIdx) => (
                  <td key={cIdx} className="excel-grid-cell">
                    {row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Microsoft Word & PowerPoint Document Viewer */
function DocxViewer({ file, onDownload }: { file: FileItem; onDownload: () => void }) {
  const [extractedText, setExtractedText] = useState<string | null>(file.textContent || null);
  const [loading, setLoading] = useState(!file.textContent && Boolean(file.dataUrl));
  const [isSlideDeck, setIsSlideDeck] = useState(false);

  useEffect(() => {
    if (file.textContent) {
      setExtractedText(file.textContent);
      setLoading(false);
      return;
    }

    if (!file.dataUrl || !file.dataUrl.startsWith('data:')) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function parseOfficeDocument() {
      try {
        const base64Str = file.dataUrl!.split(',')[1];
        const zip = await JSZip.loadAsync(base64Str, { base64: true });

        // 1. Parse DOCX (word/document.xml)
        const docXmlFile = zip.file('word/document.xml');
        if (docXmlFile) {
          const docXmlText = await docXmlFile.async('string');
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(docXmlText, 'text/xml');
          const paragraphs = xmlDoc.getElementsByTagName('w:p');
          const lines: string[] = [];
          for (let i = 0; i < paragraphs.length; i++) {
            const textNodes = paragraphs[i].getElementsByTagName('w:t');
            let pText = '';
            for (let j = 0; j < textNodes.length; j++) {
              pText += textNodes[j].textContent || '';
            }
            if (pText.trim()) {
              lines.push(pText.trim());
            }
          }
          if (isMounted && lines.length > 0) {
            setExtractedText(lines.join('\n\n'));
            setIsSlideDeck(false);
            setLoading(false);
            return;
          }
        }

        // 2. Parse PPTX (ppt/slides/slide*.xml)
        const slideFiles = Object.keys(zip.files).filter((f) =>
          f.match(/^ppt\/slides\/slide\d+\.xml$/i)
        );
        if (slideFiles.length > 0) {
          slideFiles.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
            const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
            return numA - numB;
          });

          const slides: string[] = [];
          for (let i = 0; i < slideFiles.length; i++) {
            const slideXmlText = await zip.files[slideFiles[i]].async('string');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(slideXmlText, 'text/xml');
            const textNodes = xmlDoc.getElementsByTagName('a:t');
            let sText = '';
            for (let j = 0; j < textNodes.length; j++) {
              const txt = textNodes[j].textContent || '';
              if (txt.trim()) {
                sText += txt.trim() + ' ';
              }
            }
            if (sText.trim()) {
              slides.push(`SLIDE ${i + 1}\n${sText.trim()}`);
            }
          }
          if (isMounted && slides.length > 0) {
            setExtractedText(slides.join('\n\n'));
            setIsSlideDeck(true);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Office zip extraction error:', err);
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    parseOfficeDocument();

    return () => {
      isMounted = false;
    };
  }, [file.dataUrl, file.textContent]);

  const wordCount = extractedText ? extractedText.trim().split(/\s+/).length : 0;
  const charCount = extractedText ? extractedText.length : 0;
  const extUpper = file.extension?.toUpperCase() || (isSlideDeck ? 'PPTX' : 'DOCX');

  // Split text into paragraphs for Word document sheets
  const paragraphs = useMemo(() => {
    if (!extractedText || isSlideDeck) return [];
    return extractedText.split('\n\n').filter((p) => p.trim().length > 0);
  }, [extractedText, isSlideDeck]);

  // Group paragraphs into realistic multi-page document sheets
  const docPages = useMemo(() => {
    if (isSlideDeck || paragraphs.length === 0) return [];
    const pages: string[][] = [];
    let currentPage: string[] = [];
    let currentLen = 0;

    paragraphs.forEach((p) => {
      currentPage.push(p);
      currentLen += p.length;
      if (currentLen > 1400 || currentPage.length >= 7) {
        pages.push(currentPage);
        currentPage = [];
        currentLen = 0;
      }
    });
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }
    return pages;
  }, [paragraphs, isSlideDeck]);

  if (loading) {
    return (
      <div className="sheet-status-box">
        <p>Loading document layout for {extUpper}...</p>
      </div>
    );
  }

  return (
    <div className="docx-viewer-container">
      {/* Document Header Banner */}
      <div className="docx-header-banner">
        <div className="docx-info-group">
          <span className="docx-type-badge">{extUpper} DOCUMENT</span>
          <h3>{file.name}</h3>
          <span className="docx-meta">
            Size: <strong>{file.size}</strong> · Words: <strong>{wordCount}</strong> · Characters: <strong>{charCount}</strong>
          </span>
        </div>
        <button type="button" className="primary-button sm-btn" onClick={onDownload}>
          Download Document
        </button>
      </div>

      {/* Main Viewport containing paper sheets / slide cards */}
      <div className="docx-content-viewport">
        {extractedText ? (
          isSlideDeck ? (
            /* PowerPoint Presentation Slides View */
            <div className="pptx-slides-wrapper">
              {extractedText.split('\n\n').map((block, idx) => {
                const lines = block.split('\n');
                const slideNumText = lines[0] || `SLIDE ${idx + 1}`;
                const slideBody = lines.slice(1).join(' ');
                return (
                  <div key={idx} className="pptx-slide-card">
                    <div className="slide-card-header">
                      <span className="slide-num-badge">{slideNumText}</span>
                      <span className="slide-deck-meta">Presentation Slide</span>
                    </div>
                    <div className="slide-card-body">
                      <p>{slideBody}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Microsoft Word Document Multi-Page Sheet View */
            <div className="docx-pages-wrapper">
              {docPages.map((pageParagraphs, pIdx) => (
                <div key={pIdx} className="docx-page-sheet">
                  <div className="docx-page-header">
                    <span className="docx-page-doc-title">{file.name}</span>
                    <span className="docx-page-meta">Page {pIdx + 1} of {docPages.length}</span>
                  </div>
                  <div className="docx-page-content">
                    {pageParagraphs.map((para, idx) => (
                      <p key={idx}>{para}</p>
                    ))}
                  </div>
                  <div className="docx-page-footer">
                    <span>Daymark Document Studio</span>
                    <span>{pIdx + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="docx-fallback-card">
            <h4>Microsoft Office Document ({extUpper})</h4>
            <p>
              This file ({file.name}) is ready for download and viewing in Microsoft Word or PowerPoint.
            </p>
            <button type="button" className="primary-button" onClick={onDownload}>
              Download {file.name} ({file.size})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* Full Screen Document Studio Modal */
interface DocumentStudioModalProps {
  file: FileItem;
  onClose: () => void;
  onUpdateFile: (file: FileItem) => void;
  onDownload: () => void;
}

function DocumentStudioModal({ file, onClose, onDownload }: DocumentStudioModalProps) {
  const isPdf =
    file.extension?.toLowerCase() === 'pdf' ||
    file.name.toLowerCase().endsWith('.pdf') ||
    (file.type || '').includes('pdf');

  const isSvg =
    !isPdf &&
    (file.extension?.toLowerCase() === 'svg' ||
      (file.type || '').includes('svg') ||
      (file.dataUrl || '').startsWith('data:image/svg'));

  const isImage =
    isSvg ||
    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(file.extension?.toLowerCase() || '') ||
    (file.type || '').startsWith('image/');

  const isSpreadsheet =
    ['xlsx', 'xls', 'csv', 'tsv', 'ods'].includes(file.extension?.toLowerCase() || '') ||
    (file.type || '').includes('sheet') ||
    (file.type || '').includes('excel') ||
    (file.type || '').includes('csv');

  const isDocxOrPpt =
    ['docx', 'doc', 'pptx', 'ppt', 'rtf'].includes(file.extension?.toLowerCase() || '') ||
    (file.type || '').includes('wordprocessingml') ||
    (file.type || '').includes('msword') ||
    (file.type || '').includes('presentationml');

  const isTextOrCode =
    !isSpreadsheet &&
    !isDocxOrPpt &&
    (file.textContent ||
      ['md', 'txt', 'json', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'py', 'sql', 'yaml', 'yml', 'xml', 'log'].includes(
        file.extension?.toLowerCase() || ''
      ) ||
      (file.type || '').startsWith('text/'));

  // Convert Base64 PDF DataURL to Blob URL so Chrome renders PDF pages reliably
  const pdfBlobUrl = useMemo(() => {
    if (!file.dataUrl || !isPdf) return null;
    if (file.dataUrl.startsWith('blob:')) return file.dataUrl;
    if (file.dataUrl.startsWith('data:')) {
      try {
        const parts = file.dataUrl.split(';base64,');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        return URL.createObjectURL(blob);
      } catch (e) {
        console.error('DataURL to Blob conversion failed:', e);
        return file.dataUrl;
      }
    }
    return file.dataUrl;
  }, [file.dataUrl, isPdf]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl && pdfBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  return (
    <div className="modal-backdrop document-studio-backdrop" onMouseDown={onClose}>
      <div className="document-studio-container full-width-studio" onMouseDown={(e) => e.stopPropagation()}>
        {/* Studio Header Bar */}
        <div className="studio-header">
          <div className="studio-title-group">
            <span className="eyebrow">DOCUMENT WORKSPACE STUDIO</span>
            <h2>{file.name}</h2>
            <span className="file-studio-meta">
              {file.size} · Category: <strong>{file.category}</strong> · Uploaded: {file.uploadedAt}
            </span>
          </div>

          <div className="studio-header-actions">
            <button type="button" className="quiet-button sm-btn" onClick={onDownload}>
              Download File
            </button>
            <button type="button" className="close" onClick={onClose} title="Close File Viewer">
              ×
            </button>
          </div>
        </div>

        {/* Studio Body Content (Full Width) */}
        <div className="studio-body full-width-body">
          {isPdf ? (
            <div className="pdf-viewport-full">
              <iframe
                src={pdfBlobUrl || file.dataUrl}
                className="pdf-document-frame"
                title={file.name}
              />
            </div>
          ) : isSpreadsheet ? (
            <SpreadsheetViewer file={file} />
          ) : isDocxOrPpt ? (
            <DocxViewer file={file} onDownload={onDownload} />
          ) : isImage ? (
            <div className="image-viewport-full">
              <img src={file.dataUrl} className="image-document-view" alt={file.name} />
            </div>
          ) : isTextOrCode ? (
            <div className="text-viewer-container">
              <div className="text-viewer-toolbar">
                <span>Format: <strong>{file.extension?.toUpperCase() || 'TEXT'}</strong></span>
                <span>Lines: <strong>{(file.textContent || '').split('\n').length}</strong></span>
                <button
                  type="button"
                  className="quiet-button sm-btn"
                  onClick={(e) => {
                    navigator.clipboard.writeText(file.textContent || '');
                    const btn = e.currentTarget;
                    btn.textContent = 'Copied ✓';
                    setTimeout(() => { btn.textContent = 'Copy Text'; }, 2000);
                  }}
                >
                  Copy Text
                </button>

              </div>
              <pre className="code-text-display">
                <code>{file.textContent || 'No text content available.'}</code>
              </pre>
            </div>
          ) : (
            <div className="generic-viewer-box">
              <span className="eyebrow">ATTACHMENT FILE RECORD</span>
              <h3>{file.name}</h3>
              <p>Type: {file.type || 'Binary Package'} · Size: {file.size}</p>
              <button type="button" className="primary-button" onClick={onDownload}>
                Download {file.name} ({file.size})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
