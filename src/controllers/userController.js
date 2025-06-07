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

  function parseDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d) ? null : d;
  }

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if ((startDate && !start) || (endDate && !end)) {
    return res.status(400).json({ message: 'Invalid date filter' });
  }

  const dateFilter = {};
  if (start) dateFilter.$gte = start;
  if (end) dateFilter.$lte = end;

  const attemptQuery = { user: userId };
  if (start || end) attemptQuery.createdAt = dateFilter;

  // Run DB queries in parallel
  const [bookmarks, attempts, assignments, materials] = await Promise.all([
    Bookmark.find({ user: userId }).populate('quiz', 'title category topic level').lean(),
    QuizAttempt.find(attemptQuery).populate('quiz', 'title duration level category topic').sort({ createdAt: -1 }).lean(),
    QuizAssignment.find({ user: userId }).populate({
      path: 'quiz',
      select: 'title category topic level duration',
      populate: [{ path: 'category', select: 'name' }, { path: 'topic', select: 'name' }]
    }).lean(),
    LearningMaterial.find({ assignedTo: userId }).select('title type url assignedAt').sort({ assignedAt: -1 }).lean()
  ]);

  const history = attempts.map(a => ({
    quizId: a.quiz._id,
    title: a.quiz.subTopic.name,
    score: a.score,
    correct: a.correctAnswers,
    totalQs: a.totalQuestions,
    timeTaken: a.timeTaken,
    attemptedAt: a.createdAt,
  }));

  res.json({
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      joined: req.user.createdAt,
    },
    bookmarks: bookmarks.map(b => b.quiz),
    attempts,
    assignments: assignments.map(a => a.quiz),
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
  const { id } = req.params;

  // 1) Validate the ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  // 2) Load & populate the user, including role.name
  const user = await User.findById(id)
    .select('name email role isVerified createdAt')
    .populate('role', 'name');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // 3) Optionally filter by date if you pass startDate/endDate query params…
  const { startDate, endDate } = req.query;
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate)   dateFilter.$lte = new Date(endDate);

  // 4) Fetch that user’s quiz attempts, populating quiz.title
  const attemptFilter = { user: id };
  if (startDate || endDate) {
    attemptFilter.createdAt = dateFilter;
  }
  const quizAttempts = await QuizAttempt.find(attemptFilter)
    .populate('quiz', 'title')
    .sort({ createdAt: -1 });

  // 5) (Optional) also fetch login history
  const loginFilter = { user: id };
  if (startDate || endDate) {
    loginFilter.at = dateFilter; // adjust to your schema field name
  }
  const loginHistory = await LoginHistory.find(loginFilter)
    .select('at ip city region country success')
    .sort({ at: -1 });

  // 6) Return them in one JSON
  res.json({ user, quizAttempts, loginHistory });
});