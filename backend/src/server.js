// Loads settings from .env
require('dotenv').config();

const app = require('./app');
const { start: startQrCleanup } = require('./jobs/expireQrTokens');

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
   startQrCleanup();
});
