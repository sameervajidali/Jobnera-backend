// src/controllers/adminStatsController.js
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import LoginHistory from '../models/LoginHistory.js';

// 1) Daily Active Users (last 7 days)
export const getDAU = asyncHandler(async (req, res) => {
  const today = new Date();
  const past = new Date(); past.setDate(today.getDate() - 6);

  const pipeline = [
    { $match: { createdAt: { $gte: past, $lte: today } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ];

  const results = await LoginHistory.aggregate(pipeline);
  res.json(results.map(r => ({ date: r._id, count: r.count })));
});

// 2) Category distribution of quizzes
//enum: get number of quizzes per category
export const getCategoryStats = asyncHandler(async (req, res) => {
  const pipeline = [
    { $group: { _id: "$category", value: { $sum: 1 } } },
    { $project: { _id: 0, name: "$_id", value: 1 } },
    { $sort: { value: -1 } }
  ]; F
  const results = await Quiz.aggregate(pipeline);
  res.json(results);
});

// 3) New User Growth (last 7 days)
export const getUserGrowth = asyncHandler(async (req, res) => {
  const today = new Date();
  const past = new Date(); past.setDate(today.getDate() - 6);

  const pipeline = [
    { $match: { createdAt: { $gte: past, $lte: today } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ];
  const results = await User.aggregate(pipeline);
  res.json(results.map(r => ({ date: r._id, count: r.count })));
});

// 4) Ticket status summary
import Ticket from '../models/Ticket.js';
export const getTicketStats = asyncHandler(async (req, res) => {
  const pipeline = [
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { _id: 0, status: "$_id", count: 1 } }
  ];
  const results = await Ticket.aggregate(pipeline);
  res.json(results);
});