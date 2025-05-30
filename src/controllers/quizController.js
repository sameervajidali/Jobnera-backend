// import mongoose from 'mongoose';
// import Redis from 'ioredis';
// import Quiz from '../models/Quiz.js';
// import Question from '../models/Question.js';
// import QuizAttempt from '../models/QuizAttempt.js';
// import LeaderboardEntry from '../models/LeaderboardEntry.js';
// import asyncHandler from '../utils/asyncHandler.js';
// import { attemptParamSchema } from '../validators/quizValidator.js';
// import { publicLeaderboardSchema } from '../validators/quizValidator.js';
// import { Parser } from 'json2csv';

// import Topic    from '../models/Topic.js';
// import csv      from 'csvtojson';
// import { z } from 'zod';
// import AuditLog from '../models/AuditLog.js';
// import Category from '../models/Category.js'

// import {
//   submitAttemptSchema,
//   bulkQuestionsSchema,
//   addQuestionSchema,
//   createQuizSchema,
//   updateQuizSchema,
//   idParamSchema
// } from '../validators/quizValidator.js';
// import QuizAssignment from '../models/QuizAssignment.js';

// // ─── Redis client (optional caching) ─────────────────────────────────────────
// let redis = null;
// if (process.env.REDIS_URL) {
//   redis = new Redis(process.env.REDIS_URL);
//   redis.on('error', err => console.warn('⚠️ Redis error:', err.message));
// } else {
//   console.warn('⚠️ No REDIS_URL: caching disabled');
// }

// // ─── Submit Quiz Attempt ─────────────────────────────────────────────────────

// // controllers/quizController.js
// export const submitQuizAttempt = asyncHandler(async (req, res) => {
//   // 1️⃣ Validate & extract from the body
//   const { quizId, answers, timeTaken } = submitAttemptSchema.parse(req.body);

//   // 2️⃣ Start a session for atomicity
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     // 3️⃣ Load the quiz with its questions
//     const quiz = await Quiz.findById(quizId)
//       .populate('questions')
//       .session(session);
//     if (!quiz) {
//       throw { status: 404, message: 'Quiz not found' };
//     }

//     // 4️⃣ Make sure they answered every question
//     if (Object.keys(answers).length !== quiz.questions.length) {
//       return res.status(400).json({ message: 'Invalid number of answers' });
//     }

//     // 5️⃣ Grade it
//     let correctCount = 0;
//     const processed = quiz.questions.map(q => {
//       const sel = answers[q._id] ?? null;
//       const isCorrect = sel === q.correctIndex;
//       if (isCorrect) correctCount++;
//       return {
//         question: q._id,
//         selectedIndex: sel,
//         isCorrect
//       };
//     });

//     // 6️⃣ Persist the attempt
//     const [attempt] = await QuizAttempt.create([{
//       user: req.user._id,
//       quiz: quizId,
//       score: correctCount,
//       totalQuestions: quiz.questions.length,
//       correctAnswers: correctCount,
//       answers: processed,
//       timeTaken
//     }], { session });

//     // 7️⃣ Update the leaderboard
//     await LeaderboardEntry.findOneAndUpdate({
//       user: req.user._id,
//       category: quiz.category,
//       topic: quiz.topic,
//       level: quiz.level
//     }, {
//       $inc: { score: correctCount, attempts: 1 },
//       lastUpdated: new Date()
//     }, {
//       upsert: true,
//       new: true,
//       session
//     });

//     // 8️⃣ Commit the transaction
//     await session.commitTransaction();

//     // 9️⃣ Invalidate any cached leaderboards/quizzes
//     if (redis) {
//       redis.del(`leaderboard:${quiz.category}:${quiz.topic || 'all'}:${quiz.level}:${'all-time'}`);
//       redis.del(`quizzes:all`);
//     }

//     // 10️⃣ Return the new attempt
//     return res.status(200).json({ message: 'Quiz submitted', attempt });

//   } catch (err) {
//     await session.abortTransaction();
//     throw err;
//   } finally {
//     session.endSession();
//   }
// });

// // ─── Leaderboard ──────────────────────────────────────────────────────────────

// export const getLeaderboard = asyncHandler(async (req, res) => {
//   // 1️⃣ Parse & validate the entire set of query params
//   const { category, topic, level, timePeriod, page, limit } =
//     publicLeaderboardSchema.parse(req.query);

//   // 2️⃣ Build your Mongo filter
//   const filter = {};
//   if (category) filter.category = category;
//   if (topic) filter.topic = topic;
//   if (level) filter.level = level;
//   if (timePeriod === 'week') {
//     filter.lastUpdated = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
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


// // ─── User Attempts ────────────────────────────────────────────────────────────
// export const getUserAttempts = asyncHandler(async (req, res) => {
//   const atts = await QuizAttempt.find({ user: req.user._id })
//     .populate('quiz', 'title category level')
//     .sort({ createdAt: -1 });
//   res.json(atts);
// });

// // ─── Quiz CRUD: Admin ─────────────────────────────────────────────────────────
// // ─── Quiz CRUD: Admin ─────────────────────────────────────────────────────────
// export const getAllQuizzes = asyncHandler(async (_req, res) => {
//   const key = 'quizzes:all';

//   // try Redis cache first…
//   if (redis) {
//     try {
//       const cached = await redis.get(key);
//       if (cached) return res.json(JSON.parse(cached));
//     } catch (e) {
//       console.warn('⚠️ Redis GET failed:', e.message);
//     }
//   }

//   // populate questions *and* category & topic names
//   const quizzes = await Quiz.find()
//     .populate("category", "name")
//   .populate("topic",    "name")
//   .populate("questions");           // <-- and this

//   console.log('Fetched Quizzes:', quizzes);  // Check the structure of quizzes here
//   // cache in Redis
//   if (redis) {
//     redis
//       .set(key, JSON.stringify(quizzes), 'EX', 3600)
//       .catch(err => console.warn('⚠️ Redis SET failed:', err.message));
//   }

//   res.json(quizzes);
// });


// export const getQuizById = asyncHandler(async (req, res) => {
//   const { quizId } = idParamSchema.parse(req.params);
//   const key = `quiz:${quizId}`;
//   let c = null;
//   if (redis) {
//     try { c = await redis.get(key); } catch (e) { console.warn('⚠️ Redis GET failed:', e.message); }
//     if (c) return res.json(JSON.parse(c));
//   }

//   const quiz = await Quiz.findById(quizId)
//   .populate('questions')
//   .populate('category', 'name')
//   .populate('topic',    'name');

//   if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

//   if (redis) {
//     redis.set(key, JSON.stringify(quiz), 'EX', 3600)
//       .catch(err => console.warn('⚠️ Redis SET failed:', err.message));
//   }
//   res.json(quiz);
// });

// export const createQuiz = asyncHandler(async (req, res) => {
//   const data = createQuizSchema.parse(req.body);
//   const quiz = await Quiz.create(data);
//   if (redis) redis.del('quizzes:all').catch(() => { });
//   res.status(201).json(quiz);
// });

// export const updateQuiz = asyncHandler(async (req, res) => {
//   const { quizId } = idParamSchema.parse(req.params);
//   const updates = updateQuizSchema.parse(req.body);
//   const quiz = await Quiz.findByIdAndUpdate(quizId, updates, { new: true });
//   if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

//   if (redis) {
//     redis.del(`quiz:${quizId}`).catch(() => { });
//     redis.del('quizzes:all').catch(() => { });
//   }
//   res.json(quiz);
// });

// export const addQuestionToQuiz = asyncHandler(async (req, res) => {
//   const { quizId } = idParamSchema.parse(req.params);
//   const { text, options, correctIndex, topicTag, explanation, difficulty, quiz } = addQuestionSchema.parse(req.body);
//   const q = await Question.create({ text, options, correctIndex, topicTag, explanation, difficulty, quiz: quizId });
//   await Quiz.findByIdAndUpdate(quizId, { $push: { questions: q._id }, $inc: { totalMarks: 1 } });
//   if (redis) {
//     redis.del(`quiz:${quizId}`).catch(() => { });
//     redis.del('quizzes:all').catch(() => { });
//   }
//   res.status(201).json(q);
// });

// export const bulkUploadQuestions = asyncHandler(async (req, res) => {
//   const { quizId } = idParamSchema.parse(req.params);
//   const { questions } = bulkQuestionsSchema.parse(req.body);
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const docs = questions.map(q => ({
//       quiz: quizId,
//       text: q.text,
//       options: q.options,
//       correctIndex: q.correctIndex,
//       topicTag: q.topicTag,
//       explanation: q.explanation,
//       difficulty: q.difficulty || 'medium'
//     }));
//     const created = await Question.insertMany(docs, { session });
//     await Quiz.findByIdAndUpdate(quizId,
//       { $push: { questions: created.map(x => x._id) }, $inc: { totalMarks: created.length } },
//       { session }
//     );
//     await session.commitTransaction();
//     if (redis) {
//       redis.del(`quiz:${quizId}`).catch(() => { });
//       redis.del('quizzes:all').catch(() => { });
//     }
//     res.status(201).json({ message: 'Questions uploaded', count: created.length });
//   } catch (e) {
//     await session.abortTransaction();
//     throw e;
//   } finally {
//     session.endSession();
//   }
// });

// export const bulkUploadFromFile = asyncHandler(async (req, res) => {
//   const { quizId } = idParamSchema.parse(req.params);
//   if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

//   const rows = await csv().fromString(req.file.buffer.toString());
//   if (!rows.length) return res.status(400).json({ message: 'CSV is empty' });
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const docs = rows.map(r => ({
//       quiz: quizId,
//       text: r.question,
//       options: [r.option1, r.option2, r.option3, r.option4],
//       correctIndex: Number(r.correctAnswer),
//       topicTag: r.topic || '',
//       explanation: r.explanation || '',
//       difficulty: r.difficulty || 'medium'
//     }));
//     const created = await Question.insertMany(docs, { session });
//     await Quiz.findByIdAndUpdate(quizId,
//       { $push: { questions: created.map(x => x._id) }, $inc: { totalMarks: created.length } },
//       { session }
//     );
//     await session.commitTransaction();
//     if (redis) {
//       redis.del(`quiz:${quizId}`).catch(() => { });
//       redis.del('quizzes:all').catch(() => { });
//     }
//     res.status(201).json({ message: 'Bulk upload successful', count: created.length });
//   } catch (e) {
//     await session.abortTransaction();
//     throw e;
//   } finally {
//     session.endSession();
//   }
// });


// export const downloadQuestionsTemplate = asyncHandler(async (req, res) => {
//   // 1️⃣ Validate and extract quizId
//   const { quizId } = idParamSchema.parse(req.params);

//   // 2️⃣ Fetch quiz metadata
//   const quiz = await Quiz.findById(quizId).select('topic level');
//   if (!quiz) {
//     return res.status(404).json({ message: 'Quiz not found' });
//   }

//   const topic = quiz.topic || 'quiz';
//   const level = quiz.level || 'medium';

//   // 3️⃣ Build CSV content
//   const header = ['question', 'option1', 'option2', 'option3', 'option4', 'correctAnswer', 'topic', 'explanation', 'difficulty'];
//   const sampleRows = [
//     [
//       'Sample question text?',
//       'Option A',
//       'Option B',
//       'Option C',
//       'Option D',
//       '0',
//       topic,
//       'Explain why this is the correct answer.',
//       level
//     ]
//   ];
//   const csvContent = [header, ...sampleRows]
//     .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
//     .join('\n');

//   // 4️⃣ Set headers to force download
//   const filename = `questions_template_${topic.replace(/\s+/g, '_')}.csv`;
//   res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
//   res.setHeader('Content-Type', 'text/csv; charset=utf-8');

//   // 5️⃣ Send the file
//   res.send(csvContent);
// });


// // GET all questions for a quiz
// export const getQuestionsByQuiz = asyncHandler(async (req, res) => {
//   const { quizId } = idParamSchema.parse(req.params);
//   const questions = await Question.find({ quiz: quizId });
//   res.json(questions);
// });

// // POST new question
// export const createQuestion = asyncHandler(async (req, res) => {
//   const { quizId } = idParamSchema.parse(req.params);
//   const payload = addQuestionSchema.parse(req.body);
//   const q = await Question.create({ ...payload, quiz: quizId });
//   await Quiz.findByIdAndUpdate(quizId, {
//     $push: { questions: q._id },
//     $inc: { totalMarks: 1 }
//   });
//   res.status(201).json(q);
// });

// // PATCH update an existing question
// export const updateQuestion = asyncHandler(async (req, res) => {
//   const { quizId, questionId } = req.params;
//   const payload = addQuestionSchema.parse(req.body);
//   const q = await Question.findOneAndUpdate(
//     { _id: questionId, quiz: quizId },
//     payload,
//     { new: true }
//   );
//   if (!q) return res.status(404).json({ message: 'Question not found' });
//   res.json(q);
// });

// // DELETE a question
// export const deleteQuestion = asyncHandler(async (req, res) => {
//   const { quizId, questionId } = req.params;
//   const q = await Question.findOneAndDelete({ _id: questionId, quiz: quizId });
//   if (!q) return res.status(404).json({ message: 'Question not found' });
//   await Quiz.findByIdAndUpdate(quizId, {
//     $pull: { questions: questionId },
//     $inc: { totalMarks: -1 }
//   });
//   res.json({ message: 'Deleted' });
// });



// // ➕ Assign quiz to one or more users
// export const assignQuiz = asyncHandler(async (req, res) => {
//   const { quizId } = idParamSchema.parse(req.params);

//   // Validate body with Zod
//   const { userIds } = z
//     .object({
//       userIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1)
//     })
//     .parse(req.body);

//   const ops = userIds.map(uid => ({
//     updateOne: {
//       filter: { quiz: quizId, user: uid },
//       update: { quiz: quizId, user: uid },
//       upsert: true
//     }
//   }));
//   await QuizAssignment.bulkWrite(ops);

//   res.status(200).json({ message: `Assigned to ${userIds.length} user(s)` });
// });



// // 📖 List all assignments for this quiz
// export const getQuizAssignments = asyncHandler(async (req, res) => {
//   const { quizId } = idParamSchema.parse(req.params);
//   const assignments = await QuizAssignment.find({ quiz: quizId })
//     .populate('user', 'name email');
//   res.status(200).json(assignments);
// });



// // 🗑️ Unassign one user from a quiz
// export const unassignQuiz = asyncHandler(async (req, res) => {
//   const { quizId, userId } = req.params;
//   await QuizAssignment.deleteOne({ quiz: quizId, user: userId });
//   res.status(200).json({ message: 'Unassigned' });
// });

// // 📚 Public: List / Filter Active Quizzes
// // ── controllers/quizController.js ──

// /**
//  * Public: list quizzes (with pagination + filters)
//  */
// // src/controllers/quizController.js


// /**
//  * GET /api/quizzes
//  * Public: list quizzes with filters, pagination, questionCount, attemptCount
//  */
// // controllers/quizController.js

// export const getPublicQuizzes = asyncHandler(async (req, res) => {
//   const { category, topic, level, page = 1, limit = 12 } = req.query;
//   const match = { isActive: true };

//   if (category && mongoose.isValidObjectId(category))
//     match.category = category;
//   if (topic && mongoose.isValidObjectId(topic))
//     match.topic = topic;
//   if (level)
//     match.level = level;

//   const skip = (Number(page) - 1) * Number(limit);

//   // 1) Fetch the page of quizzes, with populated category & topic
//   const quizzes = await Quiz.find(match)
//     .populate('category','name')
//     .populate('topic','name')
//     .populate('questions','_id')     // only need _id for counting
//     .skip(skip)
//     .limit(Number(limit))
//     .sort({ createdAt: -1 });

//   // 2) Compute questionCount
//   const withCounts = quizzes.map(q => ({
//     ...q.toObject(),
//     questionCount: q.questions?.length || 0
//   }));

//   // 3) Compute attemptCount in one aggregate
//   const attemptCounts = await QuizAttempt.aggregate([
//     { $match: { quiz: { $in: quizzes.map(q => q._id) } } },
//     { $group: { _id: '$quiz', count: { $sum: 1 } } }
//   ]);
//   const attemptMap = Object.fromEntries(
//     attemptCounts.map(a => [a._id.toString(), a.count])
//   );

//   // 4) Merge attemptCount
//   const finalQuizzes = withCounts.map(q => ({
//     ...q,
//     attemptCount: attemptMap[q._id.toString()] || 0
//   }));

//   // 5) Total for pagination
//   const total = await Quiz.countDocuments(match);

//   res.json({
//     quizzes: finalQuizzes,
//     total,
//     page:  Number(page),
//     limit: Number(limit)
//   });
// });


// /**
//  * GET /api/quizzes/distinct/category
//  * Public: return active categories (id + name) for sidebar
//  */
// // Return [{ _id, name }] for active categories
// export const getDistinctCategories = asyncHandler(async (_req, res) => {
//   const ids = await Quiz.distinct('category', { isActive: true });
//   const cats = await Category.find({ _id: { $in: ids } }, 'name').lean();
//   res.json(cats.map(c => ({ _id: c._id, name: c.name })));
// });


// // 📊 Get distinct values for a field
// // Keep the generic factory only for levels
// export const getDistinctValues = (field) =>
//   asyncHandler(async (_req, res) => {
//     const allowed = ['category','topic','level'];
//     if (!allowed.includes(field)) {
//       return res.status(400).json({ message: 'Invalid field' });
//     }

//     // LEVELS can stay a simple string array:
//     if (field === 'level') {
//       const levels = await Quiz.distinct('level', { isActive: true });
//       return res.json(levels);
//     }

//     // For category/topic, first pull the distinct ObjectIds…
//     const ids = await Quiz.distinct(field, { isActive: true });

//     // …then fetch full docs so you get {_id,name} back:
//     const Model = field === 'category' ? Category : Topic;
//     const docs  = await Model.find({ _id: { $in: ids } }).select('name');
//     res.json(docs);
//   });

// // controllers/quizController.js
// export const getAttemptById = asyncHandler(async (req, res) => {
//   const { attemptId } = attemptParamSchema.parse(req.params);

//   const attempt = await QuizAttempt
//     .findById(attemptId)
//     .populate('quiz', 'title duration')
//     .populate('answers.question', 'text options correctIndex');

//   if (!attempt) {
//     return res.status(404).json({ message: 'Attempt not found' });
//   }
//   res.json(attempt);
// });


// // controllers/quizController.js
// // GET /api/quizzes/attempts/:attemptId
// export const getAttemptStats = asyncHandler(async (req, res) => {
//   const { attemptId } = req.params;

//   // Find the attempt and populate the inner question refs
//   const attempt = await QuizAttempt.findById(attemptId)
//     .populate('quiz', 'title category topic level')
//     .populate({
//       path: 'answers.question',
//       model: 'Question',
//       select: 'text options correctIndex explanation'
//     })
//     .lean();

//   if (!attempt) {
//     return res.status(404).json({ message: 'Attempt not found' });
//   }

//   // Now compute rank & percentile
//   const allAttempts = await QuizAttempt
//     .find({ quiz: attempt.quiz._id })
//     .sort({ score: -1 })
//     .select('_id')
//     .lean();

//   const totalCount = allAttempts.length;
//   const rank       = allAttempts.findIndex(a => a._id.equals(attempt._id)) + 1;
//   const percentile = Math.round((1 - (rank - 1) / totalCount) * 100);

//   res.json({ attempt, rank, totalCount, percentile });
// });

// // ─── Fetch a single attempt (with question details) ───────────────
// export const getAttemptDetails = asyncHandler(async (req, res) => {;

//   const rank = higherCount + 1;
//   const percentile = Math.round((1 - (rank - 1) / totalCount) * 100);

//   // re-populate detailed attempt for client
//   const full = await QuizAttempt
//     .findById(attemptId)
//     .populate({
//       path:'answers.question',
//       select:'text options correctIndex explanation'
//     })
//     .populate('quiz', 'title category topic level')
//     .lean();

//   res.json({
//     attempt: full,
//     rank,
//     totalCount,
//     percentile
//   });
// });

// // controllers/quizController.js
// export const getQuizTopThree = asyncHandler(async (req, res) => {
//   const { quizId } = req.params;
//   const { timePeriod = 'week' } = req.query;

//   // Build time filter
//   const filter = { quiz: quizId };
//   if (timePeriod === 'week') {
//     const since = new Date(Date.now() - 7*24*60*60*1000);
//     filter.createdAt = { $gte: since };
//   } else if (timePeriod === 'month') {
//     const since = new Date(Date.now() - 30*24*60*60*1000);
//     filter.createdAt = { $gte: since };
//   }

//   // Aggregate top 3 scores for that quiz
//   const topThree = await QuizAttempt.aggregate([
//     { $match: filter },
//     { $sort: { score: -1, timeTaken: 1 } },
//     { $limit: 3 },
//     {
//       $lookup: {
//         from: 'users',
//         localField: 'user',
//         foreignField: '_id',
//         as: 'user'
//       }
//     },
//     { $unwind: '$user' },
//     { $project: { _id:1, score:1, 'user.name':1 } }
//   ]);

//   res.json(topThree);
// });


// export const bulkUploadQuizzesFile = async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: 'No file provided.' });
//   }

//   let rows;
//   const ext = path.extname(req.file.originalname).toLowerCase();

//   try {
//     if (ext === '.csv') {
//       rows = await csv().fromString(req.file.buffer.toString());
//     } else if (ext === '.xlsx' || ext === '.xls') {
//       const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
//       const sheetName = workbook.SheetNames[0];
//       const sheet = workbook.Sheets[sheetName];
//       rows = XLSX.utils.sheet_to_json(sheet);
//     } else {
//       return res.status(400).json({ message: 'Unsupported file format. Please upload CSV or XLSX.' });
//     }
//   } catch (error) {
//     return res.status(400).json({ message: 'Invalid file format or corrupted file.' });
//   }

//   if (!rows.length) {
//     return res.status(400).json({ message: 'Uploaded file is empty.' });
//   }

//   const quizDocs = [];
//   const report = [];

//   for (const row of rows) {
//     const { title = '', category: categoryName = '', topic: topicName = '', level = '', duration = '0', totalMarks = '0', isActive = 'false' } = row;
//     const trimmedTitle = String(title).trim();
//     const trimmedCategory = String(categoryName).trim();
//     const trimmedTopic = String(topicName).trim();

//     let status = 'Success';
//     let reason = '';
//     const parsedDuration = Number(duration);
//     const parsedMarks = Number(totalMarks);

//     // Validate
//     if (!trimmedTitle || !trimmedCategory || !trimmedTopic || !level.trim()) {
//       status = 'Failed'; reason = 'Missing required fields';
//     } else if (isNaN(parsedDuration) || isNaN(parsedMarks)) {
//       status = 'Failed'; reason = 'Invalid number in duration or totalMarks';
//     } else if (parsedDuration < 1 || parsedDuration > 180 || parsedMarks < 1 || parsedMarks > 100) {
//       status = 'Failed'; reason = 'Duration or marks out of range';
//     }

//     let cat, top, existing;
//     if (status === 'Success') {
//       cat = await Category.findOneAndUpdate({ name: trimmedCategory }, { name: trimmedCategory }, { new: true, upsert: true });
//       top = await Topic.findOneAndUpdate({ name: trimmedTopic, category: cat._id }, { name: trimmedTopic, category: cat._id }, { new: true, upsert: true });
//       existing = await Quiz.findOne({ title: trimmedTitle, topic: top._id });
//       if (existing) {
//         status = 'Failed'; reason = 'Duplicate quiz for topic';
//       }
//     }

//     if (status === 'Success') {
//       quizDocs.push({ title: trimmedTitle, category: cat._id, topic: top._id, level: level.trim(), duration: parsedDuration, totalMarks: parsedMarks, isActive: String(isActive).toLowerCase() === 'true' });
//     }

//     report.push({ title: trimmedTitle, category: trimmedCategory, topic: trimmedTopic, level, duration, totalMarks, isActive, status, reason });
//   }

//   let inserted = [];
//   try {
//     if (quizDocs.length) inserted = await Quiz.insertMany(quizDocs, { ordered: false });

//     await AuditLog.create({ action: 'bulk_quiz_upload', user: req.user?._id || null, details: { inserted: inserted.length, totalUploaded: rows.length, skipped: rows.length - inserted.length }, createdAt: new Date() });

//     const parser = new Parser();
//     const csvReport = parser.parse(report);
//     res.header('Content-Type', 'text/csv');
//     res.attachment('quiz_upload_report.csv');
//     return res.send(csvReport);
//   } catch (err) {
//     const parser = new Parser();
//     const csvReport = parser.parse(report);
//     await AuditLog.create({ action: 'bulk_quiz_upload_partial', user: req.user?._id || null, details: { inserted: inserted.length, totalUploaded: rows.length, skipped: rows.length - inserted.length }, createdAt: new Date() });
//     res.header('Content-Type', 'text/csv');
//     res.attachment('quiz_upload_partial_report.csv');
//     return res.status(207).send(csvReport);
//   }
// };

// export const downloadAllQuizzes = async (req, res) => {
//   const quizzes = await Quiz.find({})
//     .populate('category', 'name')
//     .populate('topic', 'name')
//     .lean();

//   const fields = ['title', 'category.name', 'topic.name', 'level', 'duration', 'totalMarks', 'isActive'];
//   const parser = new Parser({ fields });
//   const csv = parser.parse(quizzes);

//   res.header('Content-Type', 'text/csv');
//   res.attachment('quizzes.csv');
//   return res.send(csv);
// };

// export const downloadAllCategories = async (req, res) => {
//   const categories = await Category.find({}).lean();
//   const fields = ['name'];
//   const parser = new Parser({ fields });
//   const csv = parser.parse(categories);

//   res.header('Content-Type', 'text/csv');
//   res.attachment('categories.csv');
//   return res.send(csv);
// };

// export const downloadAllTopics = async (req, res) => {
//   const topics = await Topic.find({}).populate('category', 'name').lean();
//   const fields = ['name', 'category.name'];
//   const parser = new Parser({ fields });
//   const csv = parser.parse(topics);

//   res.header('Content-Type', 'text/csv');
//   res.attachment('topics.csv');
//   return res.send(csv);
// };



// // controllers/quizController.js
// export const getGroupedTopics = asyncHandler(async (_req, res) => {
//   // 1) grab all active quizzes, but only category & topic fields
//   const quizzes = await Quiz.find({ isActive: true }).select('category topic -_id');

//   // 2) group in memory
//   const grouped = {};
//   quizzes.forEach(q => {
//     // skip any missing data
//     if (!q.category || !q.topic) return;
//     const catId = q.category.toString();
//     const topId = q.topic.toString();
//     if (!grouped[catId]) grouped[catId] = new Set();
//     grouped[catId].add(topId);
//   });

//   // 3) turn map-of-sets into array-of-objects
//   const result = Object.entries(grouped).map(([category, topicSet]) => ({
//     category,                  // this is the _id of your Category
//     topics: Array.from(topicSet) // array of _id of your Topic
//   }));

//   res.json(result);
// });






// /** * GET /api/quizzes/highlight/just-added
//  * Returns the N most recently created active quizzes.
//  */
// export const getJustAddedQuizzes = asyncHandler(async (req, res) => {
//   const limit = Math.min(10, parseInt(req.query.limit,10) || 3);
//   const quizzes = await Quiz.find({ isActive: true })
//     .sort({ createdAt: -1 })
//     .limit(limit)
//     .select('title duration level createdAt')    // only necessary fields
//     .lean();
//   res.json(quizzes);
// });

// /**
//  * GET /api/quizzes/highlight/trending
//  * Returns the top N quizzes by number of attempts in the last week.
//  */
// export const getTrendingQuizzes = asyncHandler(async (req, res) => {
//   const limit = Math.min(10, parseInt(req.query.limit,10) || 5);
//   const since = new Date(Date.now() - 7*24*60*60*1000);

//   // aggregate attempt counts in last week
//   const top = await QuizAttempt.aggregate([
//     { $match: { createdAt: { $gte: since } } },
//     { $group: { _id: '$quiz', count: { $sum: 1 } } },
//     { $sort: { count: -1 } },
//     { $limit: limit }
//   ]);

//   const quizIds = top.map(x => x._id);
//   const quizzes = await Quiz.find({ _id: { $in: quizIds } })
//     .select('title duration level')
//     .lean();
  
//   // preserve original order
//   const ordered = quizIds.map(id =>
//     quizzes.find(q => q._id.equals(id))
//   ).filter(Boolean);

//   res.json(ordered);
// });

// /**
//  * GET /api/quizzes/highlight/daily-spotlight
//  * Returns one quiz per day (rotates through your active quizzes).
//  */
// export const getDailySpotlight = asyncHandler(async (_req, res) => {
//   const all = await Quiz.find({ isActive: true })
//     .select('title duration level createdAt')
//     .lean();
//   if (!all.length) return res.json(null);

//   // pick an index based on today’s date
//   const day = new Date().getDate();
//   const idx = day % all.length;
//   res.json(all[idx]);
// });


// export const getSidebarFilters = asyncHandler(async (_req, res) => {
//   // 1) levels
//   const levels = await Quiz.distinct('level', { isActive: true });

//   // 2) distinct category & topic IDs from the quizzes
//   const [catIds, topicIds] = await Promise.all([
//     Quiz.distinct('category', { isActive: true }),
//     Quiz.distinct('topic',    { isActive: true }),
//   ]);

//   // 3) fetch their names in bulk
//   const [categories, topics] = await Promise.all([
//     Category.find({ _id: { $in: catIds } }).select('_id name'),
//     Topic    .find({ _id: { $in: topicIds } }).select('_id name'),
//   ]);

//   res.json({ categories, topics, levels });
// });


// /**
//  * DELETE /api/quizzes/admin/quizzes/:quizId
//  * Remove a quiz (admin only).
//  */
// export const deleteQuiz = asyncHandler(async (req, res) => {
//   // 1️⃣ Validate quizId param
//   const { quizId } = idParamSchema.parse(req.params);

//   // 2️⃣ Attempt deletion
//   const quiz = await Quiz.findByIdAndDelete(quizId);
//   if (!quiz) {
//     return res.status(404).json({ message: 'Quiz not found' });
//   }

//   // 3️⃣ (Optional) Invalidate cache
//   if (redis) {
//     // Remove from all‐quizzes cache
//     redis.del('quizzes:all').catch(() => {});
//     // Remove individual quiz cache
//     redis.del(`quiz:${quizId}`).catch(() => {});
//   }

//   // 4️⃣ Respond
//   res.json({ message: 'Quiz deleted successfully' });
// });



import mongoose from 'mongoose';
import Redis from 'ioredis';
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import QuizAttempt from '../models/QuizAttempt.js';
import LeaderboardEntry from '../models/LeaderboardEntry.js';
import asyncHandler from '../utils/asyncHandler.js';
import { Parser } from 'json2csv';
import csv from 'csvtojson';
import { z } from 'zod';
import Topic from '../models/Topic.js';
import AuditLog from '../models/AuditLog.js';
import Category from '../models/Category.js';
import QuizAssignment from '../models/QuizAssignment.js';

import {
  submitAttemptSchema,
  bulkQuestionsSchema,
  addQuestionSchema,
  createQuizSchema,
  updateQuizSchema,
  idParamSchema,
  attemptParamSchema,
  publicLeaderboardSchema
} from '../validators/quizValidator.js';

// ─── Redis client (optional caching) ─────────────────────────────────────────
let redis = null;
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
  redis.on('error', err => console.warn('⚠️ Redis error:', err.message));
} else {
  console.warn('⚠️ No REDIS_URL: caching disabled');
}

// ─── SUBMIT QUIZ ATTEMPT ──────────────────────────────────────────────────────
export const submitQuizAttempt = asyncHandler(async (req, res) => {
  // Validate request body
  const { quizId, answers, timeTaken } = submitAttemptSchema.parse(req.body);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Load quiz with questions (within transaction session)
    const quiz = await Quiz.findById(quizId).populate('questions').session(session);
    if (!quiz) throw { status: 404, message: 'Quiz not found' };

    // Verify all questions answered
    if (Object.keys(answers).length !== quiz.questions.length) {
      return res.status(400).json({ message: 'Invalid number of answers' });
    }

    // Grade attempt
    let correctCount = 0;
    const processed = quiz.questions.map(q => {
      const sel = answers[q._id] ?? null;
      const isCorrect = sel === q.correctIndex;
      if (isCorrect) correctCount++;
      return { question: q._id, selectedIndex: sel, isCorrect };
    });

    // Save attempt
    const [attempt] = await QuizAttempt.create([{
      user: req.user._id,
      quiz: quizId,
      score: correctCount,
      totalQuestions: quiz.questions.length,
      correctAnswers: correctCount,
      answers: processed,
      timeTaken
    }], { session });

    // Update leaderboard stats
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

    // Commit transaction
    await session.commitTransaction();

    // Clear caches related to quizzes and leaderboard
    if (redis) {
      redis.del(`leaderboard:${quiz.category}:${quiz.topic || 'all'}:${quiz.level}:all-time`);
      redis.del('quizzes:all');
    }

    // Respond with attempt
    res.status(200).json({ message: 'Quiz submitted', attempt });

  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ─── GET LEADERBOARD ──────────────────────────────────────────────────────────
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { category, topic, level, timePeriod, page, limit } = publicLeaderboardSchema.parse(req.query);

  // Build query filter
  const filter = {};
  if (category) filter.category = category;
  if (topic) filter.topic = topic;
  if (level) filter.level = level;
  if (timePeriod === 'week') {
    filter.lastUpdated = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }

  // Pagination
  const skip = (page - 1) * limit;

  // Fetch leaderboard entries
  const entries = await LeaderboardEntry.find(filter)
    .sort({ score: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name avatar');

  res.json({
    items: entries,
    total: await LeaderboardEntry.countDocuments(filter),
    page,
    limit
  });
});

// ─── GET USER QUIZ ATTEMPTS ───────────────────────────────────────────────────
export const getUserAttempts = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({ user: req.user._id })
    .populate('quiz', 'title category level')
    .sort({ createdAt: -1 });
  res.json(attempts);
});

// ─── QUIZ CRUD: Get All Quizzes with caching ────────────────────────────────
export const getAllQuizzes = asyncHandler(async (_req, res) => {
  const cacheKey = 'quizzes:all';

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch (e) {
      console.warn('⚠️ Redis GET failed:', e.message);
    }
  }

  const quizzes = await Quiz.find()
    .populate('category', 'name')
    .populate('topic', 'name')
    .populate('questions');

  if (redis) {
    redis.set(cacheKey, JSON.stringify(quizzes), 'EX', 3600).catch(() => {});
  }

  res.json(quizzes);
});

// ─── GET QUIZ BY ID WITH CACHE ───────────────────────────────────────────────
export const getQuizById = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const cacheKey = `quiz:${quizId}`;
  let cached = null;

  if (redis) {
    try {
      cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch (e) {
      console.warn('⚠️ Redis GET failed:', e.message);
    }
  }

  const quiz = await Quiz.findById(quizId)
    .populate('questions')
    .populate('category', 'name')
    .populate('topic', 'name');

  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  if (redis) {
    redis.set(cacheKey, JSON.stringify(quiz), 'EX', 3600).catch(() => {});
  }

  res.json(quiz);
});

// ─── CREATE, UPDATE QUIZ ──────────────────────────────────────────────────────
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

// Inside quizController.js

export const deleteQuiz = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);

  const quiz = await Quiz.findByIdAndDelete(quizId);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  if (redis) {
    redis.del('quizzes:all').catch(() => {});
    redis.del(`quiz:${quizId}`).catch(() => {});
  }

  res.json({ message: 'Quiz deleted successfully' });
});


// ─── QUESTIONS CRUD ──────────────────────────────────────────────────────────
export const addQuestionToQuiz = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const payload = addQuestionSchema.parse(req.body);

  const question = await Question.create({ ...payload, quiz: quizId });

  await Quiz.findByIdAndUpdate(quizId, {
    $push: { questions: question._id },
    $inc: { totalMarks: 1 }
  });

  if (redis) {
    redis.del(`quiz:${quizId}`).catch(() => {});
    redis.del('quizzes:all').catch(() => {});
  }

  res.status(201).json(question);
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

    await Quiz.findByIdAndUpdate(quizId, {
      $push: { questions: created.map(x => x._id) },
      $inc: { totalMarks: created.length }
    }, { session });

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

// ─── BULK UPLOAD FROM FILE (CSV/XLSX) ────────────────────────────────────────
export const bulkUploadFromFile = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  // Determine file type
  const ext = path.extname(req.file.originalname).toLowerCase();
  let rows;

  try {
    if (ext === '.csv') {
      rows = await csv().fromString(req.file.buffer.toString());
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else {
      return res.status(400).json({ message: 'Unsupported file format. Please upload CSV or XLSX.' });
    }
  } catch {
    return res.status(400).json({ message: 'Invalid file format or corrupted file.' });
  }

  if (!rows.length) return res.status(400).json({ message: 'Uploaded file is empty.' });

  // Use a transaction to insert questions
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

    await Quiz.findByIdAndUpdate(quizId, {
      $push: { questions: created.map(x => x._id) },
      $inc: { totalMarks: created.length }
    }, { session });

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

// ─── DOWNLOAD QUESTIONS TEMPLATE CSV ─────────────────────────────────────────
export const downloadQuestionsTemplate = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);

  const quiz = await Quiz.findById(quizId).select('topic level');
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  const topic = quiz.topic || 'quiz';
  const level = quiz.level || 'medium';

  const header = ['question', 'option1', 'option2', 'option3', 'option4', 'correctAnswer', 'topic', 'explanation', 'difficulty'];
  const sampleRows = [[
    'Sample question text?',
    'Option A',
    'Option B',
    'Option C',
    'Option D',
    '0',
    topic,
    'Explain why this is the correct answer.',
    level
  ]];

  const csvContent = [header, ...sampleRows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  res.setHeader('Content-Disposition', `attachment; filename="questions_template_${topic.replace(/\s+/g, '_')}.csv"`);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.send(csvContent);
});

// ─── QUESTION CRUD ───────────────────────────────────────────────────────────
export const getQuestionsByQuiz = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const questions = await Question.find({ quiz: quizId });
  res.json(questions);
});

export const createQuestion = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const payload = addQuestionSchema.parse(req.body);

  const question = await Question.create({ ...payload, quiz: quizId });

  await Quiz.findByIdAndUpdate(quizId, {
    $push: { questions: question._id },
    $inc: { totalMarks: 1 }
  });

  res.status(201).json(question);
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const { quizId, questionId } = req.params;
  const payload = addQuestionSchema.parse(req.body);

  const question = await Question.findOneAndUpdate({ _id: questionId, quiz: quizId }, payload, { new: true });
  if (!question) return res.status(404).json({ message: 'Question not found' });

  res.json(question);
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const { quizId, questionId } = req.params;

  const question = await Question.findOneAndDelete({ _id: questionId, quiz: quizId });
  if (!question) return res.status(404).json({ message: 'Question not found' });

  await Quiz.findByIdAndUpdate(quizId, {
    $pull: { questions: questionId },
    $inc: { totalMarks: -1 }
  });

  res.json({ message: 'Deleted' });
});

// ─── QUIZ ASSIGNMENTS ──────────────────────────────────────────────────────────
export const assignQuiz = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);

  const { userIds } = z.object({
    userIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1)
  }).parse(req.body);

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

export const getQuizAssignments = asyncHandler(async (req, res) => {
  const { quizId } = idParamSchema.parse(req.params);
  const assignments = await QuizAssignment.find({ quiz: quizId }).populate('user', 'name email');
  res.status(200).json(assignments);
});

export const unassignQuiz = asyncHandler(async (req, res) => {
  const { quizId, userId } = req.params;
  await QuizAssignment.deleteOne({ quiz: quizId, user: userId });
  res.status(200).json({ message: 'Unassigned' });
});

// ─── PUBLIC QUIZ LIST WITH FILTERS ───────────────────────────────────────────
export const getPublicQuizzes = asyncHandler(async (req, res) => {
  const { category, topic, level, page = 1, limit = 12 } = req.query;
  const match = { isActive: true };

  if (category && mongoose.isValidObjectId(category)) match.category = category;
  if (topic && mongoose.isValidObjectId(topic)) match.topic = topic;
  if (level) match.level = level;

  const skip = (Number(page) - 1) * Number(limit);

  const quizzes = await Quiz.find(match)
    .populate('category', 'name')
    .populate('topic', 'name')
    .populate('questions', '_id') // only _id needed for count
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const withCounts = quizzes.map(q => ({
    ...q.toObject(),
    questionCount: q.questions?.length || 0
  }));

  const attemptCounts = await QuizAttempt.aggregate([
    { $match: { quiz: { $in: quizzes.map(q => q._id) } } },
    { $group: { _id: '$quiz', count: { $sum: 1 } } }
  ]);

  const attemptMap = Object.fromEntries(attemptCounts.map(a => [a._id.toString(), a.count]));

  const finalQuizzes = withCounts.map(q => ({
    ...q,
    attemptCount: attemptMap[q._id.toString()] || 0
  }));

  const total = await Quiz.countDocuments(match);

  res.json({ quizzes: finalQuizzes, total, page: Number(page), limit: Number(limit) });
});

// ─── DISTINCT FILTER VALUES ───────────────────────────────────────────────────
export const getDistinctCategories = asyncHandler(async (_req, res) => {
  const ids = await Quiz.distinct('category', { isActive: true });
  const cats = await Category.find({ _id: { $in: ids } }, 'name').lean();
  res.json(cats.map(c => ({ _id: c._id, name: c.name })));
});

export const getDistinctValues = (field) => asyncHandler(async (_req, res) => {
  const allowed = ['category', 'topic', 'level'];
  if (!allowed.includes(field)) {
    return res.status(400).json({ message: 'Invalid field' });
  }

  if (field === 'level') {
    const levels = await Quiz.distinct('level', { isActive: true });
    return res.json(levels);
  }

  const ids = await Quiz.distinct(field, { isActive: true });
  const Model = field === 'category' ? Category : Topic;
  const docs = await Model.find({ _id: { $in: ids } }).select('name');
  res.json(docs);
});

// ─── GET ATTEMPT BY ID ───────────────────────────────────────────────────────
export const getAttemptById = asyncHandler(async (req, res) => {
  const { attemptId } = attemptParamSchema.parse(req.params);

  const attempt = await QuizAttempt.findById(attemptId)
    .populate('quiz', 'title duration')
    .populate('answers.question', 'text options correctIndex');

  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

  res.json(attempt);
});

// ─── GET ATTEMPT STATS + RANK & PERCENTILE ───────────────────────────────────
export const getAttemptStats = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;

  const attempt = await QuizAttempt.findById(attemptId)
    .populate('quiz', 'title category topic level')
    .populate({
      path: 'answers.question',
      model: 'Question',
      select: 'text options correctIndex explanation'
    })
    .lean();

  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

  const allAttempts = await QuizAttempt.find({ quiz: attempt.quiz._id }).sort({ score: -1 }).select('_id').lean();

  const totalCount = allAttempts.length;
  const rank = allAttempts.findIndex(a => a._id.equals(attempt._id)) + 1;
  const percentile = Math.round((1 - (rank - 1) / totalCount) * 100);

  res.json({ attempt, rank, totalCount, percentile });
});

// ─── GET QUIZ TOP 3 SCORES ─────────────────────────────────────────────────────
export const getQuizTopThree = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { timePeriod = 'week' } = req.query;

  const filter = { quiz: quizId };
  if (timePeriod === 'week') filter.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  else if (timePeriod === 'month') filter.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };

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
    { $project: { _id: 1, score: 1, 'user.name': 1 } }
  ]);

  res.json(topThree);
});

// ─── BULK UPLOAD QUIZZES FILE ────────────────────────────────────────────────
export const bulkUploadQuizzesFile = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file provided.' });

  let rows;
  const ext = path.extname(req.file.originalname).toLowerCase();

  try {
    if (ext === '.csv') {
      rows = await csv().fromString(req.file.buffer.toString());
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else {
      return res.status(400).json({ message: 'Unsupported file format. Please upload CSV or XLSX.' });
    }
  } catch {
    return res.status(400).json({ message: 'Invalid file format or corrupted file.' });
  }

  if (!rows.length) return res.status(400).json({ message: 'Uploaded file is empty.' });

  const quizDocs = [];
  const report = [];

  for (const row of rows) {
    // Extract & trim fields
    const { title = '', category: categoryName = '', topic: topicName = '', level = '', duration = '0', totalMarks = '0', isActive = 'false' } = row;
    const trimmedTitle = String(title).trim();
    const trimmedCategory = String(categoryName).trim();
    const trimmedTopic = String(topicName).trim();

    let status = 'Success';
    let reason = '';
    const parsedDuration = Number(duration);
    const parsedMarks = Number(totalMarks);

    // Validate data fields
    if (!trimmedTitle || !trimmedCategory || !trimmedTopic || !level.trim()) {
      status = 'Failed'; reason = 'Missing required fields';
    } else if (isNaN(parsedDuration) || isNaN(parsedMarks)) {
      status = 'Failed'; reason = 'Invalid number in duration or totalMarks';
    } else if (parsedDuration < 1 || parsedDuration > 180 || parsedMarks < 1 || parsedMarks > 100) {
      status = 'Failed'; reason = 'Duration or marks out of range';
    }

    let cat, top, existing;
    if (status === 'Success') {
      cat = await Category.findOneAndUpdate({ name: trimmedCategory }, { name: trimmedCategory }, { new: true, upsert: true });
      top = await Topic.findOneAndUpdate({ name: trimmedTopic, category: cat._id }, { name: trimmedTopic, category: cat._id }, { new: true, upsert: true });
      existing = await Quiz.findOne({ title: trimmedTitle, topic: top._id });
      if (existing) {
        status = 'Failed'; reason = 'Duplicate quiz for topic';
      }
    }

    if (status === 'Success') {
      quizDocs.push({
        title: trimmedTitle,
        category: cat._id,
        topic: top._id,
        level: level.trim(),
        duration: parsedDuration,
        totalMarks: parsedMarks,
        isActive: String(isActive).toLowerCase() === 'true'
      });
    }

    report.push({ title: trimmedTitle, category: trimmedCategory, topic: trimmedTopic, level, duration, totalMarks, isActive, status, reason });
  }

  let inserted = [];
  try {
    if (quizDocs.length) inserted = await Quiz.insertMany(quizDocs, { ordered: false });

    await AuditLog.create({
      action: 'bulk_quiz_upload',
      user: req.user?._id || null,
      details: { inserted: inserted.length, totalUploaded: rows.length, skipped: rows.length - inserted.length },
      createdAt: new Date()
    });

    const parser = new Parser();
    const csvReport = parser.parse(report);
    res.header('Content-Type', 'text/csv');
    res.attachment('quiz_upload_report.csv');
    return res.send(csvReport);
  } catch (err) {
    const parser = new Parser();
    const csvReport = parser.parse(report);

    await AuditLog.create({
      action: 'bulk_quiz_upload_partial',
      user: req.user?._id || null,
      details: { inserted: inserted.length, totalUploaded: rows.length, skipped: rows.length - inserted.length },
      createdAt: new Date()
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('quiz_upload_partial_report.csv');
    return res.status(207).send(csvReport);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
//  NEW APIs for Admin Reports (usage, engagement, exports, alerts)
// ──────────────────────────────────────────────────────────────────────────────

// Sample data model imports for these new APIs (adjust as per your schema)
import User from '../models/User.js';
import ExportLog from '../models/ExportLog.js';  // Hypothetical model to track exports
import Alert from '../models/Alert.js';          // Hypothetical alert config/record model

/**
 * GET /api/admin/reports/dau?from=yyyy-mm-dd&to=yyyy-mm-dd
 * Returns daily active users count between date range
 */
export const getDAUReport = asyncHandler(async (req, res) => {
  let { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ message: 'Missing from/to date params' });

  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  // Aggregate unique user logins by day from QuizAttempt or User login logs
  // Assuming QuizAttempt createdAt = user activity proxy
  const results = await QuizAttempt.aggregate([
    { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        dauCount: { $addToSet: "$user" }
      }
    },
    {
      $project: {
        date: "$_id",
        count: { $size: "$dauCount" },
        _id: 0
      }
    },
    { $sort: { date: 1 } }
  ]);

  res.json(results);
});

/**
 * GET /api/admin/reports/category-engagement
 * Returns total attempts grouped by category for engagement report
 */
export const getCategoryEngagement = asyncHandler(async (req, res) => {
  const results = await QuizAttempt.aggregate([
    {
      $lookup: {
        from: 'quizzes',
        localField: 'quiz',
        foreignField: '_id',
        as: 'quizDetails'
      }
    },
    { $unwind: '$quizDetails' },
    {
      $group: {
        _id: '$quizDetails.category',
        attemptsCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $project: {
        _id: 0,
        name: '$category.name',
        value: '$attemptsCount'
      }
    },
    { $sort: { value: -1 } }
  ]);
  res.json(results);
});

/**
 * GET /api/admin/reports/export-history
 * Returns a list of export logs
 */
export const getExportHistory = asyncHandler(async (_req, res) => {
  // Assuming you have an ExportLog model that tracks downloads
  const logs = await ExportLog.find().sort({ createdAt: -1 }).limit(50);
  res.json(logs);
});

/**
 * GET /api/admin/reports/alerts
 * Returns current active alerts
 */
export const getAlerts = asyncHandler(async (_req, res) => {
  const alerts = await Alert.find({ isActive: true }).sort({ createdAt: -1 });
  res.json(alerts);
});

/**
 * POST /api/admin/reports/alerts
 * Save alert config settings (thresholds, email toggles)
 */
export const saveAlertConfig = asyncHandler(async (req, res) => {
  const { dauThreshold, sendEmail } = req.body;

  // Basic validation
  if (typeof dauThreshold !== 'number' || dauThreshold < 0) {
    return res.status(400).json({ message: 'Invalid DAU threshold' });
  }

  let alert = await Alert.findOne();
  if (!alert) alert = new Alert();

  alert.dauThreshold = dauThreshold;
  alert.sendEmail = !!sendEmail;
  alert.isActive = true;

  await alert.save();

  res.json({ message: 'Alert settings saved', alert });
});



export const downloadAllQuizzes = async (req, res) => {
  const quizzes = await Quiz.find({})
    .populate('category', 'name')
    .populate('topic', 'name')
    .lean();

  const fields = ['title', 'category.name', 'topic.name', 'level', 'duration', 'totalMarks', 'isActive'];
  const parser = new Parser({ fields });
  const csv = parser.parse(quizzes);

  res.header('Content-Type', 'text/csv');
  res.attachment('quizzes.csv');
  return res.send(csv);
};

export const downloadAllCategories = async (req, res) => {
  const categories = await Category.find({}).lean();
  const fields = ['name'];
  const parser = new Parser({ fields });
  const csv = parser.parse(categories);

  res.header('Content-Type', 'text/csv');
  res.attachment('categories.csv');
  return res.send(csv);
};

export const downloadAllTopics = async (req, res) => {
  const topics = await Topic.find({}).populate('category', 'name').lean();
  const fields = ['name', 'category.name'];
  const parser = new Parser({ fields });
  const csv = parser.parse(topics);

  res.header('Content-Type', 'text/csv');
  res.attachment('topics.csv');
  return res.send(csv);
};



/**
 * GET /api/quizzes/highlight/daily-spotlight
 * Returns one quiz per day (rotates through your active quizzes).
 */
export const getDailySpotlight = asyncHandler(async (_req, res) => {
  const all = await Quiz.find({ isActive: true })
    .select('title duration level createdAt')
    .lean();
  if (!all.length) return res.json(null);

  // pick an index based on today’s date
  const day = new Date().getDate();
  const idx = day % all.length;
  res.json(all[idx]);
});



export const getGroupedTopics = asyncHandler(async (_req, res) => {
  // 1) grab all active quizzes, but only category & topic fields
  const quizzes = await Quiz.find({ isActive: true }).select('category topic -_id');

  // 2) group in memory
  const grouped = {};
  quizzes.forEach(q => {
    // skip any missing data
    if (!q.category || !q.topic) return;
    const catId = q.category.toString();
    const topId = q.topic.toString();
    if (!grouped[catId]) grouped[catId] = new Set();
    grouped[catId].add(topId);
  });

  // 3) turn map-of-sets into array-of-objects
  const result = Object.entries(grouped).map(([category, topicSet]) => ({
    category,                  // this is the _id of your Category
    topics: Array.from(topicSet) // array of _id of your Topic
  }));

  res.json(result);
});



/** * GET /api/quizzes/highlight/just-added
 * Returns the N most recently created active quizzes.
 */
export const getJustAddedQuizzes = asyncHandler(async (req, res) => {
  const limit = Math.min(10, parseInt(req.query.limit,10) || 3);
  const quizzes = await Quiz.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('title duration level createdAt')    // only necessary fields
    .lean();
  res.json(quizzes);
});



export const getSidebarFilters = asyncHandler(async (_req, res) => {
  // 1) levels
  const levels = await Quiz.distinct('level', { isActive: true });

  // 2) distinct category & topic IDs from the quizzes
  const [catIds, topicIds] = await Promise.all([
    Quiz.distinct('category', { isActive: true }),
    Quiz.distinct('topic',    { isActive: true }),
  ]);

  // 3) fetch their names in bulk
  const [categories, topics] = await Promise.all([
    Category.find({ _id: { $in: catIds } }).select('_id name'),
    Topic    .find({ _id: { $in: topicIds } }).select('_id name'),
  ]);

  res.json({ categories, topics, levels });
});



/**
 * GET /api/quizzes/highlight/trending
 * Returns the top N quizzes by number of attempts in the last week.
 */
export const getTrendingQuizzes = asyncHandler(async (req, res) => {
  const limit = Math.min(10, parseInt(req.query.limit,10) || 5);
  const since = new Date(Date.now() - 7*24*60*60*1000);

  // aggregate attempt counts in last week
  const top = await QuizAttempt.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: '$quiz', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  const quizIds = top.map(x => x._id);
  const quizzes = await Quiz.find({ _id: { $in: quizIds } })
    .select('title duration level')
    .lean();
  
  // preserve original order
  const ordered = quizIds.map(id =>
    quizzes.find(q => q._id.equals(id))
  ).filter(Boolean);

  res.json(ordered);
});
