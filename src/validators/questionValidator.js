// src/validators/questionValidator.js
import { z } from 'zod';

// ─── Submit Quiz Attempt ─────────────────────────────────────────────────────
export const submitAttemptSchema = z.object({
  quizId:    z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid quizId'),
  timeTaken: z.number().min(0, 'timeTaken must be non-negative'),
  answers: z
    .record(
      z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid question ID'),
      z.number().int().min(0, 'Answer index must be ≥ 0')
    )
    .refine(obj => Object.keys(obj).length >= 1, {
      message: 'Answers object cannot be empty',
    }),
});

// ─── Add Single Question ──────────────────────────────────────────────────────
export const addQuestionSchema = z.object({
  text:         z.string().min(1, 'Question text is required'),
  options:      z.array(z.string().min(1)).length(4, 'Exactly 4 options'),
  correctIndex: z.number().int().gte(0).lte(3),
  topicTag:     z.string().optional(),
  explanation:  z.string().optional(),
});

export const bulkQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      text:         z.string().min(1, 'Question text is required'),
      options:      z.array(z.string().min(1, 'Option text is required'))
                         .length(4, 'Exactly 4 options are required'),
      correctIndex: z.number().int()
                         .gte(0, 'correctIndex must be between 0 and 3')
                         .lte(3, 'correctIndex must be between 0 and 3'),
      topicTag:     z.string().optional(),
      explanation:  z.string().optional(),
    })
  ).min(1, 'At least one question is required')
});

// ─── Leaderboard Query Params ─────────────────────────────────────────────────
export const getLeaderboardSchema = z.object({
  category:   z.string().min(1, 'Category is required'),
  topic:      z.string().optional(),
  level:      z.enum(['Beginner','Intermediate','Expert']).optional(),
  timePeriod: z.enum(['week','month','all-time']).default('all-time'),
});
