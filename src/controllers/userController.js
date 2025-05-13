import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Quiz          from '../models/Quiz.js';
import QuizAttempt   from '../models/QuizAttempt.js';
import Bookmark      from '../models/Bookmark.js';
import QuizAssignment from '../models/QuizAssignment.js';
import LearningMaterial from '../models/Material.js'; // assume you’ve defined this
import User          from '../models/User.js';

/**
 * GET /api/user/dashboard
 * Aggregate all user data in one payload:
 * - bookmarked quizzes
 * - attempted quizzes
 * - assigned quizzes
 * - assigned learning materials
 * - full quiz history (with optional date filters)
 */
export const getUserDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { startDate, endDate } = req.query;
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate)   dateFilter.$lte = new Date(endDate);

  // 1) Bookmarks
  const bookmarks = await Bookmark.find({ user: userId })
    .populate('quiz', 'title category topic level');

  // 2) Attempts (with optional date filtering)
  const attemptQuery = { user: userId };
  if (startDate || endDate) attemptQuery.createdAt = dateFilter;
  const attempts = await QuizAttempt.find(attemptQuery)
    .populate('quiz', 'title duration level category topic')
    .sort({ createdAt: -1 });

  // 3) Assigned quizzes
  const assignments = await QuizAssignment.find({ user: userId })
    .populate({
      path: 'quiz',
      select: 'title category topic level duration',
      populate: [
        { path: 'category', select: 'name' },
        { path: 'topic',    select: 'name' }
      ]
    });

  // 4) Learning materials (e.g. articles or PDFs assigned by admin)
  const materials = await LearningMaterial.find({ assignedTo: userId })
    .select('title type url assignedAt')
    .sort({ assignedAt: -1 });

  // 5) Full quiz history summary
  const history = attempts.map(a => ({
    quizId:      a.quiz._id,
    title:       a.quiz.title,
    score:       a.score,
    correct:     a.correctAnswers,
    totalQs:     a.totalQuestions,
    timeTaken:   a.timeTaken,
    attemptedAt: a.createdAt,
  }));

  res.json({
    user: {
      _id:    req.user._id,
      name:   req.user.name,
      email:  req.user.email,
      joined: req.user.createdAt,
    },
    bookmarks:    bookmarks.map(b => b.quiz),
    attempts,
    assignments:  assignments.map(a => a.quiz),
    materials,
    history,
  });
});


/**
 * GET /api/user/bookmarks
 */
export const getUserBookmarks = asyncHandler(async (req, res) => {
  const list = await Bookmark.find({ user: req.user._id })
    .populate('quiz', 'title category topic level');
  res.json(list.map(b => b.quiz));
});

/**
 * GET /api/user/attempts
 */
export const getUserAttempts = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({ user: req.user._id })
    .populate('quiz', 'title duration level')
    .sort({ createdAt: -1 });
  res.json(attempts);
});

/**
 * GET /api/user/assignments
 */
export const getUserAssignments = asyncHandler(async (req, res) => {
  const assigns = await QuizAssignment.find({ user: req.user._id })
    .populate({
      path: 'quiz',
      select: 'title category topic level',
      populate: [{ path: 'category', select: 'name' }, { path: 'topic', select: 'name' }]
    });
  res.json(assigns.map(a => a.quiz));
});

/**
 * GET /api/user/materials
 */
export const getUserMaterials = asyncHandler(async (req, res) => {
  const mats = await LearningMaterial.find({ assignedTo: req.user._id })
    .select('title type url assignedAt');
  res.json(mats);
});

/**
 * GET /api/user/history
 * Optional query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getUserHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { startDate, endDate } = req.query;
  const filter = { user: userId };
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate)   filter.createdAt.$lte = new Date(endDate);
  }
  const attempts = await QuizAttempt.find(filter)
    .populate('quiz', 'title')
    .sort({ createdAt: -1 });
  res.json(attempts);
});
