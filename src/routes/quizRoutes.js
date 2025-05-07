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
  downloadQuestionsTemplate,
  addQuestionToQuiz,
  getUserAttempts,
  getQuestionsByQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
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

// under your admin block:
router.get(
  '/admin/quizzes/:quizId/template',
  protect,
  requireRole(['SUPERADMIN', 'ADMIN', 'CREATOR']),
    downloadQuestionsTemplate
);
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




// under your admin/quizzes/:quizId block:
router.get(
  '/admin/quizzes/:quizId/questions',
  protect, requireRole(['SUPERADMIN','ADMIN','CREATOR']),
  getQuestionsByQuiz
);
router.post(
  '/admin/quizzes/:quizId/questions',
  protect, requireRole(['SUPERADMIN','ADMIN','CREATOR']),
  createQuestion
);
router.patch(
  '/admin/quizzes/:quizId/questions/:questionId',
  protect, requireRole(['SUPERADMIN','ADMIN','CREATOR']),
  updateQuestion
);
router.delete(
  '/admin/quizzes/:quizId/questions/:questionId',
  protect, requireRole(['SUPERADMIN','ADMIN','CREATOR']),
  deleteQuestion
);




export default router;
