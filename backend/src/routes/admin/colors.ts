import { Router, Response } from 'express'
import prisma from '../../lib/prisma'
import { authenticate, AuthRequest } from '../../middleware/auth'
import { slugify } from '../../lib/utils'

const router = Router()
router.use(authenticate)

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const colors = await prisma.color.findMany({ orderBy: { name: 'asc' } })
    res.json({ success: true, data: colors })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch colors', code: 'INTERNAL_ERROR' } })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, hex, darkHex, imageUrl } = req.body
    const slug = slugify(name)

    const existing = await prisma.color.findUnique({ where: { slug } })
    if (existing) {
      res.status(400).json({ success: false, error: { message: 'Color with this name already exists', code: 'DUPLICATE' } })
      return
    }

    const color = await prisma.color.create({
      data: { name, slug, hex, darkHex: darkHex || null, imageUrl: imageUrl || null },
    })

    await prisma.activityLog.create({
      data: { action: 'CREATE', entity: 'color', entityId: color.id, detail: `Created color: ${name}` },
    })

    res.json({ success: true, data: color })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to create color', code: 'INTERNAL_ERROR' } })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, hex, darkHex, imageUrl } = req.body

    const color = await prisma.color.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name, slug: slugify(name) }),
        ...(hex && { hex }),
        ...(darkHex !== undefined && { darkHex: darkHex || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      },
    })

    await prisma.activityLog.create({
      data: { action: 'UPDATE', entity: 'color', entityId: color.id, detail: `Updated color: ${color.name}` },
    })

    res.json({ success: true, data: color })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to update color', code: 'INTERNAL_ERROR' } })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.color.delete({ where: { id: req.params.id } })

    await prisma.activityLog.create({
      data: { action: 'DELETE', entity: 'color', entityId: req.params.id, detail: 'Deleted color' },
    })

    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to delete color', code: 'INTERNAL_ERROR' } })
  }
})

export default router