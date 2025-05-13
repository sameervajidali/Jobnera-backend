// src/config/multer.js
import multer from 'multer'
import path from 'path'




const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext  = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-')
    cb(null, `${base}-${Date.now()}${ext}`)
  }
})

export default multer({ storage })
