import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
    res.json({ success: true, data: categories })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch categories', code: 'INTERNAL_ERROR' } })
  }
})

export default router