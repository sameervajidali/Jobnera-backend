import { z } from 'zod';

// ─── Re-export question-related validators for convenience ───────────────
export {
  submitAttemptSchema,
  bulkQuestionsSchema,
  addQuestionSchema,
} from './questionValidator.js';

// ─── Validate :quizId URL parameter ───────────────────────────────────────
export const idParamSchema = z.object({
  quizId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid quizId'),
});

// ─── Validate :attemptId URL parameter ────────────────────────────────────
export const attemptParamSchema = z.object({
  attemptId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid attemptId'),
});

// ─── Create Quiz Payload Validation ───────────────────────────────────────
export const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required'),

  category: z.string().min(1, 'Category is required'),

  topic: z.string().min(1, 'Topic is required'),

  level: z.enum(['Beginner', 'Intermediate', 'Expert'], 'Invalid level'),

  duration: z.number().int().positive('Duration must be positive'),

  totalMarks: z.number().int().nonnegative('Total marks must be ≥ 0'),

  isActive: z.boolean().optional(),
});

// ─── Update Quiz Payload (all fields optional) ────────────────────────────
// Use partial() to make all fields optional for update endpoints
export const updateQuizSchema = createQuizSchema.partial();

// ─── Public Leaderboard Query Parameters Validation ──────────────────────
export const publicLeaderboardSchema = z.object({
  category: z.string().optional(),

  topic: z.string().optional(),

  // level can be empty string (treated as undefined) or valid enum
  level: z
    .union([z.enum(['Beginner', 'Intermediate', 'Expert']), z.literal('')])
    .transform(val => val === '' ? undefined : val)
    .optional(),

  timePeriod: z.enum(['week', 'month', 'all-time']).default('all-time'),

  // Pagination params come as strings from query, so we transform to number
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),

  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
});
