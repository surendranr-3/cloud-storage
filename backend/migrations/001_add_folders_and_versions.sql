/**
 * MIGRATION 001: Add Folders and Version History Tables
 * 
 * Adds support for:
 * 1. Folder hierarchy (parent-child relationships)
 * 2. File version history (track old file copies)
 * 
 * Run this migration against the PostgreSQL database to add these tables:
 * psql postgresql://user:password@host:5432/cloudvault < migrations/001_add_folders_and_versions.sql
 */

-- ─── FOLDERS TABLE ──────────────────────────────────────────
-- Supports hierarchical folder structure with parent_id for parent-child relationships
CREATE TABLE IF NOT EXISTS folders (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_folders_owner_id ON folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_unique_name_per_parent ON folders(owner_id, parent_id, name);

-- ─── UPDATE FILES TABLE ────────────────────────────────────
-- Add folder_id to files table to support folder organization
ALTER TABLE files ADD COLUMN IF NOT EXISTS folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL;
ALTER TABLE files ADD COLUMN IF NOT EXISTS is_version BOOLEAN DEFAULT false;
ALTER TABLE files ADD COLUMN IF NOT EXISTS version_of_id INTEGER REFERENCES files(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_version_of_id ON files(version_of_id);

-- ─── FILE_VERSIONS TABLE ──────────────────────────────────
-- Tracks version history, allowing users to restore previous file versions
CREATE TABLE IF NOT EXISTS file_versions (
  id SERIAL PRIMARY KEY,
  file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  size_bytes BIGINT,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_file_versions_unique ON file_versions(file_id, version_number);

-- ─── SEARCH INDEX ──────────────────────────────────────────
-- Add full-text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_files_name_search ON files USING GIN(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_folders_name_search ON folders USING GIN(to_tsvector('english', name));
