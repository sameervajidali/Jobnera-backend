
import express from 'express';
import {
  listBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  listMyBlogPosts,
  publishBlogPost,
  getBlogRevisions
} from '../controllers/blogController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';
import validateRequest from '../middlewares/validateRequest.js';
import { blogPostSchema } from '../validators/blogValidators.js';
import blogTagRoutes from './blogTagRoutes.js';

const router = express.Router();


router.use('/tags', blogTagRoutes); // THIS enables /api/blog/tags
// Public
router.get('/', listBlogPosts); // ?category=&tag=&search=
router.get('/category/:slug', listBlogPosts); // List by category
router.get('/tag/:slug', listBlogPosts); // List by tag
router.get('/:slug', getBlogPost); // Single post by slug

// Authenticated
router.get('/my-posts', protect, listMyBlogPosts);

// Create/update/delete
router.post('/', protect, requireRole(['AUTHOR', 'EDITOR', 'ADMIN']), validateRequest(blogPostSchema), createBlogPost);
router.put('/:id', protect, requireRole(['AUTHOR', 'EDITOR', 'ADMIN']), validateRequest(blogPostSchema, true), updateBlogPost);
router.delete('/:id', protect, requireRole(['AUTHOR', 'EDITOR', 'ADMIN']), deleteBlogPost);

// Publish/unpublish (schedule)
router.patch('/:id/publish', protect, requireRole(['AUTHOR', 'EDITOR', 'ADMIN']), publishBlogPost);

// Revisions
router.get('/:id/revisions', protect, requireRole(['AUTHOR', 'EDITOR', 'ADMIN']), getBlogRevisions);

export default router;


/**
 * @swagger
 * tags:
 *   name: Blog
 *   description: Blog post management
 */

/**
 * @swagger
 * /api/blog:
 *   get:
 *     summary: List all published blog posts
 *     tags: [Blog]
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BlogPost'
 *                 count:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *             example:
 *               posts:
 *                 - _id: "666cafecc5f26c18b4cb2351"
 *                   title: "First Post"
 *                   slug: "first-post"
 *                   summary: "Welcome post."
 *                   status: "published"
 *                 - _id: "666cafecc5f26c18b4cb2352"
 *                   title: "Second Post"
 *                   slug: "second-post"
 *                   summary: "Follow-up guide."
 *                   status: "published"
 *               count: 2
 *               page: 1
 *               limit: 10
 */


/**
 * @swagger
 * /api/blog/{slug}:
 *   get:
 *     summary: Get a single blog post by slug
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Blog post slug
 *     responses:
 *       200:
 *         description: Blog post found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogPost'
 *             example:
 *               _id: "666cafecc5f26c18b4cb2351"
 *               title: "How to Build a World-Class SaaS Blog"
 *               slug: "how-to-build-world-class-saas-blog"
 *               summary: "Step-by-step guide for SaaS founders."
 *               content: "<h2>Introduction</h2><p>Welcome to the ultimate guide…</p>"
 *               status: "published"
 *               category:
 *                 _id: "cat1"
 *                 name: "Tech"
 *                 slug: "tech"
 *               tags:
 *                 - _id: "tag1"
 *                   name: "Node.js"
 *                   slug: "nodejs"
 *               coverImageUrl: "https://cdn.jobneura.tech/blog/cover1.jpg"
 *               author:
 *                 _id: "user1"
 *                 name: "Vajid Ali"
 *               createdAt: "2025-06-08T12:30:00.000Z"
 *               updatedAt: "2025-06-09T10:10:00.000Z"
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Post not found"
 */

/**
 * @swagger
 * /api/blog/my-posts:
 *   get:
 *     summary: List my own blog posts (authenticated)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user’s posts
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/blog:
 *   post:
 *     summary: Create a new blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlogPost'
 *           example:
 *             title: "New Blog Post"
 *             slug: "new-blog-post"
 *             summary: "Quick intro to our API"
 *             content: "<p>Body goes here…</p>"
 *             category: "catid123"
 *             tags: ["tagid1", "tagid2"]
 *     responses:
 *       201:
 *         description: Blog post created
 *         content:
 *           application/json:
 *             example:
 *               _id: "666cb19ec5f26c18b4cb2359"
 *               title: "New Blog Post"
 *               slug: "new-blog-post"
 *               summary: "Quick intro to our API"
 *               status: "draft"
 *               author: { _id: "user1", name: "Vajid Ali" }
 *               createdAt: "2025-06-09T12:31:10.000Z"
 *               updatedAt: "2025-06-09T12:31:10.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               message: "Title is required"
 */

/**
 * @swagger
 * /api/blog/{id}:
 *   delete:
 *     summary: Delete a blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: Blog post deleted
 *         content:
 *           application/json:
 *             example:
 *               message: "Post deleted"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: "Not authorized: session or token missing"
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Post not found"
 */

/**
 * @swagger
 * /api/blog/{id}/publish:
 *   patch:
 *     summary: Publish a blog post (author/editor/admin)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: Blog post published
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/blog/{id}/revisions:
 *   get:
 *     summary: Get all revisions for a blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: List of revisions
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
