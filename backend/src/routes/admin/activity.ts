import { Router, Response } from 'express'
import prisma from '../../lib/prisma'
import { authenticate, AuthRequest } from '../../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const activities = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    res.json({ success: true, data: activities })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch activity', code: 'INTERNAL_ERROR' } })
  }
})

export default router