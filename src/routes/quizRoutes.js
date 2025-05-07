// src/routes/quizRoutes.js

import express from 'express';
import multer from 'multer';
import {
  submitQuizAttempt,
  getLeaderboard,
  getUserAttempts,
  downloadQuestionsTemplate,
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  addQuestionToQuiz,
  bulkUploadQuestions,
  bulkUploadFromFile,
  getQuestionsByQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../controllers/quizController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const upload = multer();  // memory storage for CSV uploads
const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────────────────

// 🏆 Public leaderboard (anybody)
router.get('/leaderboard', getLeaderboard);

// ─── Protected User Routes ────────────────────────────────────────────────────

// ✏️ Submit a quiz attempt
router.post('/submit', protect, submitQuizAttempt);

// 📖 View your own quiz attempts
router.get('/my-attempts', protect, getUserAttempts);

// ─── Admin / Creator Routes ───────────────────────────────────────────────────

// All routes under `/admin` require authentication + one of these roles:
router.use(
  '/admin',
  protect,
  requireRole(['SUPERADMIN', 'ADMIN', 'CREATER'])
);

// 📥 Download CSV template pre-filled with this quiz’s topic & level
router.get(
  '/admin/quizzes/:quizId/template',
  downloadQuestionsTemplate
);

// ➕ Create a new quiz
router.post(
  '/admin/quizzes',
  createQuiz
);

// 📚 List all quizzes
router.get(
  '/admin/quizzes',
  getAllQuizzes
);

// 📝 Get or update a specific quiz
router
  .route('/admin/quizzes/:quizId')
  .get(getQuizById)    // fetch quiz metadata + questions
  .patch(updateQuiz);  // update quiz fields (title, category, etc.)

// ➕ Add a single question to a quiz
router.post(
  '/admin/quizzes/:quizId/questions',
  addQuestionToQuiz
);

// 📥 Bulk-upload questions via JSON
router.post(
  '/admin/quizzes/:quizId/bulk-upload',
  bulkUploadQuestions
);

// 📤 Bulk-upload questions via CSV/XLSX file
router.post(
  '/admin/quizzes/:quizId/bulk-upload-file',
  upload.single('file'),
  bulkUploadFromFile
);

// ─── Question CRUD for a Given Quiz ──────────────────────────────────────────

// 📖 List all questions for this quiz
router.get(
  '/admin/quizzes/:quizId/questions',
  getQuestionsByQuiz
);

// ➕ Create a new question under this quiz
router.post(
  '/admin/quizzes/:quizId/questions',
  createQuestion
);

// 📝 Update or delete a specific question
router
  .route('/admin/quizzes/:quizId/questions/:questionId')
  .patch(updateQuestion)
  .delete(deleteQuestion);

export default router;
