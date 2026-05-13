/**
 * FILE VERSIONS ROUTES
 * 
 * Handles file version history: view previous versions and restore them.
 * Every time a file is uploaded with the same name, a new version is created.
 * Users can view history and restore any previous version.
 * 
 * Endpoints:
 * - GET /api/files/:id/versions : List all versions of a file
 * - GET /api/files/:id/versions/:versionId : Get download link for specific version
 * - POST /api/files/:id/restore/:versionId : Restore file to a previous version
 */

const router = require('express').Router();
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = require('../s3');
const db = require('../db');
const auth = require('../middleware/auth');

/**
 * GET /:fileId/versions
 * Lists all versions of a specific file, including current and previous versions
 * 
 * Authentication: Required
 * URL params: fileId (file ID)
 * 
 * Response: Array of version objects with:
 * - id: Version ID
 * - file_id: Parent file ID
 * - version_number: Version sequence (1, 2, 3, etc.)
 * - size_bytes: File size in bytes
 * - mime_type: MIME type (e.g., application/pdf)
 * - created_at: Timestamp when version was created
 * - created_by_id: User ID who uploaded this version
 */
router.get('/:fileId/versions', auth, async (req, res) => {
  try {
    // Verify file exists and belongs to authenticated user
    const { rows: file } = await db.query(
      'SELECT * FROM files WHERE id=$1 AND owner_id=$2',
      [req.params.fileId, req.user.userId]
    );
    if (!file[0]) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get all versions of this file (current + previous)
    const { rows } = await db.query(
      `SELECT id, file_id, version_number, size_bytes, mime_type, created_at, created_by_id
       FROM file_versions 
       WHERE file_id=$1 
       ORDER BY version_number DESC`,
      [req.params.fileId]
    );

    // Include current file as version 0
    const allVersions = [
      {
        id: file[0].id,
        file_id: file[0].id,
        version_number: 0,
        size_bytes: file[0].size_bytes,
        mime_type: file[0].mime_type,
        created_at: file[0].created_at,
        isCurrent: true
      },
      ...rows
    ];

    res.json(allVersions);
  } catch (err) {
    console.error('Get versions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /:fileId/versions/:versionId
 * Gets a presigned URL to download a specific version of a file
 * 
 * Authentication: Required
 * URL params:
 * - fileId: Original file ID
 * - versionId: Version ID to download (or 'current' for latest)
 * 
 * Response: { url } - Presigned S3 URL (expires in 15 minutes)
 * Error: 404 (file or version not found)
 */
router.get('/:fileId/versions/:versionId', auth, async (req, res) => {
  try {
    const { fileId, versionId } = req.params;

    // Verify file exists and belongs to user
    const { rows: file } = await db.query(
      'SELECT * FROM files WHERE id=$1 AND owner_id=$2',
      [fileId, req.user.userId]
    );
    if (!file[0]) {
      return res.status(404).json({ error: 'File not found' });
    }

    let s3Key;

    // If versionId is 'current' or equals file ID, use current file
    if (versionId === 'current' || parseInt(versionId) === file[0].id) {
      s3Key = file[0].s3_key;
    } else {
      // Get specific version from file_versions table
      const { rows: version } = await db.query(
        'SELECT s3_key FROM file_versions WHERE id=$1 AND file_id=$2',
        [versionId, fileId]
      );
      if (!version[0]) {
        return res.status(404).json({ error: 'Version not found' });
      }
      s3Key = version[0].s3_key;
    }

    // Generate presigned URL for S3 (15 minute expiry)
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: s3Key
      }),
      { expiresIn: 900 }
    );

    res.json({ url });
  } catch (err) {
    console.error('Get version download error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /:fileId/restore/:versionId
 * Restores a file to a previous version
 * 
 * Authentication: Required
 * URL params:
 * - fileId: File ID to restore
 * - versionId: Version ID to restore to
 * 
 * Process:
 * 1. Verifies file exists and belongs to user
 * 2. Verifies version exists
 * 3. Creates new version entry for current file (before overwriting)
 * 4. Updates file metadata (size, mime type) to match restored version
 * 5. Updates S3 key pointer to restored version's S3 key
 * 
 * Response: Updated file object
 * Error: 404 (file or version not found)
 */
router.post('/:fileId/restore/:versionId', auth, async (req, res) => {
  try {
    const { fileId, versionId } = req.params;

    // Verify file exists and belongs to user
    const { rows: file } = await db.query(
      'SELECT * FROM files WHERE id=$1 AND owner_id=$2',
      [fileId, req.user.userId]
    );
    if (!file[0]) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify version exists
    const { rows: version } = await db.query(
      'SELECT * FROM file_versions WHERE id=$1 AND file_id=$2',
      [versionId, fileId]
    );
    if (!version[0]) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Get next version number
    const { rows: maxVersion } = await db.query(
      'SELECT MAX(version_number) as max_version FROM file_versions WHERE file_id=$1',
      [fileId]
    );
    const nextVersionNumber = (maxVersion[0]?.max_version || 0) + 1;

    // Create version entry for current file (before overwriting)
    await db.query(
      `INSERT INTO file_versions(file_id, version_number, s3_key, size_bytes, mime_type, created_by_id)
       VALUES($1, $2, $3, $4, $5, $6)`,
      [fileId, nextVersionNumber, file[0].s3_key, file[0].size_bytes, file[0].mime_type, req.user.userId]
    );

    // Update file with restored version's content and metadata
    const { rows } = await db.query(
      `UPDATE files 
       SET s3_key=$1, size_bytes=$2, mime_type=$3, updated_at=CURRENT_TIMESTAMP
       WHERE id=$4
       RETURNING *`,
      [version[0].s3_key, version[0].size_bytes, version[0].mime_type, fileId]
    );

    res.json({
      message: `File restored to version ${version[0].version_number}`,
      file: rows[0]
    });
  } catch (err) {
    console.error('Restore version error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
