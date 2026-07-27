import jwt from 'jsonwebtoken'
import { config } from '../config/env'

const JWT_SECRET = config.jwtSecret
const JWT_EXPIRES_IN = '24h'

export function signToken(payload: { sub: string; username: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { sub: string; username: string; iat: number; exp: number }
}