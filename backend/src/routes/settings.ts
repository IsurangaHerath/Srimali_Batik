import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.setting.findMany()
    res.json({ success: true, data: settings })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch settings', code: 'INTERNAL_ERROR' } })
  }
})

export default router