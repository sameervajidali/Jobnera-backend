
import express from 'express';
import {
  getUserDashboard,
  getUserBookmarks,
  getUserAttempts,
  getUserAssignments,
  getUserMaterials,
  getUserHistory,
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All endpoints here require a valid user token:
router.use(protect);

// 1) Comprehensive dashboard
router.get('/dashboard', getUserDashboard);

// 2) Individual slices (if you prefer separate calls)
router.get('/bookmarks',   getUserBookmarks);
router.get('/attempts',    getUserAttempts);
router.get('/assignments', getUserAssignments);
router.get('/materials',   getUserMaterials);
router.get('/history',     getUserHistory);

export default router;
