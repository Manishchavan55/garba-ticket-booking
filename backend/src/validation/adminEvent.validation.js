const ID_PATTERN = /^[1-9]\d*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
const AVAILABILITY_STATUSES = new Set(['available', 'unavailable']);

const fail = (message, field = null) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = 'VALIDATION_ERROR';
  error.type = 'validation';
  if (field) error.field = field;
  throw error;
};

const validateId = (value, field) => {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    fail(`${field} must be a positive integer`, field);
  }
  return value;
};

const isValidDate = (value) => {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const isValidTime = (value) => typeof value === 'string' && TIME_PATTERN.test(value);

const validateEventBody = (body, { partial = false } = {}) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    fail('Request body must be an object');
  }

  const allowed = new Set(['name', 'event_date', 'start_time', 'end_time', 'venue', 'guidelines']);
  const unknown = Object.keys(body).filter((key) => !allowed.has(key));
  if (unknown.length) fail(`Unsupported event field: ${unknown[0]}`);

  const required = ['name', 'event_date', 'start_time', 'venue'];
  if (!partial) {
    for (const field of required) {
      if (typeof body[field] === 'undefined') fail(`${field} is required`, field);
    }
  }

  if (typeof body.name !== 'undefined' && (typeof body.name !== 'string' || body.name.trim().length < 1 || body.name.trim().length > 200)) {
    fail('Event name must be between 1 and 200 characters', 'name');
  }
  if (typeof body.event_date !== 'undefined' && !isValidDate(body.event_date)) {
    fail('Event date must be a valid YYYY-MM-DD date', 'event_date');
  }
  if (typeof body.start_time !== 'undefined' && !isValidTime(body.start_time)) {
    fail('Start time must be a valid HH:MM or HH:MM:SS time', 'start_time');
  }
  if (typeof body.end_time !== 'undefined' && body.end_time !== null && !isValidTime(body.end_time)) {
    fail('End time must be a valid HH:MM or HH:MM:SS time', 'end_time');
  }
  if (typeof body.start_time !== 'undefined' && typeof body.end_time !== 'undefined' && body.end_time !== null && body.start_time >= body.end_time) {
    fail('End time must be later than start time', 'end_time');
  }
  if (typeof body.venue !== 'undefined' && (typeof body.venue !== 'string' || body.venue.trim().length < 1 || body.venue.trim().length > 255)) {
    fail('Venue must be between 1 and 255 characters', 'venue');
  }
  if (typeof body.guidelines !== 'undefined' && body.guidelines !== null && (typeof body.guidelines !== 'string' || body.guidelines.length > 65535)) {
    fail('Guidelines must be a valid text value', 'guidelines');
  }

  return body;
};

const validateCategoryBody = (body, { partial = false } = {}) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Request body must be an object');
  const allowed = new Set(['name', 'price', 'availability_status']);
  const unknown = Object.keys(body).filter((key) => !allowed.has(key));
  if (unknown.length) fail(`Unsupported ticket category field: ${unknown[0]}`);

  if (!partial) {
    for (const field of ['name', 'price', 'availability_status']) {
      if (typeof body[field] === 'undefined') fail(`${field} is required`, field);
    }
  }
  if (typeof body.name !== 'undefined' && (typeof body.name !== 'string' || body.name.trim().length < 1 || body.name.trim().length > 120)) {
    fail('Ticket category name must be between 1 and 120 characters', 'name');
  }
  if (typeof body.price !== 'undefined') {
    const validNumber = (typeof body.price === 'number' && Number.isFinite(body.price)) || (typeof body.price === 'string' && /^\d+(\.\d{1,2})?$/.test(body.price));
    const numericPrice = Number(body.price);
    if (!validNumber || numericPrice < 0 || numericPrice > 9999999999.99) fail('Price must be a non-negative monetary value with at most 2 decimal places', 'price');
  }
  if (typeof body.availability_status !== 'undefined' && !AVAILABILITY_STATUSES.has(body.availability_status)) {
    fail('Availability status must be available or unavailable', 'availability_status');
  }
  return body;
};

export const validateAdminEventId = (req, _res, next) => {
  try { req.params.id = validateId(req.params.id, 'Event ID'); next(); } catch (error) { next(error); }
};

export const validateAdminEventRouteId = (req, _res, next) => {
  try { req.params.eventId = validateId(req.params.eventId, 'Event ID'); next(); } catch (error) { next(error); }
};

export const validateAdminTicketCategoryId = (req, _res, next) => {
  try { req.params.id = validateId(req.params.id, 'Ticket category ID'); next(); } catch (error) { next(error); }
};

export const validateAdminEventBody = (req, _res, next) => {
  try { validateEventBody(req.body, { partial: req.method === 'PATCH' }); next(); } catch (error) { next(error); }
};

export const validateAdminCategoryBody = (req, _res, next) => {
  try { validateCategoryBody(req.body, { partial: req.method === 'PATCH' }); next(); } catch (error) { next(error); }
};
