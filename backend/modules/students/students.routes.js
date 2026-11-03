const express = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const { validateBody } = require('../../middleware/validate');
const { AppError } = require('../../shared/errors');
const pool = require('../../db');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('students:read'), async (req, res, next) => {
  try {
    const values = [];
    const filters = ['s.archived_at IS NULL'];
    if (req.query.search) {
      values.push(`%${req.query.search}%`);
      filters.push(`(s.first_name ILIKE $${values.length} OR s.surname ILIKE $${values.length} OR s.application_number ILIKE $${values.length})`);
    }
    if (req.query.academicYearId) {
      values.push(req.query.academicYearId);
      filters.push(`e.academic_year_id = $${values.length}`);
    }
    if (req.query.classId) {
      values.push(req.query.classId);
      filters.push(`e.class_id = $${values.length}`);
    }
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    values.push(limit, offset);
    const result = await pool.query(
      `SELECT s.uuid AS id,
              CONCAT_WS(' ', s.first_name, s.surname) AS name,
              c.name AS "className",
              sec.name AS section,
              e.academic_year_id AS "academicYearId"
         FROM students s
    LEFT JOIN student_enrollments e ON e.student_id = s.uuid AND e.is_current = TRUE
    LEFT JOIN classes c ON c.uuid = e.class_id
    LEFT JOIN sections sec ON sec.uuid = e.section_id
        WHERE ${filters.join(' AND ')}
        ORDER BY s.first_name, s.surname
        LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:studentId', authorize('students:read'), async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT s.*,
              CONCAT_WS(' ', s.first_name, s.surname) AS name,
              c.name AS "className", sec.name AS section,
              e.academic_year_id AS "academicYearId"
         FROM students s
    LEFT JOIN student_enrollments e ON e.student_id = s.uuid AND e.is_current = TRUE
    LEFT JOIN classes c ON c.uuid = e.class_id
    LEFT JOIN sections sec ON sec.uuid = e.section_id
        WHERE s.uuid = $1 AND s.archived_at IS NULL`,
      [req.params.studentId],
    );
    if (result.rowCount === 0) {
      throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student was not found.');
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authorize('students:write'),
  validateBody(['applicationNumber', 'firstName', 'surname', 'dateOfBirth']),
  async (req, res, next) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const student = await client.query(
        `INSERT INTO students
          (application_number, first_name, surname, date_of_birth, father_name,
           contact_number, photo_reference)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING uuid AS id`,
        [
          req.body.applicationNumber,
          req.body.firstName,
          req.body.surname,
          req.body.dateOfBirth,
          req.body.fatherName || null,
          req.body.contactNumber || null,
          req.body.photoReference || null,
        ],
      );
      await client.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, 'create', 'student', $2, $3)`,
        [req.user.id, student.rows[0].id, JSON.stringify({ applicationNumber: req.body.applicationNumber })],
      );
      await client.query('COMMIT');
      res.status(201).json(student.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  },
);

router.patch('/:studentId', authorize('students:write'), async (req, res, next) => {
  try {
    const allowed = {
      firstName: 'first_name',
      surname: 'surname',
      fatherName: 'father_name',
      contactNumber: 'contact_number',
      photoReference: 'photo_reference',
      dateOfBirth: 'date_of_birth',
    };
    const entries = Object.entries(req.body).filter(([key, value]) => allowed[key] && value !== undefined);
    if (entries.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'At least one editable field is required.');
    }
    const values = entries.map(([, value]) => value);
    const assignments = entries.map(([key], index) => `${allowed[key]} = $${index + 1}`);
    values.push(req.params.studentId);
    const result = await pool.query(
      `UPDATE students SET ${assignments.join(', ')}, updated_at = NOW()
        WHERE uuid = $${values.length} AND archived_at IS NULL
        RETURNING uuid AS id`,
      values,
    );
    if (result.rowCount === 0) {
      throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student was not found.');
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:studentId', authorize('students:archive'), async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE students SET archived_at = NOW(), updated_at = NOW()
        WHERE uuid = $1 AND archived_at IS NULL
        RETURNING uuid`,
      [req.params.studentId],
    );
    if (result.rowCount === 0) {
      throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student was not found.');
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
