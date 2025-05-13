import express from 'express';
import multer from 'multer';
import {
  createMaterial,
  getAllMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  assignMaterial,
  getMyMaterials,
  toggleBookmark,
  getMyBookmarks,
} from '../controllers/materialController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ─── Public (anyone logged-in) ───────────────────────────────────────────────
// get details for one material
router.get('/:materialId', protect, getMaterialById);

// ─── User routes ──────────────────────────────────────────────────────────────
router.use(protect);
router.get('/', getMyMaterials);                 // GET all materials assigned to me
router.post('/:materialId/bookmark', toggleBookmark);   // bookmark / unbookmark
router.get('/bookmarks', getMyBookmarks);        // list my bookmarks

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.use(requireRole(['ADMIN', 'SUPERADMIN']));
router.post('/', createMaterial);                // create new material
router.get('/all', getAllMaterials);             // get all materials
router.patch('/:materialId', updateMaterial);    // update
router.delete('/:materialId', deleteMaterial);   // delete
router.post('/:materialId/assign', assignMaterial);  // assign to users

export default router;
