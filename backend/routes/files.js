/**
 * FILE MANAGEMENT ROUTES
 * 
 * Handles all file operations: upload, list, download, delete, and sharing.
 * All endpoints require JWT authentication (except public share links).
 * Files are stored in AWS S3 with AES-256 server-side encryption.
 * 
 * Endpoints:
 * - POST /api/files/upload : Upload file to S3 and create database record
 * - GET /api/files : List all files owned by authenticated user
 * - GET /api/files/:id/download : Get presigned S3 download URL (15 min expiry)
 * - DELETE /api/files/:id : Delete file from S3 and database
 * - POST /api/files/:id/share : Share file with another user (viewer/editor role)
 * 
 * Security:
 * - S3 Server-Side Encryption: AES-256
 * - Presigned URLs: Expire in 15 minutes
 * - User Isolation: Users can only access their own files
 * - Rate Limiting: Recommended on production (nginx/express-rate-limit)
 * 
 * File Upload Process:
 * 1. Client sends multipart form with file in "file" field
 * 2. Multer stores file in memory (max 500 MB)
 * 3. Server generates unique S3 key: {userId}/{uuid}-{filename}
 * 4. File uploaded to S3 with AES-256 encryption
 * 5. File metadata stored in PostgreSQL
 * 6. Metadata returned to client (201 status)
 * 
 * Error Handling:
 * - 400: Bad request (missing fields, invalid role)
 * - 401: Unauthorized (no token or expired token)
 * - 404: Not found (file doesn't exist or doesn't belong to user)
 * - 500: Server error (S3 or database issues)
 */

const router = require('express').Router();
const multer = require('multer');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const s3 = require('../s3');
const db = require('../db');
const auth = require('../middleware/auth');

// Configure multer to store files in memory (not on disk) with 500 MB size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB limit
});

/**
 * POST /upload
 * Uploads a file to AWS S3 and creates a database record
 * 
 * Authentication: Required (JWT token)
 * Multipart form-data required with 'file' field
 * 
 * Process:
 * 1. Generates unique S3 key: userId/uuid-filename
 * 2. Uploads file to S3 with AES-256 encryption
 * 3. Records file metadata in PostgreSQL database
 * 
 * Response: 201 with file metadata { id, name, size_bytes, mime_type, created_at, ... }
 * Max file size: 500 MB
 */
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    // Generate unique S3 key with user ID and UUID to prevent collisions
    const s3Key = `${req.user.userId}/${uuidv4()}-${req.file.originalname}`;

    // Upload file to S3 with server-side AES-256 encryption
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ServerSideEncryption: 'AES256' // Enable encryption in S3
    }));

    // Store file metadata in database
    const { rows } = await db.query(
      'INSERT INTO files(owner_id, name, size_bytes, mime_type, s3_key) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [req.user.userId, req.file.originalname, req.file.size, req.file.mimetype, s3Key]
    );

    // Return created file metadata
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /
 * Lists all files owned by the authenticated user
 * 
 * Authentication: Required (JWT token)
 * Query params: None
 * 
 * Response: Array of file objects sorted by creation date (newest first)
 * Each file: { id, owner_id, name, size_bytes, mime_type, s3_key, created_at, ... }
 */
router.get('/', auth, async (req, res) => {
  try {
    // Query all files owned by the authenticated user
    const { rows } = await db.query(
      'SELECT * FROM files WHERE owner_id=$1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('List error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /:id/download
 * Generates a presigned URL for downloading a file from S3
 * 
 * Authentication: Required (JWT token)
 * URL params: id (file ID)
 * 
 * Process:
 * 1. Verifies file exists and belongs to authenticated user
 * 2. Generates temporary presigned URL from S3
 * 3. URL expires in 15 minutes for security
 * 
 * Response: { url } - Direct S3 download link
 * Error: 404 if file not found or not owned by user
 */
router.get('/:id/download', auth, async (req, res) => {
  try {
    // Verify file exists and is owned by authenticated user
    const { rows } = await db.query(
      'SELECT * FROM files WHERE id=$1 AND owner_id=$2',
      [req.params.id, req.user.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'File not found' });

    // Generate presigned S3 URL valid for 15 minutes
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: process.env.AWS_BUCKET, Key: rows[0].s3_key }),
      { expiresIn: 900 } // 15 minutes expiration
    );

    // Return presigned URL for direct S3 access
    res.json({ url });
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /:id
 * Deletes a file from S3 and removes it from the database
 * 
 * Authentication: Required (JWT token)
 * URL params: id (file ID)
 * 
 * Process:
 * 1. Verifies file exists and belongs to authenticated user
 * 2. Deletes from database (with RETURNING to get s3_key)
 * 3. Deletes from S3 bucket
 * 
 * Response: { message } on success
 * Error: 404 if file not found or not owned by user
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    // Delete from database and get file metadata (including s3_key)
    const { rows } = await db.query(
      'DELETE FROM files WHERE id=$1 AND owner_id=$2 RETURNING *',
      [req.params.id, req.user.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'File not found' });

    // Delete file from S3 using the s3_key
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: rows[0].s3_key
    }));

    // Return success message
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── SHARE FILE ───────────────────────────────────────
/**
 * POST /:id/share
 * Shares a file with another user with specific permission level
 * 
 * Authentication: Required (JWT token)
 * URL params: id (file ID)
 * 
 * Request body:
 * - email (string): Email of user to share with
 * - role (string): Permission level - "viewer" (read-only) or "editor" (read/write)
 * 
 * Process:
 * 1. Validates file exists and belongs to authenticated user
 * 2. Verifies recipient user exists in database
 * 3. Creates/updates permission record in database
 * 4. Uses upsert (ON CONFLICT) to prevent duplicate permissions
 * 
 * Response: { message } on success
 * Error codes: 
 * - 400: Missing required fields or invalid role
 * - 404: File not found or recipient user not found
 * 
 * Note: For production, add notifications to recipient user
 */
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { email, role } = req.body;

    // Validate required fields
    if (!email || !role) {
      return res.status(400).json({ error: 'email and role are required' });
    }

    // Validate role is one of allowed values
    if (!['viewer', 'editor'].includes(role)) {
      return res.status(400).json({ error: 'role must be viewer or editor' });
    }

    // Check file belongs to this user (authorization)
    const { rows: [file] } = await db.query(
      'SELECT * FROM files WHERE id=$1 AND owner_id=$2',
      [req.params.id, req.user.userId]
    );
    if (!file) return res.status(404).json({ error: 'File not found' });

    // Find the user to share with
    const { rows: [target] } = await db.query(
      'SELECT id FROM users WHERE email=$1',
      [email]
    );
    if (!target) return res.status(404).json({ error: 'User not found' });

    // Prevent sharing with self
    if (target.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot share file with yourself' });
    }

    // Insert or update permission (upsert: update if exists, insert if not)
    await db.query(
      `INSERT INTO permissions(file_id, user_id, role)
       VALUES($1, $2, $3)
       ON CONFLICT(file_id, user_id) DO UPDATE SET role=$3`,
      [req.params.id, target.id, role]
    );

    // Return success message
    res.json({ message: `File shared with ${email} as ${role}` });
  } catch (err) {
    console.error('Share error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── LIST VERSIONS ────────────────────────────────────
const { ListObjectVersionsCommand } = require('@aws-sdk/client-s3');

router.get('/:id/versions', auth, async (req, res) => {
  try {
    const { rows: [file] } = await db.query(
      'SELECT * FROM files WHERE id=$1 AND owner_id=$2',
      [req.params.id, req.user.userId]
    );
    if (!file) return res.status(404).json({ error: 'File not found' });

    const data = await s3.send(new ListObjectVersionsCommand({
      Bucket: process.env.AWS_BUCKET,
      Prefix: file.s3_key
    }));

    const versions = (data.Versions || []).map(v => ({
      versionId: v.VersionId,
      lastModified: v.LastModified,
      size: v.Size,
      isLatest: v.IsLatest
    }));

    res.json(versions);
  } catch (err) {
    console.error('Versions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── RESTORE VERSION ──────────────────────────────────
const { CopyObjectCommand } = require('@aws-sdk/client-s3');

router.post('/:id/restore/:versionId', auth, async (req, res) => {
  try {
    const { rows: [file] } = await db.query(
      'SELECT * FROM files WHERE id=$1 AND owner_id=$2',
      [req.params.id, req.user.userId]
    );
    if (!file) return res.status(404).json({ error: 'File not found' });

    await s3.send(new CopyObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      CopySource: `${process.env.AWS_BUCKET}/${file.s3_key}?versionId=${req.params.versionId}`,
      Key: file.s3_key
    }));

    res.json({ message: 'Version restored successfully' });
  } catch (err) {
    console.error('Restore error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── SHARED FILES (files others shared with me) ───────
router.get('/shared-with-me', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT f.*, p.role, u.name as owner_name
       FROM files f
       JOIN permissions p ON p.file_id = f.id
       JOIN users u ON u.id = f.owner_id
       WHERE p.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Shared with me error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /search
 * Searches for files owned by the authenticated user
 * 
 * Authentication: Required
 * Query params:
 * - q (required): Search query (searches filename, description, etc.)
 * - type (optional): Filter by MIME type (e.g., 'image', 'pdf', 'video')
 * - from_date (optional): ISO date string to filter files uploaded after this date
 * - to_date (optional): ISO date string to filter files uploaded before this date
 * - size_from (optional): Minimum file size in bytes
 * - size_to (optional): Maximum file size in bytes
 * - limit (default: 50): Number of results to return
 * - offset (default: 0): Pagination offset
 * 
 * Response: Array of matching file objects with total count
 * 
 * Example:
 * GET /api/files/search?q=document&type=pdf&limit=20
 */
router.get('/search', auth, async (req, res) => {
  try {
    const { q, type, from_date, to_date, size_from, size_to, limit = 50, offset = 0 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    let query = 'SELECT * FROM files WHERE owner_id=$1 AND is_version=false';
    const params = [req.user.userId];
    let paramIndex = 2;

    // Search by filename (case-insensitive)
    query += ` AND name ILIKE $${paramIndex}`;
    params.push(`%${q}%`);
    paramIndex++;

    // Filter by MIME type if provided
    if (type) {
      if (type === 'image') {
        query += ` AND mime_type LIKE $${paramIndex}`;
        params.push('image%');
      } else if (type === 'pdf') {
        query += ` AND mime_type = $${paramIndex}`;
        params.push('application/pdf');
      } else if (type === 'video') {
        query += ` AND mime_type LIKE $${paramIndex}`;
        params.push('video%');
      } else if (type === 'audio') {
        query += ` AND mime_type LIKE $${paramIndex}`;
        params.push('audio%');
      } else if (type === 'document') {
        query += ` AND mime_type IN ($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`;
        params.push(
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        paramIndex += 2;
      }
      paramIndex++;
    }

    // Filter by upload date range if provided
    if (from_date) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(new Date(from_date));
      paramIndex++;
    }
    if (to_date) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(new Date(to_date));
      paramIndex++;
    }

    // Filter by file size range if provided
    if (size_from) {
      query += ` AND size_bytes >= $${paramIndex}`;
      params.push(parseInt(size_from));
      paramIndex++;
    }
    if (size_to) {
      query += ` AND size_bytes <= $${paramIndex}`;
      params.push(parseInt(size_to));
      paramIndex++;
    }

    // Add sorting and pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    // Execute search query
    const { rows } = await db.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM files WHERE owner_id=$1 AND is_version=false';
    const countParams = [req.user.userId];
    let countParamIndex = 2;

    countQuery += ` AND name ILIKE $${countParamIndex}`;
    countParams.push(`%${q}%`);
    countParamIndex++;

    if (type) {
      if (type === 'image') {
        countQuery += ` AND mime_type LIKE $${countParamIndex}`;
        countParams.push('image%');
      } else if (type === 'pdf') {
        countQuery += ` AND mime_type = $${countParamIndex}`;
        countParams.push('application/pdf');
      } else if (type === 'video') {
        countQuery += ` AND mime_type LIKE $${countParamIndex}`;
        countParams.push('video%');
      } else if (type === 'audio') {
        countQuery += ` AND mime_type LIKE $${countParamIndex}`;
        countParams.push('audio%');
      } else if (type === 'document') {
        countQuery += ` AND mime_type IN ($${countParamIndex}, $${countParamIndex + 1}, $${countParamIndex + 2})`;
        countParams.push(
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        countParamIndex += 2;
      }
      countParamIndex++;
    }

    if (from_date) {
      countQuery += ` AND created_at >= $${countParamIndex}`;
      countParams.push(new Date(from_date));
      countParamIndex++;
    }
    if (to_date) {
      countQuery += ` AND created_at <= $${countParamIndex}`;
      countParams.push(new Date(to_date));
      countParamIndex++;
    }

    if (size_from) {
      countQuery += ` AND size_bytes >= $${countParamIndex}`;
      countParams.push(parseInt(size_from));
      countParamIndex++;
    }
    if (size_to) {
      countQuery += ` AND size_bytes <= $${countParamIndex}`;
      countParams.push(parseInt(size_to));
      countParamIndex++;
    }

    const { rows: countResult } = await db.query(countQuery, countParams);
    const total = parseInt(countResult[0].count);

    res.json({
      results: rows,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + parseInt(limit) < total
    });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;