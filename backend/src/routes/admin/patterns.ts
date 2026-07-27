import { Router, Response } from 'express'
import prisma from '../../lib/prisma'
import { authenticate, AuthRequest } from '../../middleware/auth'
import { slugify } from '../../lib/utils'

const router = Router()
router.use(authenticate)

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const patterns = await prisma.pattern.findMany({
      include: {
        category: true,
        colors: { include: { color: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: patterns })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch patterns', code: 'INTERNAL_ERROR' } })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, imageUrl, categoryId, colorIds } = req.body
    const slug = slugify(name)

    const existing = await prisma.pattern.findUnique({ where: { slug } })
    if (existing) {
      res.status(400).json({ success: false, error: { message: 'Pattern with this name already exists', code: 'DUPLICATE' } })
      return
    }

    const pattern = await prisma.pattern.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
        categoryId: categoryId || null,
        colors: colorIds?.length ? {
          create: colorIds.map((colorId: string) => ({ colorId })),
        } : undefined,
      },
      include: { category: true, colors: { include: { color: true } }, _count: { select: { products: true } } },
    })

    await prisma.activityLog.create({
      data: { action: 'CREATE', entity: 'pattern', entityId: pattern.id, detail: `Created pattern: ${name}` },
    })

    res.json({ success: true, data: pattern })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to create pattern', code: 'INTERNAL_ERROR' } })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, imageUrl, categoryId, colorIds } = req.body
    const slug = name ? slugify(name) : undefined

    const pattern = await prisma.pattern.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name, slug }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(colorIds ? {
          colors: { deleteMany: {}, create: colorIds.map((colorId: string) => ({ colorId })) },
        } : {}),
      },
      include: { category: true, colors: { include: { color: true } }, _count: { select: { products: true } } },
    })

    await prisma.activityLog.create({
      data: { action: 'UPDATE', entity: 'pattern', entityId: pattern.id, detail: `Updated pattern: ${pattern.name}` },
    })

    res.json({ success: true, data: pattern })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to update pattern', code: 'INTERNAL_ERROR' } })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.pattern.delete({ where: { id: req.params.id } })

    await prisma.activityLog.create({
      data: { action: 'DELETE', entity: 'pattern', entityId: req.params.id, detail: 'Deleted pattern' },
    })

    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to delete pattern', code: 'INTERNAL_ERROR' } })
  }
})

export default router