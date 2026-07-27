import { Router, Response } from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { authenticate, AuthRequest } from '../../middleware/auth'

const uploadDir = path.resolve('uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only jpg, jpeg, png, webp allowed.'))
    }
  },
})

const router = Router()
router.use(authenticate)

router.post('/', upload.single('image'), (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: { message: 'No file uploaded', code: 'VALIDATION_ERROR' } })
      return
    }
    const url = `/uploads/${req.file.filename}`
    res.json({ success: true, data: { url } })
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message || 'Upload failed', code: 'UPLOAD_ERROR' } })
  }
})

export default router