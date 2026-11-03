const express = require('express');
const cors = require("cors");
const pool = require('./db');
const { errorHandler } = require('./shared/errors');
const authRoutes = require('./modules/auth/auth.routes');
const studentRoutes = require('./modules/students/students.routes');
const staffRoutes = require('./modules/staff/staff.routes');
const feesRoutes = require('./modules/fees/fees.routes');
const idCardRoutes = require('./modules/idCards/idCards.routes');
const galleryRoutes = require('./modules/gallery/gallery.routes');

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
}));

app.use(express.json());

app.use('/api/auth', authRoutes);

app.get("/api/hello", (req, res) => {
  res.json({
    message: "Hello from Express Backend!",
  });
});

app.use('/api/students', studentRoutes);
app.use('/api/students/:studentId/fee-payments', feesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/id-cards', idCardRoutes);
app.use('/api/gallery', galleryRoutes);

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "Database connected successfully!",
      time: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});