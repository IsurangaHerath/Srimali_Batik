import { createApp } from './app'

const PORT = parseInt(process.env.PORT || '3001', 10)

async function main() {
  // Ensure database is ready
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  await prisma.$connect()
  console.log('Database connected')
  await prisma.$disconnect()

  const app = createApp()

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})