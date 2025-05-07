// src/validators/quizValidator.js
import { z } from 'zod';
import {
  submitAttemptSchema,
  bulkQuestionsSchema,
  addQuestionSchema,
  getLeaderboardSchema
} from './questionValidator.js';

// Validate :quizId param
export const idParamSchema = z.object({
  quizId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid quizId'),
});

// Create Quiz
export const createQuizSchema = z.object({
  title:      z.string().min(1, 'Title is required'),
  category:   z.string().min(1, 'Category is required'),
  topic:      z.string().min(1, 'Topic is required'),
  level:      z.enum(['Beginner','Intermediate','Expert'], 'Invalid level'),
  duration:   z.number().int().positive('Duration must be positive'),
  totalMarks: z.number().int().nonnegative('Total marks must be ≥0'),
  isActive:   z.boolean().optional(),
});

// Update Quiz (all fields optional)
export const updateQuizSchema = createQuizSchema.partial();

// Re-export question & leaderboard validators
export {
  submitAttemptSchema,
  bulkQuestionsSchema,
  addQuestionSchema,
  getLeaderboardSchema
};
