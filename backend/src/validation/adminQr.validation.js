const TICKET_ID_PATTERN = /^\d+$/;
const QR_IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]{32,191}$/;

export const validateAdminQrTicketId = (req, _res, next) => {
  const value = req.params.ticketId;
  if (typeof value !== 'string' || !TICKET_ID_PATTERN.test(value) || Number(value) <= 0) {
    const error = new Error('QR ticket ID must be a positive integer');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    error.type = 'validation';
    error.field = 'ticketId';
    return next(error);
  }
  return next();
};

export const validateVenueQrPayload = (req, _res, next) => {
  const value = req.body?.qrIdentifier;
  if (typeof value !== 'string' || !QR_IDENTIFIER_PATTERN.test(value)) {
    const error = new Error('QR identifier is invalid');
    error.statusCode = 400;
    error.code = 'INVALID_QR_IDENTIFIER';
    error.type = 'validation';
    error.field = 'qrIdentifier';
    return next(error);
  }
  return next();
};
