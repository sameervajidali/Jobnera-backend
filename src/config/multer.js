import multer from 'multer';
import path   from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// We keep an `uploads/` folder at the same level as `src/`
const uploadDir = path.resolve(__dirname, '..', 'uploads');
console.log('⬆️ Multer will write files to:', uploadDir);

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
