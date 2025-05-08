// // src/validators/quizValidator.js
// import { z } from 'zod';
// import {
//   submitAttemptSchema,
//   bulkQuestionsSchema,
//   addQuestionSchema,
//   getLeaderboardSchema,
//  } from './questionValidator.js';

// // Validate :quizId param
// export const idParamSchema = z.object({
//   quizId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid quizId'),
// });


// export const attemptParamSchema = z.object({
//   attemptId: z.string()
//     .regex(/^[0-9a-fA-F]{24}$/, 'Invalid attemptId')
// });

// // Create Quiz
// export const createQuizSchema = z.object({
//   title:      z.string().min(1, 'Title is required'),
//   category:   z.string().min(1, 'Category is required'),
//   topic:      z.string().min(1, 'Topic is required'),
//   level:      z.enum(['Beginner','Intermediate','Expert'], 'Invalid level'),
//   duration:   z.number().int().positive('Duration must be positive'),
//   totalMarks: z.number().int().nonnegative('Total marks must be ≥0'),
//   isActive:   z.boolean().optional(),
// });



// export const getLeaderboard = asyncHandler(async (req, res) => {
//   // 1️⃣ Parse & validate the entire set of query params
//   const { category, topic, level, timePeriod, page, limit } =
//     publicLeaderboardSchema.parse(req.query);

//   // 2️⃣ Build your Mongo filter
//   const filter = {};
//   if (category) filter.category = category;
//   if (topic)    filter.topic    = topic;
//   if (level)    filter.level    = level;
//   if (timePeriod === 'week') {
//     filter.lastUpdated = { $gte: new Date(Date.now() - 7*24*60*60*1000) };
//   }

//   // 3️⃣ Query & sort
//   const skip = (page - 1) * limit;
//   const entries = await LeaderboardEntry.find(filter)
//     .sort({ score: -1 })
//     .skip(skip)
//     .limit(limit)
//     .populate('user', 'name avatar');

//   // 4️⃣ Respond
//   res.json({
//     items: entries,
//     total: await LeaderboardEntry.countDocuments(filter),
//     page,
//     limit
//   });
// });

// export const publicLeaderboardSchema = z.object({
//   category:    z.string().optional(),
//   topic:       z.string().optional(),
//   level:       z.enum(['Beginner','Intermediate','Expert']).optional(),
//   timePeriod:  z.enum(['week','month','all-time']).default('all-time'),
//   // pagination as strings from query → coerce to numbers
//   page:        z.string().regex(/^\d+$/).transform(Number).default('1'),
//   limit:       z.string().regex(/^\d+$/).transform(Number).default('10'),
// });



// // Update Quiz (all fields optional)
// export const updateQuizSchema = createQuizSchema.partial();

// // Re-export question & leaderboard validators
// export {
//   submitAttemptSchema,
//   bulkQuestionsSchema,
//   addQuestionSchema,
// };




// src/validators/quizValidator.js
import { z } from 'zod';

// ─── Re-export question-related validators ───────────────────────────────────
export {
  submitAttemptSchema,
  bulkQuestionsSchema,
  addQuestionSchema,
} from './questionValidator.js';

// ─── Validate :quizId param ─────────────────────────────────────────────────
export const idParamSchema = z.object({
  quizId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid quizId'),
});

// ─── Validate :attemptId param ───────────────────────────────────────────────
export const attemptParamSchema = z.object({
  attemptId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid attemptId'),
});

// ─── Create Quiz payload ─────────────────────────────────────────────────────
export const createQuizSchema = z.object({
  title:      z.string().min(1, 'Title is required'),
  category:   z.string().min(1, 'Category is required'),
  topic:      z.string().min(1, 'Topic is required'),
  level:      z.enum(['Beginner', 'Intermediate', 'Expert'], 'Invalid level'),
  duration:   z.number().int().positive('Duration must be positive'),
  totalMarks: z.number().int().nonnegative('Total marks must be ≥ 0'),
  isActive:   z.boolean().optional(),
});

// ─── Update Quiz (all fields optional) ───────────────────────────────────────
export const updateQuizSchema = createQuizSchema.partial();

// ─── Public Leaderboard Query Params ────────────────────────────────────────
export const publicLeaderboardSchema = z.object({
  category:   z.string().optional(),
  topic:      z.string().optional(),

  // Level: allow "" → undefined, otherwise must match the enum
  level: z
    .union([z.enum(['Beginner','Intermediate','Expert']), z.literal('')])
    .transform(val => val === '' ? undefined : val)
    .optional(),

  timePeriod: z.enum(['week','month','all-time']).default('all-time'),

  // pagination as strings from query → coerce to numbers
  page:  z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
});