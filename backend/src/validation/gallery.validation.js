const GALLERY_ID_PATTERN = /^\d+$/;
const MEDIA_TYPES = new Set(['image', 'video']);

const validationError = (message, field) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = 'VALIDATION_ERROR';
  error.type = 'validation';
  error.field = field;
  return error;
};

export const validateGalleryId = (req, _res, next) => {
  const value = req.params.id;
  if (typeof value !== 'string' || !GALLERY_ID_PATTERN.test(value) || Number(value) <= 0) {
    return next(validationError('Gallery ID must be a positive integer', 'id'));
  }
  return next();
};

export const validateGalleryBody = (req, _res, next) => {
  const body = req.body ?? {};
  const { title, mediaType, mediaUrl, altText, isActive } = body;

  if (title !== undefined && title !== null && (typeof title !== 'string' || title.trim().length > 200)) {
    return next(validationError('Title must be 200 characters or fewer', 'title'));
  }
  if (typeof mediaType !== 'string' || !MEDIA_TYPES.has(mediaType)) {
    return next(validationError('Media type must be image or video', 'mediaType'));
  }
  if (typeof mediaUrl !== 'string' || mediaUrl.trim().length === 0 || mediaUrl.length > 2048) {
    return next(validationError('Media URL is required and must be 2048 characters or fewer', 'mediaUrl'));
  }
  if (altText !== undefined && altText !== null && (typeof altText !== 'string' || altText.length > 255)) {
    return next(validationError('Alt text must be 255 characters or fewer', 'altText'));
  }
  if (typeof isActive !== 'boolean') {
    return next(validationError('isActive must be a boolean', 'isActive'));
  }

  return next();
};
