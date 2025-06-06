import { z } from 'zod';

// ─── Submit Quiz Attempt Validation ────────────────────────────────────────
export const submitAttemptSchema = z.object({
  // MongoDB ObjectId string validation for quiz ID
  quizId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid quizId'),

  // Time taken in seconds or milliseconds (non-negative)
  timeTaken: z.number().min(0, 'timeTaken must be non-negative'),

  // Answers map: questionId -> selected option index
  answers: z
    .record(
      z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid question ID'),
      z.number().int().min(0, 'Answer index must be ≥ 0')
    )
    .refine(obj => Object.keys(obj).length >= 1, {
      message: 'Answers object cannot be empty',
    }),
});

// ─── Single Question Validation ─────────────────────────────────────────────
export const addQuestionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),

  // Exactly 4 answer options, each non-empty string
  options: z
    .array(z.string().min(1), 'Option text is required')
    .length(4, 'Exactly 4 options are required'),

  // Correct answer index: integer between 0 and 3 inclusive
  correctIndex: z.number().int().gte(0).lte(3),

  // Optional fields
  topicTag: z.string().optional(),
  explanation: z.string().optional(),
});

// ─── Bulk Questions Upload Validation ───────────────────────────────────────
export const bulkQuestionsSchema = z.array(
  z.object({
    text: z.string().min(1),
    options: z.array(z.string().min(1)).length(4),
    correctIndex: z.number().int().min(0).max(3),
    topicTag: z.string().optional(),
    explanation: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  })
);
