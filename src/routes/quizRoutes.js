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
  getPublicQuizzes,
  getQuizById,
  updateQuiz,
  addQuestionToQuiz,
  bulkUploadQuestions,
  bulkUploadFromFile,
  getQuestionsByQuiz,
  createQuestion,
  getAttemptById,
  updateQuestion,
  deleteQuestion,
  assignQuiz,
  getQuizTopThree,
  getAttemptStats,
  getQuizAssignments,
  getDistinctValues,
  getGroupedTopics,
  bulkUploadQuizzesFile,
  unassignQuiz
} from '../controllers/quizController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const upload = multer();  // memory storage for CSV uploads
const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────────────────

// Distinct-value endpoints for sidebar filters
router.get('/distinct/category', getDistinctValues('category'));
router.get('/distinct/topic', getDistinctValues('topic'));
router.get('/distinct/level', getDistinctValues('level'));
router.get('/grouped-topics', getGroupedTopics);

// List all active quizzes (paginated + filterable)
router.get('/', getPublicQuizzes);

// Public leaderboard (any visitor)
router.get('/leaderboard', getLeaderboard);
// Public/top-three
router.get('/:quizId/top-three', getQuizTopThree);

router.get('/attempts/:attemptId/stats', getAttemptStats);
// Fetch a single quiz (requires login)
router.get('/:quizId', protect, getQuizById);


// ─── Protected User Routes ────────────────────────────────────────────────────

// Submit a quiz attempt
router.post('/submit',     protect, submitQuizAttempt);
router.get('/my-attempts', protect, getUserAttempts);
router.get('/attempts/:attemptId',             protect, getAttemptById);
//router.get('/attempts/:attemptId/stats',       protect, getAttemptStats);
//router.get('/:quizId/top-three',               protect, getQuizTopThree);

// ─── Admin / Creator Routes ────────────────────────────────────────────────────

// All under /admin require SUPERADMIN, ADMIN, or CREATOR
router.use('/admin', protect, requireRole(['SUPERADMIN', 'ADMIN', 'CREATOR']));

// Download a CSV template pre-filled with this quiz’s topic & level
router.get(
  '/admin/quizzes/:quizId/template',
  downloadQuestionsTemplate
);

// **Bulk‐upload an entire CSV of quizzes:**
// POST /api/quizzes/admin/quizzes/bulk-upload-file
// Bulk-create *quizzes* via CSV/XLSX:
router.post(
  '/admin/quizzes/bulk-upload-file',    // <-- note the “-file”
  upload.single('file'),
  bulkUploadQuizzesFile
)

// Create a new quiz
router.post('/admin/quizzes', createQuiz);

// List all quizzes (admin view)
router.get('/admin/quizzes', getAllQuizzes);

// Get or update a specific quiz
router
  .route('/admin/quizzes/:quizId')
  .get(getQuizById)
  .patch(updateQuiz);

// Add a single question to a quiz
router.post(
  '/admin/quizzes/:quizId/questions',
  addQuestionToQuiz
);

// Bulk-upload questions via JSON
router.post(
  '/admin/quizzes/:quizId/bulk-upload',
  bulkUploadQuestions
);

// Bulk-upload questions via CSV/XLSX file
router.post(
  '/admin/quizzes/:quizId/bulk-upload-file',
  upload.single('file'),
  bulkUploadFromFile
);

// ─── Question CRUD for a Given Quiz ──────────────────────────────────────────

// List all questions for this quiz
router.get(
  '/admin/quizzes/:quizId/questions',
  getQuestionsByQuiz
);

// Create a new question under this quiz
router.post(
  '/admin/quizzes/:quizId/questions',
  createQuestion
);

// Update or delete a specific question
router
  .route('/admin/quizzes/:quizId/questions/:questionId')
  .patch(updateQuestion)
  .delete(deleteQuestion);

// ─── Quiz Assignment Management ───────────────────────────────────────────────

// Assign one or more users to a quiz
router.post(
  '/admin/quizzes/:quizId/assign',
  assignQuiz
);

// List all current assignments for a quiz
router.get(
  '/admin/quizzes/:quizId/assignments',
  getQuizAssignments
);

// Unassign a specific user from a quiz
router.delete(
  '/admin/quizzes/:quizId/assign/:userId',
  unassignQuiz
);

export default router;
