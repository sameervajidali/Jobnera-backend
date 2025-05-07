// src/routes/quizRoutes.js

import express from 'express';
import multer from 'multer';
import {
  submitQuizAttempt,
  getLeaderboard,
  bulkUploadQuestions,
  bulkUploadFromFile,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  addQuestionToQuiz,
  getUserAttempts,
  createQuiz
} from '../controllers/quizController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const upload = multer();  // memory storage for CSV uploads
const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────

// 🏆 Public Leaderboard
router.get('/leaderboard', getLeaderboard);

// ─── Protected User Routes (any authenticated user) ─────────────────────────

router.use(protect);

router.post('/submit', submitQuizAttempt);
router.get('/my-attempts', getUserAttempts);

// ─── Admin/Creator Routes (SUPERADMIN, ADMIN, CREATER only) ─────────────────

router.use('/admin', requireRole(['SUPERADMIN', 'ADMIN', 'CREATER']));


// Create a new quiz
router.post('/admin/quizzes', createQuiz);

// 📚 Get all quizzes
router.get('/admin/quizzes', getAllQuizzes);

// 📝 Get or update a specific quiz
router
  .route('/admin/quizzes/:quizId')
  .get(getQuizById)
  .patch(updateQuiz);

// ➕ Add a single question to a quiz
router.post(
  '/admin/quizzes/:quizId/questions',
  addQuestionToQuiz
);

// 📥 Bulk upload via JSON
router.post(
  '/admin/quizzes/:quizId/bulk-upload',
  bulkUploadQuestions
);

// 📤 Bulk upload via CSV file
router.post(
  '/admin/quizzes/:quizId/bulk-upload-file',
  upload.single('file'),
  bulkUploadFromFile
);

export default router;
