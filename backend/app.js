const express = require('express');
const cors = require("cors");
const pool = require('./db');

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
}));

app.use(express.json());

app.get("/api/hello", (req, res) => {
  res.json({
    message: "Hello from Express Backend!",
  });
});

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

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});