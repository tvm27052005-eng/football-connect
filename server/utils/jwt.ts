import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { IUser } from '../types/index.js';

export interface IJwtPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

export function generateAccessToken(user: IUser): string {
  const payload: IJwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function generateRefreshToken(user: IUser): string {
  const payload = {
    id: user.id
  };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '30d' });
}

export function verifyToken(token: string): IJwtPayload {
  return jwt.verify(token, config.jwtSecret) as IJwtPayload;
}
