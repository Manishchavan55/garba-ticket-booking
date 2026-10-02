const BOOKING_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/;

export const validateAdminBookingId = (req, _res, next) => {
  const value = req.params.bookingId;
  if (typeof value !== 'string' || !BOOKING_ID_PATTERN.test(value)) {
    const error = new Error('Booking ID must be a valid booking identifier');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    error.type = 'validation';
    error.field = 'bookingId';
    return next(error);
  }
  return next();
};
