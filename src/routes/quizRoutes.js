// // src/routes/quizRoutes.js

// import express from 'express';
// import multer from 'multer';
// import {
//   submitQuizAttempt,
//   getLeaderboard,
//   getUserAttempts,
//   downloadQuestionsTemplate,
//   createQuiz,
//   getAllQuizzes,
//   getQuizById,
//   updateQuiz,
//   addQuestionToQuiz,
//   bulkUploadQuestions,
//   bulkUploadFromFile,
//   getQuestionsByQuiz,
//   createQuestion,
//   updateQuestion,
//   deleteQuestion,
//   assignQuiz,
//   getPublicQuizzes,
//   getQuizAssignments,
//   getDistinctValues,
//   unassignQuiz
// } from '../controllers/quizController.js';
// import { protect, requireRole } from '../middlewares/authMiddleware.js';

// const upload = multer();  // memory storage for CSV uploads
// const router = express.Router();

// // ─── Public Routes ────────────────────────────────────────────────────────────


// // Public distinct endpoints under /api/quizzes/distinct/…
// router.get('/distinct/category', getDistinctValues('category'));
// router.get('/distinct/topic',    getDistinctValues('topic'));
// router.get('/distinct/level', getDistinctValues('level'));

// router.get(
//   '/',
//   getPublicQuizzes
// );

// router.get('/:quizId', getQuizById);

// // 🏆 Public leaderboard (anybody)
// router.get('/leaderboard', getLeaderboard);

// // ─── Protected User Routes ────────────────────────────────────────────────────

// // ✏️ Submit a quiz attempt
// router.post('/submit', protect, submitQuizAttempt);

// // 📖 View your own quiz attempts
// router.get('/my-attempts', protect, getUserAttempts);

// // ─── Admin / Creator Routes ───────────────────────────────────────────────────

// // All routes under `/admin` require authentication + one of these roles:
// router.use('/admin', protect, requireRole(['SUPERADMIN', 'ADMIN', 'CREATOR']));

// // 📥 Download CSV template pre-filled with this quiz’s topic & level
// router.get(
//   '/admin/quizzes/:quizId/template',
//   downloadQuestionsTemplate
// );

// // ➕ Create a new quiz
// router.post(
//   '/admin/quizzes',
//   createQuiz
// );

// // 📚 List all quizzes
// router.get(
//   '/admin/quizzes',
//   getAllQuizzes
// );

// // 📝 Get or update a specific quiz
// router
//   .route('/admin/quizzes/:quizId')
//   .get(getQuizById)    // fetch quiz metadata + questions
//   .patch(updateQuiz);  // update quiz fields (title, category, etc.)

// // ➕ Add a single question to a quiz
// router.post(
//   '/admin/quizzes/:quizId/questions',
//   addQuestionToQuiz
// );

// // 📥 Bulk-upload questions via JSON
// router.post(
//   '/admin/quizzes/:quizId/bulk-upload',
//   bulkUploadQuestions
// );

// // 📤 Bulk-upload questions via CSV/XLSX file
// router.post(
//   '/admin/quizzes/:quizId/bulk-upload-file',
//   upload.single('file'),
//   bulkUploadFromFile
// );

// // ─── Question CRUD for a Given Quiz ──────────────────────────────────────────

// // 📖 List all questions for this quiz
// router.get(
//   '/admin/quizzes/:quizId/questions',
//   getQuestionsByQuiz
// );

// // ➕ Create a new question under this quiz
// router.post(
//   '/admin/quizzes/:quizId/questions',
//   createQuestion
// );

// // 📝 Update or delete a specific question
// router
//   .route('/admin/quizzes/:quizId/questions/:questionId')
//   .patch(updateQuestion)
//   .delete(deleteQuestion);

// // List who’s assigned to this quiz
// // POST   /api/quizzes/admin/quizzes/:quizId/assign
// router.post('/admin/quizzes/:quizId/assign', assignQuiz);

// // GET    /api/quizzes/admin/quizzes/:quizId/assignments
// router.get('/admin/quizzes/:quizId/assignments', getQuizAssignments);

// // DELETE /api/quizzes/admin/quizzes/:quizId/assign/:userId
// router.delete('/admin/quizzes/:quizId/assign/:userId', unassignQuiz);


// export default router;




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
  updateQuestion,
  deleteQuestion,
  assignQuiz,
  getQuizAssignments,
  getDistinctValues,
  unassignQuiz
} from '../controllers/quizController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';

const upload = multer();  // memory storage for CSV uploads
const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────────────────

// Distinct-value endpoints for sidebar filters
router.get('/distinct/category', getDistinctValues('category'));
router.get('/distinct/topic',    getDistinctValues('topic'));
router.get('/distinct/level',    getDistinctValues('level'));

// List all active quizzes (paginated + filterable)
router.get('/', getPublicQuizzes);

// Fetch a single quiz (requires login)
router.get('/:quizId', protect, getQuizById);

// Public leaderboard (any visitor)
router.get('/leaderboard', getLeaderboard);

// ─── Protected User Routes ────────────────────────────────────────────────────

// Submit a quiz attempt
router.post('/submit', protect, submitQuizAttempt);

// View your own quiz attempt history
router.get('/my-attempts', protect, getUserAttempts);

// ─── Admin / Creator Routes ────────────────────────────────────────────────────

// All under /admin require SUPERADMIN, ADMIN, or CREATOR
router.use('/admin', protect, requireRole(['SUPERADMIN', 'ADMIN', 'CREATOR']));

// Download a CSV template pre-filled with this quiz’s topic & level
router.get(
  '/admin/quizzes/:quizId/template',
  downloadQuestionsTemplate
);

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
