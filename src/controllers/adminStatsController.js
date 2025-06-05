import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import LoginHistory from '../models/LoginHistory.js';
import Ticket from '../models/Ticket.js';

// ─── 1) Daily Active Users (DAU) in last 7 days ────────────────────────────────
export const getDAU = asyncHandler(async (req, res) => {
  const today = new Date();
  const past = new Date();
  past.setDate(today.getDate() - 6);  // last 7 days including today

  const pipeline = [
    {
      $match: {
        createdAt: { $gte: past, $lte: today }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ];

  const results = await LoginHistory.aggregate(pipeline);
  // Return array of { date: 'YYYY-MM-DD', count }
  res.json(results.map(r => ({ date: r._id, count: r.count })));
});

// ─── 2) Quiz category distribution with category name ─────────────────────────
export const getCategoryStats = asyncHandler(async (req, res) => {
  const pipeline = [
    // Group quizzes by category ObjectId
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 }
      }
    },
    // Lookup to categories collection to fetch category details
    {
      $lookup: {
        from: 'categories',      // must match the MongoDB collection name exactly
        localField: '_id',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    { $unwind: '$categoryInfo' },  // Flatten the joined array
    {
      $project: {
        _id: 0,
        name: '$categoryInfo.name',
        count: 1
      }
    },
    { $sort: { count: -1 } }  // Sort descending by count
  ];

  const results = await Quiz.aggregate(pipeline);
  res.json(results);
});

// ─── 3) New user growth in last 7 days ────────────────────────────────────────
export const getUserGrowth = asyncHandler(async (req, res) => {
  const today = new Date();
  const past = new Date();
  past.setDate(today.getDate() - 6);

  const pipeline = [
    {
      $match: {
        createdAt: { $gte: past, $lte: today }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ];

  const results = await User.aggregate(pipeline);
  res.json(results.map(r => ({ date: r._id, count: r.count })));
});

// ─── 4) Ticket status summary ────────────────────────────────────────────────
export const getTicketStats = asyncHandler(async (req, res) => {
  const pipeline = [
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        count: 1
      }
    }
  ];

  const results = await Ticket.aggregate(pipeline);
  res.json(results);
});
