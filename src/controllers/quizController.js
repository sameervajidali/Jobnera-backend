import mongoose from 'mongoose';
import Redis from 'ioredis';
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import QuizAttempt from '../models/QuizAttempt.js';
import LeaderboardEntry from '../models/LeaderboardEntry.js';
import asyncHandler from '../utils/asyncHandler.js';
import { attemptParamSchema } from '../validators/quizValidator.js';
import { publicLeaderboardSchema } from '../validators/quizValidator.js';

import csv from 'csvtojson';
import { z } from 'zod';
import {
  submitAttemptSchema,
  bulkQuestionsSchema,
  addQuestionSchema,
  createQuizSchema,
  updateQuizSchema,
  idParamSchema
} from '../validators/quizValidator.js';
import QuizAssignment from '../models/QuizAssignment.js';

// ─── Redis client (optional caching) ─────────────────────────────────────────
let redis = null;
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
  redis.on('error', err => console.warn('⚠️ Redis error:', err.message));
} else {
  console.warn('⚠️ No REDIS_URL: caching disabled');
}

// ─── Submit Quiz Attempt ─────────────────────────────────────────────────────

// controllers/quizController.js
export const submitQuizAttempt = asyncHandler(async (req, res) => {
  // 1️⃣ Validate & extract from the body
  const { quizId, answers, timeTaken } = submitAttemptSchema.parse(req.body);

  // 2️⃣ Start a session for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // 3️⃣ Load the quiz with its questions
    const quiz = await Quiz.findById(quizId)
      .populate('questions')
      .session(session);
    if (!quiz) {
      throw { status: 404, message: 'Quiz not found' };
    }

    // 4️⃣ Make sure they answered every question
    if (Object.keys(answers).length !== quiz.questions.length) {
      return res.status(400).json({ message: 'Invalid number of answers' });
    }

    // 5️⃣ Grade it
    let correctCount = 0;
    const processed = quiz.questions.map(q => {
      const sel = answers[q._id] ?? null;
      const isCorrect = sel === q.correctIndex;
      if (isCorrect) correctCount++;
      return {
        question: q._id,
        selectedIndex: sel,
        isCorrect
      };
    });

    // 6️⃣ Persist the attempt
    const [attempt] = await QuizAttempt.create([{
      user: req.user._id,
      quiz: quizId,
      score: correctCount,
      totalQuestions: quiz.questions.length,
      correctAnswers: correctCount,
      answers: processed,
      timeTaken
    }], { session });

    // 7️⃣ Update the leaderboard
    await LeaderboardEntry.findOneAndUpdate({
      user: req.user._id,
      category: quiz.category,
      topic: quiz.topic,
      level: quiz.level
    }, {
      $inc: { score: correctCount, attempts: 1 },
      lastUpdated: new Date()
    }, {
      upsert: true,
      new: true,
      session
    });

    // 8️⃣ Commit the transaction
    await session.commitTransaction();

    // 9️⃣ Invalidate any cached leaderboards/quizzes
    if (redis) {
      redis.del(`leaderboard:${quiz.category}:${quiz.topic || 'all'}:${quiz.level}:${'all-time'}`);
      redis.del(`quizzes:all`);
    }

    // 10️⃣ Return the new attempt
    return res.status(200).json({ message: 'Quiz submitted', attempt });

  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export const getLeaderboard = asyncHandler(async (req, res) => {
  // 1️⃣ Parse & validate the entire set of query params
  const { category, topic, level, timePeriod, page, limit } =
    publicLeaderboardSchema.parse(req.query);

  // 2️⃣ Build your Mongo filter
  const filter = {};
  if (category) filter.category = category;
  if (topic) filter.topic = topic;
  if (level) filter.level = level;
  if (timePeriod === 'week') {
    filter.lastUpdated = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }

  // 3️⃣ Query & sort
  const skip = (page - 1) * limit;
  const entries = await LeaderboardEntry.find(filter)
    .sort({ score: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name avatar');

  // 4️⃣ Respond
  res.json({
    items: entries,
    total: await LeaderboardEntry.countDocuments(filter),
    page,
    limit
  });
});


// ─── User Attempts ────────────────────────────────────────────────────────────
export const getUserAttempts = asyncHandler(async (req, res) => {
  const atts = await QuizAttempt.find({ user: req.user._id })
    .populate('quiz', 'title category level')
    .sort({ createdAt: -1 });
  res.json(atts);
});

// ─── Quiz CRUD: Admin ─────────────────────────────────────────────────────────
// ─── Quiz CRUD: Admin ─────────────────────────────────────────────────────────
export const getAllQuizzes = asyncHandler(async (_req, res) => {
  const key = 'quizzes:all';

  // try Redis cache first…
  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) return res.json(JSON.parse(cached));
    } catch (e) {
      console.warn('⚠️ Redis GET failed:', e.message);
    }
  }

  // populate questions *and* category & topic names
  const quizzes = await Quiz.find()
    .populate("category", "name")
  .populate("topic",    "name")
  .populate("questions");           // <-- and this

  // cache in Redis
  if (redis) {
    redis
      .set(key, JSON.stringify(quizzes), 'EX', 3600)
      .catch(err => console.warn('⚠️ Redis SET failed:', err.message));
  }

  res.json(quizzes);
});


export const getQuizById = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const key = `quiz:${quizId}`;
  let c = null;
  if (redis) {
    try { c = await redis.get(key); } catch (e) { console.warn('⚠️ Redis GET failed:', e.message); }
    if (c) return res.json(JSON.parse(c));
  }

  const quiz = await Quiz.findById(quizId).populate('questions');
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  if (redis) {
    redis.set(key, JSON.stringify(quiz), 'EX', 3600)
      .catch(err => console.warn('⚠️ Redis SET failed:', err.message));
  }
  res.json(quiz);
});

export const createQuiz = asyncHandler(async (req, res) => {
  const data = createQuizSchema.parse(req.body);
  const quiz = await Quiz.create(data);
  if (redis) redis.del('quizzes:all').catch(() => { });
  res.status(201).json(quiz);
});

export const updateQuiz = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const updates = updateQuizSchema.parse(req.body);
  const quiz = await Quiz.findByIdAndUpdate(quizId, updates, { new: true });
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  if (redis) {
    redis.del(`quiz:${quizId}`).catch(() => { });
    redis.del('quizzes:all').catch(() => { });
  }
  res.json(quiz);
});

export const addQuestionToQuiz = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const { text, options, correctIndex, topicTag, explanation, difficulty, quiz } = addQuestionSchema.parse(req.body);
  const q = await Question.create({ text, options, correctIndex, topicTag, explanation, difficulty, quiz: quizId });
  await Quiz.findByIdAndUpdate(quizId, { $push: { questions: q._id }, $inc: { totalMarks: 1 } });
  if (redis) {
    redis.del(`quiz:${quizId}`).catch(() => { });
    redis.del('quizzes:all').catch(() => { });
  }
  res.status(201).json(q);
});

export const bulkUploadQuestions = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const { questions } = bulkQuestionsSchema.parse(req.body);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const docs = questions.map(q => ({
      quiz: quizId,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      topicTag: q.topicTag,
      explanation: q.explanation,
      difficulty: q.difficulty || 'medium'
    }));
    const created = await Question.insertMany(docs, { session });
    await Quiz.findByIdAndUpdate(quizId,
      { $push: { questions: created.map(x => x._id) }, $inc: { totalMarks: created.length } },
      { session }
    );
    await session.commitTransaction();
    if (redis) {
      redis.del(`quiz:${quizId}`).catch(() => { });
      redis.del('quizzes:all').catch(() => { });
    }
    res.status(201).json({ message: 'Questions uploaded', count: created.length });
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
});

export const bulkUploadFromFile = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const rows = await csv().fromString(req.file.buffer.toString());
  if (!rows.length) return res.status(400).json({ message: 'CSV is empty' });
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const docs = rows.map(r => ({
      quiz: quizId,
      text: r.question,
      options: [r.option1, r.option2, r.option3, r.option4],
      correctIndex: Number(r.correctAnswer),
      topicTag: r.topic || '',
      explanation: r.explanation || '',
      difficulty: r.difficulty || 'medium'
    }));
    const created = await Question.insertMany(docs, { session });
    await Quiz.findByIdAndUpdate(quizId,
      { $push: { questions: created.map(x => x._id) }, $inc: { totalMarks: created.length } },
      { session }
    );
    await session.commitTransaction();
    if (redis) {
      redis.del(`quiz:${quizId}`).catch(() => { });
      redis.del('quizzes:all').catch(() => { });
    }
    res.status(201).json({ message: 'Bulk upload successful', count: created.length });
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
});


export const downloadQuestionsTemplate = asyncHandler(async (req, res) => {
  // 1️⃣ Validate and extract quizId
  const { quizId } = idParamSchema.parse(req.params);

  // 2️⃣ Fetch quiz metadata
  const quiz = await Quiz.findById(quizId).select('topic level');
  if (!quiz) {
    return res.status(404).json({ message: 'Quiz not found' });
  }

  const topic = quiz.topic || 'quiz';
  const level = quiz.level || 'medium';

  // 3️⃣ Build CSV content
  const header = ['question', 'option1', 'option2', 'option3', 'option4', 'correctAnswer', 'topic', 'explanation', 'difficulty'];
  const sampleRows = [
    [
      'Sample question text?',
      'Option A',
      'Option B',
      'Option C',
      'Option D',
      '0',
      topic,
      'Explain why this is the correct answer.',
      level
    ]
  ];
  const csvContent = [header, ...sampleRows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // 4️⃣ Set headers to force download
  const filename = `questions_template_${topic.replace(/\s+/g, '_')}.csv`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');

  // 5️⃣ Send the file
  res.send(csvContent);
});


// GET all questions for a quiz
export const getQuestionsByQuiz = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const questions = await Question.find({ quiz: quizId });
  res.json(questions);
});

// POST new question
export const createQuestion = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const payload = addQuestionSchema.parse(req.body);
  const q = await Question.create({ ...payload, quiz: quizId });
  await Quiz.findByIdAndUpdate(quizId, {
    $push: { questions: q._id },
    $inc: { totalMarks: 1 }
  });
  res.status(201).json(q);
});

// PATCH update an existing question
export const updateQuestion = asyncHandler(async (req, res) => {
  const { quizId, questionId } = req.params;
  const payload = addQuestionSchema.parse(req.body);
  const q = await Question.findOneAndUpdate(
    { _id: questionId, quiz: quizId },
    payload,
    { new: true }
  );
  if (!q) return res.status(404).json({ message: 'Question not found' });
  res.json(q);
});

// DELETE a question
export const deleteQuestion = asyncHandler(async (req, res) => {
  const { quizId, questionId } = req.params;
  const q = await Question.findOneAndDelete({ _id: questionId, quiz: quizId });
  if (!q) return res.status(404).json({ message: 'Question not found' });
  await Quiz.findByIdAndUpdate(quizId, {
    $pull: { questions: questionId },
    $inc: { totalMarks: -1 }
  });
  res.json({ message: 'Deleted' });
});



// ➕ Assign quiz to one or more users
export const assignQuiz = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);

  // Validate body with Zod
  const { userIds } = z
    .object({
      userIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1)
    })
    .parse(req.body);

  const ops = userIds.map(uid => ({
    updateOne: {
      filter: { quiz: quizId, user: uid },
      update: { quiz: quizId, user: uid },
      upsert: true
    }
  }));
  await QuizAssignment.bulkWrite(ops);

  res.status(200).json({ message: `Assigned to ${userIds.length} user(s)` });
});



// 📖 List all assignments for this quiz
export const getQuizAssignments = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const assignments = await QuizAssignment.find({ quiz: quizId })
    .populate('user', 'name email');
  res.status(200).json(assignments);
});



// 🗑️ Unassign one user from a quiz
export const unassignQuiz = asyncHandler(async (req, res) => {
  const { quizId, userId } = req.params;
  await QuizAssignment.deleteOne({ quiz: quizId, user: userId });
  res.status(200).json({ message: 'Unassigned' });
});

// 📚 Public: List / Filter Active Quizzes
// ── controllers/quizController.js ──

/**
 * Public: list quizzes (with pagination + filters)
 */
// src/controllers/quizController.js
export const getPublicQuizzes = asyncHandler(async (req, res) => {
  const { category, topic, level, page = 1, limit = 12 } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (topic) filter.topic = topic;
  if (level) filter.level = level;

  const skip = (page - 1) * limit;

  // Step 1: Get paginated quizzes with question count
  const quizzes = await Quiz.aggregate([
    { $match: filter },
    {
      $project: {
        title: 1,
        duration: 1,
        totalMarks: 1,
        createdAt: 1,
        questionCount: { $size: { $ifNull: ['$questions', []] } },
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  // Step 2: Get attempt counts from QuizAttempt model
  const attemptData = await QuizAttempt.aggregate([
    { $match: { quiz: { $in: quizzes.map(q => q._id) } } },
    { $group: { _id: '$quiz', count: { $sum: 1 } } },
  ]);

  const attemptMap = Object.fromEntries(
    attemptData.map(a => [a._id.toString(), a.count])
  );

  // Step 3: Merge attempt counts into quiz list
  const finalQuizzes = quizzes.map(q => ({
    ...q,
    attemptCount: attemptMap[q._id.toString()] || 0,
  }));

  const total = await Quiz.countDocuments(filter);

  res.json({
    quizzes: finalQuizzes,
    total,
    page: Number(page),
    limit: Number(limit),
  });
});



// 📊 Get distinct values for a field
export const getDistinctValues = (field) =>
  asyncHandler(async (_req, res) => {
    // only allow certain fields:
    const allowed = ['category', 'topic', 'level'];
    if (!allowed.includes(field)) {
      return res.status(400).json({ message: 'Invalid distinct field' });
    }
    const values = await Quiz.distinct(field, { isActive: true });
    res.json(values);
  });


// controllers/quizController.js
export const getAttemptById = asyncHandler(async (req, res) => {
  const { attemptId } = attemptParamSchema.parse(req.params);

  const attempt = await QuizAttempt
    .findById(attemptId)
    .populate('quiz', 'title duration')
    .populate('answers.question', 'text options correctIndex');

  if (!attempt) {
    return res.status(404).json({ message: 'Attempt not found' });
  }
  res.json(attempt);
});


// controllers/quizController.js
// GET /api/quizzes/attempts/:attemptId
export const getAttemptStats = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;

  // Find the attempt and populate the inner question refs
  const attempt = await QuizAttempt.findById(attemptId)
    .populate('quiz', 'title category topic level')
    .populate({
      path: 'answers.question',
      model: 'Question',
      select: 'text options correctIndex explanation'
    })
    .lean();

  if (!attempt) {
    return res.status(404).json({ message: 'Attempt not found' });
  }

  // Now compute rank & percentile
  const allAttempts = await QuizAttempt
    .find({ quiz: attempt.quiz._id })
    .sort({ score: -1 })
    .select('_id')
    .lean();

  const totalCount = allAttempts.length;
  const rank       = allAttempts.findIndex(a => a._id.equals(attempt._id)) + 1;
  const percentile = Math.round((1 - (rank - 1) / totalCount) * 100);

  res.json({ attempt, rank, totalCount, percentile });
});

// ─── Fetch a single attempt (with question details) ───────────────
export const getAttemptDetails = asyncHandler(async (req, res) => {;

  const rank = higherCount + 1;
  const percentile = Math.round((1 - (rank - 1) / totalCount) * 100);

  // re-populate detailed attempt for client
  const full = await QuizAttempt
    .findById(attemptId)
    .populate({
      path:'answers.question',
      select:'text options correctIndex explanation'
    })
    .populate('quiz', 'title category topic level')
    .lean();

  res.json({ 
    attempt: full,
    rank,
    totalCount,
    percentile
  });
});

// controllers/quizController.js
export const getQuizTopThree = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { timePeriod = 'week' } = req.query;

  // Build time filter
  const filter = { quiz: quizId };
  if (timePeriod === 'week') {
    const since = new Date(Date.now() - 7*24*60*60*1000);
    filter.createdAt = { $gte: since };
  } else if (timePeriod === 'month') {
    const since = new Date(Date.now() - 30*24*60*60*1000);
    filter.createdAt = { $gte: since };
  }

  // Aggregate top 3 scores for that quiz
  const topThree = await QuizAttempt.aggregate([
    { $match: filter },
    { $sort: { score: -1, timeTaken: 1 } },
    { $limit: 3 },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    { $project: { _id:1, score:1, 'user.name':1 } }
  ]);

  res.json(topThree);
});


export const bulkUploadQuizzesFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided.' });
  }

  // parse CSV buffer
  let rows;
  try {
    rows = await csv().fromString(req.file.buffer.toString());
  } catch (err) {
    return res.status(400).json({ message: 'Invalid CSV format.' });
  }

  if (!rows.length) {
    return res.status(400).json({ message: 'CSV is empty.' });
  }

  // expecting columns: title,category,topic,level,duration,totalMarks,isActive
  const toCreate = rows.map(r => ({
    title:       r.title,
    category:    r.category,
    topic:       r.topic,
    level:       r.level,
    duration:    Number(r.duration)    || 0,
    totalMarks:  Number(r.totalMarks)  || 0,
    isActive:    String(r.isActive).toLowerCase() === 'true',
  }));

  let created;
  try {
    created = await Quiz.insertMany(toCreate);
  } catch (err) {
    console.error('Bulk upload quizzes error:', err);
    return res.status(500).json({ message: 'Failed to save quizzes.' });
  }

  res.status(201).json({
    message: `Imported ${created.length} quizzes successfully.`,
    count:   created.length
  });
};


// GET /api/quizzes/grouped-topics
export const getGroupedTopics = asyncHandler(async (_req, res) => {
  const quizzes = await Quiz.find({ isActive: true }).select('category topic -_id');
  const grouped = {};

  quizzes.forEach(({ category, topic }) => {
    if (!grouped[category]) grouped[category] = new Set();
    grouped[category].add(topic);
  });

  const result = Object.entries(grouped).map(([category, topicSet]) => ({
    category,
    topics: Array.from(topicSet)
  }));

  res.json(result);
});
