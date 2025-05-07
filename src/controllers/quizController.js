import mongoose from 'mongoose';
import Redis from 'ioredis';
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import QuizAttempt from '../models/QuizAttempt.js';
import LeaderboardEntry from '../models/LeaderboardEntry.js';
import asyncHandler from '../utils/asyncHandler.js';
import csv from 'csvtojson';
import {
  submitAttemptSchema,
  bulkQuestionsSchema,
  addQuestionSchema,
  getLeaderboardSchema,
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
export const submitQuizAttempt = asyncHandler(async (req, res) => {
  const { quizId, answers, timeTaken } = submitAttemptSchema.parse(req.body);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const quiz = await Quiz.findById(quizId).populate('questions').session(session);
    if (!quiz) throw { status: 404, message: 'Quiz not found' };

    if (!answers || Object.keys(answers).length !== quiz.questions.length) {
      return res.status(400).json({ message: 'Invalid number of answers' });
    }

    let correctCount = 0;
    const processed = quiz.questions.map(q => {
      const sel = answers[q._id] ?? null;
      const correct = sel === q.correctIndex;
      if (correct) correctCount++;
      return { question: q._id, selectedIndex: sel, isCorrect: correct };
    });

    const [attempt] = await QuizAttempt.create([
      {
        user: req.user._id,
        quiz: quizId,
        score: correctCount,
        totalQuestions: quiz.questions.length,
        correctAnswers: correctCount,
        answers: processed,
        timeTaken
      }
    ], { session });

    await LeaderboardEntry.findOneAndUpdate(
      { user: req.user._id, category: quiz.category, topic: quiz.topic, level: quiz.level },
      { $inc: { score: correctCount, attempts: 1 }, lastUpdated: new Date() },
      { upsert: true, new: true, session }
    );

    await session.commitTransaction();
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
  const { category, topic, level, timePeriod } = getLeaderboardSchema.parse(req.query);
  const key = `leaderboard:${category}:${topic||'all'}:${level||'all'}:${timePeriod}`;

  // cache read
  if (redis) {
    try {
      const c = await redis.get(key);
      if (c) return res.json(JSON.parse(c));
    } catch (e) {
      console.warn('⚠️ Redis GET failed:', e.message);
    }
  }

  const filter = { category };
  if (topic) filter.topic = topic;
  if (level) filter.level = level;
  if (timePeriod === 'week') filter.lastUpdated = { $gte: new Date(Date.now() - 7*24*60*60*1000) };

  const entries = await LeaderboardEntry.find(filter)
    .sort({ score: -1 })
    .limit(100)
    .populate('user', 'name avatar');

  // cache write
  if (redis) {
    redis.set(key, JSON.stringify(entries), 'EX', 3600)
         .catch(err => console.warn('⚠️ Redis SET failed:', err.message));
  }

  res.json(entries);
});

// ─── User Attempts ────────────────────────────────────────────────────────────
export const getUserAttempts = asyncHandler(async (req, res) => {
  const atts = await QuizAttempt.find({ user: req.user._id })
    .populate('quiz', 'title category level')
    .sort({ createdAt: -1 });
  res.json(atts);
});

// ─── Quiz CRUD: Admin ─────────────────────────────────────────────────────────
export const getAllQuizzes = asyncHandler(async (_req, res) => {
  const key = 'quizzes:all';
  if (redis) {
    try {
      const c = await redis.get(key);
      if (c) return res.json(JSON.parse(c));
    } catch (e) { console.warn('⚠️ Redis GET failed:', e.message); }
  }

  const quizzes = await Quiz.find().populate('questions');
  if (redis) {
    redis.set(key, JSON.stringify(quizzes), 'EX', 3600)
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
  if (redis) redis.del('quizzes:all').catch(() => {});
  res.status(201).json(quiz);
});

export const updateQuiz = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const updates = updateQuizSchema.parse(req.body);
  const quiz = await Quiz.findByIdAndUpdate(quizId, updates, { new: true });
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  if (redis) {
    redis.del(`quiz:${quizId}`).catch(() => {});
    redis.del('quizzes:all').catch(() => {});
  }
  res.json(quiz);
});

export const addQuestionToQuiz = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const { text, options, correctIndex, topicTag, explanation, difficulty, quiz } = addQuestionSchema.parse(req.body);
  const q = await Question.create({ text, options, correctIndex, topicTag, explanation, difficulty, quiz: quizId });
  await Quiz.findByIdAndUpdate(quizId, { $push: { questions: q._id }, $inc: { totalMarks: 1 } });
  if (redis) {
    redis.del(`quiz:${quizId}`).catch(() => {});
    redis.del('quizzes:all').catch(() => {});
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
      redis.del(`quiz:${quizId}`).catch(() => {});
      redis.del('quizzes:all').catch(() => {});
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
      redis.del(`quiz:${quizId}`).catch(() => {});
      redis.del('quizzes:all').catch(() => {});
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
  const header = ['question','option1','option2','option3','option4','correctAnswer','topic','explanation','difficulty'];
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
    .map(row => row.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(','))
    .join('\n');

  // 4️⃣ Set headers to force download
  const filename = `questions_template_${topic.replace(/\s+/g,'_')}.csv`;
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
  const { userIds } = z.object({ userIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1) }).parse(req.body);

  // ensure quiz exists
  const quiz = await Quiz.findById(quizId);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  // upsert assignments
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

// 📖 List users assigned to this quiz
// src/controllers/quizController.js
export const getQuizAssignments = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);

  // Fetch the full list of assignments
  const assignments = await QuizAssignment
    .find({ quiz: quizId })
    .populate('user', 'name email');

  // Return the array, not its length
  return res.status(200).json(assignments);
});


// 🗑️ Unassign one user from quiz
export const unassignQuiz = asyncHandler(async (req, res) => {
  const { quizId, userId } = req.params;
  await QuizAssignment.deleteOne({ quiz: quizId, user: userId });
  res.json({ message: 'Unassigned' });
});