import multer from 'multer';
import path   from 'path';
import fs     from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// resolve to /opt/render/project/src/uploads
const uploadDir = path.resolve(__dirname, '..', 'uploads');

// Ensure the uploads folder exists (auto-create in production)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('🆕 Created upload directory:', uploadDir);
} else {
  console.log('⬆️ Multer will write files to:', uploadDir);
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

export default multer({ storage });
