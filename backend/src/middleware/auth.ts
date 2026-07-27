import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt'

export interface AuthRequest extends Request {
  admin?: { sub: string; username: string }
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { message: 'No token provided', code: 'UNAUTHORIZED' } })
    return
  }
  try {
    const payload = verifyToken(header.split(' ')[1])
    req.admin = payload
    next()
  } catch {
    res.status(401).json({ success: false, error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' } })
  }
}