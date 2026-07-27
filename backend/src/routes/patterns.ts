import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const patterns = await prisma.pattern.findMany({
      include: {
        category: true,
        colors: { include: { color: true } },
        products: {
          include: { colors: { include: { color: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: patterns })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch patterns', code: 'INTERNAL_ERROR' } })
  }
})

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const pattern = await prisma.pattern.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        colors: { include: { color: true } },
        products: {
          include: { colors: { include: { color: true } } },
        },
      },
    })
    if (!pattern) {
      res.status(404).json({ success: false, error: { message: 'Pattern not found', code: 'NOT_FOUND' } })
      return
    }
    res.json({ success: true, data: pattern })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch pattern', code: 'INTERNAL_ERROR' } })
  }
})

router.get('/search/:query', async (req: Request, res: Response) => {
  try {
    const query = req.params.query
    const patterns = await prisma.pattern.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      },
      include: {
        category: true,
        colors: { include: { color: true } },
        products: { include: { colors: { include: { color: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: patterns })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Search failed', code: 'INTERNAL_ERROR' } })
  }
})

export default router