const { AppError } = require('../shared/errors');

function validateBody(requiredFields) {
  return (req, res, next) => {
    const missingFields = requiredFields.filter((field) => {
      const value = req.body && req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      next(new AppError(
        400,
        'VALIDATION_ERROR',
        'Request validation failed.',
        { missingFields },
      ));
      return;
    }
    next();
  };
}

module.exports = { validateBody };
