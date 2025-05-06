// backend/src/config/multer.js
import multer from 'multer';
import path   from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolve to /opt/render/project/backend/uploads
const uploadDir = path.resolve(__dirname, '..', '..', 'uploads');
console.log('⬆️ Multer writing files to:', uploadDir);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

export default multer({ storage });
