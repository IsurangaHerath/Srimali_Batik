import { Router, Response } from 'express'
import prisma from '../../lib/prisma'
import { authenticate, AuthRequest } from '../../middleware/auth'
import { slugify } from '../../lib/utils'

const router = Router()
router.use(authenticate)

router.get('/', async (_req: AuthRequest, res: Response) => {
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

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, patternId, type, description, imageUrl, price, colorIds } = req.body
    const slug = slugify(name)

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        patternId,
        type: type || null,
        description: description || null,
        imageUrl: imageUrl || null,
        price: price || null,
        colors: colorIds?.length ? {
          create: colorIds.map((colorId: string) => ({ colorId })),
        } : undefined,
      },
      include: { pattern: true, colors: { include: { color: true } } },
    })

    await prisma.activityLog.create({
      data: { action: 'CREATE', entity: 'product', entityId: product.id, detail: `Created product: ${name}` },
    })

    res.json({ success: true, data: product })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to create product', code: 'INTERNAL_ERROR' } })
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, patternId, type, description, imageUrl, price, colorIds } = req.body
    const slug = name ? slugify(name) : undefined

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name, slug }),
        ...(patternId && { patternId }),
        ...(type !== undefined && { type: type || null }),
        ...(description !== undefined && { description: description || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(price !== undefined && { price: price || null }),
        ...(colorIds ? {
          colors: { deleteMany: {}, create: colorIds.map((colorId: string) => ({ colorId })) },
        } : {}),
      },
      include: { pattern: true, colors: { include: { color: true } } },
    })

    await prisma.activityLog.create({
      data: { action: 'UPDATE', entity: 'product', entityId: product.id, detail: `Updated product: ${product.name}` },
    })

    res.json({ success: true, data: product })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to update product', code: 'INTERNAL_ERROR' } })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } })

    await prisma.activityLog.create({
      data: { action: 'DELETE', entity: 'product', entityId: req.params.id, detail: 'Deleted product' },
    })

    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to delete product', code: 'INTERNAL_ERROR' } })
  }
})

export default router