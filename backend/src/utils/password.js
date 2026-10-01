import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const SALT_BYTES = 16;

export const hashPassword = async (password) => {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
  });

  return [
    'scrypt',
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString('base64url'),
    Buffer.from(derivedKey).toString('base64url'),
  ].join('$');
};

export const verifyPassword = async (password, encodedHash) => {
  try {
    const [algorithm, cost, blockSize, parallelization, encodedSalt, encodedKey] = encodedHash.split('$');
    if (algorithm !== 'scrypt' || !encodedSalt || !encodedKey) {
      return false;
    }

    const salt = Buffer.from(encodedSalt, 'base64url');
    const expectedKey = Buffer.from(encodedKey, 'base64url');
    const derivedKey = await scrypt(password, salt, expectedKey.length, {
      N: Number(cost),
      r: Number(blockSize),
      p: Number(parallelization),
    });

    return expectedKey.length === derivedKey.length
      && timingSafeEqual(expectedKey, Buffer.from(derivedKey));
  } catch {
    return false;
  }
};
