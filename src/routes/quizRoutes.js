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
//   getPublicQuizzes,
//   getQuizById,
//   updateQuiz,
//   addQuestionToQuiz,
//   bulkUploadQuestions,
//   bulkUploadFromFile,
//   getQuestionsByQuiz,
//   createQuestion,
//   getAttemptById,
//   updateQuestion,
//   deleteQuestion,
//   assignQuiz,
//   getQuizTopThree,
//   getAttemptStats,
//   getQuizAssignments,
//   getDistinctValues,
//   getGroupedTopics,
//   bulkUploadQuizzesFile,
//   unassignQuiz,
//   getJustAddedQuizzes,
//   getTrendingQuizzes,
//   getDailySpotlight,
//   getSidebarFilters,
//   deleteQuiz,
// } from '../controllers/quizController.js';
// import { protect, requireRole } from '../middlewares/authMiddleware.js';

// const upload = multer();  // memory storage for CSV uploads
// const router = express.Router();

// router.get('/sidebar/filters' , getSidebarFilters);
// router.get('/grouped-topics'  , getGroupedTopics);
// router.get('/'                , getPublicQuizzes);

// import asyncHandler from '../utils/asyncHandler.js';
// import Category from '../models/Category.js';
// import Topic    from '../models/Topic.js';
// import Quiz from '../models/Quiz.js';




// // GET /api/quizzes/distinct/category
// router.get('/distinct/category', asyncHandler(async (_req, res) => {
//   const cats = await Category.find()
//     .select('_id name')
//     .sort('name');
//   res.json(cats);
// }));

// // GET /api/quizzes/distinct/topic
// router.get('/distinct/topic', asyncHandler(async (_req, res) => {
//   const tops = await Topic.find()
//     .select('_id name')
//     .sort('name');
//   res.json(tops);
// }));

// // GET /api/quizzes/distinct/level
// router.get('/distinct/level', asyncHandler(async (_req, res) => {
//   const levels = await Quiz.distinct('level', { isActive: true });
//   res.json(levels);
// }));



// router.get('/highlight/just-added',   getJustAddedQuizzes);
// router.get('/highlight/trending',     getTrendingQuizzes);
// router.get('/highlight/daily-spotlight', getDailySpotlight);

// // … the rest of your /quizzes routes …


// // ─── Public Routes ────────────────────────────────────────────────────────────

// // Distinct-value endpoints for sidebar filters
// router.get('/distinct/category', getDistinctValues('category'));
// router.get('/distinct/topic', getDistinctValues('topic'));
// router.get('/distinct/level', getDistinctValues('level'));




// // Public leaderboard (any visitor)
// router.get('/leaderboard', getLeaderboard);
// // Public/top-three
// router.get('/:quizId/top-three', getQuizTopThree);

// router.get('/attempts/:attemptId/stats', getAttemptStats);
// // Fetch a single quiz (requires login)
// router.get('/:quizId', protect, getQuizById);


// // ─── Protected User Routes ────────────────────────────────────────────────────

// // Submit a quiz attempt
// router.post('/submit',     protect, submitQuizAttempt);
// router.get('/my-attempts', protect, getUserAttempts);
// router.get('/attempts/:attemptId',             protect, getAttemptById);
// //router.get('/attempts/:attemptId/stats',       protect, getAttemptStats);
// //router.get('/:quizId/top-three',               protect, getQuizTopThree);

// // ─── Admin / Creator Routes ────────────────────────────────────────────────────

// // All under /admin require SUPERADMIN, ADMIN, or CREATOR
// router.use('/admin', protect, requireRole(['SUPERADMIN', 'ADMIN', 'CREATOR']));

// // Download a CSV template pre-filled with this quiz’s topic & level
// router.get(
//   '/admin/quizzes/:quizId/template',
//   downloadQuestionsTemplate
// );

// // **Bulk‐upload an entire CSV of quizzes:**
// // POST /api/quizzes/admin/quizzes/bulk-upload-file
// // Bulk-create *quizzes* via CSV/XLSX:
// router.post(
//   '/admin/quizzes/bulk-upload-file',    // <-- note the “-file”
//   upload.single('file'),
//   bulkUploadQuizzesFile
// )

// // Create a new quiz
// router.post('/admin/quizzes', createQuiz);

// // List all quizzes (admin view)
// router.get('/admin/quizzes', getAllQuizzes);

// // Get or update a specific quiz
// router
//   .route('/admin/quizzes/:quizId')
//   .get(getQuizById)
//   .patch(updateQuiz)
//   .delete(deleteQuiz);


// // Add a single question to a quiz
// router.post(
//   '/admin/quizzes/:quizId/questions',
//   addQuestionToQuiz
// );

// // Bulk-upload questions via JSON
// router.post(
//   '/admin/quizzes/:quizId/bulk-upload',
//   bulkUploadQuestions
// );

// // Bulk-upload questions via CSV/XLSX file
// router.post(
//   '/admin/quizzes/:quizId/bulk-upload-file',
//   upload.single('file'),
//   bulkUploadFromFile
// );

// // ─── Question CRUD for a Given Quiz ──────────────────────────────────────────

// // List all questions for this quiz
// router.get(
//   '/admin/quizzes/:quizId/questions',
//   getQuestionsByQuiz
// );

// // Create a new question under this quiz
// router.post(
//   '/admin/quizzes/:quizId/questions',
//   createQuestion
// );

// // Update or delete a specific question
// router
//   .route('/admin/quizzes/:quizId/questions/:questionId')
//   .patch(updateQuestion)
//   .delete(deleteQuestion);

// // ─── Quiz Assignment Management ───────────────────────────────────────────────

// // Assign one or more users to a quiz
// router.post(
//   '/admin/quizzes/:quizId/assign',
//   assignQuiz
// );

// // List all current assignments for a quiz
// router.get(
//   '/admin/quizzes/:quizId/assignments',
//   getQuizAssignments
// );

// // Unassign a specific user from a quiz
// router.delete(
//   '/admin/quizzes/:quizId/assign/:userId',
//   unassignQuiz
// );

// export default router;



// src/routes/quizRoutes.js
import express from 'express';
import multer from 'multer';
import asyncHandler from '../utils/asyncHandler.js';
import Category from '../models/Category.js';
import Topic from '../models/Topic.js';
import Quiz from '../models/Quiz.js';

import {
  // Public controllers
  getPublicQuizzes,
  getJustAddedQuizzes,
  getTrendingQuizzes,
  getDailySpotlight,
  getSidebarFilters,
  getGroupedTopics,
  getLeaderboard,
  getQuizTopThree,
  getAttemptStats,
  getQuizById,

  // User controllers
  submitQuizAttempt,
  getUserAttempts,
  getAttemptById,

  // Admin controllers
  downloadQuestionsTemplate,
  bulkUploadQuizzesFile,
  createQuiz,
  getAllQuizzes,
  updateQuiz,
  deleteQuiz,
  addQuestionToQuiz,
  bulkUploadQuestions,
  bulkUploadFromFile,
  getQuestionsByQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  assignQuiz,
  getQuizAssignments,
  unassignQuiz,
} from '../controllers/quizController.js';

import { protect, requireRole } from '../middlewares/authMiddleware.js';

const upload = multer(); // in-memory storage for CSV uploads
const router = express.Router();


// ───────────────────────────────────────────────────────────────────────────────
// Public / “browse” routes (no auth required)
// ───────────────────────────────────────────────────────────────────────────────

// 1) Sidebar data
router.get('/sidebar/filters', getSidebarFilters);
router.get('/grouped-topics', getGroupedTopics);

// 2) Highlights
router.get('/highlight/just-added', getJustAddedQuizzes);
router.get('/highlight/trending', getTrendingQuizzes);
router.get('/highlight/daily-spotlight', getDailySpotlight);

// 3) Distinct lists for sidebar select controls
router.get(
  '/distinct/category',
  asyncHandler(async (_req, res) => {
    const cats = await Category.find().select('_id name').sort('name');
    res.json(cats);
  })
);
router.get(
  '/distinct/topic',
  asyncHandler(async (_req, res) => {
    const tops = await Topic.find().select('_id name').sort('name');
    res.json(tops);
  })
);
router.get(
  '/distinct/level',
  asyncHandler(async (_req, res) => {
    const levels = await Quiz.distinct('level', { isActive: true });
    res.json(levels);
  })
);

// 4) Quiz listing & details
router.get('/', getPublicQuizzes);
router.get('/leaderboard', getLeaderboard);
router.get('/:quizId/top-three', getQuizTopThree);
router.get('/:quizId', protect, getQuizById);
router.get('/attempts/:attemptId/stats', getAttemptStats);


// ───────────────────────────────────────────────────────────────────────────────
// Protected user routes (must be logged in)
// ───────────────────────────────────────────────────────────────────────────────

router.post('/submit', protect, submitQuizAttempt);
router.get('/my-attempts', protect, getUserAttempts);
router.get('/attempts/:attemptId', protect, getAttemptById);


// ───────────────────────────────────────────────────────────────────────────────
// Admin / Creator routes (must be SUPERADMIN | ADMIN | CREATOR)
// all paths under “/admin” share these middlewares
// ───────────────────────────────────────────────────────────────────────────────

router.use(
  '/admin',
  protect,
  requireRole(['SUPERADMIN', 'ADMIN', 'CREATOR'])
);

// 1) CSV template / bulk‐upload quizzes
router.get(
  '/admin/quizzes/:quizId/template',
  downloadQuestionsTemplate
);
router.post(
  '/admin/quizzes/bulk-upload-file',
  upload.single('file'),
  bulkUploadQuizzesFile
);

// 2) Quiz CRUD
router.post('/admin/quizzes', createQuiz);
router.get('/admin/quizzes', getAllQuizzes);
router
  .route('/admin/quizzes/:quizId')
  .get(getQuizById)
  .patch(updateQuiz)
  .delete(deleteQuiz);

// 3) Question management
router.post(
  '/admin/quizzes/:quizId/questions',
  addQuestionToQuiz
);
router.post(
  '/admin/quizzes/:quizId/bulk-upload',
  bulkUploadQuestions
);
router.post(
  '/admin/quizzes/:quizId/bulk-upload-file',
  upload.single('file'),
  bulkUploadFromFile
);
router.get(
  '/admin/quizzes/:quizId/questions',
  getQuestionsByQuiz
);
router
  .route('/admin/quizzes/:quizId/questions/:questionId')
  .patch(updateQuestion)
  .delete(deleteQuestion);

// 4) Quiz assignment
router.post(
  '/admin/quizzes/:quizId/assign',
  assignQuiz
);
router.get(
  '/admin/quizzes/:quizId/assignments',
  getQuizAssignments
);
router.delete(
  '/admin/quizzes/:quizId/assign/:userId',
  unassignQuiz
);


export default router;
