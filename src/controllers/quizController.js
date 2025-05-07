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
  updateQuizSchema,
  idParamSchema,
  createQuizSchema
} from '../validators/quizValidator.js';

// Initialize Redis client for caching



let redis;
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
} else {
  // Fallback to null so we can check ‘if (redis)’ later
  console.warn('⚠️  No REDIS_URL supplied: caching disabled');
  redis = null;
}

// Attach a no-op error handler so ioredis doesn’t emit unhandled errors
if (redis) {
  redis.on('error', (err) => {
    console.warn('⚠️  Redis connection error:', err.message);
    // optionally: redis.disconnect();
  });
}




// 📤 Submit Quiz Attempt
export const submitQuizAttempt = asyncHandler(async (req, res) => {
  const { quizId, answers, timeTaken } = submitAttemptSchema.parse(req.body);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const quiz = await Quiz.findById(quizId).populate('questions').session(session);
    if (!quiz) throw { status: 404, message: 'Quiz not found' };

    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      return res.status(400).json({ message: 'Invalid number of answers' });
    }

    let correctAnswersCount = 0;
    const processedAnswers = quiz.questions.map(q => {
      const selectedIndex = answers[q._id] ?? null;
      const isCorrect = selectedIndex === q.correctIndex;
      if (isCorrect) correctAnswersCount++;
      return { question: q._id, selectedIndex, isCorrect };
    });

    const [attempt] = await QuizAttempt.create([
      {
        user: req.user._id,
        quiz: quizId,
        score: correctAnswersCount,
        totalQuestions: quiz.questions.length,
        correctAnswers: correctAnswersCount,
        answers: processedAnswers,
        timeTaken
      }
    ], { session });

    await LeaderboardEntry.findOneAndUpdate(
      {
        user: req.user._id,
        category: quiz.category,
        topic: quiz.topic,
        level: quiz.level
      },
      {
        $inc: { score: correctAnswersCount, attempts: 1 },
        lastUpdated: new Date()
      },
      { upsert: true, new: true, session }
    );

    await session.commitTransaction();
    res.status(200).json({ message: 'Quiz submitted', attempt });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// 🏆 Leaderboard with caching
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { category, topic, level, timePeriod } = getLeaderboardSchema.parse(req.query);
  const cacheKey = `leaderboard:${category}:${topic || 'all'}:${level || 'all'}:${timePeriod}`;

  // Try cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.status(200).json(JSON.parse(cached));
  }

  // Fetch from DB
  const filter = { category };
  if (topic) filter.topic = topic;
  if (level) filter.level = level;
  if (timePeriod === 'week') {
    filter.lastUpdated = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }

  const entries = await LeaderboardEntry.find(filter)
    .sort({ score: -1 })
    .limit(100)
    .populate('user', 'name avatar');

  // Cache & respond
  await redis.set(cacheKey, JSON.stringify(entries), 'EX', 3600);
  res.status(200).json(entries);
});

// 📥 Get Quiz Attempt History for User
export const getUserAttempts = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({ user: req.user._id })
    .populate('quiz', 'title category level')
    .sort({ createdAt: -1 });
  res.status(200).json(attempts);
});

// 📚 Get All Quizzes (Admin) with caching
export const getAllQuizzes = asyncHandler(async (_req, res) => {
  const cacheKey = 'quizzes:all';

  // 1️⃣ Try to serve from cache, if redis client is available
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (err) {
      console.warn('⚠️ Redis GET failed:', err.message);
      // fall through to DB fetch
    }
  }

  // 2️⃣ Fetch from Mongo
  const quizzes = await Quiz.find().populate('questions');

  // 3️⃣ Populate cache (best‐effort, non‐blocking)
  if (redis) {
    redis.set(cacheKey, JSON.stringify(quizzes), 'EX', 3600)
      .catch(err => console.warn('⚠️ Redis SET failed:', err.message));
  }

  // 4️⃣ Return the fresh data
  res.status(200).json(quizzes);
});


// 📝 Get Quiz By ID (Admin) with caching
export const getQuizById = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const cacheKey = `quiz:${quizId}`;

  // -  // Try cache
  // const cached = await redis.get(cacheKey);
  // if (cached) {
  //   return res.status(200).json(JSON.parse(cached));
  // }
  // Try cache (only if redis is configured)
  let cached = null;
  if (redis) {
    try {
      cached = await redis.get(cacheKey);
    } catch (err) {
      console.warn('⚠️ Redis GET failed:', err.message);
    }
  }
  if (cached) {
    return res.status(200).json(JSON.parse(cached));
  }

  const quiz = await Quiz.findById(quizId).populate('questions');
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  // -  // Cache & respond
  // -  await redis.set(cacheKey, JSON.stringify(quiz), 'EX', 3600);
  // Cache (best‐effort) & respond
  if (redis) {
    redis.set(cacheKey, JSON.stringify(quiz), 'EX', 3600)
      .catch(err => console.warn('⚠️ Redis SET failed:', err.message));
  }

  res.status(200).json(quiz);
});







// 🛠️ Update Quiz (Admin)
export const updateQuiz = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const updates = updateQuizSchema.parse(req.body);

  const updated = await Quiz.findByIdAndUpdate(quizId, updates, { new: true });
  if (!updated) return res.status(404).json({ message: 'Quiz not found' });

  // Invalidate cache
  await redis.del(`quiz:${quizId}`);
  await redis.del('quizzes:all');

  res.status(200).json(updated);
});

// ➕ Add Single Question (Admin)
export const addQuestionToQuiz = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const { question, options, correctAnswer, topicTag, explanation } = addQuestionSchema.parse(req.body);

  const q = await Question.create({ quiz: quizId, question, options, correctAnswer, topicTag, explanation });
  await Quiz.findByIdAndUpdate(quizId, { $push: { questions: q._id }, $inc: { totalMarks: 1 } });

  // Invalidate cache
  await redis.del(`quiz:${quizId}`);
  await redis.del('quizzes:all');

  res.status(201).json(q);
});

// 📤 Admin: Bulk Upload JSON
export const bulkUploadQuestions = asyncHandler(async (req, res) => {
  // 1️⃣ grab the quizId from the URL
  const { quizId } = idParamSchema.parse(req.params);

  // 2️⃣ validate only the questions array
  const { questions } = bulkQuestionsSchema.parse(req.body);

  // 3️⃣ format & insert
  const formatted = questions.map(q => ({
    quiz:            quizId,
    question:        q.text,
    options:         q.options,
    correctAnswer:   q.correctIndex,
    topicTag:        q.topicTag,
    explanation:     q.explanation
  }));
  // … rest of your transaction + update logic remains the same …
});

// 📤 Admin: Bulk Upload From File (CSV)
export const bulkUploadFromFile = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const rows = await csv().fromString(req.file.buffer.toString());
    if (!rows.length) throw { status: 400, message: 'CSV file is empty' };

    const formatted = rows.map(row => ({ quiz: quizId, question: row.question, options: [row.option1, row.option2, row.option3, row.option4], correctAnswer: Number(row.correctAnswer), topicTag: row.topic || '', explanation: row.explanation || '' }));
    const created = await Question.insertMany(formatted, { session });
    await Quiz.findByIdAndUpdate(quizId, { $push: { questions: created.map(q => q._id) }, $inc: { totalMarks: created.length } }, { session });
    await session.commitTransaction();

    // Invalidate cache
    await redis.del(`quiz:${quizId}`);
    await redis.del('quizzes:all');

    res.status(201).json({ message: 'Bulk upload successful', count: created.length });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ➕ Create new quiz (Admin/Creater only)
export const createQuiz = asyncHandler(async (req, res) => {
  // 1️⃣ validate input
  const quizData = createQuizSchema.parse(req.body);

  // 2️⃣ persist
  const quiz = await Quiz.create(quizData);

  // 3️⃣ clear any quiz-list cache (if you’re using Redis)
  if (typeof redis !== 'undefined' && redis) {
    await redis.del('quizzes:all');
  }

  // 4️⃣ respond
  res.status(201).json(quiz);
});

