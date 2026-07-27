import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        pattern: { select: { id: true, name: true, slug: true } },
        colors: { include: { color: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: products })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch products', code: 'INTERNAL_ERROR' } })
  }
})

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        pattern: { select: { id: true, name: true, slug: true, imageUrl: true } },
        colors: { include: { color: true } },
      },
    })
    if (!product) {
      res.status(404).json({ success: false, error: { message: 'Product not found', code: 'NOT_FOUND' } })
      return
    }
    res.json({ success: true, data: product })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch product', code: 'INTERNAL_ERROR' } })
  }
})

export default router