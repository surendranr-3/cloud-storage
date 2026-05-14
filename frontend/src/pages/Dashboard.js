/**
 * DASHBOARD PAGE - MAIN FILE MANAGEMENT INTERFACE
 * 
 * Primary user interface for CloudVault file management.
 * Features include uploading, downloading, deleting, and sharing files.
 * Displays files in grid or list view with sorting and filtering.
 * Supports drag-and-drop file uploads.
 * Shows storage usage with visual progress bar (0-50GB limit).
 * Displays shared files with owner information.
 * 
 * Key Features:
 * - Multiple view modes: My Files, Shared Files, Recent Files
 * - Grid/List view toggle for different layouts
 * - Search/filter files by name
 * - Drag-and-drop upload capability
 * - File sharing with role-based access (Viewer/Editor)
 * - Download files with signed URLs
 * - Delete files with confirmation
 * - Storage usage tracking and visualization
 * - User profile menu with logout option
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import api from '../api';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

/**
 * FILE ICONS AND STYLING
 * 
 * Maps MIME types to display icons, colors, and background colors.
 * Each file type gets a unique emoji icon and color scheme for easy identification.
 * Used when rendering file cards in the dashboard.
 */
const FILE_ICONS = {
  'image/png': {
    icon: '🖼',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  'image/jpeg': {
    icon: '🖼',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  'image/gif': {
    icon: '🖼',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  'image/webp': {
    icon: '🖼',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  'application/pdf': {
    icon: '📄',
    color: '#dc2626',
    bg: '#fef2f2',
  },
  'video/mp4': {
    icon: '🎬',
    color: '#d97706',
    bg: '#fffbeb',
  },
  'video/webm': {
    icon: '🎬',
    color: '#d97706',
    bg: '#fffbeb',
  },
  'audio/mpeg': {
    icon: '🎵',
    color: '#059669',
    bg: '#f0fdf4',
  },
  'application/zip': {
    icon: '📦',
    color: '#374151',
    bg: '#f9fafb',
  },
  'text/plain': {
    icon: '📝',
    color: '#2563eb',
    bg: '#eff6ff',
  },
};

/**
 * Get file styling (icon, color, background) based on MIME type
 * Returns default styling if MIME type not found in FILE_ICONS
 */
const getFileStyle = (mime) =>
  FILE_ICONS[mime] || {
    icon: '📁',
    color: '#6b7280',
    bg: '#f9fafb',
  };

/**
 * Format bytes to human-readable file size
 * Converts bytes to B, KB, MB, or GB depending on size
 * Example: 1024 => "1.0 KB", 1048576 => "1.0 MB"
 */
const formatSize = (bytes = 0) => {
  const b = parseInt(bytes);

  if (b < 1024) return `${b} B`;

  if (b < 1024 * 1024) {
    return `${(b / 1024).toFixed(1)} KB`;
  }

  if (b < 1024 * 1024 * 1024) {
    return `${(
      b /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  return `${(
    b /
    (1024 * 1024 * 1024)
  ).toFixed(2)} GB`;
};

/**
 * Format date to relative time display
 * Shows "Just now", "5m ago", "2h ago", etc.
 * Falls back to formatted date for older files
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();

  const diff = (now - date) / 1000;

  if (diff < 60) return 'Just now';

  if (diff < 3600) {
    return `${Math.floor(diff / 60)}m ago`;
  }

  if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h ago`;
  }

  if (diff < 604800) {
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );
};

/**
 * Extract user initials from full name
 * Example: "John Doe" => "JD"
 * Used for user avatar in profile menu
 */
const getUserInitials = (name) => {
  if (!name) return 'U';

  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function Dashboard() {
  // Navigation hook for redirecting to login on logout
  const navigate = useNavigate();
  
  // Reference to hidden file input element for file selection
  const fileInputRef = useRef();

  /* ========== FILE AND VIEW STATE ========== */
  
  // Array of files owned by current user
  const [files, setFiles] = useState([]);
  
  // Array of files shared with current user by others
  const [sharedFiles, setSharedFiles] = useState([]);
  
  // Current view mode: 'grid' or 'list'
  const [view, setView] = useState('grid');
  
  // Current tab/filter: 'myfiles', 'shared', or 'recent'
  const [tab, setTab] = useState('myfiles');
  
  // Search query for filtering files by name
  const [search, setSearch] = useState('');

  /* ========== UPLOAD STATE ========== */
  
  // Whether a file upload is currently in progress
  const [uploading, setUploading] = useState(false);
  
  // Upload progress percentage (0-100)
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Name of file currently being uploaded (for display)
  const [uploadingName, setUploadingName] = useState('');

  /* ========== DRAG AND DROP STATE ========== */
  
  // Whether files are currently being dragged over the area
  const [dragging, setDragging] = useState(false);

  /* ========== NOTIFICATION STATE ========== */
  
  // Toast notification: { msg: string, type: 'success'|'error' }
  const [toast, setToast] = useState(null);

  /* ========== USER STATE ========== */
  
  // Current logged-in user's name
  const [userName, setUserName] = useState('User');
  
  // Whether profile dropdown menu is open
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  /* ========== FILE SHARING STATE ========== */
  
  // Whether the share modal is open
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Email address to share file with
  const [shareEmail, setShareEmail] = useState('');
  
  // Access role for shared file: 'viewer' or 'editor'
  const [shareRole, setShareRole] = useState('viewer');
  
  // File object currently being shared
  const [sharingFile, setSharingFile] = useState(null);
  
  // Whether a share operation is in progress
  const [sharingInProgress, setSharingInProgress] = useState(false);

  /**
   * Show temporary notification toast
   * Auto-dismisses after 3 seconds
   * @param {string} msg - Message to display
   * @param {string} type - 'success' or 'error' for styling
   */
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  /**
   * Fetch all files owned by current user from API
   * Called on component mount and after file operations
   */
  const fetchFiles = useCallback(async () => {
    try {
      const { data } = await api.get('/files');
      setFiles(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch files', 'error');
    }
  }, [showToast]);

  /**
   * Fetch all files shared with current user
   * Called on component mount to populate "Shared" tab
   */
  const fetchSharedFiles = useCallback(async () => {
    try {
      const { data } = await api.get('/files/shared-with-me');
      setSharedFiles(data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);


  /**
   * Load initial data on component mount
   * Fetches user's files, shared files, and retrieves user name from localStorage
   */
  useEffect(() => {
    fetchFiles();
    fetchSharedFiles();

    const name = localStorage.getItem('userName');
    if (name) {
      setUserName(name);
    }
  }, [fetchFiles, fetchSharedFiles]);

  /**
   * Handle file upload
   * Converts file to FormData, sends to API with progress tracking
   * Refreshes file list on success
   * @param {File} file - File object from input or drop event
   */
  const handleUpload = useCallback(async (file) => {
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadingName(file.name);

      const formData = new FormData();
      formData.append('file', file);

      // Send file to backend, tracking upload progress
      await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(percent);
        },
      });

      // Refresh file list to show newly uploaded file
      await fetchFiles();
      showToast(`${file.name} uploaded successfully`);
    } catch (err) {
      console.error(err);
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadingName('');
    }
  }, [fetchFiles, showToast]);


  /**
   * Handle file download
   * Fetches signed URL from API and downloads file to user's device
   * @param {Object} file - File object with id and name
   */
  const handleDownload = useCallback(async (file) => {
    showToast(`Preparing download for ${file.name}...`);
    try {
      // Get signed URL from backend
      const response = await api.get(`/files/${file.id}/download`, {
        responseType: 'blob',
      });

      // Create blob from response data
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      
      // Clean up resources
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`Downloaded ${file.name}`);
    } catch (err) {
      console.error(err);
      showToast('Download failed', 'error');
    }
  }, [showToast]);

  /**
   * Handle file deletion
   * Shows confirmation dialog before deleting file
   * @param {Object} file - File object to delete
   */
  const handleDelete = useCallback(async (file) => {
    const confirmDelete = window.confirm(`Delete "${file.name}" ?`);
    if (!confirmDelete) return;

    try {
      // Delete file from API
      await api.delete(`/files/${file.id}`);
      
      // Remove from local state
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      showToast('File deleted');
    } catch (err) {
      console.error(err);
      showToast('Delete failed', 'error');
    }
  }, [showToast]);

  /**
   * Handle file sharing
   * Sends share request with email and role to API
   * Updates shared files list on success
   */
  const handleShare = useCallback(async () => {
    console.log('Share button clicked', { shareEmail, shareRole, sharingFile });
    
    if (!shareEmail || !shareRole || !sharingFile) {
      console.warn('Missing share data', { shareEmail, shareRole, sharingFile });
      showToast('Email and role required', 'error');
      return;
    }

    try {
      setSharingInProgress(true);
      console.log('Sending share request for file:', sharingFile.id);
      
      // Send share request to API
      const { data } = await api.post(`/files/${sharingFile.id}/share`, {
        email: shareEmail,
        role: shareRole,
      });
      
      console.log('Share response:', data);
      showToast(data.message || `Shared with ${shareEmail}`);
      
      // Reset share modal state
      setShowShareModal(false);
      setShareEmail('');
      setShareRole('viewer');
      setSharingFile(null);
      
      // Refresh shared files list
      await fetchSharedFiles();
    } catch (err) {
      console.error('Share error:', err);
      console.error('Error response:', err?.response?.data);
      showToast(err?.response?.data?.error || 'Share failed', 'error');
    } finally {
      setSharingInProgress(false);
    }
  }, [shareEmail, shareRole, sharingFile, fetchSharedFiles, showToast]);

  /**
   * Handle file drop from drag-and-drop
   * Extracts file and triggers upload
   */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleUpload(droppedFile);
    }
  }, [handleUpload]);

  /**
   * Handle drag over event
   * Shows visual feedback that drop zone is active
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  /**
   * Handle drag leave event
   * Removes visual feedback when user drags away
   */
  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  /**
   * Handle user logout
   * Clears localStorage and redirects to login
   */
  const handleLogout = useCallback(() => {
    localStorage.clear();
    navigate('/login');
  }, [navigate]);

  /**
   * Compute derived state for file display
   */
  const recentFiles = [...files]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  // Select files based on current tab
  const currentFiles = tab === 'shared' ? sharedFiles : tab === 'recent' ? recentFiles : files;

  // Filter files by search query
  const filteredFiles = currentFiles.filter((file) =>
    file.name.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate total storage used and percentage
  const totalSize = files.reduce((acc, file) => acc + Number(file.size_bytes || 0), 0);
  const storageUsedPct = Math.min(
    (totalSize / (50 * 1024 * 1024 * 1024)) * 100,
    100
  );

  return (
    <div
      className="dash-root"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <header className="topbar">
        <div className="topbar-brand">
          <span className="topbar-name">CloudVault</span>
        </div>

        <div className="topbar-search">
          <input
            type="text"
            placeholder="Search files..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="topbar-right">
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current.click()}
          >
            Upload
          </button>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={(e) => handleUpload(e.target.files[0])}
          />

          <div className="profile-wrapper">
            <div
              className="profile-trigger"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="user-avatar">
                {getUserInitials(userName)}
              </div>
              <span className="profile-name">{userName}</span>
            </div>

            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-name">{userName}</div>
                <button
                  className="profile-logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="dash-body">
        <aside className="sidebar">
          <button
            className={`nav-item ${tab === 'myfiles' ? 'active' : ''}`}
            onClick={() => setTab('myfiles')}
          >
            My Files
          </button>

          <button
            className={`nav-item ${tab === 'shared' ? 'active' : ''}`}
            onClick={() => setTab('shared')}
          >
            Shared
          </button>

          <button
            className={`nav-item ${tab === 'recent' ? 'active' : ''}`}
            onClick={() => setTab('recent')}
          >
            Recent
          </button>

          <div className="storage-box">
            <div>{formatSize(totalSize)} / 50 GB</div>
            <div className="storage-bar">
              <div
                className="storage-fill"
                style={{ width: `${storageUsedPct}%` }}
              />
            </div>
          </div>
        </aside>

        <main className="main-content">
          {dragging && <div className="drag-overlay">Drop files to upload</div>}

          {uploading && (
            <div className="upload-progress-bar">
              <div>Uploading {uploadingName}</div>
              <div className="upb-track">
                <div
                  className="upb-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="content-header">
            <h2>
              {tab === 'myfiles' && 'My Files'}
              {tab === 'shared' && 'Shared Files'}
              {tab === 'recent' && 'Recent Files'}
            </h2>

            <div className="view-toggle">
              <button
                className={view === 'grid' ? 'active' : ''}
                onClick={() => setView('grid')}
              >
                Grid
              </button>
              <button
                className={view === 'list' ? 'active' : ''}
                onClick={() => setView('list')}
              >
                List
              </button>
            </div>
          </div>

          <div className={view === 'grid' ? 'file-grid' : 'file-list'}>
            {filteredFiles.map((file) => {
              const style = getFileStyle(file.mime_type);

              return (
                <div key={file.id} className="file-card">
                  <div
                    className="file-icon"
                    style={{
                      background: style.bg,
                      color: style.color,
                    }}
                  >
                    {style.icon}
                  </div>

                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">
                    {formatSize(file.size_bytes)} • {formatDate(file.created_at)}
                  </div>

                  <div className="file-actions">
                    <button
                      className="download-btn"
                      onClick={() => handleDownload(file)}
                    >
                      Download
                    </button>

                    {!file.role && (
                      <button
                        className="share-btn"
                        onClick={() => {
                          setSharingFile(file);
                          setShowShareModal(true);
                        }}
                      >
                        Share
                      </button>
                    )}

                    {!file.role && (
                      <button
                        className="danger"
                        onClick={() => handleDelete(file)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {showShareModal && (
        <div className="modal-overlay">
          <div className="share-modal">
            <h3>Share File</h3>
            <p className="share-file-name">{sharingFile?.name}</p>

            <input
              type="email"
              placeholder="Enter user email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className="share-input"
            />

            <select
              value={shareRole}
              onChange={(e) => setShareRole(e.target.value)}
              className="share-select"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>

            <div className="share-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowShareModal(false);
                  setShareEmail('');
                  setShareRole('viewer');
                }}
              >
                Cancel
              </button>

              <button
                className="confirm-share-btn"
                onClick={handleShare}
                disabled={sharingInProgress}
              >
                {sharingInProgress ? 'Sharing...' : 'Share File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}