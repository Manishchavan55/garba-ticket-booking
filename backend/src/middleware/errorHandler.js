export const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (error, _req, res, _next) => {
  console.error(error);
  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 ? 'Internal server error' : error.message,
  });
};
