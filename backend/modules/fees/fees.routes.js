const express = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const { AppError } = require('../../shared/errors');
const pool = require('../../db');

const router = express.Router({ mergeParams: true });
router.use(authenticate);

router.get('/', authorize('fees:read'), async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT uuid AS id, student_id AS "studentId", academic_year_id AS "academicYearId",
              amount, paid_on AS "paidOn", reference, notes, created_by AS "createdBy"
         FROM fee_payments
        WHERE student_id = $1 ORDER BY paid_on DESC, created_at DESC`,
      [req.params.studentId],
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', authorize('fees:write'), async (req, res, next) => {
  try {
    const { academicYearId, amount, paidOn, reference, notes } = req.body;
    if (!academicYearId || amount === undefined || !paidOn) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Academic year, amount, and paid date are required.');
    }
    const result = await pool.query(
      `INSERT INTO fee_payments
        (student_id, academic_year_id, amount, paid_on, reference, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING uuid AS id`,
      [req.params.studentId, academicYearId, amount, paidOn, reference || null, notes || null, req.user.id],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch('/:paymentId', authorize('fees:write'), async (req, res, next) => {
  try {
    const allowed = { amount: 'amount', paidOn: 'paid_on', reference: 'reference', notes: 'notes' };
    const entries = Object.entries(req.body).filter(([key, value]) => allowed[key] && value !== undefined);
    if (!entries.length) throw new AppError(400, 'VALIDATION_ERROR', 'At least one editable field is required.');
    const values = entries.map(([, value]) => value);
    const assignments = entries.map(([key], index) => `${allowed[key]} = $${index + 1}`);
    values.push(req.params.paymentId, req.params.studentId);
    const result = await pool.query(
      `UPDATE fee_payments SET ${assignments.join(', ')}, updated_at = NOW()
        WHERE uuid = $${values.length - 1} AND student_id = $${values.length}
        RETURNING uuid AS id`,
      values,
    );
    if (!result.rowCount) throw new AppError(404, 'FEE_PAYMENT_NOT_FOUND', 'Fee record was not found.');
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
