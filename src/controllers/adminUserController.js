// src/controllers/adminUserController.js
import asyncHandler   from '../utils/asyncHandler.js';
import User           from '../models/User.js';
import QuizAttempt    from '../models/QuizAttempt.js';
import LoginHistory   from '../models/LoginHistory.js';

export const getUserHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // 1) Load user (omit password & tokens)
  const user = await User.findById(id)
    .select('-password -refreshTokens')
    .lean();
  if (!user) return res.status(404).json({ message: 'User not found.' });

  // 2) Load quiz attempts
  const quizAttempts = await QuizAttempt.find({ user: id })
    .populate('quiz', 'title category level')
    .sort({ createdAt: -1 })
    .lean();

  // 3) Load login history
  const loginHistory = await LoginHistory.find({ user: id })
    .sort({ at: -1 })
    .lean();

  // 4) Return combined payload
  res.json({ user, quizAttempts, loginHistory });
});
