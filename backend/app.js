const express = require('express');
const app = express();
const port = 4000;

app.get('/test', (req, res) => {
  res.send('Hello World! from the backend');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});