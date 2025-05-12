// src/routes/admin/topicRoutes.js
import express from 'express';
import { protect, requireRole } from '../middlewares/authMiddleware.js';
import {
  getAllTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
} from '../controllers/admin/topicController.js';

const router = express.Router();
router.use(protect, requireRole('SUPERADMIN','ADMIN'));

router.route('/')
  .get(getAllTopics)
  .post(createTopic);

router.route('/:id')
  .get(getTopicById)
  .put(updateTopic)
  .delete(deleteTopic);

export default router;
