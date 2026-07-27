import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth'
import publicPatternRoutes from './routes/patterns'
import publicProductRoutes from './routes/products'
import publicColorRoutes from './routes/colors'
import publicCategoryRoutes from './routes/categories'
import publicSettingRoutes from './routes/settings'
import adminPatternRoutes from './routes/admin/patterns'
import adminProductRoutes from './routes/admin/products'
import adminColorRoutes from './routes/admin/colors'
import adminCategoryRoutes from './routes/admin/categories'
import adminSettingRoutes from './routes/admin/settings'
import adminStatsRoutes from './routes/admin/stats'
import adminActivityRoutes from './routes/admin/activity'
import adminUploadRoutes from './routes/admin/upload'

export function createApp() {
  const app = express()

  // Security
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }))

  // Logging
  app.use(morgan('dev'))

  // Body parsing
  app.use(express.json())

  // Static files (uploads)
  app.use('/uploads', express.static(path.resolve('uploads')))

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
  app.use('/api', limiter)

  const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
  })
  app.use('/api/auth/login', loginLimiter)

  // Public routes
  app.use('/api/auth', authRoutes)
  app.use('/api/patterns', publicPatternRoutes)
  app.use('/api/products', publicProductRoutes)
  app.use('/api/colors', publicColorRoutes)
  app.use('/api/categories', publicCategoryRoutes)
  app.use('/api/settings', publicSettingRoutes)

  // Admin routes
  app.use('/api/admin/patterns', adminPatternRoutes)
  app.use('/api/admin/products', adminProductRoutes)
  app.use('/api/admin/colors', adminColorRoutes)
  app.use('/api/admin/categories', adminCategoryRoutes)
  app.use('/api/admin/settings', adminSettingRoutes)
  app.use('/api/admin/stats', adminStatsRoutes)
  app.use('/api/admin/activity', adminActivityRoutes)
  app.use('/api/admin/upload', adminUploadRoutes)

  // Error handling
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}