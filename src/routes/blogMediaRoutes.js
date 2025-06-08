import express from 'express';
import {
  uploadMedia,
  listMyMedia,
  deleteMedia
} from '../controllers/blogMediaController.js';
import { protect, requireRole } from '../middlewares/authMiddleware.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadMedia);
router.get('/my', protect, listMyMedia);
router.delete('/:id', protect, deleteMedia);

export default router;


/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Blog media asset management
 */

/**
 * @swagger
 * /api/blog/media/upload:
 *   post:
 *     summary: Upload a media file (image/video/file)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               alt:
 *                 type: string
 *               caption:
 *                 type: string
 *     responses:
 *       201:
 *         description: Media uploaded
 *         content:
 *           application/json:
 *             example:
 *               _id: "media1"
 *               url: "https://cdn.jobneura.tech/blog/uploads/image-1.png"
 *               type: "image"
 *               alt: "OG Image"
 *               caption: "Official Blog Banner"
 *               uploadedBy: { _id: "user1", name: "Vajid Ali" }
 *               meta:
 *                 size: 12345
 *                 mime: "image/png"
 *               createdAt: "2025-06-09T13:11:00.000Z"
 */

/**
 * @swagger
 * /api/blog/media/my:
 *   get:
 *     summary: List my uploaded media
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of media
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/blog/media/{id}:
 *   delete:
 *     summary: Delete a media asset
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Media deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
