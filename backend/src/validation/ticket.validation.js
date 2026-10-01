const isValidQrIdentifier = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{32,191}$/.test(value);

export const validateQrVerificationPayload = (req, res, next) => {
  const { qrIdentifier } = req.body ?? {};

  if (!isValidQrIdentifier(qrIdentifier)) {
    const error = new Error('QR identifier is invalid');
    error.statusCode = 400;
    error.code = 'INVALID_QR_IDENTIFIER';
    error.type = 'validation';
    throw error;
  }

  req.qrIdentifier = qrIdentifier;
  next();
};
