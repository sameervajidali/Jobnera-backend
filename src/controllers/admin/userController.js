// src/controllers/admin/userController.js
import asyncHandler from '../../utils/asyncHandler.js';
import User         from '../../models/User.js';
import QuizAttempt  from '../../models/QuizAttempt.js';
import LoginHistory from '../../models/LoginHistory.js';

export const getUserHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select('-password').lean();
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const quizAttempts = await QuizAttempt
    .find({ user: id })
    .populate('quiz', 'title category level')
    .sort({ createdAt: -1 })
    .lean();

  const loginHistory = await LoginHistory
    .find({ user: id })
    .sort({ at: -1 })
    .lean();

  res.json({ user, quizAttempts, loginHistory });
});
