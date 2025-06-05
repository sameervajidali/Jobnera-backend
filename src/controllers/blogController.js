import asyncHandler from '../utils/asyncHandler.js';
import Blog from '../models/Blog.js';

// ─── Get all blogs with optional filters and pagination ────────────────────────
export const getBlogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    category,
    status
  } = req.query;

  const query = { isDeleted: false };

  if (search) {
    query.title = { $regex: search, $options: 'i' }; // Case-insensitive partial match
  }
  if (category) {
    query.category = category;
  }
  if (status) {
    query.status = status;
  }

  const total = await Blog.countDocuments(query);

  const blogs = await Blog.find(query)
    .populate('category', 'name')          // Include category name
    .populate('author', 'name email')      // Include author name and email
    .skip((page - 1) * Number(limit))
    .limit(Number(limit))
    .sort({ createdAt: -1 });               // Most recent first

  res.json({ blogs, total });
});

// ─── Get single blog by ID ────────────────────────────────────────────────────
export const getBlogById = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.blogId)  // <-- note: req.params.blogId, not id
    .populate('category', 'name')
    .populate('author', 'name email');

  if (!blog || blog.isDeleted) {
    return res.status(404).json({ message: 'Blog not found' });
  }
  res.json(blog);
});


// ─── Create a new blog post ────────────────────────────────────────────────────
export const createBlog = asyncHandler(async (req, res) => {
  const data = req.body;
  data.author = req.user._id;  // user from authenticated request

  const blog = new Blog(data);
  await blog.save();

  res.status(201).json(blog);
});

// ─── Update an existing blog ───────────────────────────────────────────────────
export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog || blog.isDeleted) {
    return res.status(404).json({ message: 'Blog not found' });
  }

  Object.assign(blog, req.body);
  await blog.save();

  res.json(blog);
});

// ─── Soft delete a blog (mark as deleted) ────────────────────────────────────
export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog || blog.isDeleted) {
    return res.status(404).json({ message: 'Blog not found' });
  }

  blog.isDeleted = true;
  await blog.save();

  res.json({ message: 'Blog deleted' });
});
