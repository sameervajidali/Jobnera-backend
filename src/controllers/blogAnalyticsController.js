import BlogAnalytics from '../models/BlogAnalytics.js';
import BlogPost from '../models/BlogPost.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/blog/:slug/analytics (track a view)
export const trackPageView = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const post = await BlogPost.findOne({ slug, status: 'published' });
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upsert today's stats
  const analytics = await BlogAnalytics.findOneAndUpdate(
    { post: post._id, date: today },
    {
      $inc: { views: 1, uniqueVisitors: 1 }, // For simplicity; in reality, uniqueVisitors logic is more complex!
    },
    { new: true, upsert: true }
  );
  // Optionally, increment viewCount in post as well (cache for speed)
  await BlogPost.findByIdAndUpdate(post._id, { $inc: { viewCount: 1 } });

  res.json({ message: 'Tracked', analytics });
});

// GET /api/blog/analytics?post=POSTID&from=YYYY-MM-DD&to=YYYY-MM-DD
export const getAnalytics = asyncHandler(async (req, res) => {
  const { post, from, to } = req.query;
  const filter = {};
  if (post) filter.post = post;
  if (from || to) filter.date = {};
  if (from) filter.date.$gte = new Date(from);
  if (to) filter.date.$lte = new Date(to);

  const analytics = await BlogAnalytics.find(filter)
    .populate('post', 'title slug')
    .sort({ date: 1 });

  res.json(analytics);
});
