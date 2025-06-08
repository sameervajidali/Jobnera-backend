import BlogComment from '../models/BlogComment.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/blog/:postId/comments
export const listComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const comments = await BlogComment.find({ post: postId, parentComment: null, status: 'approved' })
    .populate('user', 'name avatar')
    .sort({ createdAt: 1 });
  res.json(comments);
});

// POST /api/blog/:postId/comments
export const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const comment = await BlogComment.create({
    ...req.body,
    post: postId,
    user: req.user._id,
    status: 'pending', // Moderation enabled
  });
  res.status(201).json(comment);
});

// POST /api/blog/comments/:parentId/reply
export const replyToComment = asyncHandler(async (req, res) => {
  const { parentId } = req.params;
  const parent = await BlogComment.findById(parentId);
  if (!parent) return res.status(404).json({ message: 'Parent comment not found' });

  const reply = await BlogComment.create({
    ...req.body,
    post: parent.post,
    user: req.user._id,
    parentComment: parentId,
    status: 'pending',
  });

  parent.replies.push(reply._id);
  await parent.save();

  res.status(201).json(reply);
});

// PUT /api/blog/comments/:id (moderation)
export const updateComment = asyncHandler(async (req, res) => {
  const comment = await BlogComment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!comment) return res.status(404).json({ message: 'Comment not found' });
  res.json(comment);
});

// DELETE /api/blog/comments/:id
export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await BlogComment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });
  if (!comment.user.equals(req.user._id) && req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  await comment.deleteOne();
  res.json({ message: 'Comment deleted' });
});
