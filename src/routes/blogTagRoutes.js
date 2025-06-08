import express from 'express';
import {
  listTags,
  createTag,
  updateTag,
  deleteTag
} from '../controllers/blogTagController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';
import validateRequest from '../middlewares/validateRequest.js';
import { blogTagSchema } from '../validators/blogValidators.js';

const router = express.Router();

router.get('/', listTags); // Public
router.post('/', protect, requireRole(['ADMIN']), validateRequest(blogTagSchema), createTag);
router.put('/:id', protect, requireRole(['ADMIN']), validateRequest(blogTagSchema, true), updateTag);
router.delete('/:id', protect, requireRole(['ADMIN']), deleteTag);

export default router;


/**
 * @swagger
 * tags:
 *   name: Tag
 *   description: Blog tags management
 */

/**
 * @swagger
 * /api/blog/tags:
 *   get:
 *     summary: List all tags
 *     tags: [Tag]
 *     responses:
 *       200:
 *         description: List of tags
 *   post:
 *     summary: Create a new tag (admin)
 *     tags: [Tag]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tag'
 *     responses:
 *       201:
 *         description: Tag created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/blog/tags/{id}:
 *   put:
 *     summary: Update a tag (admin)
 *     tags: [Tag]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Tag ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tag'
 *     responses:
 *       200:
 *         description: Tag updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete a tag (admin)
 *     tags: [Tag]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Tag ID
 *     responses:
 *       200:
 *         description: Tag deleted
 *       401:
 *         description: Unauthorized
 */
