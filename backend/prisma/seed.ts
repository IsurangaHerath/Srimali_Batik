import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin (default password: password123 — change after first login)
  const adminPassword = await bcrypt.hash('password123', 12)
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: { password: adminPassword },
    create: {
      username: 'admin',
      password: adminPassword,
    },
  })

  // Create categories
  const categories = [
    { name: 'Traditional', slug: 'traditional', description: 'Classic Sri Lankan batik patterns' },
    { name: 'Modern', slug: 'modern', description: 'Contemporary batik designs' },
    { name: 'Floral', slug: 'floral', description: 'Floral and nature-inspired patterns' },
    { name: 'Geometric', slug: 'geometric', description: 'Geometric and abstract patterns' },
  ]
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  // Create colors
  const colors = [
    { name: 'Emerald Green', slug: 'emerald-green', hex: '#2ECC71', darkHex: '#27AE60' },
    { name: 'Royal Blue', slug: 'royal-blue', hex: '#3498DB', darkHex: '#2980B9' },
    { name: 'Crimson Red', slug: 'crimson-red', hex: '#E74C3C', darkHex: '#C0392B' },
    { name: 'Sunset Orange', slug: 'sunset-orange', hex: '#F39C12', darkHex: '#D68910' },
    { name: 'Purple Reign', slug: 'purple-reign', hex: '#9B59B6', darkHex: '#8E44AD' },
    { name: 'Midnight Black', slug: 'midnight-black', hex: '#2C3E50', darkHex: '#1A252F' },
    { name: 'Pure White', slug: 'pure-white', hex: '#FFFFFF', darkHex: '#ECF0F1' },
    { name: 'Golden Yellow', slug: 'golden-yellow', hex: '#F1C40F', darkHex: '#D4AC0D' },
    { name: 'Teal', slug: 'teal', hex: '#1ABC9C', darkHex: '#16A085' },
    { name: 'Warm Brown', slug: 'warm-brown', hex: '#8B5E3C', darkHex: '#6F4E2E' },
  ]
  for (const color of colors) {
    await prisma.color.upsert({
      where: { slug: color.slug },
      update: {},
      create: color,
    })
  }

  // Create settings
  const settings = [
    { key: 'whatsapp_number', value: '+94771234567' },
    { key: 'store_name', value: 'Srimali Batik' },
    { key: 'store_email', value: 'info@srimalibatik.com' },
    { key: 'store_phone', value: '+94 77 123 4567' },
    { key: 'store_address', value: 'Colombo, Sri Lanka' },
    { key: 'store_description', value: 'Handcrafted batik clothing and fabrics since 1990.' },
  ]
  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  // Create sample patterns with products
  const floralCat = await prisma.category.findUnique({ where: { slug: 'floral' } })
  const tradCat = await prisma.category.findUnique({ where: { slug: 'traditional' } })
  const modernCat = await prisma.category.findUnique({ where: { slug: 'modern' } })

  const allColors = await prisma.color.findMany()
  const greenId = allColors.find(c => c.slug === 'emerald-green')?.id
  const blueId = allColors.find(c => c.slug === 'royal-blue')?.id
  const redId = allColors.find(c => c.slug === 'crimson-red')?.id
  const goldId = allColors.find(c => c.slug === 'golden-yellow')?.id
  const brownId = allColors.find(c => c.slug === 'warm-brown')?.id
  const whiteId = allColors.find(c => c.slug === 'pure-white')?.id
  const blackId = allColors.find(c => c.slug === 'midnight-black')?.id

  const patternData = [
    {
      name: 'Traditional Floral Saree',
      slug: 'traditional-floral-saree',
      description: 'A beautiful traditional floral batik pattern featuring hand-drawn flower motifs on premium fabric. Perfect for sarees and formal wear.',
      imageUrl: '/uploads/cover.jpg',
      categoryId: floralCat?.id,
      colorIds: [redId, goldId, whiteId].filter(Boolean),
      products: [
        { name: 'Floral Saree', slug: 'floral-saree', type: 'Saree', price: '15,000 LKR', colorIds: [redId, goldId].filter(Boolean) },
        { name: 'Matching Blouse', slug: 'matching-blouse', type: 'Other', price: '4,500 LKR', colorIds: [redId].filter(Boolean) },
      ],
    },
    {
      name: 'Modern Geometric',
      slug: 'modern-geometric',
      description: 'Contemporary geometric batik pattern with clean lines and bold shapes. Ideal for modern fashion pieces.',
      imageUrl: '/uploads/cover.jpg',
      categoryId: modernCat?.id,
      colorIds: [blueId, whiteId, blackId].filter(Boolean),
      products: [
        { name: 'Geometric Frock', slug: 'geometric-frock', type: 'Frock', price: '12,500 LKR', colorIds: [blueId, whiteId].filter(Boolean) },
        { name: 'Geometric Shirt', slug: 'geometric-shirt', type: 'Shirt', price: '6,500 LKR', colorIds: [blueId].filter(Boolean) },
      ],
    },
    {
      name: 'Classic Sri Lankan',
      slug: 'classic-sri-lankan',
      description: 'Traditional Sri Lankan batik pattern inspired by ancient temple art and cultural motifs. Handcrafted by master artisans.',
      imageUrl: '/uploads/cover.jpg',
      categoryId: tradCat?.id,
      colorIds: [brownId, goldId, greenId].filter(Boolean),
      products: [
        { name: 'Traditional Sarong', slug: 'traditional-sarong', type: 'Sarong', price: '8,500 LKR', colorIds: [brownId, goldId].filter(Boolean) },
        { name: 'Cassual Shirt', slug: 'cassual-shirt', type: 'Shirt', price: '5,500 LKR', colorIds: [brownId].filter(Boolean) },
      ],
    },
  ]

  for (const pd of patternData) {
    const existing = await prisma.pattern.findUnique({ where: { slug: pd.slug } })
    if (!existing) {
      const pattern = await prisma.pattern.create({
        data: {
          name: pd.name,
          slug: pd.slug,
          description: pd.description,
          imageUrl: pd.imageUrl,
          categoryId: pd.categoryId || undefined,
          colors: pd.colorIds.length ? {
            create: pd.colorIds.map(colorId => ({ colorId })),
          } : undefined,
        },
      })

      for (const prod of pd.products) {
        await prisma.product.create({
          data: {
            name: prod.name,
            slug: prod.slug,
            patternId: pattern.id,
            type: prod.type,
            price: prod.price,
            colors: prod.colorIds.length ? {
              create: prod.colorIds.map(colorId => ({ colorId })),
            } : undefined,
          },
        })
      }
    }
  }

  console.log('Seed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })