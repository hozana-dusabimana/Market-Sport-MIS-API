// Global error handling middleware
const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = null;

  // Handle specific error types
  
  // MySQL errors
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        statusCode = 409;
        message = 'Duplicate entry. This record already exists.';
        break;
      
      case 'ER_NO_REFERENCED_ROW':
      case 'ER_NO_REFERENCED_ROW_2':
        statusCode = 400;
        message = 'Invalid reference. The referenced record does not exist.';
        break;
      
      case 'ER_ROW_IS_REFERENCED':
      case 'ER_ROW_IS_REFERENCED_2':
        statusCode = 400;
        message = 'Cannot delete. This record is referenced by other records.';
        break;
      
      case 'ER_BAD_FIELD_ERROR':
        statusCode = 400;
        message = 'Invalid field in query.';
        break;
      
      case 'ER_PARSE_ERROR':
        statusCode = 400;
        message = 'Query syntax error.';
        break;
      
      case 'ECONNREFUSED':
        statusCode = 503;
        message = 'Database connection failed.';
        break;
    }
  }

  // JWT errors (already handled in auth middleware, but as fallback)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired.';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error.';
    errors = err.errors;
  }

  // Cast errors (invalid ID format, etc.)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format.';
  }

  // Send response
  const response = {
    success: false,
    message: message
  };

  if (errors) {
    response.errors = errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// Not found middleware (404)
const notFoundMiddleware = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};

// Async error wrapper - wrap async route handlers to catch errors
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default errorMiddleware;
export { notFoundMiddleware, asyncHandler, AppError };