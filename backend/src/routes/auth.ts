import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'
import { signToken } from '../lib/jwt'

const router = Router()

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ success: false, error: { message: 'Username and password required', code: 'VALIDATION_ERROR' } })
      return
    }

    const admin = await prisma.admin.findUnique({ where: { username } })
    if (!admin) {
      res.status(401).json({ success: false, error: { message: 'Invalid credentials', code: 'UNAUTHORIZED' } })
      return
    }

    const valid = await bcrypt.compare(password, admin.password)
    if (!valid) {
      res.status(401).json({ success: false, error: { message: 'Invalid credentials', code: 'UNAUTHORIZED' } })
      return
    }

    const token = signToken({ sub: admin.id, username: admin.username })
    
    await prisma.activityLog.create({
      data: { action: 'LOGIN', entity: 'admin', entityId: admin.id, detail: 'Admin logged in' },
    })

    res.json({ success: true, data: { token, admin: { id: admin.id, username: admin.username } } })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: { message: 'Login failed', code: 'INTERNAL_ERROR' } })
  }
})

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: { message: 'No token', code: 'UNAUTHORIZED' } })
      return
    }
    
    const { verifyToken } = await import('../lib/jwt')
    const payload = verifyToken(header.split(' ')[1])
    
    const admin = await prisma.admin.findUnique({ where: { id: payload.sub } })
    if (!admin) {
      res.status(401).json({ success: false, error: { message: 'Admin not found', code: 'UNAUTHORIZED' } })
      return
    }

    res.json({ success: true, data: { admin: { id: admin.id, username: admin.username } } })
  } catch {
    res.status(401).json({ success: false, error: { message: 'Invalid token', code: 'UNAUTHORIZED' } })
  }
})

export default router