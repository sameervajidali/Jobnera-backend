// src/controllers/adminUserController.js
import asyncHandler from '../../utils/asyncHandler.js';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import QuizAttempt from '../../models/QuizAttempt.js';
import LoginHistory from '../../models/LoginHistory.js';

export const getUserHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 0) Validate user ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  // 1) Load user (omit sensitive fields) and populate role.name
  const user = await User.findById(id)
    .select('-password -refreshTokens')
    .populate('role', 'name')
    .lean();
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  // 2) Load quiz attempts with quiz title and totalQuestions
  const quizAttempts = await QuizAttempt.find({ user: id })
    .populate('quiz', 'title totalQuestions')
    .sort({ createdAt: -1 })
    .lean();

  // 3) Load login history (assumes field 'at' stores timestamp)
  const loginHistory = await LoginHistory.find({ user: id })
    .sort({ at: -1 })
    .lean();

  // 4) Return combined payload with populated role and quiz data
  res.json({ user, quizAttempts, loginHistory });
});
