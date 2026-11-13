// Entry point: loads settings from .env, then starts listening for requests.
require('dotenv').config();

const app = require('./app');

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});
