// // src/routes/quizRoutes.js
// import express from 'express';
// import multer from 'multer';
// import asyncHandler from '../utils/asyncHandler.js';
// import Category from '../models/Category.js';
// import Topic from '../models/Topic.js';
// import Quiz from '../models/Quiz.js';

// import {
//   // Public controllers
//   getPublicQuizzes,
//   getJustAddedQuizzes,
//   getTrendingQuizzes,
//   getDailySpotlight,
//   getSidebarFilters,
//   getGroupedTopics,
//   getLeaderboard,
//   getQuizTopThree,
//   getAttemptStats,
//   getQuizById,

//   // User controllers
//   submitQuizAttempt,
//   getUserAttempts,
//   getAttemptById,

//   // Admin controllers
//   downloadQuestionsTemplate,
//   bulkUploadQuizzesFile,
//   createQuiz,
//   getAllQuizzes,
//   updateQuiz,
//   deleteQuiz,
//   addQuestionToQuiz,
//   bulkUploadQuestions,
//   bulkUploadFromFile,
//   getQuestionsByQuiz,
//   createQuestion,
//   updateQuestion,
//   deleteQuestion,
//   assignQuiz,
//   getQuizAssignments,
//   unassignQuiz,
// } from '../controllers/quizController.js';

// import { protect, requireRole } from '../middlewares/authMiddleware.js';

// const upload = multer(); // in-memory storage for CSV uploads
// const router = express.Router();


// // ───────────────────────────────────────────────────────────────────────────────
// // Public / “browse” routes (no auth required)
// // ───────────────────────────────────────────────────────────────────────────────

// // 1) Sidebar data
// router.get('/sidebar/filters', getSidebarFilters);
// router.get('/grouped-topics', getGroupedTopics);

// // 2) Highlights
// router.get('/highlight/just-added', getJustAddedQuizzes);
// router.get('/highlight/trending', getTrendingQuizzes);
// router.get('/highlight/daily-spotlight', getDailySpotlight);

// // 3) Distinct lists for sidebar select controls
// router.get(
//   '/distinct/category',
//   asyncHandler(async (_req, res) => {
//     const cats = await Category.find().select('_id name').sort('name');
//     res.json(cats);
//   })
// );
// router.get(
//   '/distinct/topic',
//   asyncHandler(async (_req, res) => {
//     const tops = await Topic.find().select('_id name').sort('name');
//     res.json(tops);
//   })
// );
// router.get(
//   '/distinct/level',
//   asyncHandler(async (_req, res) => {
//     const levels = await Quiz.distinct('level', { isActive: true });
//     res.json(levels);
//   })
// );

// // 4) Quiz listing & details
// router.get('/', getPublicQuizzes);
// router.get('/leaderboard', getLeaderboard);
// router.get('/:quizId/top-three', getQuizTopThree);
// router.get('/:quizId', protect, getQuizById);
// router.get('/attempts/:attemptId/stats', getAttemptStats);


// // ───────────────────────────────────────────────────────────────────────────────
// // Protected user routes (must be logged in)
// // ───────────────────────────────────────────────────────────────────────────────

// router.post('/submit', protect, submitQuizAttempt);
// router.get('/my-attempts', protect, getUserAttempts);
// router.get('/attempts/:attemptId', protect, getAttemptById);


// // ───────────────────────────────────────────────────────────────────────────────
// // Admin / Creator routes (must be SUPERADMIN | ADMIN | CREATOR)
// // all paths under “/admin” share these middlewares
// // ───────────────────────────────────────────────────────────────────────────────

// router.use(
//   '/admin',
//   protect,
//   requireRole(['SUPERADMIN', 'ADMIN', 'CREATOR'])
// );

// // 1) CSV template / bulk‐upload quizzes
// router.get(
//   '/admin/quizzes/:quizId/template',
//   downloadQuestionsTemplate
// );
// router.post(
//   '/admin/quizzes/bulk-upload-file',
//   upload.single('file'),
//   bulkUploadQuizzesFile
// );

// // 2) Quiz CRUD
// router.post('/admin/quizzes', createQuiz);
// router.get('/admin/quizzes', getAllQuizzes);
// router
//   .route('/admin/quizzes/:quizId')
//   .get(getQuizById)
//   .patch(updateQuiz)
//   .delete(deleteQuiz);

// // 3) Question management
// router.post(
//   '/admin/quizzes/:quizId/questions',
//   addQuestionToQuiz
// );
// router.post(
//   '/admin/quizzes/:quizId/bulk-upload',
//   bulkUploadQuestions
// );
// router.post(
//   '/admin/quizzes/:quizId/bulk-upload-file',
//   upload.single('file'),
//   bulkUploadFromFile
// );
// router.get(
//   '/admin/quizzes/:quizId/questions',
//   getQuestionsByQuiz
// );
// router
//   .route('/admin/quizzes/:quizId/questions/:questionId')
//   .patch(updateQuestion)
//   .delete(deleteQuestion);

// // 4) Quiz assignment
// router.post(
//   '/admin/quizzes/:quizId/assign',
//   assignQuiz
// );
// router.get(
//   '/admin/quizzes/:quizId/assignments',
//   getQuizAssignments
// );
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
  downloadAllQuizzes,
  downloadAllCategories,
  downloadAllTopics
} from '../controllers/quizController.js';

import { protect, requireRole } from '../middlewares/authMiddleware.js';

const upload = multer(); // in-memory storage for CSV uploads
const router = express.Router();


// ───────────────────────────────────────────────────────────────────────────────
// Public / “browse” routes (no auth required)
// ───────────────────────────────────────────────────────────────────────────────

// Sidebar filters and grouped topics
router.get('/sidebar/filters', getSidebarFilters);
router.get('/grouped-topics', getGroupedTopics);

// Highlighted content
router.get('/highlight/just-added', getJustAddedQuizzes);
router.get('/highlight/trending', getTrendingQuizzes);
router.get('/highlight/daily-spotlight', getDailySpotlight);

// Distinct field lists for UI filters
router.get('/distinct/category', asyncHandler(async (_req, res) => {
  const cats = await Category.find().select('_id name').sort('name');
  res.json(cats);
}));
router.get('/distinct/topic', asyncHandler(async (_req, res) => {
  const tops = await Topic.find().select('_id name').sort('name');
  res.json(tops);
}));
router.get('/distinct/level', asyncHandler(async (_req, res) => {
  const levels = await Quiz.distinct('level', { isActive: true });
  res.json(levels);
}));

// Public quizzes and leaderboard
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
// ───────────────────────────────────────────────────────────────────────────────

router.use('/admin', protect, requireRole(['SUPERADMIN', 'ADMIN', 'CREATOR']));

// Admin: CSV Template & Bulk Upload
router.get('/admin/quizzes/:quizId/template', downloadQuestionsTemplate);
router.post('/admin/quizzes/bulk-upload-file', upload.single('file'), bulkUploadQuizzesFile);

// Admin: Quiz CRUD
router.post('/admin/quizzes', createQuiz);
router.get('/admin/quizzes', getAllQuizzes);
router.route('/admin/quizzes/:quizId')
  .get(getQuizById)
  .patch(updateQuiz)
  .delete(deleteQuiz);

// Admin: Question management
router.post('/admin/quizzes/:quizId/questions', addQuestionToQuiz);
router.post('/admin/quizzes/:quizId/bulk-upload', bulkUploadQuestions);
router.post('/admin/quizzes/:quizId/bulk-upload-file', upload.single('file'), bulkUploadFromFile);
router.get('/admin/quizzes/:quizId/questions', getQuestionsByQuiz);
router.route('/admin/quizzes/:quizId/questions/:questionId')
  .patch(updateQuestion)
  .delete(deleteQuestion);

// Admin: Quiz assignment
router.post('/admin/quizzes/:quizId/assign', assignQuiz);
router.get('/admin/quizzes/:quizId/assignments', getQuizAssignments);
router.delete('/admin/quizzes/:quizId/assign/:userId', unassignQuiz);

// Admin: CSV Downloads
router.get('/admin/export/quizzes', downloadAllQuizzes);
router.get('/admin/export/categories', downloadAllCategories);
router.get('/admin/export/topics', downloadAllTopics);


export default router;
