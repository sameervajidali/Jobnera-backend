// controllers/quizController.js
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import QuizAttempt from '../models/QuizAttempt.js';
import LeaderboardEntry from '../models/LeaderboardEntry.js';
import asyncHandler from '../utils/asyncHandler.js';
import csv from 'csvtojson';

// 📤 Submit Quiz Attempt
export const submitQuizAttempt = asyncHandler(async (req, res) => {
  const { quizId, answers, timeTaken } = req.body;
  const quiz = await Quiz.findById(quizId).populate('questions');

  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
  if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
    return res.status(400).json({ message: 'Invalid number of answers' });
  }

  let correctAnswers = 0;
  const processedAnswers = quiz.questions.map((q, index) => {
    const selectedIndex = answers[q._id] ?? null;
    const isCorrect = selectedIndex === q.correctIndex;
    if (isCorrect) correctAnswers++;
    return { question: q._id, selectedIndex, isCorrect };
  });

  const attempt = await QuizAttempt.create({
    user: req.user._id,
    quiz: quizId,
    score: correctAnswers,
    totalQuestions: quiz.questions.length,
    correctAnswers,
    answers: processedAnswers,
    timeTaken
  });

  await LeaderboardEntry.findOneAndUpdate(
    {
      user: req.user._id,
      category: quiz.category,
      topic: quiz.topic,
      level: quiz.level
    },
    {
      $inc: { score: correctAnswers, attempts: 1 },
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );

  res.status(200).json({ message: 'Quiz submitted', attempt });
});

// 🏆 Leaderboard
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { category, topic, level, timePeriod = 'all-time' } = req.query;
  const query = { category };
  if (topic) query.topic = topic;
  if (level) query.level = level;

  if (timePeriod === 'week') {
    query.lastUpdated = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }

  const leaderboard = await LeaderboardEntry.find(query)
    .sort({ score: -1 })
    .limit(100)
    .populate('user', 'name avatar');

  res.status(200).json(leaderboard);
});

// 📥 Admin: Bulk Upload JSON
export const bulkUploadQuestions = asyncHandler(async (req, res) => {
  const { quizId, questions } = req.body;
  if (!Array.isArray(questions)) return res.status(400).json({ message: 'Invalid question array' });

  const formatted = questions.map(q => ({
    quiz: quizId,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    topicTag: q.topicTag || '',
    explanation: q.explanation || ''
  }));

  const created = await Question.insertMany(formatted);
  await Quiz.findByIdAndUpdate(quizId, {
    $push: { questions: { $each: created.map(q => q._id) } },
    $inc: { totalMarks: created.length }
  });

  res.status(201).json({ message: 'Questions uploaded', count: created.length });
});

// 📤 Admin: Bulk Upload From File (CSV)
export const bulkUploadFromFile = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const quizId = req.params.quizId;
  const rows = await csv().fromString(req.file.buffer.toString());
  if (!rows.length) return res.status(400).json({ message: 'CSV file is empty' });

  const formatted = rows.map(row => ({
    quiz: quizId,
    question: row.question,
    options: [row.option1, row.option2, row.option3, row.option4],
    correctAnswer: row.correctAnswer,
    topicTag: row.topic || '',
    explanation: row.explanation || ''
  }));

  const created = await Question.insertMany(formatted);
  await Quiz.findByIdAndUpdate(quizId, {
    $push: { questions: { $each: created.map(q => q._id) } },
    $inc: { totalMarks: created.length }
  });

  res.status(201).json({ message: 'Bulk upload successful', count: created.length });
});

// 📊 Get Quiz Attempt History for User
export const getUserAttempts = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({ user: req.user._id })
    .populate('quiz', 'title category level')
    .sort({ createdAt: -1 });
  res.status(200).json(attempts);
});

// 📚 Get All Quizzes (Admin Panel)
export const getAllQuizzes = asyncHandler(async (_req, res) => {
  const quizzes = await Quiz.find().populate('questions');
  res.status(200).json(quizzes);
});

// 📝 Get Quiz By ID (Admin Panel)
export const getQuizById = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId).populate('questions');
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
  res.status(200).json(quiz);
});

// 🛠️ Update Quiz (Admin Panel)
export const updateQuiz = asyncHandler(async (req, res) => {
  const updated = await Quiz.findByIdAndUpdate(req.params.quizId, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: 'Quiz not found' });
  res.status(200).json(updated);
});

// ➕ Add Single Question (Admin Panel)
export const addQuestionToQuiz = asyncHandler(async (req, res) => {
  const { question, options, correctAnswer, topicTag, explanation } = req.body;
  const q = await Question.create({
    quiz: req.params.quizId,
    question,
    options,
    correctAnswer,
    topicTag,
    explanation
  });
  await Quiz.findByIdAndUpdate(req.params.quizId, {
    $push: { questions: q._id },
    $inc: { totalMarks: 1 }
  });
  res.status(201).json(q);
});
