// Builds the Express app: middleware first, then routes, then error handling.
// Kept separate from server.js so tests can load the app without opening a port.
const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Only the Angular app may call this API from a browser.
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:4200' }));

// Lets the API read JSON request bodies.
app.use(express.json());

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
