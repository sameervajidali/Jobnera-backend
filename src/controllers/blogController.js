// import mongoose from 'mongoose';
// import Blog from '../models/Blog.js';
// import Category from '../models/Category.js';
// import asyncHandler from '../utils/asyncHandler.js';

// // Create a new blog
// export const createBlog = asyncHandler(async (req, res) => {
//   const {
//     title, category, status, content,
//     excerpt, featuredImage,
//     metaTitle, metaDescription, metaKeywords,
//   } = req.body;

//   if (!mongoose.isValidObjectId(category)) {
//     return res.status(400).json({ message: 'Invalid category ID' });
//   }

//   const cat = await Category.findById(category);
//   if (!cat) return res.status(404).json({ message: 'Category not found' });

//   const blog = new Blog({
//     title,
//     category,
//     author: req.user._id,
//     status,
//     content,
//     excerpt,
//     featuredImage,
//     metaTitle,
//     metaDescription,
//     metaKeywords,
//     publishedAt: status === 'Published' ? new Date() : null,
//   });

//   await blog.save();
//   res.status(201).json(blog);
// });

// // Update existing blog by ID
// export const updateBlog = asyncHandler(async (req, res) => {
//   const { blogId } = req.params;
//   const updates = { ...req.body };

//   if (updates.category && !mongoose.isValidObjectId(updates.category)) {
//     return res.status(400).json({ message: 'Invalid category ID' });
//   }

//   if (updates.category) {
//     const cat = await Category.findById(updates.category);
//     if (!cat) return res.status(404).json({ message: 'Category not found' });
//   }

//   // Handle publishedAt update on status change to Published
//   if (updates.status === 'Published') {
//     updates.publishedAt = new Date();
//   } else if (updates.status === 'Draft') {
//     updates.publishedAt = null;
//   }

//   // Find and update blog
//   const blog = await Blog.findById(blogId);
//   if (!blog) return res.status(404).json({ message: 'Blog not found' });

//   Object.assign(blog, updates);
//   await blog.save();

//   res.json(blog);
// });

// // Get a single blog by ID with populated category and author
// export const getBlogById = asyncHandler(async (req, res) => {
//   const { blogId } = req.params;

//   if (!mongoose.isValidObjectId(blogId)) {
//     return res.status(400).json({ message: 'Invalid blog ID' });
//   }

//   const blog = await Blog.findOne({ _id: blogId, isDeleted: false })
//     .populate('category', 'name description')
//     .populate('author', 'name email');

//   if (!blog) return res.status(404).json({ message: 'Blog not found' });

//   res.json(blog);
// });

// // Get paginated blogs list with filters & search
// export const getBlogs = asyncHandler(async (req, res) => {
//   const {
//     page = 1,
//     limit = 10,
//     category,
//     status,
//     search,
//   } = req.query;

//   const query = { isDeleted: false };

//   if (category && mongoose.isValidObjectId(category)) {
//     query.category = category;
//   }

//   if (status && ['Draft', 'Published'].includes(status)) {
//     query.status = status;
//   }

//   if (search) {
//     query.$or = [
//       { title: { $regex: search, $options: 'i' } },
//       { excerpt: { $regex: search, $options: 'i' } },
//       { content: { $regex: search, $options: 'i' } },
//     ];
//   }

//   const skip = (Number(page) - 1) * Number(limit);

//   const [blogs, total] = await Promise.all([
//     Blog.find(query)
//       .populate('category', 'name')
//       .populate('author', 'name')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(Number(limit)),
//     Blog.countDocuments(query),
//   ]);

//   res.json({
//     blogs,
//     total,
//     page: Number(page),
//     limit: Number(limit),
//   });
// });

// // Soft delete a blog by ID
// export const deleteBlog = asyncHandler(async (req, res) => {
//   const { blogId } = req.params;

//   if (!mongoose.isValidObjectId(blogId)) {
//     return res.status(400).json({ message: 'Invalid blog ID' });
//   }

//   const blog = await Blog.findById(blogId);
//   if (!blog) return res.status(404).json({ message: 'Blog not found' });

//   blog.isDeleted = true;
//   await blog.save();

//   res.json({ message: 'Blog deleted successfully' });
// });

// // Fetch categories filtered by type (quiz, blog, both)
// export const getBlogCategories = asyncHandler(async (req, res) => {
//   const categories = await Category.find({
//     $or: [{ type: 'blog' }, { type: 'both' }]
//   }).sort('name');
//   res.json(categories);
// });

// src/controllers/blogController.js
import asyncHandler from '../utils/asyncHandler.js';
import Blog from '../models/Blog.js';

// Get all blogs with filters, pagination
export const getBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', category, status } = req.query;

  const query = { isDeleted: false };

  if (search) query.title = { $regex: search, $options: 'i' };
  if (category) query.category = category;
  if (status) query.status = status;

  const total = await Blog.countDocuments(query);
  const blogs = await Blog.find(query)
    .populate('category', 'name')
    .populate('author', 'name email')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({ blogs, total });
});

// Get blog by ID
export const getBlogById = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id)
    .populate('category', 'name')
    .populate('author', 'name email');

  if (!blog || blog.isDeleted) {
    return res.status(404).json({ message: 'Blog not found' });
  }
  res.json(blog);
});

// Create blog
export const createBlog = asyncHandler(async (req, res) => {
  const data = req.body;
  data.author = req.user._id; // assuming user info from protect middleware

  const blog = new Blog(data);
  await blog.save();
  res.status(201).json(blog);
});

// Update blog
export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog || blog.isDeleted) {
    return res.status(404).json({ message: 'Blog not found' });
  }

  Object.assign(blog, req.body);
  await blog.save();
  res.json(blog);
});

// Soft delete blog
export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog || blog.isDeleted) {
    return res.status(404).json({ message: 'Blog not found' });
  }

  blog.isDeleted = true;
  await blog.save();
  res.json({ message: 'Blog deleted' });
});
