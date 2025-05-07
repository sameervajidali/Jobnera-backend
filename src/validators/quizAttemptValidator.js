import { z } from 'zod';

// ─── Submit Quiz Attempt Input ─────────────────────────────────────────────────
// Already defined in questionValidator, re-export here for clarity
export const submitAttemptSchema = z.object({
  quizId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid quizId'),
  timeTaken: z.number().min(0, 'timeTaken must be non-negative'),
  answers: z.record(
    z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid question ID'),
    z.number().int().min(0, 'Answer index must be ≥ 0')
  ).min(1, 'Answers object cannot be empty')
});

// ─── QuizAttempt Model Schema ───────────────────────────────────────────────────
export const quizAttemptModelSchema = z.object({
  _id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid attempt ID'),
  user: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  quiz: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid quiz ID'),
  score: z.number().int().nonnegative(),
  totalQuestions: z.number().int().positive(),
  correctAnswers: z.number().int().nonnegative(),
  answers: z.array(z.object({
    question: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid question ID'),
    selectedIndex: z.number().int().min(0).optional(),
    isCorrect: z.boolean().optional()
  })),
  timeTaken: z.number().min(0).optional(),
  submittedAt: z.date().optional(),
  rankSnapshot: z.number().nonnegative().optional(),
  weakTopics: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
