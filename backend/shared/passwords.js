const crypto = require('crypto');

const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

function verifyPassword(password, encodedHash) {
  const parts = String(encodedHash || '').split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }

  const [, salt, storedHash] = parts;
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  const storedBuffer = Buffer.from(storedHash, 'hex');
  return storedBuffer.length === derivedKey.length
    && crypto.timingSafeEqual(storedBuffer, derivedKey);
}

function createToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { hashPassword, verifyPassword, createToken, hashToken };
