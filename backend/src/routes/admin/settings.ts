import { Router, Response } from 'express'
import prisma from '../../lib/prisma'
import { authenticate, AuthRequest } from '../../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.setting.findMany()
    res.json({ success: true, data: settings })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch settings', code: 'INTERNAL_ERROR' } })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { value } = req.body
    const setting = await prisma.setting.update({
      where: { id: req.params.id },
      data: { value },
    })

    await prisma.activityLog.create({
      data: { action: 'UPDATE', entity: 'setting', entityId: setting.id, detail: `Updated setting: ${setting.key}` },
    })

    res.json({ success: true, data: setting })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to update setting', code: 'INTERNAL_ERROR' } })
  }
})

export default router