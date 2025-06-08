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
  downloadAllTopics,
  getTestPopulatedQuizzes,

  // New Admin Reports APIs
  getDAUReport,
  getCategoryEngagement,
  getExportHistory,
  getAlerts,
  saveAlertConfig,
} from '../controllers/quizController.js';
import { getRecommendedQuizzes } from '../controllers/quizController.js';

import { protect, requireRole } from '../middlewares/authMiddleware.js';

const upload = multer(); // in-memory storage for CSV uploads
const router = express.Router();

// ──────────────────────────────────────────────────────────────
// Public routes (no authentication required)
// ──────────────────────────────────────────────────────────────

// Sidebar filters and grouped topics
router.get('/sidebar/filters', getSidebarFilters);
router.get('/grouped-topics', getGroupedTopics);

// Highlighted quizzes
router.get('/highlight/just-added', getJustAddedQuizzes);
router.get('/highlight/trending', getTrendingQuizzes);
router.get('/highlight/daily-spotlight', getDailySpotlight);

// Distinct lists for filters
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


// Add this test route
router.get('/test-quizzes', getTestPopulatedQuizzes);

// Public quizzes & leaderboard
router.get('/', getPublicQuizzes);
router.get('/leaderboard', getLeaderboard);
router.get('/:quizId/top-three', getQuizTopThree);



// Require login for accessing detailed quiz data & attempts
router.get('/:quizId', protect, getQuizById);
router.get('/attempts/:attemptId/stats', getAttemptStats);


// ──────────────────────────────────────────────────────────────
// Protected user routes (require authentication)
// ──────────────────────────────────────────────────────────────
router.get('/:quizId/recommended', protect, getRecommendedQuizzes); // protect = require login
router.post('/submit', protect, submitQuizAttempt);
router.get('/my-attempts', protect, getUserAttempts);
router.get('/attempts/:attemptId', protect, getAttemptById);

// ──────────────────────────────────────────────────────────────
// Admin / Creator routes (require roles: SUPERADMIN, ADMIN, CREATOR)
// ──────────────────────────────────────────────────────────────

router.use('/admin', protect, requireRole(['SUPERADMIN', 'ADMIN', 'CREATOR']));

// Quiz CSV Template & Bulk Upload
router.get('/admin/quizzes/:quizId/template', downloadQuestionsTemplate);
router.post('/admin/quizzes/bulk-upload-file', upload.single('file'), bulkUploadQuizzesFile);

// Quiz CRUD
router.post('/admin/quizzes', createQuiz);
router.get('/admin/quizzes', getAllQuizzes);
router.route('/admin/quizzes/:quizId')
  .get(getQuizById)
  .patch(updateQuiz)
  .delete(deleteQuiz);

// Question management
router.post('/admin/quizzes/:quizId/questions', addQuestionToQuiz);
router.post('/admin/quizzes/:quizId/bulk-upload', bulkUploadQuestions);
router.post('/admin/quizzes/:quizId/bulk-upload-file', upload.single('file'), bulkUploadFromFile);
router.get('/admin/quizzes/:quizId/questions', getQuestionsByQuiz);
router.route('/admin/quizzes/:quizId/questions/:questionId')
  .patch(updateQuestion)
  .delete(deleteQuestion);

// Quiz assignment
router.post('/admin/quizzes/:quizId/assign', assignQuiz);
router.get('/admin/quizzes/:quizId/assignments', getQuizAssignments);
router.delete('/admin/quizzes/:quizId/assign/:userId', unassignQuiz);

// CSV Data Exports
router.get('/admin/export/quizzes', downloadAllQuizzes);
router.get('/admin/export/categories', downloadAllCategories);
router.get('/admin/export/topics', downloadAllTopics);

// ──────────────────────────────────────────────────────────────
// New Admin Reports Routes
// ──────────────────────────────────────────────────────────────

// Daily Active Users report with date range filters
router.get('/admin/reports/dau', getDAUReport);

// Category Engagement report
router.get('/admin/reports/category-engagement', getCategoryEngagement);

// Export history logs
router.get('/admin/reports/export-history', getExportHistory);

// Alerts management: fetch active alerts
router.get('/admin/reports/alerts', getAlerts);

// Alerts management: save/update alert config
router.post('/admin/reports/alerts', saveAlertConfig);

export default router;
