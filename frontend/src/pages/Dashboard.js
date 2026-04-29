import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const FILE_ICONS = {
  'image/png': { icon: '🖼', color: '#7c3aed', bg: '#f5f3ff' },
  'image/jpeg': { icon: '🖼', color: '#7c3aed', bg: '#f5f3ff' },
  'image/gif': { icon: '🖼', color: '#7c3aed', bg: '#f5f3ff' },
  'image/webp': { icon: '🖼', color: '#7c3aed', bg: '#f5f3ff' },
  'application/pdf': { icon: '📄', color: '#dc2626', bg: '#fef2f2' },
  'video/mp4': { icon: '🎬', color: '#d97706', bg: '#fffbeb' },
  'video/webm': { icon: '🎬', color: '#d97706', bg: '#fffbeb' },
  'audio/mpeg': { icon: '🎵', color: '#059669', bg: '#f0fdf4' },
  'application/zip': { icon: '📦', color: '#374151', bg: '#f9fafb' },
  'application/x-zip-compressed': { icon: '📦', color: '#374151', bg: '#f9fafb' },
  'text/plain': { icon: '📝', color: '#2563eb', bg: '#eff6ff' },
  'text/csv': { icon: '📊', color: '#059669', bg: '#f0fdf4' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📊', color: '#059669', bg: '#f0fdf4' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', color: '#2563eb', bg: '#eff6ff' },
};

const getFileStyle = (mime) => FILE_ICONS[mime] || { icon: '📁', color: '#6b7280', bg: '#f9fafb' };

const formatSize = (bytes) => {
  const b = parseInt(bytes);
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  if (b < 1024 * 1024 * 1024) return (b / (1024 * 1024)).toFixed(1) + ' MB';
  return (b / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

const formatDate = (d) => {
  const date = new Date(d);
  const now = new Date();
  const diff = (now - date) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getUserInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingName, setUploadingName] = useState('');
  const [view, setView] = useState('grid'); // grid | list
  const [tab, setTab] = useState('myfiles'); // myfiles | shared | recent
  const [selectedFile, setSelectedFile] = useState(null);
  const [detailPanel, setDetailPanel] = useState(false);
  const [versions, setVersions] = useState([]);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('viewer');
  const [shareMsg, setShareMsg] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [userName, setUserName] = useState('User');
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchFiles();
    fetchShared();
    const name = localStorage.getItem('userName');
    if (name) setUserName(name);
  }, []);

  const fetchFiles = async () => {
    try {
      const { data } = await api.get('/files');
      setFiles(data);
    } catch {}
  };

  const fetchShared = async () => {
    try {
      const { data } = await api.get('/files/shared-with-me');
      setSharedFiles(data);
    } catch {}
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadingName(file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setUploadProgress(Math.round((e.loaded / e.total) * 100))
      });
      await fetchFiles();
      showToast(`"${file.name}" uploaded successfully`);
    } catch {
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadingName('');
    }
  };

  const handleDownload = async (file) => {
    try {
      const { data } = await api.get(`/files/${file.id}/download`);
      window.open(data.url, '_blank');
      showToast(`Downloading "${file.name}"`);
    } catch { showToast('Download failed', 'error'); }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/files/${file.id}`);
      setFiles(f => f.filter(x => x.id !== file.id));
      if (selectedFile?.id === file.id) { setSelectedFile(null); setDetailPanel(false); }
      showToast(`"${file.name}" deleted`);
    } catch { showToast('Delete failed', 'error'); }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    try {
      const { data } = await api.post(`/files/${selectedFile.id}/share`, { email: shareEmail, role: shareRole });
      setShareMsg(data.message);
      setShareEmail('');
      showToast('File shared successfully');
    } catch (err) {
      setShareMsg(err.response?.data?.error || 'Share failed');
    }
  };

  const fetchVersions = async (file) => {
    try {
      const { data } = await api.get(`/files/${file.id}/versions`);
      setVersions(data);
    } catch { setVersions([]); }
  };

  const openDetail = (file) => {
    setSelectedFile(file);
    setDetailPanel(true);
    setVersions([]);
    setShareMsg('');
    fetchVersions(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleContextMenu = (e, file) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const closeContext = () => setContextMenu(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const displayFiles = (tab === 'shared' ? sharedFiles : files)
    .filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const totalSize = files.reduce((acc, f) => acc + parseInt(f.size_bytes || 0), 0);
  const storageUsedPct = Math.min((totalSize / (50 * 1024 * 1024 * 1024)) * 100, 100);

  return (
    <div className="dash-root" onClick={closeContext} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>

      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M14 3C8.477 3 4 7.477 4 13c0 3.09 1.408 5.857 3.632 7.723L6 24h16l-1.632-3.277A9.956 9.956 0 0024 13c0-5.523-4.477-10-10-10z" fill="white" fillOpacity="0.9"/>
              <circle cx="10" cy="13" r="2" fill="#2563eb"/>
              <circle cx="14" cy="10" r="2" fill="#2563eb"/>
              <circle cx="18" cy="13" r="2" fill="#2563eb"/>
            </svg>
          </div>
          <span className="topbar-name">CloudVault</span>
        </div>

        <div className="topbar-search">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input
            className="search-input"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="topbar-right">
          <button className="upload-btn" onClick={() => fileInputRef.current.click()}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 4L7 1l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Upload
          </button>
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files[0])}/>
          <div className="user-avatar" title={userName}>{getUserInitials(userName)}</div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </header>

      <div className="dash-body">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <button className={`nav-item ${tab === 'myfiles' ? 'active' : ''}`} onClick={() => setTab('myfiles')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3.5A1.5 1.5 0 013.5 2h3.879a1.5 1.5 0 011.06.44l1.122 1.12A1.5 1.5 0 0010.62 4H12.5A1.5 1.5 0 0114 5.5v7A1.5 1.5 0 0112.5 14h-9A1.5 1.5 0 012 12.5v-9z" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
              My Files
              <span className="nav-badge">{files.length}</span>
            </button>
            <button className={`nav-item ${tab === 'shared' ? 'active' : ''}`} onClick={() => setTab('shared')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="10.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1 13c0-2.21 2.015-4 4.5-4s4.5 1.79 4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M11 9c1.657 0 3 1.343 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Shared with me
              <span className="nav-badge">{sharedFiles.length}</span>
            </button>
            <button className={`nav-item ${tab === 'recent' ? 'active' : ''}`} onClick={() => setTab('recent')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Recent
            </button>
          </nav>

          <div className="sidebar-storage">
            <div className="storage-label">
              <span>Storage</span>
              <span className="storage-used">{formatSize(totalSize)} / 50 GB</span>
            </div>
            <div className="storage-bar">
              <div className="storage-fill" style={{ width: storageUsedPct + '%' }}/>
            </div>
            <div className="storage-pct">{storageUsedPct.toFixed(1)}% used</div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">

          {/* Drag overlay */}
          {dragging && (
            <div className="drag-overlay">
              <div className="drag-inner">
                <div className="drag-icon">⬆</div>
                <div className="drag-text">Drop to upload</div>
              </div>
            </div>
          )}

          {/* Upload progress bar */}
          {uploading && (
            <div className="upload-progress-bar">
              <div className="upb-left">
                <div className="upb-spinner"/>
                <span className="upb-name">Uploading <strong>{uploadingName}</strong></span>
              </div>
              <div className="upb-track">
                <div className="upb-fill" style={{ width: uploadProgress + '%' }}/>
              </div>
              <span className="upb-pct">{uploadProgress}%</span>
            </div>
          )}

          {/* Page header */}
          <div className="content-header">
            <div className="content-header-left">
              <h2 className="content-title">
                {tab === 'myfiles' && 'My Files'}
                {tab === 'shared' && 'Shared with me'}
                {tab === 'recent' && 'Recent'}
              </h2>
              <span className="content-count">{displayFiles.length} item{displayFiles.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="view-toggle">
              <button className={`vt-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')} title="Grid view">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="0" width="6" height="6" rx="1"/><rect x="8" y="0" width="6" height="6" rx="1"/><rect x="0" y="8" width="6" height="6" rx="1"/><rect x="8" y="8" width="6" height="6" rx="1"/></svg>
              </button>
              <button className={`vt-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')} title="List view">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3h10M2 7h10M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>

          {/* Empty state */}
          {displayFiles.length === 0 && !uploading && (
            <div className="empty-state">
              <div className="empty-icon">
                {search ? '🔍' : tab === 'shared' ? '👥' : '☁'}
              </div>
              <div className="empty-title">
                {search ? `No results for "${search}"` : tab === 'shared' ? 'No files shared with you' : 'No files yet'}
              </div>
              <div className="empty-sub">
                {!search && tab === 'myfiles' && 'Upload your first file by clicking the Upload button or dragging a file here'}
              </div>
              {!search && tab === 'myfiles' && (
                <button className="empty-upload-btn" onClick={() => fileInputRef.current.click()}>
                  Upload a file
                </button>
              )}
            </div>
          )}

          {/* GRID VIEW */}
          {view === 'grid' && displayFiles.length > 0 && (
            <div className="file-grid">
              {displayFiles.map(file => {
                const { icon, color, bg } = getFileStyle(file.mime_type);
                return (
                  <div
                    key={file.id}
                    className={`file-card ${selectedFile?.id === file.id ? 'selected' : ''}`}
                    onClick={() => openDetail(file)}
                    onContextMenu={e => handleContextMenu(e, file)}
                  >
                    <div className="fc-thumb" style={{ background: bg }}>
                      <span className="fc-icon">{icon}</span>
                    </div>
                    <div className="fc-body">
                      <div className="fc-name" title={file.name}>{file.name}</div>
                      <div className="fc-meta">{formatSize(file.size_bytes)} · {formatDate(file.created_at)}</div>
                    </div>
                    <div className="fc-actions">
                      <button className="fca-btn" onClick={e => { e.stopPropagation(); handleDownload(file); }} title="Download">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v7M4 6l2.5 2.5L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 10v.5A1.5 1.5 0 002.5 12h8a1.5 1.5 0 001.5-1.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </button>
                      <button className="fca-btn danger" onClick={e => { e.stopPropagation(); handleDelete(file); }} title="Delete">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5h9M5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M10.5 3.5l-.5 7a1 1 0 01-1 1h-5a1 1 0 01-1-1l-.5-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                    {file.role && <span className="fc-shared-badge">{file.role}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* LIST VIEW */}
          {view === 'list' && displayFiles.length > 0 && (
            <div className="file-list-wrap">
              <div className="list-header">
                <span className="lh-name">Name</span>
                <span className="lh-size">Size</span>
                <span className="lh-date">Modified</span>
                <span className="lh-actions">Actions</span>
              </div>
              {displayFiles.map(file => {
                const { icon, color, bg } = getFileStyle(file.mime_type);
                return (
                  <div
                    key={file.id}
                    className={`list-row ${selectedFile?.id === file.id ? 'selected' : ''}`}
                    onClick={() => openDetail(file)}
                    onContextMenu={e => handleContextMenu(e, file)}
                  >
                    <div className="lr-name">
                      <div className="lr-icon" style={{ background: bg, color }}>
                        {icon}
                      </div>
                      <div>
                        <div className="lr-filename">{file.name}</div>
                        {file.role && <span className="lr-role">{file.role}</span>}
                      </div>
                    </div>
                    <span className="lr-size">{formatSize(file.size_bytes)}</span>
                    <span className="lr-date">{formatDate(file.created_at)}</span>
                    <div className="lr-actions">
                      <button className="la-btn" onClick={e => { e.stopPropagation(); handleDownload(file); }}>Download</button>
                      {!file.role && <button className="la-btn danger" onClick={e => { e.stopPropagation(); handleDelete(file); }}>Delete</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* DETAIL PANEL */}
        {detailPanel && selectedFile && (
          <aside className="detail-panel">
            <div className="dp-header">
              <h3 className="dp-title">File details</h3>
              <button className="dp-close" onClick={() => setDetailPanel(false)}>✕</button>
            </div>

            <div className="dp-preview">
              <div className="dp-icon-wrap" style={{ background: getFileStyle(selectedFile.mime_type).bg }}>
                <span className="dp-icon">{getFileStyle(selectedFile.mime_type).icon}</span>
              </div>
              <div className="dp-filename">{selectedFile.name}</div>
            </div>

            <div className="dp-info">
              <div className="dp-row"><span className="dp-key">Size</span><span className="dp-val">{formatSize(selectedFile.size_bytes)}</span></div>
              <div className="dp-row"><span className="dp-key">Type</span><span className="dp-val">{selectedFile.mime_type || 'Unknown'}</span></div>
              <div className="dp-row"><span className="dp-key">Uploaded</span><span className="dp-val">{formatDate(selectedFile.created_at)}</span></div>
            </div>

            <div className="dp-actions">
              <button className="dp-btn primary" onClick={() => handleDownload(selectedFile)}>
                ⬇ Download
              </button>
              {!selectedFile.role && (
                <button className="dp-btn danger" onClick={() => handleDelete(selectedFile)}>
                  🗑 Delete
                </button>
              )}
            </div>

            {/* Share section */}
            {!selectedFile.role && (
              <div className="dp-section">
                <div className="dp-section-title">Share file</div>
                <form onSubmit={handleShare} className="share-form">
                  <input
                    className="share-input"
                    type="email"
                    placeholder="Email address"
                    value={shareEmail}
                    onChange={e => setShareEmail(e.target.value)}
                    required
                  />
                  <select className="share-select" value={shareRole} onChange={e => setShareRole(e.target.value)}>
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button className="share-btn" type="submit">Share</button>
                </form>
                {shareMsg && <div className="share-msg">{shareMsg}</div>}
              </div>
            )}

            {/* Version history */}
            <div className="dp-section">
              <div className="dp-section-title">Version history</div>
              {versions.length === 0 ? (
                <div className="dp-empty">No versions found</div>
              ) : (
                <div className="versions-list">
                  {versions.map((v, i) => (
                    <div key={v.versionId} className="version-row">
                      <div className={`v-dot ${v.isLatest ? 'latest' : ''}`}/>
                      <div className="v-info">
                        <div className="v-label">{v.isLatest ? 'Current version' : `Version ${versions.length - i}`}</div>
                        <div className="v-date">{formatDate(v.lastModified)} · {formatSize(v.size)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={e => e.stopPropagation()}>
          <button className="cm-item" onClick={() => { handleDownload(contextMenu.file); closeContext(); }}>⬇ Download</button>
          <button className="cm-item" onClick={() => { openDetail(contextMenu.file); closeContext(); }}>ℹ Details & Share</button>
          {!contextMenu.file.role && <button className="cm-item danger" onClick={() => { handleDelete(contextMenu.file); closeContext(); }}>🗑 Delete</button>}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}
    </div>
  );
}