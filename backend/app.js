const express = require('express');
const cors = require("cors");

const app = express();
const port = 4000;

app.use(cors({
  origin: "http://localhost:3000",
}));

app.use(express.json());

app.get("/api/hello", (req, res) => {
  res.json({
    message: "Hello from Express Backend!",
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});