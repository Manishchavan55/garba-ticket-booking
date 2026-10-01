export const validateJsonBody = (req, res, next) => {
  if (req.method !== 'GET' && req.is('application/json') === false && req.headers['content-length']) {
    return res.status(415).json({
      status: 'error',
      message: 'Content-Type must be application/json',
    });
  }

  next();
};
