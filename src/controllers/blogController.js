import BlogPost from '../models/BlogPost.js';
import Category from '../models/Category.js';
import BlogTag from '../models/BlogTag.js';
import BlogRevision from '../models/BlogRevision.js';
import AuditLog from '../models/AuditLog.js'; // New: Audit log model
import asyncHandler from '../utils/asyncHandler.js';
import slugify from 'slugify';
import { blogPostSchema } from '../validators/blogValidators.js';
import { sendNotification, sendWebhook } from '../utils/notifications.js'; // Stub functions

// --- Rate limiter: Simple in-memory (for prod use Redis, etc.) ---
const rateLimits = {}; // userId => { create: [timestamps], update: [timestamps], delete: [timestamps] }
function rateLimit(userId, action, limit = 5, windowMs = 60_000) {
  if (!rateLimits[userId]) rateLimits[userId] = { create: [], update: [], delete: [] };
  const now = Date.now();
  rateLimits[userId][action] = (rateLimits[userId][action] || []).filter(ts => now - ts < windowMs);
  if (rateLimits[userId][action].length >= limit) return false;
  rateLimits[userId][action].push(now);
  return true;
}

// --- Slug uniqueness utility ---
async function generateUniqueSlug(title, postId = null) {
  let base = slugify(title, { lower: true, strict: true });
  let slug = base, i = 1;
  while (
    await BlogPost.findOne({ slug, ...(postId && { _id: { $ne: postId } }) })
  ) slug = `${base}-${i++}`;
  return slug;
}

// --- Soft delete (add deletedAt field to schema, filter in all queries) ---
function notDeleted() {
  return { deletedAt: { $exists: false } };
}

// --- Advanced (full-text) search index (ensure created in MongoDB) ---
// BlogPostSchema.index({ title: 'text', summary: 'text', content: 'text' })

// --- List with soft delete, full-text search, scheduled publish ---
export const listBlogPosts = asyncHandler(async (req, res) => {
  const { category, tag, search, page = 1, limit = 10, showDeleted = false } = req.query;
  const filter = { status: 'published', ...notDeleted() };
  if (showDeleted === 'true') delete filter.deletedAt;
  if (category) {
    const cat = await Category.findOne({ slug: category, type: 'blog' });
    filter.category = cat?._id || null;
  }
  if (tag) {
    const tagDoc = await BlogTag.findOne({ slug: tag });
    filter.tags = tagDoc?._id || null;
  }
  if (search) {
    // Use $text if index exists, fallback to regex
    filter.$or = [
      { $text: { $search: search } },
      { title: new RegExp(search, 'i') },
      { summary: new RegExp(search, 'i') },
      { content: new RegExp(search, 'i') }
    ];
  }
  // Scheduled publishing: only show publishedAt <= now
  filter.publishedAt = { $lte: new Date() };

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

// --- Get single post, with deleted filter ---
export const getBlogPost = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const post = await BlogPost.findOne({ slug, status: 'published', ...notDeleted(), publishedAt: { $lte: new Date() } })
    .populate('author', 'name avatar bio')
    .populate('category', 'name slug icon')
    .populate('tags', 'name slug color')
    .populate('mediaAssets')
    .select('-revisionHistory -customFields');
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
});

// --- Create with audit, rate limit, and webhook ---
export const createBlogPost = asyncHandler(async (req, res) => {
  if (!rateLimit(req.user._id, 'create')) return res.status(429).json({ message: 'Too many posts, slow down!' });

  const { error } = blogPostSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const slug = await generateUniqueSlug(req.body.title);

  const post = await BlogPost.create({
    ...req.body,
    slug,
    author: req.user._id,
    status: req.body.status && req.user.role === 'ADMIN' ? req.body.status : 'draft',
    publishedAt: req.body.scheduledAt || null, // For scheduled
  });

  // --- Audit log ---
  await AuditLog.create({
    user: req.user._id,
    action: 'create',
    resource: 'BlogPost',
    resourceId: post._id,
    data: post,
  });

  // --- Webhook/notification (stub, fill as needed) ---
  sendNotification({ type: 'blog_created', post });
  sendWebhook({ event: 'blog_created', post });

  res.status(201).json(post);
});

// --- Update with audit, rate limit, soft delete protection, scheduled publish, hide prod errors ---
export const updateBlogPost = asyncHandler(async (req, res) => {
  if (!rateLimit(req.user._id, 'update')) return res.status(429).json({ message: 'Too many updates, slow down!' });

  const { id } = req.params;
  const post = await BlogPost.findById(id);
  if (!post || post.deletedAt) return res.status(404).json({ message: 'Post not found' });

  const allowedRoles = ['ADMIN', 'SUPERADMIN', 'EDITOR'];
  const isOwner = post.author.equals(req.user._id);
  const isEditor = post.editors?.some(eid => eid.equals(req.user._id));
  const isAdmin = allowedRoles.includes(req.user.role);
  if (!(isOwner || isEditor || isAdmin)) return res.status(403).json({ message: 'Forbidden' });

  const { error } = blogPostSchema.fork(Object.keys(req.body), f => f.optional()).validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  if (req.body.title && req.body.title !== post.title) {
    post.slug = await generateUniqueSlug(req.body.title, post._id);
  }
  if (req.body.content && req.body.content !== post.content) {
    const revision = await BlogRevision.create({
      post: post._id,
      editor: req.user._id,
      content: post.content,
      changeSummary: 'Auto revision on update',
    });
    post.revisionHistory.push(revision._id);
  }

  Object.assign(post, req.body);

  // Scheduled publish support
  if (req.body.scheduledAt) {
    post.publishedAt = new Date(req.body.scheduledAt);
    post.status = 'scheduled';
  }

  try {
    await post.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'update',
      resource: 'BlogPost',
      resourceId: post._id,
      data: req.body,
    });
    sendWebhook({ event: 'blog_updated', post });
    res.json(post);
  } catch (err) {
    res.status(500).json({
      message: process.env.NODE_ENV === 'production' ? 'Failed to update post.' : err.message,
    });
  }
});

// --- Soft delete with audit, rate limit ---
export const deleteBlogPost = asyncHandler(async (req, res) => {
  if (!rateLimit(req.user._id, 'delete')) return res.status(429).json({ message: 'Too many deletes, slow down!' });

  const { id } = req.params;
  const post = await BlogPost.findById(id);
  if (!post || post.deletedAt) return res.status(404).json({ message: 'Post not found' });

  const allowedRoles = ['ADMIN', 'SUPERADMIN'];
  const isOwner = post.author.equals(req.user._id);
  const isAdmin = allowedRoles.includes(req.user.role);
  if (!(isOwner || isAdmin)) return res.status(403).json({ message: 'Forbidden' });

  // --- Soft delete (future restore) ---
  post.deletedAt = new Date();
  await post.save();

  await AuditLog.create({
    user: req.user._id,
    action: 'delete',
    resource: 'BlogPost',
    resourceId: post._id,
    data: {},
  });
  sendWebhook({ event: 'blog_deleted', postId: post._id });

  res.json({ message: 'Post deleted (soft)' });
});

// --- My posts, not deleted ---
export const listMyBlogPosts = asyncHandler(async (req, res) => {
  const posts = await BlogPost.find({ author: req.user._id, ...notDeleted() })
    .sort({ updatedAt: -1 })
    .populate('category', 'name slug')
    .select('title slug status updatedAt publishedAt');
  res.json(posts);
});

// --- Publish with audit, webhook, schedule ---
export const publishBlogPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const post = await BlogPost.findById(id);
  if (!post || post.deletedAt) return res.status(404).json({ message: 'Post not found' });

  const allowedRoles = ['ADMIN', 'SUPERADMIN', 'EDITOR'];
  const isOwner = post.author.equals(req.user._id);
  const isEditor = post.editors?.some(eid => eid.equals(req.user._id));
  const isAdmin = allowedRoles.includes(req.user.role);
  if (!(isOwner || isEditor || isAdmin)) return res.status(403).json({ message: 'Forbidden' });

  post.status = 'published';
  post.publishedAt = new Date();
  await post.save();

  await AuditLog.create({
    user: req.user._id,
    action: 'publish',
    resource: 'BlogPost',
    resourceId: post._id,
    data: {},
  });
  sendWebhook({ event: 'blog_published', post });
  res.json(post);
});

// --- Scheduled publish/unpublish (CRON or at request, basic example) ---
export const scheduledPublishHandler = asyncHandler(async () => {
  // Run this from a cron job every X minutes
  const now = new Date();
  const toPublish = await BlogPost.find({
    status: 'scheduled',
    publishedAt: { $lte: now },
    ...notDeleted(),
  });
  for (const post of toPublish) {
    post.status = 'published';
    await post.save();
    await AuditLog.create({
      user: post.author,
      action: 'auto_publish',
      resource: 'BlogPost',
      resourceId: post._id,
      data: {},
    });
    sendWebhook({ event: 'blog_auto_published', post });
  }
});

// --- Revisions (as before) ---
export const getBlogRevisions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const revisions = await BlogRevision.find({ post: id })
    .sort({ createdAt: -1 })
    .populate('editor', 'name avatar');
  res.json(revisions);
});
