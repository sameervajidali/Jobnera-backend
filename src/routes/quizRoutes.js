// routes/quizRoutes.js
import express from 'express';
import {
  submitQuizAttempt,
  getLeaderboard,
  bulkUploadQuestions,
  bulkUploadFromFile,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  addQuestionToQuiz,
  getUserAttempts
} from '../controllers/quizController.js';
import { protect } from '../middlewares/authMiddleware.js';
import multer from 'multer';

const upload = multer(); // Memory storage for CSV/XLSX

const router = express.Router();

// 📤 Submit a quiz attempt
router.post('/submit', protect, submitQuizAttempt);

// 🏆 Leaderboard
router.get('/leaderboard', getLeaderboard);

// 🧪 View user quiz attempts
router.get('/my-attempts', protect, getUserAttempts);

// 📚 Admin: All quizzes
router.get('/admin/quizzes', protect, getAllQuizzes);

// 📝 Admin: Get specific quiz
router.get('/admin/quizzes/:quizId', protect, getQuizById);

// 🛠️ Admin: Update quiz
router.put('/admin/quizzes/:quizId', protect, updateQuiz);

// ➕ Admin: Add one question
router.post('/admin/quizzes/:quizId/questions', protect, addQuestionToQuiz);

// 📥 Admin: Upload JSON questions
router.post('/admin/quizzes/:quizId/bulk-upload', protect, bulkUploadQuestions);

// 📤 Admin: Upload CSV/XLSX
router.post('/admin/quizzes/:quizId/bulk-upload-file', protect, upload.single('file'), bulkUploadFromFile);

export default router;
