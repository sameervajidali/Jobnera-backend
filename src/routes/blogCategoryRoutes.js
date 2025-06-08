import express from 'express';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/blogCategoryController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';
import validateRequest from '../middlewares/validateRequest.js';
import { blogCategorySchema } from '../validators/blogValidators.js';

const router = express.Router();

router.get('/', listCategories); // Public
router.post('/', protect, requireRole(['ADMIN']), validateRequest(blogCategorySchema), createCategory);
router.put('/:id', protect, requireRole(['ADMIN']), validateRequest(blogCategorySchema, true), updateCategory);
router.delete('/:id', protect, requireRole(['ADMIN']), deleteCategory);

export default router;


/**
 * @swagger
 * tags:
 *   name: Category
 *   description: Blog categories management
 */

/**
 * @swagger
 * /api/blog/categories:
 *   get:
 *     summary: List all blog categories
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *             example:
 *               - _id: "cat1"
 *                 name: "Tech"
 *                 slug: "tech"
 *                 description: "All technology topics"
 *                 icon: "fa-laptop-code"
 *                 isVisible: true
 *                 order: 1
 *               - _id: "cat2"
 *                 name: "Career"
 *                 slug: "career"
 *                 description: "Career advice and stories"
 *                 icon: "fa-user-tie"
 *                 isVisible: true
 *                 order: 2
 */

/**
 * @swagger
 * /api/blog/categories/{id}:
 *   put:
 *     summary: Update a category (admin)
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete a category (admin)
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted
 *       401:
 *         description: Unauthorized
 */
