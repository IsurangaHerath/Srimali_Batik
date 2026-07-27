import { Router, Response } from 'express'
import prisma from '../../lib/prisma'
import { authenticate, AuthRequest } from '../../middleware/auth'
import { slugify } from '../../lib/utils'

const router = Router()
router.use(authenticate)

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { patterns: true } } },
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, data: categories })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch categories', code: 'INTERNAL_ERROR' } })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body
    const slug = slugify(name)

    const category = await prisma.category.create({
      data: { name, slug, description: description || null },
    })

    await prisma.activityLog.create({
      data: { action: 'CREATE', entity: 'category', entityId: category.id, detail: `Created category: ${name}` },
    })

    res.json({ success: true, data: category })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to create category', code: 'INTERNAL_ERROR' } })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name, slug: slugify(name) }),
        ...(description !== undefined && { description: description || null }),
      },
    })

    await prisma.activityLog.create({
      data: { action: 'UPDATE', entity: 'category', entityId: category.id, detail: `Updated category: ${category.name}` },
    })

    res.json({ success: true, data: category })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to update category', code: 'INTERNAL_ERROR' } })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } })

    await prisma.activityLog.create({
      data: { action: 'DELETE', entity: 'category', entityId: req.params.id, detail: 'Deleted category' },
    })

    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to delete category', code: 'INTERNAL_ERROR' } })
  }
})

export default router