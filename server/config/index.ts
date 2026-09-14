import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: 3000,
  jwtSecret: process.env.JWT_SECRET || 'football_connect_jwt_super_secret_2025_key',
  jwtExpiresIn: '7d',
  refreshTokenExpiresIn: '30d',
  nodeEnv: process.env.NODE_ENV || 'development'
};
