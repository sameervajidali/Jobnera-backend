// src/config/multer.js
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.resolve(__dirname, '..', 'uploads')

// ensure the folder exists
fs.mkdirSync(uploadDir, { recursive: true })
console.log('Uploads directory:', uploadDir); // Add this line to check the upload path

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext  = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-')
    cb(null, `${base}-${Date.now()}${ext}`)
  }
})

export default multer({ storage })
