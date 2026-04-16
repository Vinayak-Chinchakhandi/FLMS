import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'iflo_local_secret_2026';
const PASSWORD_SALT = process.env.PASSWORD_SALT || 'iflo_local_salt_2026';
const TOKEN_EXPIRY = '8h';

export const hashPassword = (password) => {
  if (!password) return '';
  return crypto.scryptSync(password, PASSWORD_SALT, 64).toString('hex');
};

export const verifyPassword = (password, hashedPassword) => {
  if (!password || !hashedPassword) return false;
  const candidate = hashPassword(password);
  try {
    return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hashedPassword, 'hex'));
  } catch (err) {
    return false;
  }
};

export const generateToken = (user) => {
  const payload = {
    id: user.id,
    name: user.name,
    role: user.role,
    department_id: user.department_id,
  };
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_EXPIRY });
};

export const verifyToken = (token) => jwt.verify(token, SECRET);
