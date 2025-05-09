// src/controllers/dashboardController.js
import asyncHandler from '../utils/asyncHandler.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';
import Certificate from '../models/Certificate.js';  // or whatever model you use

export const getDashboardStats = asyncHandler(async (req, res) => {
  // 1) total job matches — if you have a JobMatch model
  // const jobMatches = await JobMatch.countDocuments({ user: req.user._id });

  // If “job matches” is something you compute, replace the above.
  // For demo purposes let’s just return total users:
  const totalUsers = await User.countDocuments();

  // 2) quizzes completed by this user
  const quizzesCompleted = await QuizAttempt.countDocuments({ user: req.user._id });

  // 3) resume score – if you store it on the user object
  const resumeScore = req.user.resumeScore ?? 0;

  // 4) certificates earned – if you have a Certificate model
  const certificates = await Certificate.countDocuments({ user: req.user._id });

  res.json({
    jobMatches: totalUsers,        // ← swap with your real value
    quizzesCompleted,
    resumeScore,
    certificates,
  });
});
