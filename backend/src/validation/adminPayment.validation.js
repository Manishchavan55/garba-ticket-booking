const PAYMENT_ID_PATTERN = /^\d+$/;

export const validateAdminPaymentId = (req, _res, next) => {
  const value = req.params.paymentId;
  if (typeof value !== 'string' || !PAYMENT_ID_PATTERN.test(value) || Number(value) <= 0) {
    const error = new Error('Payment ID must be a positive integer');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    error.type = 'validation';
    error.field = 'paymentId';
    return next(error);
  }
  return next();
};
