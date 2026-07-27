import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const colors = await prisma.color.findMany({ orderBy: { name: 'asc' } })
    res.json({ success: true, data: colors })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch colors', code: 'INTERNAL_ERROR' } })
  }
})

export default router