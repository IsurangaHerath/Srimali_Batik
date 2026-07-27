import { Router, Response } from 'express'
import prisma from '../../lib/prisma'
import { authenticate, AuthRequest } from '../../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const totalPatterns = await prisma.pattern.count()
    const totalProducts = await prisma.product.count()
    const totalColors = await prisma.color.count()
    const totalCategories = await prisma.category.count()
    const recentActivity = await prisma.activityLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    })

    res.json({
      success: true,
      data: {
        totalPatterns,
        totalProducts,
        totalColors,
        totalCategories,
        recentActivity,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch stats', code: 'INTERNAL_ERROR' } })
  }
})

export default router