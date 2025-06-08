import BlogPost from '../models/BlogPost.js';
import Category from '../models/Category.js';
import BlogTag from '../models/BlogTag.js';
import BlogMedia from '../models/BlogMedia.js';
import BlogRevision from '../models/BlogRevision.js';
import asyncHandler from '../utils/asyncHandler.js';
import { blogPostSchema } from '../validators/blogValidators.js';

// GET /api/blog?category=&tag=&search=
// GET /api/blog?category=&tag=&search=&page=&limit=
export const listBlogPosts = asyncHandler(async (req, res) => {
  const { category, tag, search, page = 1, limit = 10 } = req.query;
  const filter = { status: 'published' };

  if (category) {
    const cat = await Category.findOne({ slug: category, type: 'blog' });
    if (cat) filter.category = cat._id;
    else filter.category = null; // No results for unknown slug
  }
  if (tag) {
    const tagDoc = await BlogTag.findOne({ slug: tag });
    if (tagDoc) filter.tags = tagDoc._id;
    else filter.tags = null;
  }
  if (search) {
    filter.$or = [
      { title:   new RegExp(search, 'i') },
      { summary: new RegExp(search, 'i') },
    ];
  }

  const posts = await BlogPost.find(filter)
    .sort({ publishedAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('author', 'name avatar bio')
    .populate('category', 'name slug icon')
    .populate('tags', 'name slug color')
    .select('-revisionHistory -customFields');

  const count = await BlogPost.countDocuments(filter);

  res.json({ posts, count, page: Number(page), limit: Number(limit) });
});

// GET /api/blog/:slug
// GET /api/blog/:slug
export const getBlogPost = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const post = await BlogPost.findOne({ slug, status: 'published' })
    .populate('author', 'name avatar bio')
    .populate('category', 'name slug icon')
    .populate('tags', 'name slug color')
    .populate('mediaAssets')
    .select('-revisionHistory -customFields');
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
});


// POST /api/blog (protect, requireRole('AUTHOR'))
// POST /api/blog
export const createBlogPost = asyncHandler(async (req, res) => {
  // Validate input
  const { error } = blogPostSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  // Set author and status
  const post = await BlogPost.create({
    ...req.body,
    author: req.user._id,
    status: 'draft',
    publishedAt: null,
  });

  res.status(201).json(post);
});


// PUT /api/blog/:id (protect, requireOwnOrRole('AUTHOR'))
// PUT /api/blog/:id
export const updateBlogPost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Only author, editors, or admin can update
  const post = await BlogPost.findById(id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const isOwner = post.author.equals(req.user._id);
  const isEditor = post.editors?.some(eid => eid.equals(req.user._id));
  const isAdmin = req.user.role === 'ADMIN';

  if (!(isOwner || isEditor || isAdmin)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  // Validate input
  const { error } = blogPostSchema.fork(Object.keys(req.body), f => f.optional()).validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  // Save revision if content changes
  if (req.body.content && req.body.content !== post.content) {
    await BlogRevision.create({
      post: post._id,
      editor: req.user._id,
      content: post.content,
      changeSummary: 'Auto revision on update',
    });
    post.revisionHistory.push(post._id);
  }

  // Update fields
  Object.assign(post, req.body);
  await post.save();
  res.json(post);
});


// DELETE /api/blog/:id
export const deleteBlogPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const post = await BlogPost.findById(id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const isOwner = post.author.equals(req.user._id);
  const isAdmin = req.user.role === 'ADMIN';

  if (!(isOwner || isAdmin)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  await post.deleteOne();
  res.json({ message: 'Post deleted' });
});



// GET /api/blog/my-posts
export const listMyBlogPosts = asyncHandler(async (req, res) => {
  const posts = await BlogPost.find({ author: req.user._id })
    .sort({ updatedAt: -1 })
    .populate('category', 'name slug')
    .select('title slug status updatedAt publishedAt');
  res.json(posts);
});



// PATCH /api/blog/:id/publish
export const publishBlogPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const post = await BlogPost.findById(id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const isOwner = post.author.equals(req.user._id);
  const isEditor = post.editors?.some(eid => eid.equals(req.user._id));
  const isAdmin = req.user.role === 'ADMIN';

  if (!(isOwner || isEditor || isAdmin)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  post.status = 'published';
  post.publishedAt = new Date();
  await post.save();
  res.json(post);
});


// GET /api/blog/:id/revisions
export const getBlogRevisions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const revisions = await BlogRevision.find({ post: id })
    .sort({ createdAt: -1 })
    .populate('editor', 'name avatar');
  res.json(revisions);
});



