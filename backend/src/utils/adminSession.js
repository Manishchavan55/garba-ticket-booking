import { createHash, randomBytes } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'kdn_admin_session';

export const createSessionToken = () => randomBytes(32).toString('base64url');

export const hashSessionToken = (token) => createHash('sha256').update(token).digest('hex');

const decodeCookieValue = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return '';
  }
};

export const parseCookies = (cookieHeader = '') => Object.fromEntries(
  cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex < 0) {
        return [part, ''];
      }
      return [part.slice(0, separatorIndex), decodeCookieValue(part.slice(separatorIndex + 1))];
    }),
);

export const getSessionToken = (req) => parseCookies(req.headers.cookie)[ADMIN_SESSION_COOKIE] ?? null;

export const setSessionCookie = (res, token, { secure, maxAgeSeconds }) => {
  const attributes = [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/api/admin',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];

  if (secure) {
    attributes.push('Secure');
  }

  res.setHeader('Set-Cookie', attributes.join('; '));
};

export const clearSessionCookie = (res, { secure }) => {
  const attributes = [
    `${ADMIN_SESSION_COOKIE}=`,
    'Path=/api/admin',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];

  if (secure) {
    attributes.push('Secure');
  }

  res.setHeader('Set-Cookie', attributes.join('; '));
};
