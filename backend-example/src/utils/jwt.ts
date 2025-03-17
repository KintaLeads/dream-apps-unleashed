
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const TOKEN_EXPIRY = '24h';

export const generateToken = (userId: string): string => {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

export const verifyToken = (token: string): { sub: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string };
  } catch (error) {
    return null;
  }
};
