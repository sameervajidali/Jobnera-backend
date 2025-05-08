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

// ─── Single Question Shape ────────────────────────────────────────────────────
export const addQuestionSchema = z.object({
  text:         z.string().min(1, 'Question text is required'),
  options:      z
                   .array(z.string().min(1), 'Option text is required')
                   .length(4, 'Exactly 4 options are required'),
  correctIndex: z.number().int().gte(0).lte(3),
  topicTag:     z.string().optional(),
  explanation:  z.string().optional(),
});

// For bulk upload
export const bulkQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      text:         z.string().min(1),
      options:      z.array(z.string().min(1)).length(4),
      correctIndex: z.number().int().min(0).max(3),
      topicTag:     z.string().optional(),
      explanation:  z.string().optional(),
      difficulty:   z.enum(['easy','medium','hard']).optional()
    })
  ).min(1),
});

