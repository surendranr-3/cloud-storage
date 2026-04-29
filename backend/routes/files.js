const router = require('express').Router();
const multer = require('multer');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const s3 = require('../s3');
const db = require('../db');
const auth = require('../middleware/auth');

// Multer — store file in memory, not disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB limit
});

// ─── UPLOAD ───────────────────────────────────────────
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const s3Key = `${req.user.userId}/${uuidv4()}-${req.file.originalname}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ServerSideEncryption: 'AES256'
    }));

    const { rows } = await db.query(
      'INSERT INTO files(owner_id, name, size_bytes, mime_type, s3_key) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [req.user.userId, req.file.originalname, req.file.size, req.file.mimetype, s3Key]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── LIST FILES ───────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
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

// ─── DOWNLOAD (presigned URL) ─────────────────────────
router.get('/:id/download', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM files WHERE id=$1 AND owner_id=$2',
      [req.params.id, req.user.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'File not found' });

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: process.env.AWS_BUCKET, Key: rows[0].s3_key }),
      { expiresIn: 900 } // 15 minutes
    );

    res.json({ url });
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE ───────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'DELETE FROM files WHERE id=$1 AND owner_id=$2 RETURNING *',
      [req.params.id, req.user.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'File not found' });

    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: rows[0].s3_key
    }));

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── SHARE FILE ───────────────────────────────────────
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'email and role are required' });
    }

    if (!['viewer', 'editor'].includes(role)) {
      return res.status(400).json({ error: 'role must be viewer or editor' });
    }

    // Check file belongs to this user
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

    // Insert permission
    await db.query(
      `INSERT INTO permissions(file_id, user_id, role)
       VALUES($1, $2, $3)
       ON CONFLICT(file_id, user_id) DO UPDATE SET role=$3`,
      [req.params.id, target.id, role]
    );

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

module.exports = router;