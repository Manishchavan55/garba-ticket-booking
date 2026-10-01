const validateId = (value, field) => {
  if (typeof value !== 'string' || !/^\d+$/.test(value) || value === '0') {
    const error = new Error(`${field} must be a positive integer`);
    error.statusCode = 400;
    error.code = 'INVALID_ID';
    error.type = 'validation';
    throw error;
  }

  return value;
};

export const validateEventId = (req, _res, next) => {
  try {
    req.params.id = validateId(req.params.id, 'Event ID');
    next();
  } catch (error) {
    next(error);
  }
};

export const validateEventRouteId = (req, _res, next) => {
  try {
    req.params.eventId = validateId(req.params.eventId, 'Event ID');
    next();
  } catch (error) {
    next(error);
  }
};
