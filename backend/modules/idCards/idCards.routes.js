const express = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const { AppError } = require('../../shared/errors');
const pool = require('../../db');

function escapePdfText(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function createPdf(cards) {
  const commands = ['BT', '/F1 11 Tf'];
  cards.forEach((card, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 45 + column * 270;
    const y = 770 - row * 190;
    commands.push(`${x} ${y} Td`);
    commands.push(`(Balvatika School) Tj`);
    commands.push(`0 -18 Td (${escapePdfText(card.name)}) Tj`);
    commands.push(`0 -16 Td (Class: ${escapePdfText(card.className)}) Tj`);
    commands.push(`0 -16 Td (Father: ${escapePdfText(card.fatherName)}) Tj`);
    commands.push(`0 -16 Td (Contact: ${escapePdfText(card.contactNumber)}) Tj`);
    commands.push(`${-x} ${190 + row * 190 - y} Td`);
  });
  commands.push('ET');
  const stream = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.byteLength(pdf);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

const router = express.Router();
router.post('/student-batch', authenticate, authorize('id_cards:generate'), async (req, res, next) => {
  try {
    const studentIds = Array.isArray(req.body.studentIds) ? [...new Set(req.body.studentIds)] : [];
    if (!studentIds.length || studentIds.length > 100) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Select between 1 and 100 students.');
    }
    const result = await pool.query(
      `SELECT CONCAT_WS(' ', s.first_name, s.surname) AS name,
              c.name AS "className", s.father_name AS "fatherName",
              s.contact_number AS "contactNumber"
         FROM students s
    LEFT JOIN student_enrollments e ON e.student_id = s.uuid AND e.is_current = TRUE
    LEFT JOIN classes c ON c.uuid = e.class_id
        WHERE s.uuid = ANY($1::uuid[]) AND s.archived_at IS NULL
        ORDER BY s.first_name, s.surname`,
      [studentIds],
    );
    if (result.rowCount !== studentIds.length) {
      throw new AppError(400, 'INVALID_STUDENT_BATCH', 'One or more selected students are unavailable.');
    }
    const pdf = createPdf(result.rows);
    res.type('application/pdf');
    res.set('Content-Disposition', 'attachment; filename="student-id-cards.pdf"');
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
