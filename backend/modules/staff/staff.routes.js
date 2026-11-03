const express = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const { AppError } = require('../../shared/errors');
const pool = require('../../db');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('staff:read'), async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT uuid AS id, staff_number AS "staffNumber",
              first_name AS "firstName", last_name AS "lastName",
              role, contact_number AS "contactNumber", photo_reference AS "photoReference"
         FROM staff
        WHERE archived_at IS NULL
        ORDER BY first_name, last_name`,
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:staffId', authorize('staff:read'), async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT uuid AS id, staff_number AS "staffNumber",
              first_name AS "firstName", last_name AS "lastName",
              role, contact_number AS "contactNumber", photo_reference AS "photoReference"
         FROM staff WHERE uuid = $1 AND archived_at IS NULL`,
      [req.params.staffId],
    );
    if (result.rowCount === 0) {
      throw new AppError(404, 'STAFF_NOT_FOUND', 'Staff member was not found.');
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', authorize('staff:write'), async (req, res, next) => {
  try {
    const { staffNumber, firstName, lastName, role, contactNumber, photoReference } = req.body;
    if (!staffNumber || !firstName || !role) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Staff number, first name, and role are required.');
    }
    const result = await pool.query(
      `INSERT INTO staff
        (staff_number, first_name, last_name, role, contact_number, photo_reference)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING uuid AS id`,
      [staffNumber, firstName, lastName || null, role, contactNumber || null, photoReference || null],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch('/:staffId', authorize('staff:write'), async (req, res, next) => {
  try {
    const fields = { firstName: 'first_name', lastName: 'last_name', role: 'role', contactNumber: 'contact_number', photoReference: 'photo_reference' };
    const entries = Object.entries(req.body).filter(([key, value]) => fields[key] && value !== undefined);
    if (!entries.length) throw new AppError(400, 'VALIDATION_ERROR', 'At least one editable field is required.');
    const values = entries.map(([, value]) => value);
    const assignments = entries.map(([key], index) => `${fields[key]} = $${index + 1}`);
    values.push(req.params.staffId);
    const result = await pool.query(
      `UPDATE staff SET ${assignments.join(', ')}, updated_at = NOW()
        WHERE uuid = $${values.length} AND archived_at IS NULL RETURNING uuid AS id`,
      values,
    );
    if (!result.rowCount) throw new AppError(404, 'STAFF_NOT_FOUND', 'Staff member was not found.');
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:staffId', authorize('staff:archive'), async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE staff SET archived_at = NOW(), updated_at = NOW()
        WHERE uuid = $1 AND archived_at IS NULL RETURNING uuid`,
      [req.params.staffId],
    );
    if (!result.rowCount) throw new AppError(404, 'STAFF_NOT_FOUND', 'Staff member was not found.');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
