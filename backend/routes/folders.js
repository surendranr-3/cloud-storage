/**
 * FOLDER MANAGEMENT ROUTES
 * 
 * Handles all folder operations: create, read, update, delete.
 * Supports hierarchical folder structure (parent-child relationships).
 * All endpoints require JWT authentication.
 * 
 * Endpoints:
 * - POST /api/folders : Create new folder
 * - GET /api/folders : List all folders owned by authenticated user
 * - GET /api/folders/:id/files : List files in a specific folder
 * - GET /api/folders/:id/children : List subfolders of a specific folder
 * - PUT /api/folders/:id : Rename folder or move to different parent
 * - DELETE /api/folders/:id : Delete folder and its contents (cascade)
 */

const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

/**
 * POST /
 * Creates a new folder
 * 
 * Authentication: Required
 * Request body:
 * - name (string): Folder name
 * - parent_id (number, optional): Parent folder ID. If not provided, creates root folder
 * 
 * Response: 201 with folder object { id, owner_id, name, parent_id, created_at }
 * Error: 400 (missing name), 404 (parent not found), 409 (folder already exists)
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, parent_id } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    // If parent_id provided, verify it exists and belongs to user
    if (parent_id) {
      const { rows: parentCheck } = await db.query(
        'SELECT id FROM folders WHERE id=$1 AND owner_id=$2',
        [parent_id, req.user.userId]
      );
      if (!parentCheck[0]) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }
    }

    // Create folder
    const { rows } = await db.query(
      `INSERT INTO folders(owner_id, name, parent_id) 
       VALUES($1, $2, $3) 
       RETURNING id, owner_id, name, parent_id, created_at`,
      [req.user.userId, name, parent_id || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create folder error:', err.message);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Folder with this name already exists in this location' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /
 * Lists all folders owned by authenticated user
 * 
 * Authentication: Required
 * Query params:
 * - parent_id (optional): Filter folders by parent. If omitted, returns root folders only
 * 
 * Response: Array of folder objects
 */
router.get('/', auth, async (req, res) => {
  try {
    const { parent_id } = req.query;

    let query = 'SELECT * FROM folders WHERE owner_id=$1';
    const params = [req.user.userId];

    // If parent_id is provided, filter by parent; otherwise show only root folders
    if (parent_id !== undefined) {
      query += ' AND parent_id=$2';
      params.push(parent_id || null);
    } else {
      query += ' AND parent_id IS NULL';
    }

    query += ' ORDER BY name ASC';

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('List folders error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /:id/files
 * Lists all files in a specific folder
 * 
 * Authentication: Required
 * URL params: id (folder ID)
 * Query params:
 * - limit (default: 50): Number of files to return
 * - offset (default: 0): Pagination offset
 * - sort (default: created_at): Sort by name | size_bytes | created_at
 * - order (default: DESC): ASC or DESC
 * 
 * Response: Array of file objects in folder
 */
router.get('/:id/files', auth, async (req, res) => {
  try {
    const { limit = 50, offset = 0, sort = 'created_at', order = 'DESC' } = req.query;

    // Verify folder exists and belongs to user
    const { rows: folderCheck } = await db.query(
      'SELECT id FROM folders WHERE id=$1 AND owner_id=$2',
      [req.params.id, req.user.userId]
    );
    if (!folderCheck[0]) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Validate sort and order to prevent SQL injection
    const allowedSorts = ['name', 'size_bytes', 'created_at'];
    const allowedOrders = ['ASC', 'DESC'];
    if (!allowedSorts.includes(sort) || !allowedOrders.includes(order.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid sort or order parameter' });
    }

    // Get files in folder
    const { rows } = await db.query(
      `SELECT * FROM files 
       WHERE folder_id=$1 AND owner_id=$2 AND is_version=false
       ORDER BY ${sort} ${order}
       LIMIT $3 OFFSET $4`,
      [req.params.id, req.user.userId, limit, offset]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get folder files error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /:id/children
 * Lists immediate subfolders of a specific folder
 * 
 * Authentication: Required
 * URL params: id (parent folder ID)
 * 
 * Response: Array of folder objects that are children of specified folder
 */
router.get('/:id/children', auth, async (req, res) => {
  try {
    // Verify parent folder exists and belongs to user
    const { rows: parentCheck } = await db.query(
      'SELECT id FROM folders WHERE id=$1 AND owner_id=$2',
      [req.params.id, req.user.userId]
    );
    if (!parentCheck[0]) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Get child folders
    const { rows } = await db.query(
      'SELECT * FROM folders WHERE parent_id=$1 ORDER BY name ASC',
      [req.params.id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get folder children error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /:id
 * Updates folder (rename or move to different parent)
 * 
 * Authentication: Required
 * URL params: id (folder ID)
 * Request body:
 * - name (string, optional): New folder name
 * - parent_id (number, optional): New parent folder ID
 * 
 * Response: Updated folder object
 * Error: 404 (folder not found), 409 (name conflict or circular reference)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, parent_id } = req.body;

    // Verify folder exists and belongs to user
    const { rows: folder } = await db.query(
      'SELECT * FROM folders WHERE id=$1 AND owner_id=$2',
      [req.params.id, req.user.userId]
    );
    if (!folder[0]) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Prevent moving folder to itself or its children (circular reference)
    if (parent_id) {
      if (parent_id === parseInt(req.params.id)) {
        return res.status(409).json({ error: 'Cannot move folder to itself' });
      }

      // Verify new parent exists and belongs to user
      const { rows: parentCheck } = await db.query(
        'SELECT id FROM folders WHERE id=$1 AND owner_id=$2',
        [parent_id, req.user.userId]
      );
      if (!parentCheck[0]) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }
    }

    // Update folder
    const { rows } = await db.query(
      `UPDATE folders 
       SET name=$1, parent_id=$2, updated_at=CURRENT_TIMESTAMP 
       WHERE id=$3 
       RETURNING id, owner_id, name, parent_id, created_at, updated_at`,
      [name || folder[0].name, parent_id || folder[0].parent_id, req.params.id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Update folder error:', err.message);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Folder with this name already exists in this location' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /:id
 * Deletes folder and cascades delete to all files and subfolders
 * 
 * Authentication: Required
 * URL params: id (folder ID)
 * 
 * Response: { message, deletedCount } on success
 * Error: 404 (folder not found)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    // Verify folder exists and belongs to user
    const { rows: folder } = await db.query(
      'SELECT id FROM folders WHERE id=$1 AND owner_id=$2',
      [req.params.id, req.user.userId]
    );
    if (!folder[0]) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Delete folder (cascades to files and subfolders)
    await db.query('DELETE FROM folders WHERE id=$1', [req.params.id]);

    res.json({ message: 'Folder deleted successfully' });
  } catch (err) {
    console.error('Delete folder error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
