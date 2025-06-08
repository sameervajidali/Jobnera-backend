import express from 'express';
import {
  listComments,
  addComment,
  replyToComment,
  updateComment,
  deleteComment
} from '../controllers/blogCommentController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';
import validateRequest from '../middlewares/validateRequest.js';
import { blogCommentSchema } from '../validators/blogValidators.js';

const router = express.Router();

// List all comments for a post
router.get('/:postId/comments', listComments);

// Add a new comment
router.post('/:postId/comments', protect, validateRequest(blogCommentSchema), addComment);

// Reply to a comment
router.post('/comments/:parentId/reply', protect, validateRequest(blogCommentSchema), replyToComment);

// Update (moderate) a comment
router.put('/comments/:id', protect, requireRole(['ADMIN', 'MODERATOR']), updateComment);

// Delete a comment
router.delete('/comments/:id', protect, requireRole(['ADMIN', 'MODERATOR']), deleteComment);

export default router;



/**
 * @swagger
 * tags:
 *   name: Comment
 *   description: Blog comments management
 */

/**
 * @swagger
 * /api/blog/{postId}/comments:
 *   get:
 *     summary: List comments for a blog post
 *     tags: [Comment]
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *             example:
 *               - _id: "c1"
 *                 user: { _id: "user2", name: "Khushboo" }
 *                 content: "Great post, learned a lot!"
 *                 createdAt: "2025-06-09T13:22:00.000Z"
 *                 status: "approved"
 *               - _id: "c2"
 *                 user: { _id: "user3", name: "Sam" }
 *                 content: "Can you do a tutorial on file upload?"
 *                 createdAt: "2025-06-09T13:23:00.000Z"
 *                 status: "pending"
 */



/**
 * @swagger
 * /api/blog/comments/{parentId}/reply:
 *   post:
 *     summary: Reply to a comment
 *     tags: [Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Parent comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: Reply created
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/blog/comments/{id}:
 *   put:
 *     summary: Update (moderate) a comment
 *     tags: [Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       200:
 *         description: Comment updated
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
