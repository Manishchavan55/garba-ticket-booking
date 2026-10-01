const normalize = (value) => typeof value === 'string' ? value.trim() : '';

export const validateAdminLogin = (body = {}) => {
  const identifier = normalize(body.identifier);
  const password = typeof body.password === 'string' ? body.password : '';

  if (!identifier || identifier.length > 254) {
    return 'Identifier is required';
  }

  if (!password || password.length < 12 || password.length > 256) {
    return 'Password is required';
  }

  return true;
};
