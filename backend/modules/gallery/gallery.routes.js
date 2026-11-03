const express = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const { AppError } = require('../../shared/errors');
const pool = require('../../db');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('students:read'), async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT uuid AS id, title, description, photo_reference AS "photoReference",
              created_at AS "createdAt"
         FROM school_gallery
        WHERE archived_at IS NULL ORDER BY created_at DESC`,
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', authorize('gallery:write'), async (req, res, next) => {
  try {
    const { title, description, photoReference } = req.body;
    if (!title || !photoReference) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Title and photo reference are required.');
    }
    const result = await pool.query(
      `INSERT INTO school_gallery (title, description, photo_reference, created_by)
       VALUES ($1, $2, $3, $4) RETURNING uuid AS id`,
      [title, description || null, photoReference, req.user.id],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:galleryId', authorize('gallery:write'), async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE school_gallery SET archived_at = NOW()
        WHERE uuid = $1 AND archived_at IS NULL RETURNING uuid`,
      [req.params.galleryId],
    );
    if (!result.rowCount) throw new AppError(404, 'GALLERY_ITEM_NOT_FOUND', 'Gallery item was not found.');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
