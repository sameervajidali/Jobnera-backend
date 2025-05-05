// src/config/multer.js
import multer from 'multer';
import path from 'path';

// Store files in memory or on disk—here’s a simple disk setup:
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // you can customize per‐field or put all uploads in one folder
    cb(null, path.join(process.cwd(), 'uploads/'));
  },
  filename: (req, file, cb) => {
    // e.g. avatar-<timestamp>.<ext>  or resume-<timestamp>.<ext>
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

export default multer({ storage });
