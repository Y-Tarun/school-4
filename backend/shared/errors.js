class AppError extends Error {
  constructor(statusCode, code, message, details = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = statusCode >= 500 ? 'An unexpected error occurred.' : error.message;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      details: error.details || {},
    },
  });
}

module.exports = { AppError, errorHandler };
