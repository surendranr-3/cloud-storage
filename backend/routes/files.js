/**
 * FILE MANAGEMENT ROUTES
 * Enterprise Cloud Storage Backend
 * FULL UPDATED VERSION WITH:
 * ✅ Upload
 * ✅ Download
 * ✅ Delete
 * ✅ Share File
 * ✅ Shared Files
 * ✅ Search
 * ✅ File Versions
 * ✅ Restore Versions
 * ✅ Better Share Validation
 * ✅ Owner + Shared Access Download
 * ✅ Prevent Self Sharing
 * ✅ Better Error Handling
 */

// Express router for handling file operations
const router = require('express').Router();

// Multer middleware for handling file uploads
const multer = require('multer');

// AWS S3 SDK commands for file operations (upload, download, delete, list versions, copy)
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectVersionsCommand,
  CopyObjectCommand,
} = require('@aws-sdk/client-s3');

// Helper to generate signed URLs for secure S3 access
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// UUID generator for creating unique file identifiers
const { v4: uuidv4 } = require('uuid');

// S3 client instance for AWS operations
const s3 = require('../s3');

// PostgreSQL database client for file metadata storage
const db = require('../db');

// Authentication middleware to verify user identity
const auth = require('../middleware/auth');

/* =======================================================
   MULTER CONFIGURATION
   Configures file upload handling for Express
======================================================= */

// Configure multer for in-memory file uploads
// Memory storage keeps files in RAM during processing
// Max file size: 500MB (500 * 1024 * 1024 bytes)
const upload = multer({
  // Store files in memory instead of disk for faster processing
  storage: multer.memoryStorage(),

  // Set maximum allowed file size to 500MB
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
});

/* =======================================================
   SHARED FILES ENDPOINT
   GET /shared-with-me - Retrieve all files shared with the current user
   Returns files with owner information and user's access role
======================================================= */

router.get('/shared-with-me', auth, async (req, res) => {
  try {
    // Query database for files where current user has permissions
    // Joins files table with permissions to get access role
    // Joins users table to get owner's name and email
    const { rows } = await db.query(
      `
      SELECT 
        f.*,
        p.role,
        u.name as owner_name,
        u.email as owner_email
      FROM files f
      JOIN permissions p 
        ON p.file_id = f.id
      JOIN users u 
        ON u.id = f.owner_id
      WHERE p.user_id = $1
      ORDER BY f.created_at DESC
      `,
      [req.user.userId]
    );

    // Return array of shared files with owner details
    res.json(rows);
  } catch (err) {
    console.error('Shared files error:', err);

    // Return 500 error if database query fails
    res.status(500).json({
      error: 'Failed to fetch shared files',
    });
  }
});

/* =======================================================
   SEARCH FILES ENDPOINT
   GET /search - Search user's files with multiple filter options
   Query parameters: q (search term), type (file type), from_date, to_date,
   size_from, size_to, limit (default 50), offset (default 0)
======================================================= */

router.get('/search', auth, async (req, res) => {
  try {
    // Extract search filters from query parameters
    const {
      q,                    // Search term for file name
      type,                 // File type filter (image, video, pdf)
      from_date,            // Start date for created_at filter
      to_date,              // End date for created_at filter
      size_from,            // Minimum file size in bytes
      size_to,              // Maximum file size in bytes
      limit = 50,           // Maximum results per page
      offset = 0,           // Results offset for pagination
    } = req.query;

    // Start building dynamic SQL query - filter by owner
    let query = `
      SELECT *
      FROM files
      WHERE owner_id = $1
    `;

    // Query parameters array - start with user ID
    const params = [req.user.userId];

    // Track parameter index for parameterized queries (SQL injection prevention)
    let paramIndex = 2;

    // Add search term filter (case-insensitive name match)
    if (q) {
      query += ` AND name ILIKE $${paramIndex}`;
      params.push(`%${q}%`);
      paramIndex++;
    }

    // Add file type filter based on MIME type
    if (type) {
      if (type === 'image') {
        // Match any MIME type starting with 'image/'
        query += ` AND mime_type LIKE $${paramIndex}`;
        params.push('image%');
      }

      if (type === 'video') {
        // Match any MIME type starting with 'video/'
        query += ` AND mime_type LIKE $${paramIndex}`;
        params.push('video%');
      }

      if (type === 'pdf') {
        // Match exact PDF MIME type
        query += ` AND mime_type = $${paramIndex}`;
        params.push('application/pdf');
      }

      paramIndex++;
    }

    // Add date range filter - files created after from_date
    if (from_date) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }

    // Add date range filter - files created before to_date
    if (to_date) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }

    // Add file size filter - minimum size
    if (size_from) {
      query += ` AND size_bytes >= $${paramIndex}`;
      params.push(Number(size_from));
      paramIndex++;
    }

    // Add file size filter - maximum size
    if (size_to) {
      query += ` AND size_bytes <= $${paramIndex}`;
      params.push(Number(size_to));
      paramIndex++;
    }

    // Add sorting, pagination with LIMIT and OFFSET
    query += `
      ORDER BY created_at DESC
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `;

    // Add pagination parameters to query
    params.push(Number(limit));
    params.push(Number(offset));

    // Execute the dynamically built query with all filters
    const { rows } = await db.query(query, params);

    // Return search results with total count
    res.json({
      results: rows,
      total: rows.length,
    });
  } catch (err) {
    console.error('Search error:', err);

    // Return 500 error if search query fails
    res.status(500).json({
      error: 'Search failed',
    });
  }
});

/* =======================================================
   UPLOAD FILE ENDPOINT
   POST /upload - Upload a new file to S3 and store metadata in database
   Requires: authenticated user, multipart form data with 'file' field
   Returns: File metadata including id, name, size, mime_type, s3_key
======================================================= */

router.post(
  '/upload',
  auth,                    // Verify user authentication
  upload.single('file'),   // Parse single file upload from 'file' form field
  async (req, res) => {
    try {
      // Validate that a file was actually uploaded
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
        });
      }

      // Generate unique S3 object key: userId/uuid-filename
      // This ensures files are organized by user and have unique names
      const s3Key = `${req.user.userId}/${uuidv4()}-${
        req.file.originalname
      }`;

      // Upload file to S3 with encryption and proper content type
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET,
          Key: s3Key,
          Body: req.file.buffer,                    // File content from memory
          ContentType: req.file.mimetype,           // Preserve original MIME type
          ServerSideEncryption: 'AES256',          // Enable server-side encryption
        })
      );

      // Store file metadata in PostgreSQL database
      const { rows } = await db.query(
        `
        INSERT INTO files
        (
          owner_id,
          name,
          size_bytes,
          mime_type,
          s3_key
        )
        VALUES($1,$2,$3,$4,$5)
        RETURNING *
        `,
        [
          req.user.userId,
          req.file.originalname,
          req.file.size,
          req.file.mimetype,
          s3Key,
        ]
      );

      // Return 201 Created with the newly created file object
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error('Upload error:', err);

      // Return 500 error if S3 upload or database insert fails
      res.status(500).json({
        error: 'Upload failed',
      });
    }
  }
);

/* =======================================================
   LIST FILES ENDPOINT
   GET / - Retrieve all files owned by the current user
   Returns: Array of file objects sorted by creation date (newest first)
======================================================= */

router.get('/', auth, async (req, res) => {
  try {
    // Query all files owned by the authenticated user, ordered by creation date
    const { rows } = await db.query(
      `
      SELECT *
      FROM files
      WHERE owner_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.userId]
    );

    // Return array of user's files
    res.json(rows);
  } catch (err) {
    console.error('List files error:', err);

    // Return 500 error if database query fails
    res.status(500).json({
      error: 'Failed to fetch files',
    });
  }
});

/* =======================================================
   DOWNLOAD FILE ENDPOINT
   GET /:id/download - Generate a signed URL for secure file download
   Access: File owner OR users with permissions (viewer/editor role)
   Returns: Temporary signed URL that expires in 15 minutes (900 seconds)
======================================================= */

router.get('/:id/download', auth, async (req, res) => {
  try {
    // Query file with permission check
    // User can download if: they own the file OR have permissions
    const { rows } = await db.query(
      `
      SELECT DISTINCT f.*
      FROM files f

      LEFT JOIN permissions p
        ON p.file_id = f.id

      WHERE f.id = $1
      AND (
        f.owner_id = $2
        OR p.user_id = $2
      )
      `,
      [req.params.id, req.user.userId]
    );

    const file = rows[0];

    // Return 404 if file not found or user doesn't have access
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
      });
    }

    // Generate a temporary signed URL from S3
    // URL expires in 900 seconds (15 minutes) for security
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: file.s3_key,
      }),
      {
        expiresIn: 900,  // 15 minute expiration
      }
    );

    // Return signed URL to client for direct S3 download
    res.json({ url });
  } catch (err) {
    console.error('Download error:', err);

    // Return 500 error if signed URL generation fails
    res.status(500).json({
      error: 'Download failed',
    });
  }
});

/* =======================================================
   FILE VERSIONS ENDPOINT
   GET /:id/versions - List all versions of a file from S3
   Requires: File owner only (versioning is owner-managed)
   Returns: Array of version objects with versionId, size, date, isLatest flag
   Note: Requires S3 bucket versioning to be enabled
======================================================= */

router.get('/:id/versions', auth, async (req, res) => {
  try {
    // Verify file exists and current user is the owner
    const { rows } = await db.query(
      `
      SELECT *
      FROM files
      WHERE id = $1
      AND owner_id = $2
      `,
      [req.params.id, req.user.userId]
    );

    const file = rows[0];

    // Return 404 if file not found or user is not owner
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
      });
    }

    // Fetch all versions of the file from S3
    const data = await s3.send(
      new ListObjectVersionsCommand({
        Bucket: process.env.AWS_BUCKET,
        Prefix: file.s3_key,  // Get all versions with this object key
      })
    );

    // Transform S3 version objects to simplified response format
    const versions = (data.Versions || []).map(
      (v) => ({
        versionId: v.VersionId,      // Unique identifier for this version
        size: v.Size,                // File size in bytes
        lastModified: v.LastModified, // Timestamp of this version
        isLatest: v.IsLatest,        // Boolean: is this the current version?
      })
    );

    // Return array of all versions
    res.json(versions);
  } catch (err) {
    console.error('Versions error:', err);

    // Return 500 error if S3 version listing fails
    res.status(500).json({
      error: 'Failed to fetch versions',
    });
  }
});

/* =======================================================
   SHARE FILE ENDPOINT
   POST /:id/share - Grant a user access to a file
   Body: { email: string, role: 'viewer'|'editor' }
   Viewer: Read-only access, Editor: Can also update file
   Returns: Success message with shared user's email
======================================================= */

router.post('/:id/share', auth, async (req, res) => {
  try {
    // Extract email and access role from request body
    const { email, role } = req.body;

    // Validate required fields
    if (!email || !role) {
      return res.status(400).json({
        error: 'Email and role are required',
      });
    }

    // Validate role is one of the allowed values
    if (!['viewer', 'editor'].includes(role)) {
      return res.status(400).json({
        error: 'Role must be viewer or editor',
      });
    }

    // Verify file exists and current user is the owner
    const { rows: fileRows } = await db.query(
      `
      SELECT *
      FROM files
      WHERE id = $1
      AND owner_id = $2
      `,
      [req.params.id, req.user.userId]
    );

    const file = fileRows[0];

    // Return 404 if file not found or user is not owner
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
      });
    }

    // Look up target user by email (case-insensitive)
    const { rows: userRows } = await db.query(
      `
      SELECT id, email
      FROM users
      WHERE LOWER(email) = LOWER($1)
      `,
      [email.trim()]
    );

    const targetUser = userRows[0];

    // Return 404 if target user doesn't exist
    if (!targetUser) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Prevent users from sharing files with themselves
    if (targetUser.id === req.user.userId) {
      return res.status(400).json({
        error: 'You cannot share file with yourself',
      });
    }

    // Insert or update permission record
    // ON CONFLICT handles the case where user already has access
    await db.query(
      `
      INSERT INTO permissions
      (
        file_id,
        user_id,
        role
      )
      VALUES($1,$2,$3)

      ON CONFLICT(file_id, user_id)
      DO UPDATE SET role = EXCLUDED.role
      `,
      [req.params.id, targetUser.id, role]
    );

    // Return success confirmation
    res.json({
      success: true,
      message: `File shared with ${email}`,
    });
  } catch (err) {
    console.error('Share error:', err);

    // Return 500 error if database permission insert/update fails
    res.status(500).json({
      error: 'Share failed',
    });
  }
});

/* =======================================================
   RESTORE FILE VERSION ENDPOINT
   POST /:id/restore/:versionId - Restore a file to a previous version
   Requires: File owner only
   Effects: Overwrites current file content with specified version
   Returns: Success message confirming version restoration
======================================================= */

router.post(
  '/:id/restore/:versionId',
  auth,  // Verify user authentication
  async (req, res) => {
    try {
      // Verify file exists and current user is the owner
      const { rows } = await db.query(
        `
        SELECT *
        FROM files
        WHERE id = $1
        AND owner_id = $2
        `,
        [req.params.id, req.user.userId]
      );

      const file = rows[0];

      // Return 404 if file not found or user is not owner
      if (!file) {
        return res.status(404).json({
          error: 'File not found',
        });
      }

      // Copy previous version to become the current version
      // This creates a new version object with the old content
      await s3.send(
        new CopyObjectCommand({
          Bucket: process.env.AWS_BUCKET,

          // Source: specific version ID of the previous file state
          CopySource: `${process.env.AWS_BUCKET}/${file.s3_key}?versionId=${req.params.versionId}`,

          // Destination: same key, creating a new "current" version
          Key: file.s3_key,
        })
      );

      // Return success message
      res.json({
        message: 'Version restored',
      });
    } catch (err) {
      console.error('Restore error:', err);

      // Return 500 error if S3 copy operation fails
      res.status(500).json({
        error: 'Restore failed',
      });
    }
  }
);

/* =======================================================
   DELETE FILE ENDPOINT
   DELETE /:id - Permanently delete a file and all its versions
   Requires: File owner only
   Effects: Removes file metadata from database and deletes from S3
   Returns: Success message confirming deletion
======================================================= */

router.delete('/:id', auth, async (req, res) => {
  try {
    // Delete file record from database (soft delete pattern not used)
    // RETURNING * returns the deleted file's data
    const { rows } = await db.query(
      `
      DELETE FROM files
      WHERE id = $1
      AND owner_id = $2
      RETURNING *
      `,
      [req.params.id, req.user.userId]
    );

    const file = rows[0];

    // Return 404 if file not found or user is not owner
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
      });
    }

    // Delete file object from S3 (this removes all versions if versioning enabled)
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: file.s3_key,
      })
    );

    // Return success confirmation
    res.json({
      message: 'File deleted successfully',
    });
  } catch (err) {
    console.error('Delete error:', err);

    // Return 500 error if database delete or S3 delete operation fails
    res.status(500).json({
      error: 'Delete failed',
    });
  }
});

// Export router for use in main application
module.exports = router;