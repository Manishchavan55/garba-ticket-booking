const serializeMeta = (meta) => {
  if (!meta || typeof meta !== 'object') {
    return '';
  }

  const safeMeta = Object.fromEntries(
    Object.entries(meta).filter(([key]) => !/(password|secret|token|authorization|credential)/i.test(key)),
  );

  return Object.keys(safeMeta).length > 0 ? ` ${JSON.stringify(safeMeta)}` : '';
};

const write = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${level.toUpperCase()} ${message}${serializeMeta(meta)}`;
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
};

export const logger = Object.freeze({
  info: (message, meta) => write('info', message, meta),
  error: (message, meta) => write('error', message, meta),
});
