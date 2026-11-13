// Catches anything that goes wrong so the API always answers with the same JSON shape.

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express recognises an error handler by its four parameters. Keep all four.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);

  res.status(status).json({
    // Never leak internal details for server errors.
    error: status >= 500 ? 'Something went wrong on the server.' : err.message,
  });
}

module.exports = { notFound, errorHandler };
